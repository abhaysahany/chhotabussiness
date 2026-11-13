file_path = r'D:\xampp_lite_8_5\apps\apache\ad-net\entity\src\pages\EntityCreateOrder.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add errors state
if 'const [formErrors, setFormErrors] = useState({});' not in text:
    target_state = 'const [isSubmitting, setIsSubmitting] = useState(false);'
    rep_state = 'const [isSubmitting, setIsSubmitting] = useState(false);\n  const [formErrors, setFormErrors] = useState({});'
    if target_state in text:
        text = text.replace(target_state, rep_state)
    elif target_state.replace('\n', '\r\n') in text:
        text = text.replace(target_state.replace('\n', '\r\n'), rep_state.replace('\n', '\r\n'))

# Replace handleSubmitSale validation
old_submit_start = '''  const handleSubmitSale = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!customerUserCode.trim()) {
      setToastMessage('Please enter a Member ID (e.g. CB100001).');
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }

    if (!memberVerified) {
      setToastMessage(memberLookupError || 'Please enter a valid registered Member ID from the database.');
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }

    if (!customerName) {
      setToastMessage('Customer Name is required.');
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }

    setIsSubmitting(true);'''

new_submit_start = '''  const handleSubmitSale = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors = {};

    if (!customerUserCode.trim()) {
      newErrors.customerUserCode = 'Member ID is required (e.g. CB100001).';
    } else if (!memberVerified) {
      newErrors.customerUserCode = memberLookupError || 'Please enter a valid, database-verified Member ID.';
    }

    if (!customerName.trim()) {
      newErrors.customerName = 'Customer Name is required.';
    }

    if (customerEmail.trim()) {
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(customerEmail.trim())) {
        newErrors.customerEmail = 'Please enter a valid email address.';
      }
    }

    if (customerPhone.trim()) {
      const cleanPhone = customerPhone.replace(/[\\s-+]/g, '');
      if (!/^[6-9]\\d{9}$/.test(cleanPhone)) {
        newErrors.customerPhone = 'Phone number must be a valid 10-digit mobile number.';
      }
    }

    if (!customItemName.trim()) {
      newErrors.customItemName = 'Item description / title is required.';
    }

    if (!customPrice || Number(customPrice) <= 0 || isNaN(Number(customPrice))) {
      newErrors.customPrice = 'Price must be greater than ₹0.';
    }

    if (!quantity || Number(quantity) < 1 || isNaN(Number(quantity))) {
      newErrors.quantity = 'Quantity must be at least 1.';
    }

    if (Number(discountPercent) < 0 || Number(discountPercent) > 100) {
      newErrors.discountPercent = 'Discount must be between 0% and 100%.';
    }

    if (Number(advancePayment) < 0 || isNaN(Number(advancePayment))) {
      newErrors.advancePayment = 'Advance payment must be a valid positive amount.';
    } else if (Number(advancePayment) > grandTotal) {
      newErrors.advancePayment = `Advance payment cannot exceed Grand Total (₹${grandTotal.toLocaleString()}).`;
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setToastMessage('❌ Please resolve the highlighted form validation errors.');
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);'''

if old_submit_start in text:
    text = text.replace(old_submit_start, new_submit_start)
elif old_submit_start.replace('\n', '\r\n') in text:
    text = text.replace(old_submit_start.replace('\n', '\r\n'), new_submit_start.replace('\n', '\r\n'))

# Add inline error displays under inputs
# 1. customItemName
target_item_input = '''                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    required
                  />'''
rep_item_input = '''                    value={customItemName}
                    onChange={(e) => { setCustomItemName(e.target.value); setFormErrors(prev => ({ ...prev, customItemName: null })); }}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: formErrors.customItemName ? '2px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    required
                  />
                  {formErrors.customItemName && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {formErrors.customItemName}
                    </span>
                  )}'''

if target_item_input in text:
    text = text.replace(target_item_input, rep_item_input)
elif target_item_input.replace('\n', '\r\n') in text:
    text = text.replace(target_item_input.replace('\n', '\r\n'), rep_item_input.replace('\n', '\r\n'))

# 2. Price
target_price_input = '''                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      min="1"
                      required
                    />'''
rep_price_input = '''                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => { setCustomPrice(Number(e.target.value)); setFormErrors(prev => ({ ...prev, customPrice: null })); }}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: formErrors.customPrice ? '2px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      min="1"
                      required
                    />
                    {formErrors.customPrice && (
                      <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                        ⚠️ {formErrors.customPrice}
                      </span>
                    )}'''

if target_price_input in text:
    text = text.replace(target_price_input, rep_price_input)
elif target_price_input.replace('\n', '\r\n') in text:
    text = text.replace(target_price_input.replace('\n', '\r\n'), rep_price_input.replace('\n', '\r\n'))

# 3. Customer User Code
target_code_err = '''                {/* Error Message when Member ID not found in database */}
                {memberLookupError && ('''
rep_code_err = '''                {formErrors.customerUserCode && (
                  <div style={{ marginTop: '0.5rem', padding: '0.65rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>❌</span>
                    <span>{formErrors.customerUserCode}</span>
                  </div>
                )}
                {/* Error Message when Member ID not found in database */}
                {!formErrors.customerUserCode && memberLookupError && ('''

if target_code_err in text:
    text = text.replace(target_code_err, rep_code_err)
elif target_code_err.replace('\n', '\r\n') in text:
    text = text.replace(target_code_err.replace('\n', '\r\n'), rep_code_err.replace('\n', '\r\n'))

# 4. Customer Name and Email
target_name_input = '''                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Auto-filled on valid Member ID"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: memberVerified ? '#f8fafc' : '#ffffff' }}
                    required
                  />'''
rep_name_input = '''                    value={customerName}
                    onChange={(e) => { setCustomerName(e.target.value); setFormErrors(prev => ({ ...prev, customerName: null })); }}
                    placeholder="Auto-filled on valid Member ID"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: formErrors.customerName ? '2px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.85rem', background: memberVerified ? '#f8fafc' : '#ffffff' }}
                    required
                  />
                  {formErrors.customerName && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {formErrors.customerName}
                    </span>
                  )}'''

if target_name_input in text:
    text = text.replace(target_name_input, rep_name_input)
elif target_name_input.replace('\n', '\r\n') in text:
    text = text.replace(target_name_input.replace('\n', '\r\n'), rep_name_input.replace('\n', '\r\n'))

target_email_input = '''                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Auto-filled on valid Member ID"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: memberVerified ? '#f8fafc' : '#ffffff' }}
                    required
                  />'''
rep_email_input = '''                    value={customerEmail}
                    onChange={(e) => { setCustomerEmail(e.target.value); setFormErrors(prev => ({ ...prev, customerEmail: null })); }}
                    placeholder="Auto-filled on valid Member ID"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: formErrors.customerEmail ? '2px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.85rem', background: memberVerified ? '#f8fafc' : '#ffffff' }}
                    required
                  />
                  {formErrors.customerEmail && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {formErrors.customerEmail}
                    </span>
                  )}'''

if target_email_input in text:
    text = text.replace(target_email_input, rep_email_input)
elif target_email_input.replace('\n', '\r\n') in text:
    text = text.replace(target_email_input.replace('\n', '\r\n'), rep_email_input.replace('\n', '\r\n'))

# 5. Customer Phone
target_phone_input = '''                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />'''
rep_phone_input = '''                    value={customerPhone}
                    onChange={(e) => { setCustomerPhone(e.target.value); setFormErrors(prev => ({ ...prev, customerPhone: null })); }}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: formErrors.customerPhone ? '2px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  {formErrors.customerPhone && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {formErrors.customerPhone}
                    </span>
                  )}'''

if target_phone_input in text:
    text = text.replace(target_phone_input, rep_phone_input)
elif target_phone_input.replace('\n', '\r\n') in text:
    text = text.replace(target_phone_input.replace('\n', '\r\n'), rep_phone_input.replace('\n', '\r\n'))

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('EntityCreateOrder.jsx updated successfully')
