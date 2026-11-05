import subprocess

code = """
$testTables = Illuminate\\Support\\Facades\\DB::select('SHOW TABLES FROM chhotabiz_test');
$prodTables = Illuminate\\Support\\Facades\\DB::select('SHOW TABLES FROM chhotabiz');

$testNames = array_map(function($r) { return array_values((array)$r)[0]; }, $testTables);
$prodNames = array_map(function($r) { return array_values((array)$r)[0]; }, $prodTables);

$missing = array_diff($prodNames, $testNames);
echo "Missing in chhotabiz_test: " . json_encode(array_values($missing)) . "\\n";
"""

out = subprocess.check_output(['php', 'artisan', 'tinker', f'--execute={code}'], cwd='backend')
print(out.decode('utf-8'))
