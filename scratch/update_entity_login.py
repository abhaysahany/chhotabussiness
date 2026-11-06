import re

file_path = r'D:\xampp_lite_8_5\apps\apache\ad-net\entity\src\pages\EntityLogin.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Clear field errors on change
text = text.replace(
    'onChange={(e) => setEmail(e.target.value)}',
    'onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: null })); }}'
)
text = text.replace(
    'onChange={(e) => setPassword(e.target.value)}',
    'onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: null })); }}'
)
text = text.replace(
    'onChange={(e) => handleEntitySelect(e.target.value)}',
    'onChange={(e) => { handleEntitySelect(e.target.value); setFieldErrors(prev => ({ ...prev, entity: null })); }}'
)

# 2. Add error display after entity select
if 'fieldErrors.entity' not in text:
    old_ent = '{selectedEntity ? ('
    new_ent = '{fieldErrors.entity && (<span style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "0.25rem", display: "block", fontWeight: 600 }}>⚠️ {fieldErrors.entity}</span>)}\n            {selectedEntity ? ('
    text = text.replace(old_ent, new_ent)

# 3. Add error display after email input
if 'fieldErrors.email' not in text:
    target_email = 'autoComplete="username email"\n            />'
    target_email_crlf = 'autoComplete="username email"\r\n            />'
    rep_email = 'autoComplete="username email"\n            />\n            {fieldErrors.email && (<span style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "0.25rem", display: "block", fontWeight: 600 }}>⚠️ {fieldErrors.email}</span>)}'
    if target_email_crlf in text:
        text = text.replace(target_email_crlf, rep_email.replace('\n', '\r\n'))
    else:
        text = text.replace(target_email, rep_email)

# 4. Add error display after password input
if 'fieldErrors.password' not in text:
    target_pw = '</div>\n          </div>\n\n          <div className="form-options-row"'
    target_pw_crlf = '</div>\r\n          </div>\r\n\r\n          <div className="form-options-row"'
    rep_pw = '</div>\n            {fieldErrors.password && (<span style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "0.25rem", display: "block", fontWeight: 600 }}>⚠️ {fieldErrors.password}</span>)}\n          </div>\n\n          <div className="form-options-row"'
    if target_pw_crlf in text:
        text = text.replace(target_pw_crlf, rep_pw.replace('\n', '\r\n'))
    else:
        text = text.replace(target_pw, rep_pw)

# 5. Forgot password step 1 email error
if 'forgotFieldErrors.email' not in text:
    target_fe = 'value={resetEmail}\n                    onChange={(e) => setResetEmail(e.target.value)}\n                    style={{ width: \'100%\' }}\n                  />'
    target_fe_crlf = 'value={resetEmail}\r\n                    onChange={(e) => setResetEmail(e.target.value)}\r\n                    style={{ width: \'100%\' }}\r\n                  />'
    rep_fe = 'value={resetEmail}\n                    onChange={(e) => { setResetEmail(e.target.value); setForgotFieldErrors(prev => ({ ...prev, email: null })); }}\n                    style={{ width: \'100%\' }}\n                  />\n                  {forgotFieldErrors.email && (<span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem", display: "block", fontWeight: 600 }}>⚠️ {forgotFieldErrors.email}</span>)}'
    if target_fe_crlf in text:
        text = text.replace(target_fe_crlf, rep_fe.replace('\n', '\r\n'))
    else:
        text = text.replace(target_fe, rep_fe)

# 6. Forgot password step 2 otp error
if 'forgotFieldErrors.otp' not in text:
    target_fo = 'onChange={(e) => setResetOtp(e.target.value.replace(/\\D/g, \'\'))}\n                    style={{ width: \'100%\', letterSpacing: \'4px\', fontSize: \'1.25rem\', textAlign: \'center\', fontWeight: \'700\' }}\n                  />'
    target_fo_crlf = 'onChange={(e) => setResetOtp(e.target.value.replace(/\\D/g, \'\'))}\r\n                    style={{ width: \'100%\', letterSpacing: \'4px\', fontSize: \'1.25rem\', textAlign: \'center\', fontWeight: \'700\' }}\r\n                  />'
    rep_fo = 'onChange={(e) => { setResetOtp(e.target.value.replace(/\\D/g, \'\')); setForgotFieldErrors(prev => ({ ...prev, otp: null })); }}\n                    style={{ width: \'100%\', letterSpacing: \'4px\', fontSize: \'1.25rem\', textAlign: \'center\', fontWeight: \'700\' }}\n                  />\n                  {forgotFieldErrors.otp && (<span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem", display: "block", textAlign: "center", fontWeight: 600 }}>⚠️ {forgotFieldErrors.otp}</span>)}'
    if target_fo_crlf in text:
        text = text.replace(target_fo_crlf, rep_fo.replace('\n', '\r\n'))
    else:
        text = text.replace(target_fo, rep_fo)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated EntityLogin.jsx successfully')
