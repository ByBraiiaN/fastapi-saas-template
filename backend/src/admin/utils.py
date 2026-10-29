import datetime
import uuid
from decimal import Decimal

from src.common.enums import ENUM_CLASSES


def json_safe(obj):
        if isinstance(obj, uuid.UUID):
            return str(obj)
        if isinstance(obj, datetime.datetime | datetime.date):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        return obj


def build_enum_map_from_python() -> dict[str, str]:
    """
    Returns:
      {
        "active": "ACTIVE",
        "trialing": "TRIALING",
        "succeeded": "SUCCEEDED",
        "stripe": "STRIPE",
        ...
      }
    """
    enum_map: dict[str, str] = {}

    for enum_cls in ENUM_CLASSES:
        for member in enum_cls:
            enum_map[member.value.lower()] = member.name

    return enum_map
