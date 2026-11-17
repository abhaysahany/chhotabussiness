import re

sensitive_keys = {"APP_KEY", "DB_PASSWORD", "MAIL_PASSWORD", "AWS_SECRET_ACCESS_KEY", "JWT_SECRET"}

with open("backend/.env", "r") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#"):
            print(line)
            continue
        if "=" in line:
            k, v = line.split("=", 1)
            k = k.strip()
            if any(s in k.upper() for s in ["KEY", "PASSWORD", "SECRET"]):
                print(f"{k}=[REDACTED length={len(v)}]")
            else:
                print(f"{k}={v}")
        else:
            print(line)
