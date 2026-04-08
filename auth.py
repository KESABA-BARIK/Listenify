import os
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dataclasses import dataclass

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
if not SUPABASE_JWT_SECRET:
    raise RuntimeError("SUPABASE_JWT_SECRET must be set in your environment variables.")

security = HTTPBearer()


@dataclass
class AuthUser:
    """Minimal user object — mirrors what supabase.auth.get_user() used to return."""
    id: str
    email: str | None
    role: str | None


def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthUser:
    """
    FastAPI dependency — validates the Supabase JWT locally and returns the user.

    Usage in any endpoint:
        @app.post("/upload")
        def upload(user: AuthUser = Depends(get_current_user)):
            print(user.id)   # the Supabase user UUID
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",  # Supabase sets this claim on all user tokens
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please log in again.")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid token audience.")
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject claim.")

    return AuthUser(
        id=user_id,
        email=payload.get("email"),
        role=payload.get("role"),
    )
