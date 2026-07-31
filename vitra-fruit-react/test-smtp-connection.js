// Verifies SMTP connection + auth using values from .env.
// Does NOT send any email — transporter.verify() only does EHLO/AUTH.
// Run: node test-smtp-connection.js
// Minimal .env loader — dotenv is not hoisted in this install.
const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
}
const nodemailer = require('nodemailer');

const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
  },
  connectionTimeout: 10000,
  socketTimeout: 15000,
});

console.log(`Testing ${process.env.SMTP_HOST}:${smtpPort} as ${process.env.SMTP_USER} ...`);
transporter.verify(function (error) {
  if (error) {
    console.error('FAIL:', error.message);
    process.exit(1);
  }
  console.log('PASS: SMTP server accepted connection and credentials');
  process.exit(0);
});
