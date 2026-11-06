file_path = r'D:\xampp_lite_8_5\apps\apache\ad-net\backend\app\Http\Controllers\UserBankKycController.php'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update addBankAccount validation
old_bank_chk = '''        if (empty($bankName) || empty($accNumber) || empty($ifsc)) {
            return response()->json(['status' => 'error', 'message' => 'Bank Name, Account Number, and IFSC Code are required.'], 422);
        }'''

new_bank_chk = '''        if (empty($bankName) || empty($accNumber) || empty($ifsc)) {
            return response()->json(['status' => 'error', 'message' => 'Bank Name, Account Number, and IFSC Code are required.'], 422);
        }

        if (!preg_match('/^[0-9]{9,18}$/', $accNumber)) {
            return response()->json(['status' => 'error', 'message' => 'Account Number must contain between 9 and 18 numeric digits.'], 422);
        }

        if (!preg_match('/^[A-Z]{4}0[A-Z0-9]{6}$/', $ifsc)) {
            return response()->json(['status' => 'error', 'message' => 'Invalid IFSC Code format. Must be 11 alphanumeric characters (e.g. HDFC0001234).'], 422);
        }'''

if old_bank_chk in text:
    text = text.replace(old_bank_chk, new_bank_chk)
elif old_bank_chk.replace('\n', '\r\n') in text:
    text = text.replace(old_bank_chk.replace('\n', '\r\n'), new_bank_chk.replace('\n', '\r\n'))

# 2. Update addUpiAccount validation
old_upi_chk = '''        $upiId = strtolower(trim($request->input('upi_id') ?: ''));
        if (empty($upiId)) {
            return response()->json(['status' => 'error', 'message' => 'Valid UPI ID (e.g. mobile@upi) is required.'], 422);
        }'''

new_upi_chk = '''        $upiId = strtolower(trim($request->input('upi_id') ?: ''));
        if (empty($upiId)) {
            return response()->json(['status' => 'error', 'message' => 'Valid UPI ID (e.g. mobile@upi) is required.'], 422);
        }

        if (!preg_match('/^[\\w.-]+@[\\w.-]+$/i', $upiId)) {
            return response()->json(['status' => 'error', 'message' => 'Invalid UPI ID format (e.g. username@okhdfcbank or 9876543210@paytm).'], 422);
        }'''

if old_upi_chk in text:
    text = text.replace(old_upi_chk, new_upi_chk)
elif old_upi_chk.replace('\n', '\r\n') in text:
    text = text.replace(old_upi_chk.replace('\n', '\r\n'), new_upi_chk.replace('\n', '\r\n'))

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('UserBankKycController.php updated successfully')
