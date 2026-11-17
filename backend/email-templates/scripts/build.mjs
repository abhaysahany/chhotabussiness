import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';
import React from 'react';
import { render } from '@react-email/render';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.resolve(rootDir, 'src');
const cacheDir = path.resolve(rootDir, '.build-cache');
const distDir = path.resolve(rootDir, 'dist');
const laravelCompiledDir = path.resolve(rootDir, '../resources/views/emails/compiled');
const previewsDir = path.resolve(rootDir, '../../scratch/email-previews');

// Ensure output directories exist
for (const dir of [cacheDir, distDir, laravelCompiledDir, previewsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

console.log('--- Vyapar AdNET React Email Builder ---');

// List of all component & template files in dependency order
const filesToCompile = [
  'components/EmailHeader.tsx',
  'components/EmailFooter.tsx',
  'components/OtpDisplay.tsx',
  'components/EmailLayout.tsx',
  'templates/RegistrationOtpEmail.tsx',
  'templates/PasswordResetOtpEmail.tsx',
];

// 1. Transpile all TypeScript/TSX files to ESM JS in .build-cache
for (const relFile of filesToCompile) {
  const srcPath = path.resolve(srcDir, relFile);
  const outRelPath = relFile.replace(/\.tsx$/, '.js');
  const outPath = path.resolve(cacheDir, outRelPath);
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const tsCode = fs.readFileSync(srcPath, 'utf8');
  const transpiled = ts.transpileModule(tsCode, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    },
  });

  fs.writeFileSync(outPath, transpiled.outputText, 'utf8');
  console.log(`Transpiled: src/${relFile} -> .build-cache/${outRelPath}`);
}

// 2. Dynamically import transpiled templates and render with @react-email/render
const regModulePath = path.resolve(cacheDir, 'templates/RegistrationOtpEmail.js');
const resetModulePath = path.resolve(cacheDir, 'templates/PasswordResetOtpEmail.js');

const regModule = await import(`file://${regModulePath.replace(/\\/g, '/')}?t=${Date.now()}`);
const resetModule = await import(`file://${resetModulePath.replace(/\\/g, '/')}?t=${Date.now()}`);

const RegistrationOtpEmail = regModule.RegistrationOtpEmail || regModule.default;
const PasswordResetOtpEmail = resetModule.PasswordResetOtpEmail || resetModule.default;

function postProcessHtml(rawHtml) {
  // Decode any URL-encoded placeholder characters (e.g., %7B%7B -> {{)
  let html = rawHtml
    .replace(/%7B%7B/g, '{{')
    .replace(/%7D%7D/g, '}}')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;bull;/g, '&bull;');

  // Inject Outlook MSO conditional container wrappers if not present
  if (!html.includes('<!--[if (gte mso 9)|(IE)]>')) {
    html = html.replace(
      /(<table[^>]*class="[^"]*email-container[^"]*"[^>]*>)/i,
      '<!--[if (gte mso 9)|(IE)]><table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="580"><tr><td align="center" valign="top" width="580"><![endif]-->$1'
    );
    html = html.replace(
      /(<\/table>[\s\r\n]*<\/td>[\s\r\n]*<\/tr>[\s\r\n]*<\/tbody>[\s\r\n]*<\/table>[\s\r\n]*<\/body>)/i,
      '<!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->$1'
    );
  }

  // Strip React SSR text-separator comments (<!-- -->)
  html = html.replace(/<!-- -->/g, '');

  return html;
}

// Render Registration OTP
const rawRegHtml = await render(React.createElement(RegistrationOtpEmail, {}));
const finalRegHtml = postProcessHtml(rawRegHtml);

fs.writeFileSync(path.resolve(distDir, 'registration-otp.html'), finalRegHtml, 'utf8');
fs.writeFileSync(path.resolve(laravelCompiledDir, 'registration-otp.html'), finalRegHtml, 'utf8');
console.log(`Rendered: dist/registration-otp.html (${finalRegHtml.length} bytes)`);

// Render Password Reset OTP
const rawResetHtml = await render(React.createElement(PasswordResetOtpEmail, {}));
const finalResetHtml = postProcessHtml(rawResetHtml);

fs.writeFileSync(path.resolve(distDir, 'password-reset-otp.html'), finalResetHtml, 'utf8');
fs.writeFileSync(path.resolve(laravelCompiledDir, 'password-reset-otp.html'), finalResetHtml, 'utf8');
console.log(`Rendered: dist/password-reset-otp.html (${finalResetHtml.length} bytes)`);

// 3. Generate local visual preview HTML files with mock data
const mockRegPreview = finalRegHtml
  .replace(/{{RECIPIENT_NAME}}/g, 'Vikram Sharma')
  .replace(/{{OTP_CODE}}/g, '849201')
  .replace(/{{EXPIRY_MINUTES}}/g, '10')
  .replace(/{{CURRENT_YEAR}}/g, new Date().getFullYear().toString())
  .replace(/{{LOGO_URL}}/g, '../../backend/public/images/logo-email.png');

fs.writeFileSync(path.resolve(previewsDir, 'registration-otp-react-preview.html'), mockRegPreview, 'utf8');
console.log(`Generated: scratch/email-previews/registration-otp-react-preview.html`);

const mockResetPreview = finalResetHtml
  .replace(/{{RECIPIENT_NAME}}/g, 'Vikram Sharma')
  .replace(/{{ACCOUNT_TYPE}}/g, 'Member')
  .replace(/{{OTP_CODE}}/g, '391482')
  .replace(/{{EXPIRY_MINUTES}}/g, '15')
  .replace(/{{CURRENT_YEAR}}/g, new Date().getFullYear().toString())
  .replace(/{{LOGO_URL}}/g, '../../backend/public/images/logo-email.png');

fs.writeFileSync(path.resolve(previewsDir, 'password-reset-otp-react-preview.html'), mockResetPreview, 'utf8');
console.log(`Generated: scratch/email-previews/password-reset-otp-react-preview.html`);

console.log('\n[SUCCESS] React Email compilation complete!');
