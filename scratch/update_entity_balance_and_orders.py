# 1. Update EntityReceiveBalancePage.jsx
file_path1 = r'D:\xampp_lite_8_5\apps\apache\ad-net\entity\src\pages\EntityReceiveBalancePage.jsx'
with open(file_path1, 'r', encoding='utf-8') as f:
    text1 = f.read()

old_bal_submit = '''    if (amount > balance) {
      showToast(`Payment amount cannot exceed outstanding balance (₹${balance.toLocaleString()}).`);
      return;
    }'''

new_bal_submit = '''    if (amount > balance) {
      showToast(`Payment amount cannot exceed outstanding balance (₹${balance.toLocaleString()}).`);
      return;
    }

    if (paymentMethod !== 'Cash' && (!referenceNo || !referenceNo.trim())) {
      showToast('Please enter the transaction reference number / UTR for non-cash payment.');
      return;
    }'''

if old_bal_submit in text1:
    text1 = text1.replace(old_bal_submit, new_bal_submit)
elif old_bal_submit.replace('\n', '\r\n') in text1:
    text1 = text1.replace(old_bal_submit.replace('\n', '\r\n'), new_bal_submit.replace('\n', '\r\n'))

with open(file_path1, 'w', encoding='utf-8') as f:
    f.write(text1)

print('EntityReceiveBalancePage.jsx updated')

# 2. Update EntityOrders.jsx
file_path2 = r'D:\xampp_lite_8_5\apps\apache\ad-net\entity\src\pages\EntityOrders.jsx'
with open(file_path2, 'r', encoding='utf-8') as f:
    text2 = f.read()

old_dump_check = '''    if (!dumpReason.trim() || dumpReason.trim().length < 3) {
      setDumpError('Please provide a reason (minimum 3 characters) explaining why this payment has become dump.');
      return;
    }'''

new_dump_check = '''    if (!dumpReason.trim() || dumpReason.trim().length < 5) {
      setDumpError('Please provide a detailed reason (minimum 5 characters) explaining why this payment has become dump.');
      return;
    }'''

if old_dump_check in text2:
    text2 = text2.replace(old_dump_check, new_dump_check)
elif old_dump_check.replace('\n', '\r\n') in text2:
    text2 = text2.replace(old_dump_check.replace('\n', '\r\n'), new_dump_check.replace('\n', '\r\n'))

with open(file_path2, 'w', encoding='utf-8') as f:
    f.write(text2)

print('EntityOrders.jsx updated')
