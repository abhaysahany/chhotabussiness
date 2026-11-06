file_path = r'D:\xampp_lite_8_5\apps\apache\ad-net\user\src\components\RegisterForm.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

old_reg_val = '''    if (!trimmedName) {
      localErrors.name = ['Full Name / Business Name is required.'];
    }

    if (!trimmedEmail) {
      localErrors.email = ['Email address is required.'];
    }

    if (!password || password.length < 6) {
      localErrors.password = ['Password must be at least 6 characters.'];
    }'''

new_reg_val = '''    if (!trimmedName) {
      localErrors.name = ['Full Name / Business Name is required.'];
    } else if (trimmedName.length < 2) {
      localErrors.name = ['Full Name must be at least 2 characters long.'];
    }

    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!trimmedEmail) {
      localErrors.email = ['Email address is required.'];
    } else if (!emailRegex.test(trimmedEmail)) {
      localErrors.email = ['Please enter a valid email address format.'];
    }

    if (!password || password.length < 6) {
      localErrors.password = ['Password must be at least 6 characters.'];
    }'''

if old_reg_val in text:
    text = text.replace(old_reg_val, new_reg_val)
elif old_reg_val.replace('\n', '\r\n') in text:
    text = text.replace(old_reg_val.replace('\n', '\r\n'), new_reg_val.replace('\n', '\r\n'))

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('RegisterForm.jsx updated successfully')
