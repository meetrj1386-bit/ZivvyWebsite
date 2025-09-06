const https = require('https');

exports.handler = async (event, context) => {
  console.log('Function called with method:', event.httpMethod);
  
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { name, email, phone, message } = data;
    
    console.log('Received data:', { name, email, hasMessage: !!message });

    if (!name || !email || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Check if API key exists
    if (!process.env.BREVO_API_KEY) {
      console.error('BREVO_API_KEY is not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error - API key missing' })
      };
    }

    console.log('API Key exists, length:', process.env.BREVO_API_KEY.length);

    const emailData = JSON.stringify({
      sender: { name: 'Zivvy Support', email: 'hello@zivvy.app' },
      to: [{ email, name }],
      subject: 'Thank you for contacting Zivvy!',
      htmlContent: `
        <h2>Thank you for contacting Zivvy!</h2>
        <p>Dear ${name},</p>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
          <strong>Your message:</strong><br>${message}
        </div>
        <p>Best regards,<br>The Zivvy Team</p>
      `
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'accept': 'application/json'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          console.log('Brevo response status:', res.statusCode);
          console.log('Brevo response:', data);
          
          if (res.statusCode === 201 || res.statusCode === 200) {
            resolve({
              statusCode: 200,
              body: JSON.stringify({ success: true, message: 'Email sent' })
            });
          } else {
            resolve({
              statusCode: 500,
              body: JSON.stringify({ 
                error: 'Failed to send email',
                details: data 
              })
            });
          }
        });
      });

      req.on('error', (error) => {
        console.error('Request error:', error);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to send email' })
        });
      });

      req.write(emailData);
      req.end();
    });

  } catch (error) {
    console.error('Caught error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error', details: error.message })
    };
  }
};