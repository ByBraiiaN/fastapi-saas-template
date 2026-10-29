from fastapi import APIRouter, BackgroundTasks, Request, Response, status
from fastapi.responses import RedirectResponse

from src.auth import schemas, utils
from src.auth.dependencies import UserServiceDep, email_dependency
from src.auth_bearer import active_user_dep, non_active_user_dep, user_dependency
from src.config import settings
from src.rate_limiter import limiter

router = APIRouter()

REFRESH_COOKIE_NAME = "refresh_token"


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=settings.refresh_token_expire,
        httponly=True,
        secure=settings.app_env == "production",
        samesite="lax",
        path="/",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/")


@router.post("/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register_user(request: Request, user_data: schemas.UserCreateRequest, UserService: UserServiceDep,
                        background: BackgroundTasks, email: email_dependency):
    user = await UserService.register_user(user_data)
    background.add_task(email.send_verification_email, user.email, user.id)
    return user


@router.post("/login", response_model=schemas.UserLoginResponse, status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def login_user(request: Request, user_data: schemas.UserLoginRequest, response: Response, UserService: UserServiceDep):
    access_token, user, refresh_token = await UserService.login_user(user_data)
    _set_refresh_cookie(response, refresh_token)
    return {"token": access_token, "refresh_token": refresh_token, "user": user}


@router.post("/logout", response_model=schemas.MessageResponse, status_code=status.HTTP_200_OK)
async def logout_user(response: Response, current_user: user_dependency, UserService: UserServiceDep):
    await UserService.logout_user(current_user)
    _clear_refresh_cookie(response)
    return {"message": "Logged out."}


@router.get("/me", response_model=schemas.UserRead, status_code=status.HTTP_200_OK)
async def get_me(current_user: active_user_dep):
    return current_user


@router.patch("/me", response_model=schemas.UserRead, status_code=status.HTTP_200_OK)
async def update_me(data: schemas.UpdateProfileRequest, current_user: active_user_dep,
                    UserService: UserServiceDep):
    return await UserService.update_profile(current_user, data)


@router.post("/refresh-token", response_model=schemas.RefreshTokenResponse, status_code=status.HTTP_200_OK)
@limiter.limit("30/minute")
async def refresh_token(request: Request, response: Response, UserService: UserServiceDep,
                        token: str | None = None):
    refresh_value = token or request.cookies.get(REFRESH_COOKIE_NAME)
    access_token, new_refresh_token = await UserService.refresh_token(refresh_value or "")
    _set_refresh_cookie(response, new_refresh_token)
    return {"token": access_token, "refresh_token": new_refresh_token}


@router.get("/verify", response_model=schemas.MessageResponse, status_code=status.HTTP_202_ACCEPTED)
async def verify_email(token: str, UserService: UserServiceDep):
    verify = await UserService.validate_user(token)
    if verify:
        return {"message": "Email is Verified"}
    return {"message": "Email is already Verified"}


@router.post("/request/verify", response_model=schemas.MessageResponse, status_code=status.HTTP_202_ACCEPTED)
async def request_verify_email(current_user: non_active_user_dep,
                               background: BackgroundTasks, email: email_dependency):
    if current_user.is_verified:
        return {"message": "Email is already verified"}
    background.add_task(email.send_verification_email, current_user.email, current_user.id)
    return {"message": "New Verification Email has been sent"}


@router.post("/forget-password", response_model=schemas.MessageResponse, status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("5/minute")
async def forget_password(request: Request, data: schemas.ForgetPasswordRequest, UserService: UserServiceDep,
                          background: BackgroundTasks, email: email_dependency):
    user = await UserService.forget_password(data)
    if user:
        background.add_task(email.send_password_reset_email, user.email, user.id)
    return {"message": "If an account with this email exists, a password reset link has been sent."}


@router.post("/new-password", response_model=schemas.MessageResponse, status_code=status.HTTP_202_ACCEPTED)
async def new_password(data: schemas.NewPasswordRequest, UserService: UserServiceDep):
    success = await UserService.new_password(data)
    if success:
        return {"message": "Password has been changed successfully"}


@router.post("/change-password", response_model=schemas.MessageResponse, status_code=status.HTTP_200_OK)
async def change_password(data: schemas.ChangePasswordRequest, UserService: UserServiceDep, current_user: active_user_dep):
    success = await UserService.change_password(data, current_user)
    if success:
        return {"message": "Password has been changed successfully"}


@router.post("/request/login-code", response_model=schemas.MessageResponse, status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
async def request_login_code(request: Request, data: schemas.LoginCodeRequest, UserService: UserServiceDep,
                             background: BackgroundTasks, email: email_dependency):
    result = await UserService.login_code(data)
    if result:
        user, code = result
        background.add_task(email.send_login_code, user.email, code)
    return {"message": "If an account with this email exists, a login code has been sent."}


@router.post("/login/code", response_model=schemas.UserLoginResponse, status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def login_with_code(request: Request, data: schemas.LoginWithCodeRequest, response: Response, UserService: UserServiceDep):
    access_token, user, refresh_token = await UserService.login_with_code(data)
    _set_refresh_cookie(response, refresh_token)
    return {"token": access_token, "refresh_token": refresh_token, "user": user}


@router.get("/google/login")
async def login_with_google():
    uri, state = utils.get_google_login_url()
    redirect_response = RedirectResponse(uri)
    redirect_response.set_cookie(
        "oauth_state_google",
        state,
        httponly=True,
        secure=settings.app_env == "production",
        samesite="lax",
    )
    return redirect_response


@router.get("/auth/social/callback/google", response_model=schemas.UserLoginResponse, status_code=status.HTTP_200_OK)
async def google_callback(response: Response, request: Request, UserService: UserServiceDep):
    access_token, user, refresh_token = await UserService.login_with_google(request)
    response.delete_cookie("oauth_state_google")
    _set_refresh_cookie(response, refresh_token)
    return {"token": access_token, "refresh_token": refresh_token, "user": user}


@router.get("/github/login")
async def login_with_github():
    uri, state = utils.get_github_login_url()
    redirect_response = RedirectResponse(uri)
    redirect_response.set_cookie(
        "oauth_state_github",
        state,
        httponly=True,
        secure=settings.app_env == "production",
        samesite="lax",
    )
    return redirect_response


@router.get("/auth/social/callback/github", response_model=schemas.UserLoginResponse, status_code=status.HTTP_200_OK)
async def github_callback(response: Response, request: Request, UserService: UserServiceDep):
    access_token, user, refresh_token = await UserService.login_with_github(request)
    response.delete_cookie("oauth_state_github")
    _set_refresh_cookie(response, refresh_token)
    return {"token": access_token, "refresh_token": refresh_token, "user": user}


@router.post("/deactivate", response_model=schemas.MessageResponse, status_code=status.HTTP_202_ACCEPTED)
async def user_deactivate(response: Response, current_user: active_user_dep, UserService: UserServiceDep):
    success = await UserService.deactivate_user(current_user)
    _clear_refresh_cookie(response)
    if success:
        return {"message": "User deactivated."}
