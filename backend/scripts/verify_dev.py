import asyncio
import os
import sys

# Add the parent directory to sys.path so we can import from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import get_settings
from app.db.in_memory import InMemoryDatabase
from app.core.security import verify_password
import httpx

async def run_diagnostics():
    print("=== MediKiosk 2.0 Development Diagnostic Mode ===\n")
    
    settings = get_settings()
    
    # 1. Check Backend Configuration
    print("[1] Checking Backend Configuration...")
    if settings.JWT_SECRET_KEY:
        print("    [PASS] JWT Secret Key configured")
    else:
        print("    [FAIL] JWT Secret Key missing")
        
    print(f"    [INFO] JWT Algorithm: {settings.JWT_ALGORITHM}")
    print(f"    [INFO] API V1 Prefix: {settings.API_V1_PREFIX}")
    
    # 2. Check Database (In-Memory for Dev)
    print("\n[2] Checking Database (In-Memory Development Mode)...")
    try:
        db = InMemoryDatabase()
        print("    [PASS] Database initialized successfully")
        
        # 3. Check Users
        print("\n[3] Verifying Development Users...")
        staff_table = db.tables.get("staff", [])
        
        admin_users = [u for u in staff_table if u.get("role") == "ADMIN"]
        doctor_users = [u for u in staff_table if u.get("role") == "DOCTOR"]
        
        if admin_users:
            print(f"    [PASS] Admin user exists ({admin_users[0]['email']})")
        else:
            print("    [FAIL] Admin user missing")
            
        if doctor_users:
            print(f"    [PASS] Doctor user exists ({doctor_users[0]['email']})")
        else:
            print("    [FAIL] Doctor user missing")
            
        # 4. Check Password Verification
        print("\n[4] Verifying Password Hashing...")
        if admin_users:
            test_password = "Password123!"
            if verify_password(test_password, admin_users[0]["password_hash"]):
                print("    [PASS] Password verification successful (bcrypt)")
            else:
                print("    [FAIL] Password verification failed")
                
    except Exception as e:
        print(f"    [FAIL] Database error: {e}")

    # 5. Check Backend Reachability
    print("\n[5] Checking Backend Reachability...")
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get("http://localhost:8000/api/v1/health", timeout=2.0)
            if res.status_code == 200:
                print("    [PASS] Backend API is reachable at http://localhost:8000/api/v1")
            else:
                print(f"    [WARN] Backend returned status {res.status_code}")
    except httpx.RequestError:
        print("    [FAIL] Backend API is NOT reachable. Did you run 'uvicorn app.main:app --port 8000'?")

    # 6. Frontend ENV check
    print("\n[6] Checking Frontend Environment...")
    frontend_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env'))
    if os.path.exists(frontend_env_path):
        with open(frontend_env_path, 'r') as f:
            content = f.read()
            if 'NEXT_PUBLIC_API_URL' in content:
                print("    [PASS] NEXT_PUBLIC_API_URL configured in frontend .env")
            else:
                print("    [FAIL] NEXT_PUBLIC_API_URL missing in frontend .env")
    else:
        print("    [WARN] Frontend .env file not found")

    print("\n=== Diagnostics Complete ===")

if __name__ == '__main__':
    asyncio.run(run_diagnostics())
