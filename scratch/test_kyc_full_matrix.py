import urllib.request, json, urllib.error

API_URL = 'http://127.0.0.1:8000/api/user/kyc/submit'

SAMPLE_PAN_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
SAMPLE_FRONT_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
SAMPLE_BACK_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

def call_api(payload):
    data_bytes = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        API_URL,
        data=data_bytes,
        headers={'Content-Type': 'application/json', 'Accept': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

print("=== STARTING FULL KYC VALIDATION MATRIX TEST ===")

# Test 1: Valid PAN & Aadhaar & Docs
status, res = call_api({
    'user_code': 'CB100001',
    'pan_number': 'ABCDE1234F',
    'aadhaar_number': '123456789012',
    'pan_card_image': SAMPLE_PAN_IMG,
    'aadhaar_front_image': SAMPLE_FRONT_IMG,
    'aadhaar_back_image': SAMPLE_BACK_IMG,
})
assert status == 200, f"Expected 200, got {status}: {res}"
print("[PASS] 1. Valid PAN (ABCDE1234F) & Aadhaar (123456789012) submitted successfully")

# Test 2: Lowercase PAN conversion
status, res = call_api({
    'user_code': 'CB100001',
    'pan_number': 'abcde1234f',
    'aadhaar_number': '123456789012',
    'pan_card_image': SAMPLE_PAN_IMG,
    'aadhaar_front_image': SAMPLE_FRONT_IMG,
    'aadhaar_back_image': SAMPLE_BACK_IMG,
})
assert status == 200
assert res['user']['pan_number'] == 'ABCDE1234F'
print("[PASS] 2. Lowercase PAN automatically converted to uppercase ABCDE1234F")

# Test 3: Invalid PAN formats rejected
invalid_pans = ['ABC12345F', '1234567890', 'ABCDE12345', 'ABCDE123@F', 'ABCDE1234', 'ABCDE12345F']
for bad_pan in invalid_pans:
    status, res = call_api({
        'user_code': 'CB100001',
        'pan_number': bad_pan,
        'aadhaar_number': '123456789012',
        'pan_card_image': SAMPLE_PAN_IMG,
        'aadhaar_front_image': SAMPLE_FRONT_IMG,
        'aadhaar_back_image': SAMPLE_BACK_IMG,
    })
    assert status == 422, f"Expected 422 for bad pan '{bad_pan}', got {status}"
    assert 'pan_number' in res.get('errors', {}), f"pan_number error missing for {bad_pan}"
print(f"[PASS] 3. All invalid PAN formats rejected with HTTP 422: {invalid_pans}")

# Test 4: Leading zero in Aadhaar preserved
status, res = call_api({
    'user_code': 'CB100001',
    'pan_number': 'ABCDE1234F',
    'aadhaar_number': '012345678901',
    'pan_card_image': SAMPLE_PAN_IMG,
    'aadhaar_front_image': SAMPLE_FRONT_IMG,
    'aadhaar_back_image': SAMPLE_BACK_IMG,
})
assert status == 200
assert res['user']['aadhaar_number'] == '012345678901'
print("[PASS] 4. Aadhaar with leading zero (012345678901) preserved and accepted")

# Test 5: Invalid Aadhaar formats rejected
invalid_aadhaars = ['12345678901', '1234567890123', '1234AB789012', '1234@56789012']
for bad_aadh in invalid_aadhaars:
    status, res = call_api({
        'user_code': 'CB100001',
        'pan_number': 'ABCDE1234F',
        'aadhaar_number': bad_aadh,
        'pan_card_image': SAMPLE_PAN_IMG,
        'aadhaar_front_image': SAMPLE_FRONT_IMG,
        'aadhaar_back_image': SAMPLE_BACK_IMG,
    })
    assert status == 422, f"Expected 422 for bad aadhaar '{bad_aadh}', got {status}"
    assert 'aadhaar_number' in res.get('errors', {}), f"aadhaar_number error missing for {bad_aadh}"
print(f"[PASS] 5. All invalid Aadhaar formats rejected with HTTP 422: {invalid_aadhaars}")

# Test 6: Missing PAN Document rejected
status, res = call_api({
    'user_code': 'CB100001',
    'pan_number': 'ABCDE1234F',
    'aadhaar_number': '123456789012',
    'pan_card_image': '',
    'aadhaar_front_image': SAMPLE_FRONT_IMG,
    'aadhaar_back_image': SAMPLE_BACK_IMG,
})
assert status == 422
assert 'pan_card_image' in res.get('errors', {})
print("[PASS] 6. Missing PAN document rejected with HTTP 422")

# Test 7: Missing Aadhaar Front rejected
status, res = call_api({
    'user_code': 'CB100001',
    'pan_number': 'ABCDE1234F',
    'aadhaar_number': '123456789012',
    'pan_card_image': SAMPLE_PAN_IMG,
    'aadhaar_front_image': '',
    'aadhaar_back_image': SAMPLE_BACK_IMG,
})
assert status == 422
assert 'aadhaar_front_image' in res.get('errors', {})
print("[PASS] 7. Missing Aadhaar Front document rejected with HTTP 422")

# Test 8: Missing Aadhaar Back rejected
status, res = call_api({
    'user_code': 'CB100001',
    'pan_number': 'ABCDE1234F',
    'aadhaar_number': '123456789012',
    'pan_card_image': SAMPLE_PAN_IMG,
    'aadhaar_front_image': SAMPLE_FRONT_IMG,
    'aadhaar_back_image': '',
})
assert status == 422
assert 'aadhaar_back_image' in res.get('errors', {})
print("[PASS] 8. Missing Aadhaar Back document rejected with HTTP 422")

# Test 9: Identical Aadhaar Front and Back rejected
status, res = call_api({
    'user_code': 'CB100001',
    'pan_number': 'ABCDE1234F',
    'aadhaar_number': '123456789012',
    'pan_card_image': SAMPLE_PAN_IMG,
    'aadhaar_front_image': SAMPLE_FRONT_IMG,
    'aadhaar_back_image': SAMPLE_FRONT_IMG, # IDENTICAL
})
assert status == 422
assert 'aadhaar_back_image' in res.get('errors', {})
assert 'identical' in res['errors']['aadhaar_back_image'][0].lower()
print("[PASS] 9. Identical Aadhaar Front & Back documents rejected with HTTP 422")

# Test 10: Status transitions & workflow preservation
status, res = call_api({
    'user_code': 'CB100001',
    'pan_number': 'ABCDE1234F',
    'aadhaar_number': '123456789012',
    'pan_card_image': SAMPLE_PAN_IMG,
    'aadhaar_front_image': SAMPLE_FRONT_IMG,
    'aadhaar_back_image': SAMPLE_BACK_IMG,
})
assert status == 200
assert res['user']['kyc_status'] == 'pending'
assert res['user']['kyc_submitted_at'] is not None
print("[PASS] 10. Submission preserves Under Process (pending) status and timestamps")

print("\n=== ALL 10 KYC VALIDATION TESTS PASSED WITH 100% SUCCESS ===")
