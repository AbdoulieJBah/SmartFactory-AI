from slowapi import Limiter
from slowapi.util import get_remote_address

# Per-process, in-memory rate limiting keyed by client IP. Good enough for a
# single-instance deployment; note that if the app ever runs behind a proxy
# that doesn't forward the real client IP, this degrades to a global limit.
limiter = Limiter(key_func=get_remote_address)
