file_path = r'D:\xampp_lite_8_5\apps\apache\ad-net\user\src\components\settings\PersonalProfile.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add fieldErrors state
if 'const [fieldErrors, setFieldErrors] = useState({});' not in text:
    old_state = 'const [saveLoading, setSaveLoading] = useState(false);'
    rep_state = 'const [saveLoading, setSaveLoading] = useState(false);\n  const [fieldErrors, setFieldErrors] = useState({});'
    if old_state in text:
        text = text.replace(old_state, rep_state)
    elif old_state.replace('\n', '\r\n') in text:
        text = text.replace(old_state.replace('\n', '\r\n'), rep_state.replace('\n', '\r\n'))

# Update handleInputChange to clear field error
old_input_change = '''  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };'''

new_input_change = '''  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };'''

if old_input_change in text:
    text = text.replace(old_input_change, new_input_change)
elif old_input_change.replace('\n', '\r\n') in text:
    text = text.replace(old_input_change.replace('\n', '\r\n'), new_input_change.replace('\n', '\r\n'))

# Update handleSaveProfile with validation
old_save_prof = '''  // Full Profile Form Save Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    try {'''

new_save_prof = '''  // Full Profile Form Save Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const newErrors = {};

    const trimmedName = (formData.name || '').trim();
    if (!trimmedName) {
      newErrors.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Full name must be at least 2 characters long.';
    }

    const trimmedEmail = (formData.email || '').trim();
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!trimmedEmail) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (formData.phone) {
      const cleanPhone = formData.phone.replace(/[\\s-+]/g, '');
      if (cleanPhone && !/^[6-9]\\d{9}$/.test(cleanPhone)) {
        newErrors.phone = 'Phone number must be a valid 10-digit mobile number.';
      }
    }

    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
        newErrors.dob = 'Date of birth cannot be in the future.';
      }
    }

    if (formData.zipCode) {
      const cleanZip = formData.zipCode.trim();
      if (cleanZip && !/^\\d{6}$/.test(cleanZip)) {
        newErrors.zipCode = 'Postal / Zip code must be 6 numeric digits.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setToastMessageText('❌ Please fix the highlighted validation errors.');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3500);
      return;
    }

    setFieldErrors({});
    setSaveLoading(true);

    try {'''

if old_save_prof in text:
    text = text.replace(old_save_prof, new_save_prof)
elif old_save_prof.replace('\n', '\r\n') in text:
    text = text.replace(old_save_prof.replace('\n', '\r\n'), new_save_prof.replace('\n', '\r\n'))

# Add inline error displays under input fields
# Name
target_name = '''                      <input
                        type="text"
                        name="name"
                        required
                        className="form-input"
                        value={formData.name}
                        onChange={handleInputChange}
                      />'''
rep_name = '''                      <input
                        type="text"
                        name="name"
                        required
                        className="form-input"
                        value={formData.name}
                        onChange={handleInputChange}
                        style={{ border: fieldErrors.name ? '2px solid #ef4444' : undefined }}
                      />
                      {fieldErrors.name && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.name}
                        </span>
                      )}'''

if target_name in text:
    text = text.replace(target_name, rep_name)
elif target_name.replace('\n', '\r\n') in text:
    text = text.replace(target_name.replace('\n', '\r\n'), rep_name.replace('\n', '\r\n'))

# Email
target_email = '''                      <input
                        type="email"
                        name="email"
                        required
                        className="form-input"
                        value={formData.email}
                        onChange={handleInputChange}
                      />'''
rep_email = '''                      <input
                        type="email"
                        name="email"
                        required
                        className="form-input"
                        value={formData.email}
                        onChange={handleInputChange}
                        style={{ border: fieldErrors.email ? '2px solid #ef4444' : undefined }}
                      />
                      {fieldErrors.email && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.email}
                        </span>
                      )}'''

if target_email in text:
    text = text.replace(target_email, rep_email)
elif target_email.replace('\n', '\r\n') in text:
    text = text.replace(target_email.replace('\n', '\r\n'), rep_email.replace('\n', '\r\n'))

# Phone
target_phone = '''                      <input
                        type="tel"
                        name="phone"
                        required
                        className="form-input"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />'''
rep_phone = '''                      <input
                        type="tel"
                        name="phone"
                        required
                        className="form-input"
                        value={formData.phone}
                        onChange={handleInputChange}
                        style={{ border: fieldErrors.phone ? '2px solid #ef4444' : undefined }}
                      />
                      {fieldErrors.phone && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.phone}
                        </span>
                      )}'''

if target_phone in text:
    text = text.replace(target_phone, rep_phone)
elif target_phone.replace('\n', '\r\n') in text:
    text = text.replace(target_phone.replace('\n', '\r\n'), rep_phone.replace('\n', '\r\n'))

# DOB
target_dob = '''                      <input
                        type="date"
                        name="dob"
                        className="form-input"
                        value={formData.dob}
                        onChange={handleInputChange}
                      />'''
rep_dob = '''                      <input
                        type="date"
                        name="dob"
                        className="form-input"
                        value={formData.dob}
                        onChange={handleInputChange}
                        style={{ border: fieldErrors.dob ? '2px solid #ef4444' : undefined }}
                      />
                      {fieldErrors.dob && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.dob}
                        </span>
                      )}'''

if target_dob in text:
    text = text.replace(target_dob, rep_dob)
elif target_dob.replace('\n', '\r\n') in text:
    text = text.replace(target_dob.replace('\n', '\r\n'), rep_dob.replace('\n', '\r\n'))

# Zip Code
target_zip = '''                    <div className="form-group">
                      <label className="form-label">Postal / Zip Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        className="form-input"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                      />
                    </div>'''
rep_zip = '''                    <div className="form-group">
                      <label className="form-label">Postal / Zip Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        className="form-input"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        placeholder="e.g. 110001"
                        maxLength="6"
                        style={{ border: fieldErrors.zipCode ? '2px solid #ef4444' : undefined }}
                      />
                      {fieldErrors.zipCode && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.zipCode}
                        </span>
                      )}
                    </div>'''

if target_zip in text:
    text = text.replace(target_zip, rep_zip)
elif target_zip.replace('\n', '\r\n') in text:
    text = text.replace(target_zip.replace('\n', '\r\n'), rep_zip.replace('\n', '\r\n'))

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('PersonalProfile.jsx updated successfully')
