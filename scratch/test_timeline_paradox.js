const created_at = "2026-11-03T12:01:56.000000Z"; // from Order::toArray()
const admin_confirmed_at = "2026-11-03 12:02:44";    // from Order::toArray()

const d1 = new Date(created_at);
const d2 = new Date(admin_confirmed_at);

console.log("=== ON-SCREEN DISPLAY IN INDIA (Asia/Kolkata) ===");
console.log("Order Created At:   ", d1.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
console.log("Admin Confirmed At: ", d2.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
console.log("Difference:         ", (d2.getTime() - d1.getTime()) / (1000 * 60), "minutes");
