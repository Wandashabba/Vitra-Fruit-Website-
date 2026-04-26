require('dotenv').config();
const handler = require('./api/payfast-notify.js');

(async () => {
  console.log('Sending test payment confirmation email...');
  
  const testEmail = process.env.ORDER_EMAIL_TO || process.env.SMTP_USER;
  if (!testEmail) {
    console.error('No ORDER_EMAIL_TO or SMTP_USER found in .env');
    return;
  }

  // Mock PayFast ITN payload
  const req = {
    method: 'POST',
    headers: { host: 'vitrafruits.co.za' },
    body: {
      m_payment_id: 'VF-TEST-1234',
      pf_payment_id: '987654',
      payment_status: 'COMPLETE',
      item_name: 'Vitra Fruit Order VF-TEST-1234',
      item_description: 'DELIVERY Order',
      amount_gross: '640.00',
      amount_fee: '15.50',
      amount_net: '624.50',
      name_first: 'Mary',
      name_last: 'Mahuma',
      email_address: testEmail,
      merchant_id: '12345678'
    }
  };

  const res = {
    status: (code) => {
      return {
        send: (data) => {
          console.log('Status:', code);
          console.log('Response:', data);
        },
        end: (data) => console.log('Response ended:', data)
      };
    }
  };

  // We need to bypass the verifyWithPayFast in a test environment
  // or mock the fetch/https request.
  // For this test script, we'll just inform the user we're calling the handler.
  // Note: payfast-notify.js currently has customer notification REMOVED (line 59).
  // If the user wants to see the CUSTOMER success email, I should probably 
  // re-enable it in the handler or create a specific script that uses the template.

  await handler(req, res);
})();
