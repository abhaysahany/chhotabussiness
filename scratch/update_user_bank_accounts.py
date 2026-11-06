# 1. Update BankAccounts.jsx
file_path_bank = r'D:\xampp_lite_8_5\apps\apache\ad-net\user\src\components\settings\BankAccounts.jsx'
with open(file_path_bank, 'r', encoding='utf-8') as f:
    text_bank = f.read()

# Add states for errors
if 'const [bankFieldErrors, setBankFieldErrors] = useState({});' not in text_bank:
    old_bstate = 'const [showAddUpiModal, setShowAddUpiModal] = useState(false);'
    rep_bstate = 'const [showAddUpiModal, setShowAddUpiModal] = useState(false);\n  const [bankFieldErrors, setBankFieldErrors] = useState({});\n  const [upiFieldErrors, setUpiFieldErrors] = useState({});'
    if old_bstate in text_bank:
        text_bank = text_bank.replace(old_bstate, rep_bstate)
    elif old_bstate.replace('\n', '\r\n') in text_bank:
        text_bank = text_bank.replace(old_bstate.replace('\n', '\r\n'), rep_bstate.replace('\n', '\r\n'))

# Update handleInitiateAddBank
old_init_bank = '''  // Submit Add Bank (Step 1: Validate -> Send OTP)
  const handleInitiateAddBank = (e) => {
    e.preventDefault();
    if (!newBank.bankName.trim() || !newBank.accountNumber.trim() || !newBank.ifscCode.trim()) {
      showToast('❌ Please fill in all required bank fields.');
      return;
    }
    if (newBank.accountNumber !== newBank.confirmAccountNumber) {
      showToast('❌ Account number and confirmation number do not match.');
      return;
    }

    // Trigger OTP with payload'''

new_init_bank = '''  // Submit Add Bank (Step 1: Validate -> Send OTP)
  const handleInitiateAddBank = (e) => {
    e.preventDefault();
    const errors = {};

    const trimmedBank = (newBank.bankName || '').trim();
    if (!trimmedBank) {
      errors.bankName = 'Bank name is required.';
    } else if (trimmedBank.length < 2) {
      errors.bankName = 'Bank name must be at least 2 characters.';
    }

    const trimmedIfsc = (newBank.ifscCode || '').trim().toUpperCase();
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!trimmedIfsc) {
      errors.ifscCode = 'IFSC code is required.';
    } else if (!ifscRegex.test(trimmedIfsc)) {
      errors.ifscCode = 'Invalid IFSC code format (e.g. HDFC0001234, 11 alphanumeric characters).';
    }

    const trimmedAcc = (newBank.accountNumber || '').trim();
    if (!trimmedAcc) {
      errors.accountNumber = 'Account number is required.';
    } else if (!/^\\d{9,18}$/.test(trimmedAcc)) {
      errors.accountNumber = 'Account number must be 9 to 18 numeric digits.';
    }

    const trimmedConfirmAcc = (newBank.confirmAccountNumber || '').trim();
    if (!trimmedConfirmAcc) {
      errors.confirmAccountNumber = 'Please confirm the account number.';
    } else if (trimmedAcc !== trimmedConfirmAcc) {
      errors.confirmAccountNumber = 'Account number and confirmation number do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setBankFieldErrors(errors);
      showToast('❌ Please fix the highlighted bank validation errors.');
      return;
    }

    setBankFieldErrors({});
    // Trigger OTP with payload'''

if old_init_bank in text_bank:
    text_bank = text_bank.replace(old_init_bank, new_init_bank)
elif old_init_bank.replace('\n', '\r\n') in text_bank:
    text_bank = text_bank.replace(old_init_bank.replace('\n', '\r\n'), new_init_bank.replace('\n', '\r\n'))

# Update handleInitiateAddUpi
old_init_upi = '''  // Submit Add UPI (Step 1: Validate -> Send OTP)
  const handleInitiateAddUpi = (e) => {
    e.preventDefault();
    if (!newUpi.upiId.trim()) {
      showToast('❌ Please enter a valid UPI ID (e.g. name@okhdfcbank).');
      return;
    }

    triggerOtpForAction('add_upi', null, {'''

new_init_upi = '''  // Submit Add UPI (Step 1: Validate -> Send OTP)
  const handleInitiateAddUpi = (e) => {
    e.preventDefault();
    const errors = {};
    const trimmedUpi = (newUpi.upiId || '').trim();
    const upiRegex = /^[\\w.-]+@[\\w.-]+$/;

    if (!trimmedUpi) {
      errors.upiId = 'UPI ID (VPA) is required.';
    } else if (!upiRegex.test(trimmedUpi)) {
      errors.upiId = 'Invalid UPI ID format (e.g. username@okhdfcbank or 9876543210@paytm).';
    }

    if (Object.keys(errors).length > 0) {
      setUpiFieldErrors(errors);
      showToast('❌ Please enter a valid UPI ID.');
      return;
    }

    setUpiFieldErrors({});
    triggerOtpForAction('add_upi', null, {'''

if old_init_upi in text_bank:
    text_bank = text_bank.replace(old_init_upi, new_init_upi)
elif old_init_upi.replace('\n', '\r\n') in text_bank:
    text_bank = text_bank.replace(old_init_upi.replace('\n', '\r\n'), new_init_upi.replace('\n', '\r\n'))

# Inline error displays in Bank form
target_bank_name = '''                    placeholder="e.g. HDFC Bank / SBI"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />'''
rep_bank_name = '''                    placeholder="e.g. HDFC Bank / SBI"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: bankFieldErrors.bankName ? '2px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  {bankFieldErrors.bankName && (
                    <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.2rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {bankFieldErrors.bankName}
                    </span>
                  )}'''

if target_bank_name in text_bank:
    text_bank = text_bank.replace(target_bank_name, rep_bank_name)
elif target_bank_name.replace('\n', '\r\n') in text_bank:
    text_bank = text_bank.replace(target_bank_name.replace('\n', '\r\n'), rep_bank_name.replace('\n', '\r\n'))

target_ifsc = '''                    placeholder="e.g. HDFC0001234"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />'''
rep_ifsc = '''                    placeholder="e.g. HDFC0001234"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: bankFieldErrors.ifscCode ? '2px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  {bankFieldErrors.ifscCode && (
                    <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.2rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {bankFieldErrors.ifscCode}
                    </span>
                  )}'''

if target_ifsc in text_bank:
    text_bank = text_bank.replace(target_ifsc, rep_ifsc)
elif target_ifsc.replace('\n', '\r\n') in text_bank:
    text_bank = text_bank.replace(target_ifsc.replace('\n', '\r\n'), rep_ifsc.replace('\n', '\r\n'))

target_acc = '''                    placeholder="Bank account number"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />'''
rep_acc = '''                    placeholder="Bank account number"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: bankFieldErrors.accountNumber ? '2px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  {bankFieldErrors.accountNumber && (
                    <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.2rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {bankFieldErrors.accountNumber}
                    </span>
                  )}'''

if target_acc in text_bank:
    text_bank = text_bank.replace(target_acc, rep_acc)
elif target_acc.replace('\n', '\r\n') in text_bank:
    text_bank = text_bank.replace(target_acc.replace('\n', '\r\n'), rep_acc.replace('\n', '\r\n'))

target_cacc = '''                    placeholder="Re-enter account number"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />'''
rep_cacc = '''                    placeholder="Re-enter account number"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: bankFieldErrors.confirmAccountNumber ? '2px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  {bankFieldErrors.confirmAccountNumber && (
                    <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.2rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {bankFieldErrors.confirmAccountNumber}
                    </span>
                  )}'''

if target_cacc in text_bank:
    text_bank = text_bank.replace(target_cacc, rep_cacc)
elif target_cacc.replace('\n', '\r\n') in text_bank:
    text_bank = text_bank.replace(target_cacc.replace('\n', '\r\n'), rep_cacc.replace('\n', '\r\n'))

# Inline error display in UPI form
target_upi_input = '''                    placeholder="e.g. username@okhdfcbank or 9876543210@paytm"
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      color: '#0f172a',
                      fontWeight: 600,
                    }}
                  />'''
rep_upi_input = '''                    placeholder="e.g. username@okhdfcbank or 9876543210@paytm"
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '8px',
                      border: upiFieldErrors.upiId ? '2px solid #ef4444' : '1.5px solid #cbd5e1',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      color: '#0f172a',
                      fontWeight: 600,
                    }}
                  />
                  {upiFieldErrors.upiId && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {upiFieldErrors.upiId}
                    </span>
                  )}'''

if target_upi_input in text_bank:
    text_bank = text_bank.replace(target_upi_input, rep_upi_input)
elif target_upi_input.replace('\n', '\r\n') in text_bank:
    text_bank = text_bank.replace(target_upi_input.replace('\n', '\r\n'), rep_upi_input.replace('\n', '\r\n'))

with open(file_path_bank, 'w', encoding='utf-8') as f:
    f.write(text_bank)

print('BankAccounts.jsx updated successfully')
