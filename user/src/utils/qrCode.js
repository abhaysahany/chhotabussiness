/**
 * Vyapar AdNET — Robust ISO/IEC 18004 Standard QR Code Generator
 * Powered by standard 'qrcode' engine.
 * Generates standards-compliant QR Codes readable by any mobile camera or scanner app.
 * Outputs clean SVG strings, Data URLs, and triggers client-side PNG downloads.
 */

import QRCode from 'qrcode';

/**
 * Synchronously generates an ISO-compliant SVG string for the given text/URL.
 * Compatible with all smartphone cameras, Google Lens, and scanner apps.
 *
 * @param {string} text - URL or text to encode
 * @param {object} options - Config { size, color, bgColor, margin, errorCorrectionLevel }
 * @returns {string} SVG markup string
 */
export function generateQRSvg(text, options = {}) {
  if (!text) return '';

  const {
    size = 195,
    color = '#0F172A',
    bgColor = '#FFFFFF',
    margin = 2,
    errorCorrectionLevel = 'M',
  } = options;

  let svgString = '';
  try {
    QRCode.toString(
      text,
      {
        type: 'svg',
        width: size,
        margin: margin,
        errorCorrectionLevel: errorCorrectionLevel,
        color: {
          dark: color,
          light: bgColor,
        },
      },
      (err, string) => {
        if (!err && string) {
          svgString = string;
        }
      }
    );
  } catch (err) {
    console.error('Failed to generate QR SVG:', err);
  }

  return svgString;
}

/**
 * Triggers instant client-side download of QR code as a high-resolution PNG image.
 * Uses maximum 'H' (High) error correction for print/event quality.
 *
 * @param {string} text - URL or text to encode
 * @param {string} filename - Download file name
 * @param {number} size - Image width/height in pixels
 */
export async function downloadQRPng(text, filename = 'addnet-referral-qr.png', size = 600) {
  if (!text) return;

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 3,
      width: size,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to download QR code PNG:', err);
  }
}

/**
 * Generates raw 2D QR matrix array (0/1) for backwards compatibility if needed.
 *
 * @param {string} text - URL or text to encode
 * @param {string} errorCorrectionLevel - 'L', 'M', 'Q', 'H'
 * @returns {number[][]} 2D array of modules (1 for dark, 0 for light)
 */
export function generateQRMatrix(text, errorCorrectionLevel = 'M') {
  if (!text) return [];

  try {
    const qr = QRCode.create(text, { errorCorrectionLevel });
    const size = qr.modules.size;
    const matrix = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        row.push(qr.modules.get(r, c) ? 1 : 0);
      }
      matrix.push(row);
    }
    return matrix;
  } catch (err) {
    console.error('Failed to generate QR matrix:', err);
    return [];
  }
}
