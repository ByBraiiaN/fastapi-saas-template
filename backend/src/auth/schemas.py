from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from src.auth.models import Provider


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_.-]+$")


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    provider: Provider


class UserCreateRequest(UserBase):
    password: str = Field(min_length=6, max_length=128)


class UpdateProfileRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_.-]+$")


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserLoginResponse(BaseModel):
    token: str
    refresh_token: str
    type: str = "Bearer"
    user: UserRead


class RefreshTokenResponse(BaseModel):
    token: str
    refresh_token: str
    type: str = "Bearer"

class MessageResponse(BaseModel):
    message: str


class ForgetPasswordRequest(BaseModel):
    email: EmailStr


class NewPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=6, max_length=128)


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(min_length=6, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class LoginCodeRequest(BaseModel):
    email: EmailStr


class LoginWithCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)



