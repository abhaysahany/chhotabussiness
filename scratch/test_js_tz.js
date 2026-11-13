const d = new Date('2026-11-05T01:30:00+05:30'); // 1:30 AM IST on Nov 5
console.log('IST time:', d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
console.log('toISOString():', d.toISOString());
console.log('toISOString().split("T")[0]:', d.toISOString().split('T')[0]);

const dateOnly = new Date('2026-11-05');
console.log('new Date("2026-11-05") in UTC:', dateOnly.toUTCString());
console.log('new Date("2026-11-05") in Asia/Kolkata:', dateOnly.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
console.log('new Date("2026-11-05") in America/New_York:', dateOnly.toLocaleString('en-US', { timeZone: 'America/New_York' }));
