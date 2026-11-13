/**
 * Format numeric value to Indian Currency Format (₹)
 * e.g., 145000 -> "₹1,45,000", 4310000 -> "₹43,10,000"
 */
export const formatINR = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Format numeric value in Indian Numbering System
 * e.g., 145000 -> "1,45,000", 4310000 -> "43,10,000"
 */
export const formatNumberIN = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Format Business Volume (BV)
 * e.g., 1250 -> "1,250 BV"
 */
export const formatBV = (value) => {
  const num = Number(value) || 0;
  return `${new Intl.NumberFormat('en-IN').format(num)} BV`;
};

/**
 * Mask Email address to protect direct contact
 * e.g., "info@skyline.com" -> "in***@***.com"
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '***@***.***';
  const parts = email.split('@');
  if (parts.length < 2) return '***@***.***';
  const name = parts[0];
  const domainParts = parts[1].split('.');
  const ext = domainParts.length > 1 ? domainParts.pop() : 'com';
  const prefix = name.length > 2 ? name.substring(0, 2) : name.substring(0, 1);
  return `${prefix}***@***.${ext}`;
};

/**
 * Mask Phone number to protect direct contact
 * e.g., "+91 98765 43210" -> "+91 98*** ***10"
 */
export const maskPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '+91 ***** *****';
  const cleaned = phone.trim();
  if (cleaned.length >= 10) {
    const last2 = cleaned.slice(-2);
    const first3 = cleaned.slice(0, 3);
    return `${first3}*****${last2}`;
  }
  return '+91 ***** *****';
};
