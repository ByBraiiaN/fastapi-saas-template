from pydantic_settings import BaseSettings


class AuthSettings(BaseSettings):
    # JWT lifetimes are expressed in seconds.
    algorithm: str = "HS256"
    access_secret_key: str = "test-access-secret-32-chars-minimum"
    access_token_expire: int = 900  # 15 minutes
    refresh_secret_key: str = "test-refresh-secret-32-chars-minimum"
    refresh_token_expire: int = 2592000  # 30 days
    validation_secret_key: str = "test-validation-secret-32-chars-min"
    validation_token_expire: int = 900  # 15 minutes

    #SOCIAL_LOGIN
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8010/auth/social/callback/google"
    google_auth_url: str = "https://accounts.google.com/o/oauth2/v2/auth"
    google_token_url: str = "https://oauth2.googleapis.com/token"
    google_userinfo_url: str = "https://openidconnect.googleapis.com/v1/userinfo"

    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = "http://localhost:8010/auth/social/callback/github"
    github_authorize_url: str = "https://github.com/login/oauth/authorize"
    github_token_url: str = "https://github.com/login/oauth/access_token"
    github_user_api: str = "https://api.github.com/user"
    github_emails: str = "https://api.github.com/user/emails"