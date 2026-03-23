"""Telegram notification configuration"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class TelegramSettings(BaseSettings):
    """Telegram bot notification settings"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    telegram_bot_token: str = ""
    telegram_chat_id: str = ""
    telegram_notify_cooldown: int = 300  # seconds between duplicate alerts

    @property
    def is_configured(self) -> bool:
        return bool(self.telegram_bot_token and self.telegram_chat_id)


telegram_settings = TelegramSettings()
