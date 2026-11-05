path = 'backend/tests/Feature/OrderApprovalWorkflowTest.php'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

old = '->postJson("/api/admin/payments/{$payment->id}/income-allocation");'
new = '->postJson("/api/admin/payments/{$payment->id}/income-allocation");\n        if ($allocRes->status() !== 200) { fwrite(STDERR, json_encode($allocRes->json()) . "\\n"); }'

assert old in text
text = text.replace(old, new, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Dump added")
