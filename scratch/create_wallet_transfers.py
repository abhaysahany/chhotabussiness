import subprocess

code = """
$create = Illuminate\\Support\\Facades\\DB::select('SHOW CREATE TABLE chhotabiz.wallet_transfers');
$sql = ((array)$create[0])['Create Table'];
echo $sql . "\\n";
Illuminate\\Support\\Facades\\DB::statement('CREATE TABLE IF NOT EXISTS chhotabiz_test.wallet_transfers LIKE chhotabiz.wallet_transfers');
echo "CREATED wallet_transfers in chhotabiz_test!\\n";
"""

out = subprocess.check_output(['php', 'artisan', 'tinker', f'--execute={code}'], cwd='backend')
print(out.decode('utf-8'))
