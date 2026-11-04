with open('user/src/components/LoginForm.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''    try {
      await onLoginSuccess({ email, password, rememberMe });
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Invalid email or password. Please verify credentials and try again.'
      );
    } finally {'''

replacement = '''    try {
      await onLoginSuccess({ email, password, rememberMe });
    } catch (err) {
      console.error('Login error:', err);
      const networkMsg = typeof window !== 'undefined' && window.location.origin.includes('vyaparadnet.com')
        ? 'Unable to connect to backend server. Please verify your connection or try again shortly.'
        : 'Network Error: Unable to connect to backend server.';
      setErrorMessage(
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : null) ||
        (!err.response ? networkMsg : err.message || 'Invalid email or password. Please verify credentials and try again.')
      );
    } finally {'''

if target in content:
    content = content.replace(target, replacement, 1)
    with open('user/src/components/LoginForm.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated LoginForm.jsx successfully')
else:
    print('Target not matched')
