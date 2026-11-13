// Simulating what happens in a browser running in IST (Asia/Kolkata)
const created_at_from_api = "2026-11-03T12:01:56.000000Z";
const payment_date_from_api = "2026-11-03 12:01:56";

// Parsing in browser:
const dateA = new Date(created_at_from_api);
const dateB = new Date(payment_date_from_api);

console.log("created_at display in IST:", dateA.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
console.log("payment_date display in IST:", dateB.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
