with open('entity/src/pages/EntityLogin.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''    } catch (err) {
      console.error('Entity login error:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : 'Invalid credentials or unable to connect to backend server.');
      setError(errMsg);
    } finally {'''

replacement = '''    } catch (err) {
      console.error('Entity login error:', err);
      const networkMsg = typeof window !== 'undefined' && window.location.origin.includes('vyaparadnet.com')
        ? 'Unable to connect to backend server. Please verify your connection or try again shortly.'
        : 'Unable to connect to backend server. Please verify that "php artisan serve" is running.';
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : (!err.response ? networkMsg : 'Invalid credentials or unable to connect to backend server.'));
      setError(errMsg);
    } finally {'''

if target in content:
    content = content.replace(target, replacement, 1)
    with open('entity/src/pages/EntityLogin.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated EntityLogin.jsx successfully')
else:
    print('Target not matched')
