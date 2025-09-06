const https = require('https');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { name, email, phone, message } = data;

    if (!name || !email || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Make API call to Brevo
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
          if (res.statusCode === 201 || res.statusCode === 200) {
            resolve({
              statusCode: 200,
              body: JSON.stringify({ success: true, message: 'Email sent' })
            });
          } else {
            resolve({
              statusCode: 500,
              body: JSON.stringify({ error: 'Failed to send email' })
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to send email' })
        });
      });

      req.write(emailData);
      req.end();
    });

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};