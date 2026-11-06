file_path = r'D:\xampp_lite_8_5\apps\apache\ad-net\user\src\components\LoginForm.jsx'
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

# Update handleSubmit with client validation
old_submit = '''  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setShowRegisterPrompt(false);
    setLoading(true);

    try {
      await onLoginSuccess({ email, password, rememberMe });'''

new_submit = '''  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setShowRegisterPrompt(false);

    const newErrors = {};
    const trimmedEmail = (email || '').trim();
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

    if (!trimmedEmail) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address format.';
    }

    const trimmedPassword = (password || '').trim();
    if (!trimmedPassword) {
      newErrors.password = 'Password is required.';
    } else if (trimmedPassword.length < 4) {
      newErrors.password = 'Password must be at least 4 characters.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setErrorMessage('Please resolve the highlighted validation errors.');
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await onLoginSuccess({ email: trimmedEmail, password: trimmedPassword, rememberMe });'''

if old_submit in text:
    text = text.replace(old_submit, new_submit)
elif old_submit.replace('\n', '\r\n') in text:
    text = text.replace(old_submit.replace('\n', '\r\n'), new_submit.replace('\n', '\r\n'))

# Update email and password onChange to clear fieldErrors
text = text.replace(
    'onChange={(e) => setEmail(e.target.value)}',
    'onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: null })); }}'
)
text = text.replace(
    'onChange={(e) => setPassword(e.target.value)}',
    'onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: null })); }}'
)

# Add inline error display in JSX
target_email_close = '''                  />
                </div>
              </div>

              {/* Password Field */}'''

rep_email_close = '''                  />
                </div>
                {fieldErrors.email && (
                  <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.email}
                  </span>
                )}
              </div>

              {/* Password Field */}'''

if target_email_close in text:
    text = text.replace(target_email_close, rep_email_close)
elif target_email_close.replace('\n', '\r\n') in text:
    text = text.replace(target_email_close.replace('\n', '\r\n'), rep_email_close.replace('\n', '\r\n'))

target_pw_close = '''                  </button>
                </div>
              </div>

              {/* Options: Remember Me & Forgot Password */}'''

rep_pw_close = '''                  </button>
                </div>
                {fieldErrors.password && (
                  <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.password}
                  </span>
                )}
              </div>

              {/* Options: Remember Me & Forgot Password */}'''

if target_pw_close in text:
    text = text.replace(target_pw_close, rep_pw_close)
elif target_pw_close.replace('\n', '\r\n') in text:
    text = text.replace(target_pw_close.replace('\n', '\r\n'), rep_pw_close.replace('\n', '\r\n'))

# Update forgot password OTP validation
old_forgot_otp = '''    if (forgotOtp.length !== 6) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }'''

new_forgot_otp = '''    const cleanOtp = (forgotOtp || '').trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\\d{6}$/.test(cleanOtp)) {
      setForgotError('Please enter the valid 6-digit numeric verification code.');
      return;
    }'''

if old_forgot_otp in text:
    text = text.replace(old_forgot_otp, new_forgot_otp)
elif old_forgot_otp.replace('\n', '\r\n') in text:
    text = text.replace(old_forgot_otp.replace('\n', '\r\n'), new_forgot_otp.replace('\n', '\r\n'))

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('LoginForm.jsx updated successfully')
