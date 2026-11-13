with open('user/src/pages/BusinessReportsPage.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("display_image: b.logo_url || '/logo.png',", "display_image: b.logo_url || '',")
text = text.replace("display_image: f.avatar_url || '/logo.png',", "display_image: f.avatar_url || '',")

with open('user/src/pages/BusinessReportsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('BusinessReportsPage.jsx updated.')
