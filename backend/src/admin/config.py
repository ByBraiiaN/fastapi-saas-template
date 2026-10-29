from pydantic import Field
from pydantic_settings import BaseSettings


class AiSettings(BaseSettings):

    ai_provider: str = Field(default="groq")
    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"

    ai_model: str = Field(default="openai/gpt-oss-120b")