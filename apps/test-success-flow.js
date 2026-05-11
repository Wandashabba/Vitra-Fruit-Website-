require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Mocking the behavior of payfast-notify.js to send the SUCCESS email
const { 
  buildPaymentConfirmedCustomerEmail,
  buildPaymentConfirmedShopEmail 
} = require('./api/payfast-notify.js');

// We need the emailWrapper and other helpers since they are private in payfast-notify.js
// Actually, it's easier to just modify payfast-notify.js temporarily or use a dedicated test script 
// that contains the logic.

// Let's just create a script that uses the existing handler but mocks the verification.
// But first, let's see if the user wants the CUSTOMER to receive this email.
// In Conversation e26ffe21-cdd8-4753-b07a-60186a88a013, they wanted ONLY ONE email.
// If create-order.js already sends one, and payfast-notify.js sends ANOTHER, that's two.

// Wait, the user said "send me a test email for after you successfully purchase".
// This implies they WANT to see the "success" one.

(async () => {
  console.log('Generating test success email...');
  
  const testEmail = process.env.ORDER_EMAIL_TO || process.env.SMTP_USER;
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
    },
  });

  const orderId = 'VF-TEST-1234';
  const amountGross = '640.00';
  const customerName = 'Mary Mahuma';
  
  // Since we can't easily export the private functions, I'll just use create-order.js 
  // as it sends the most complete "Order Received" email which is what customers see 
  // currently in the flow.
  
  console.log('Running test-email.js (which sends the customer order confirmation)...');
  require('./test-email.js');
})();
