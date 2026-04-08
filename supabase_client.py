import os
from supabase import create_client, Client

# Service role key — bypasses RLS. Never expose this to the frontend.
# Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env / Render env vars.
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. "
        "Never use the anon key on the backend."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


