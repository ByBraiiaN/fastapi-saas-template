from pydantic_settings import BaseSettings


class MailSettings(BaseSettings):
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@example.com"