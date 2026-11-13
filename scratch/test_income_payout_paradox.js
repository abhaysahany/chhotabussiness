// Direct Income from UserIncomeController
const direct_income_created_at = "2026-11-03T12:00:00+00:00"; 

// Payout Request from UserPayoutController
const payout_request_date = "2026-11-03 12:00:00";

const dIncome = new Date(direct_income_created_at);
const dPayout = new Date(payout_request_date);

console.log("=== USER PANEL SIMULTANEOUS EVENT COMPARISON ===");
console.log("Direct Income Displayed in IST: ", dIncome.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
console.log("Payout Request Displayed in IST:", dPayout.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
