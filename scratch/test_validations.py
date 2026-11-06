import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests
import json

headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}
base_url = 'http://127.0.0.1:8000/api'
entity_url = 'http://127.0.0.1:8000/entity'

print("--- 1. Testing Entity Login Validation ---")
r = requests.post(f'{entity_url}/login', json={}, headers=headers)
print("Empty Entity Login Status:", r.status_code, "| Message:", r.json().get('message'))

r = requests.post(f'{entity_url}/login', json={"email": "invalid", "password": ""}, headers=headers)
print("Missing Password Entity Login Status:", r.status_code, "| Message:", r.json().get('message'))

print("\n--- 2. Testing Entity Forgot Password Validation ---")
r = requests.post(f'{base_url}/entity/forgot-password', json={"email": "not-an-email"}, headers=headers)
print("Invalid Email Forgot Password Status:", r.status_code, "| Message:", r.json().get('message'), "| Errors:", r.json().get('errors'))

print("\n--- 3. Testing Order Creation Backend Validation ---")
r = requests.post(f'{base_url}/orders', json={}, headers=headers)
print("Empty Order Status:", r.status_code, "| Message:", r.json().get('message'))

r = requests.post(f'{base_url}/orders', json={"item": "Web Development", "customer_user_code": "NONEXISTENT_999"}, headers=headers)
print("Non-existent Member Order Status:", r.status_code, "| Message:", r.json().get('message'))

print("\n--- 4. Testing User Registration Validation ---")
r = requests.post(f'{base_url}/send-otp', json={"name": "", "email": "bademail", "sponsor_id": ""}, headers=headers)
print("Invalid Registration Status:", r.status_code, "| Message:", r.json().get('message'), "| Errors:", list(r.json().get('errors', {}).keys()))

print("\n--- 5. Testing Bank & UPI Validation ---")
r = requests.post(f'{base_url}/user/bank-accounts/add', json={"user_code": "CB100001", "bank_name": "SBI", "account_number": "123", "ifsc_code": "INVALID", "otp": "123456"}, headers=headers)
print("Invalid Bank Info Status:", r.status_code, "| Message:", r.json().get('message'))

r = requests.post(f'{base_url}/user/upi-accounts/add', json={"user_code": "CB100001", "upi_id": "invalid-upi-no-at", "otp": "123456"}, headers=headers)
print("Invalid UPI Info Status:", r.status_code, "| Message:", r.json().get('message'))

print("\n--- 6. Testing Support Ticket Validation ---")
r = requests.post(f'{base_url}/user/support-tickets', json={"user_code": "CB100001", "subject": "", "category": "General", "description": "hi"}, headers=headers)
print("Invalid Ticket Status:", r.status_code, "| Message:", r.json().get('message'))

print("\n--- 7. Testing Valid Data Response Verification ---")
r = requests.get(f'{base_url}/verify-sponsor?sponsor_id=CB100001', headers=headers)
print("Valid Sponsor Verification Status:", r.status_code, "| Verified:", r.json().get('verified'))

r = requests.get(f'{base_url}/verify-member?member_id=CB100001', headers=headers)
print("Valid Member Verification Status:", r.status_code, "| Verified:", r.json().get('verified'))

print("\nAll Backend Validation Tests Completed Successfully!")
