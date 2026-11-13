file_path = r'D:\xampp_lite_8_5\apps\apache\ad-net\user\src\components\settings\SecurityPassword.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add fieldErrors state
if 'const [fieldErrors, setFieldErrors] = useState({});' not in text:
    old_state = 'const [errorMessage, setErrorMessage] = useState(\'\');'
    rep_state = 'const [errorMessage, setErrorMessage] = useState(\'\');\n  const [fieldErrors, setFieldErrors] = useState({});'
    if old_state in text:
        text = text.replace(old_state, rep_state)
    elif old_state.replace('\n', '\r\n') in text:
        text = text.replace(old_state.replace('\n', '\r\n'), rep_state.replace('\n', '\r\n'))

# Update handlePasswordSubmit
old_pw_submit = '''  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (passwordData.newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New password and confirm password do not match!');
      return;
    }

    setLoading(true);'''

new_pw_submit = '''  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const newErrors = {};

    if (!isSocialUser && !passwordData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required.';
    }

    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required.';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters long.';
    }

    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please re-enter your new password.';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match. Please verify.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setErrorMessage('Please fix the highlighted validation errors.');
      return;
    }

    setFieldErrors({});
    setLoading(true);'''

if old_pw_submit in text:
    text = text.replace(old_pw_submit, new_pw_submit)
elif old_pw_submit.replace('\n', '\r\n') in text:
    text = text.replace(old_pw_submit.replace('\n', '\r\n'), new_pw_submit.replace('\n', '\r\n'))

# Add inline error displays under inputs
# Current Password
target_cur_pw = '''                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />'''
rep_cur_pw = '''                      value={passwordData.currentPassword}
                      onChange={(e) => { setPasswordData({ ...passwordData, currentPassword: e.target.value }); setFieldErrors(prev => ({ ...prev, currentPassword: null })); }}
                      placeholder="Enter current password"
                      style={{ border: fieldErrors.currentPassword ? '2px solid #ef4444' : undefined }}
                    />'''

if target_cur_pw in text:
    text = text.replace(target_cur_pw, rep_cur_pw)
elif target_cur_pw.replace('\n', '\r\n') in text:
    text = text.replace(target_cur_pw.replace('\n', '\r\n'), rep_cur_pw.replace('\n', '\r\n'))

# Add error span under current password wrapper
target_cur_close = '''                      {showCurrent ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>'''
rep_cur_close = '''                      {showCurrent ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {fieldErrors.currentPassword && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {fieldErrors.currentPassword}
                    </span>
                  )}
                </div>'''

if target_cur_close in text:
    text = text.replace(target_cur_close, rep_cur_close)
elif target_cur_close.replace('\n', '\r\n') in text:
    text = text.replace(target_cur_close.replace('\n', '\r\n'), rep_cur_close.replace('\n', '\r\n'))

# New Password
target_new_pw = '''                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Minimum 6 characters"
                    />'''
rep_new_pw = '''                      value={passwordData.newPassword}
                      onChange={(e) => { setPasswordData({ ...passwordData, newPassword: e.target.value }); setFieldErrors(prev => ({ ...prev, newPassword: null })); }}
                      placeholder="Minimum 6 characters"
                      style={{ border: fieldErrors.newPassword ? '2px solid #ef4444' : undefined }}
                    />'''

if target_new_pw in text:
    text = text.replace(target_new_pw, rep_new_pw)
elif target_new_pw.replace('\n', '\r\n') in text:
    text = text.replace(target_new_pw.replace('\n', '\r\n'), rep_new_pw.replace('\n', '\r\n'))

target_new_close = '''                      {showNew ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>'''
rep_new_close = '''                      {showNew ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {fieldErrors.newPassword && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {fieldErrors.newPassword}
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>'''

if target_new_close in text:
    text = text.replace(target_new_close, rep_new_close)
elif target_new_close.replace('\n', '\r\n') in text:
    text = text.replace(target_new_close.replace('\n', '\r\n'), rep_new_close.replace('\n', '\r\n'))

# Confirm Password
target_conf_pw = '''                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                    />'''
rep_conf_pw = '''                      value={passwordData.confirmPassword}
                      onChange={(e) => { setPasswordData({ ...passwordData, confirmPassword: e.target.value }); setFieldErrors(prev => ({ ...prev, confirmPassword: null })); }}
                      placeholder="Re-enter new password"
                      style={{ border: fieldErrors.confirmPassword ? '2px solid #ef4444' : undefined }}
                    />'''

if target_conf_pw in text:
    text = text.replace(target_conf_pw, rep_conf_pw)
elif target_conf_pw.replace('\n', '\r\n') in text:
    text = text.replace(target_conf_pw.replace('\n', '\r\n'), rep_conf_pw.replace('\n', '\r\n'))

target_conf_close = '''                      {showConfirm ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>'''
rep_conf_close = '''                      {showConfirm ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {fieldErrors.confirmPassword}
                    </span>
                  )}
                </div>'''

if target_conf_close in text:
    text = text.replace(target_conf_close, rep_conf_close)
elif target_conf_close.replace('\n', '\r\n') in text:
    text = text.replace(target_conf_close.replace('\n', '\r\n'), rep_conf_close.replace('\n', '\r\n'))

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('SecurityPassword.jsx updated successfully')
