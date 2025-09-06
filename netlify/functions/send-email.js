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

    const emailData = JSON.stringify({
      sender: { name: 'Zivvy Support', email: 'hello@zivvy.app' },
      to: [{ email, name }],
      subject: 'Welcome to Zivvy - We\'ve Received Your Message! 💜',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Zivvy</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #faf8f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf8f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(107, 91, 149, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #6b5b95 0%, #8073a3 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700;">Zivvy</h1>
                      <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                        Made with 💜 by parents, for parents
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #2C2546; font-size: 28px; margin: 0 0 20px 0;">
                        Thank You for Reaching Out, ${name}! 
                      </h2>
                      
                      <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                        We're so glad you took the first step toward making therapy homework more manageable for your family.
                      </p>
                      
                      <div style="background: linear-gradient(135deg, rgba(107, 91, 149, 0.05), rgba(212, 165, 116, 0.05)); border-left: 4px solid #6b5b95; padding: 20px; margin: 30px 0; border-radius: 8px;">
                        <p style="margin: 0 0 10px 0; color: #6b5b95; font-weight: bold; font-size: 14px;">YOUR MESSAGE:</p>
                        <p style="margin: 0; color: #2C2546; font-size: 16px; line-height: 1.6;">
                          "${message.replace(/\n/g, '<br>')}"
                        </p>
                      </div>
                      
                      <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 20px 0;">
                        <strong style="color: #2C2546;">What happens next?</strong><br>
                        Our team will personally review your message and respond within 24 hours. 
                        We read every message and truly care about helping your family succeed.
                      </p>
                      
                      <div style="text-align: center; margin: 40px 0;">
                        <a href="https://zivvy.app" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #6b5b95, #5a4a7d); color: #ffffff; text-decoration: none; border-radius: 100px; font-weight: bold; font-size: 16px;">
                          Explore Zivvy While You Wait
                        </a>
                      </div>
                      
                      <p style="color: #87a08e; font-size: 14px; text-align: center; margin: 30px 0 0 0; padding-top: 30px; border-top: 1px solid #f0f0f0;">
                        No rush, no pressure. When you're ready, we're here to help.<br>
                        Your journey to consistent therapy practice starts with one small step.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #2C2546; padding: 30px; text-align: center;">
                      <p style="margin: 0 0 10px 0; color: #C9E4B4; font-size: 16px; font-weight: 600;">
                        Join Our Community
                      </p>
                      <p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.7); font-size: 14px;">
                        Follow us for daily tips and encouragement
                      </p>
                      <p style="margin: 20px 0 0 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                        © 2024 Zivvy. All rights reserved.<br>
                        Made with 💜 by parents, for parents.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      textContent: `Thank you for contacting Zivvy!\n\nDear ${name},\n\nWe've received your message and will get back to you within 24 hours.\n\nYour message:\n${message}\n\nBest regards,\nThe Zivvy Team`
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'accept': 'application/json',
        'Content-Length': Buffer.byteLength(emailData)
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
              body: JSON.stringify({ success: true, message: 'Email sent successfully' })
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