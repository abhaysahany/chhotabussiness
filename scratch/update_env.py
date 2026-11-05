with open('backend/.env', 'r', encoding='utf-8') as f:
    content = f.read()

if 'DB_TIMEZONE' not in content:
    if 'DB_PASSWORD=\r\n' in content:
        content = content.replace('DB_PASSWORD=\r\n', 'DB_PASSWORD=\r\nDB_TIMEZONE="+00:00"\r\n')
    elif 'DB_PASSWORD=\n' in content:
        content = content.replace('DB_PASSWORD=\n', 'DB_PASSWORD=\nDB_TIMEZONE="+00:00"\n')
    else:
        content += '\nDB_TIMEZONE="+00:00"\n'
    with open('backend/.env', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated .env with DB_TIMEZONE')
else:
    print('DB_TIMEZONE already in .env')
