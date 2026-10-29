from slowapi import Limiter
from slowapi.util import get_remote_address


def user_or_ip(request):
    # Use client IP only: using the raw Authorization header as key lets
    # attackers rotate tokens to evade limits and leaks token material to logs.
    return get_remote_address(request)


limiter = Limiter(key_func=user_or_ip, default_limits=["100/minute"])



