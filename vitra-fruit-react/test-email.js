require('dotenv').config();
const handler = require('./api/create-order.js');

(async () => {
  console.log('Sending test order email...');
  
  const testEmail = process.env.ORDER_EMAIL_TO || process.env.SMTP_USER;
  if (!testEmail) {
    console.error('No ORDER_EMAIL_TO or SMTP_USER found in .env');
    return;
  }

  const req = {
    method: 'POST',
    headers: { host: 'vitrafruits.co.za' },
    body: {
      orderId: 'VF-TEST-1234',
      billing: {
        firstName: 'Mary',
        lastName: 'Mahuma',
        email: testEmail, // Sending to the admin email so you can see it
        phone: '0784045558',
        street: '4 Ramsgate Road',
        suburb: 'Parklands',
        town: 'Cape Town',
        province: 'Western Cape',
        postcode: '7441'
      },
      items: [
        {
          id: 'test-item-1',
          name: 'Dehydrated Orange Wheels',
          size: '200g',
          price: 200,
          quantity: 2
        },
        {
          id: 'test-item-2',
          name: 'Pineapple Slices',
          size: '100g',
          price: 120,
          quantity: 1
        }
      ],
      subtotal: 520,
      discount: 0,
      shippingFee: 120,
      total: 640,
      deliveryMethod: 'delivery'
    }
  };

  const res = {
    setHeader: () => {},
    status: (code) => {
      return {
        json: (data) => {
          console.log('Status:', code);
          console.log('Response:', data);
        },
        end: () => console.log('Response ended')
      };
    }
  };

  await handler(req, res);
})();
