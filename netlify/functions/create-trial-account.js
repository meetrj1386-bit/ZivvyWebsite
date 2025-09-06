const https = require('https');

// Generate a readable temporary password
function generateTempPassword() {
  const words = ['Welcome', 'Start', 'Begin', 'Happy', 'Family'];
  const numbers = Math.floor(Math.random() * 900) + 100; // 3-digit number
  const special = '!';
  return words[Math.floor(Math.random() * words.length)] + numbers + special;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { name, email, phone, childAge, primaryConcern, type } = data;

    if (!name || !email || !childAge || !primaryConcern) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Store lead info (you'll need to add Supabase integration here)
    // For now, we'll just send emails

    // Email to new user
    const userEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Welcome to Zivvy</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #faf8f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf8f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(107, 91, 149, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6b5b95 0%, #8073a3 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700;">Welcome to Zivvy!</h1>
                    <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                      Your 5-day free trial starts now
                    </p>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #2C2546; font-size: 24px; margin: 0 0 20px 0;">
                      Hi ${name}! 👋
                    </h2>
                    
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
                      We're so excited to help you build consistent therapy routines with your child. 
                      Your account is ready!
                    </p>
                    
                    <!-- Login Credentials Box -->
                    <div style="background: linear-gradient(135deg, rgba(107, 91, 149, 0.05), rgba(212, 165, 116, 0.05)); border-left: 4px solid #6b5b95; padding: 20px; margin: 30px 0; border-radius: 8px;">
                      <h3 style="margin: 0 0 16px 0; color: #6b5b95; font-size: 18px;">Your Login Details:</h3>
                      <p style="margin: 0 0 8px 0; color: #2C2546; font-size: 16px;">
                        <strong>Email:</strong> ${email}
                      </p>
                      <p style="margin: 0; color: #2C2546; font-size: 16px;">
                        <strong>Temporary Password:</strong> ${tempPassword}
                      </p>
                      <p style="margin: 16px 0 0 0; color: #87a08e; font-size: 14px; font-style: italic;">
                        ✨ You'll be prompted to create your own password on first login
                      </p>
                    </div>

                    <!-- App Download Section -->
                    <div style="background: #f8f8f8; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
                      <h3 style="color: #2C2546; margin: 0 0 16px 0;">Download the Zivvy App</h3>
                      <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 14px;">
                        Available on iOS and Android (Coming Soon)
                      </p>
                      <!-- Placeholder for app store buttons -->
                      <p style="color: #87a08e; font-size: 14px; margin: 0;">
                        App store links will be sent as soon as they're available!
                      </p>
                    </div>

                    <!-- Next Steps -->
                    <h3 style="color: #2C2546; margin: 30px 0 16px 0;">Your First Steps:</h3>
                    <ol style="color: #4b5563; font-size: 16px; line-height: 1.8; padding-left: 20px;">
                      <li>Download the Zivvy app (links coming soon)</li>
                      <li>Sign in with your email and temporary password</li>
                      <li>Set up your child's profile and therapy schedule</li>
                      <li>Start your first exercise - we'll guide you!</li>
                    </ol>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 40px 0;">
                      <a href="https://zivvy.app" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #6b5b95, #5a4a7d); color: #ffffff; text-decoration: none; border-radius: 100px; font-weight: bold; font-size: 16px;">
                        Visit Zivvy Dashboard
                      </a>
                    </div>

                    <p style="color: #87a08e; font-size: 14px; text-align: center; margin: 30px 0 0 0; padding-top: 30px; border-top: 1px solid #f0f0f0;">
                      Need help? Reply to this email or contact us at hello@zivvy.app<br>
                      We're here to support your journey!
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: #2C2546; padding: 30px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #C9E4B4; font-size: 16px; font-weight: 600;">
                      Your 5-day trial includes everything!
                    </p>
                    <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 14px;">
                      Unlimited exercises • Smart scheduling • Progress tracking • No credit card required
                    </p>
                    <p style="margin: 20px 0 0 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                      © 2024 Zivvy. Made with 💜 by parents, for parents.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Admin notification email
    const adminEmailHtml = `
      <h2>New Trial Signup!</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Child's Age:</strong> ${childAge}</p>
      <p><strong>Primary Concern:</strong> ${primaryConcern}</p>
      <p><strong>Signup Type:</strong> Free Trial</p>
      <p><strong>Temp Password:</strong> ${tempPassword}</p>
      <hr>
      <p>Remember to follow up in 3 days to check on their progress!</p>
    `;

    // Send emails using Brevo
    const emailData = JSON.stringify({
      sender: { name: 'Zivvy Team', email: 'hello@zivvy.app' },
      to: [{ email, name }],
      subject: '🎉 Welcome to Zivvy - Your Login Details Inside',
      htmlContent: userEmailHtml
    });

    const adminData = JSON.stringify({
      sender: { name: 'Zivvy System', email: 'hello@zivvy.app' },
      to: [{ email: 'hello@zivvy.app', name: 'Zivvy Team' }],
      subject: `New Trial Signup: ${name}`,
      htmlContent: adminEmailHtml
    });

    // Send user email
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

    // Send both emails
    const sendEmail = (data) => {
      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let responseData = '';
          res.on('data', (chunk) => { responseData += chunk; });
          res.on('end', () => {
            if (res.statusCode === 201 || res.statusCode === 200) {
              resolve(true);
            } else {
              reject(new Error('Failed to send email'));
            }
          });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
      });
    };

    // Send both emails
    await sendEmail(emailData);
    await sendEmail(adminData);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Account created successfully'
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create account',
        details: error.message 
      })
    };
  }
};