// netlify/functions/create-trial-account.js
const https = require('https');

// Initialize Supabase Admin Client
const { createClient } = require('@supabase/supabase-js');

// Generate a readable temporary password
function generateTempPassword() {
  const words = ['Welcome', 'Start', 'Begin', 'Happy', 'Family'];
  const numbers = Math.floor(Math.random() * 900) + 100;
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

    // Initialize Supabase admin client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      throw new Error('Server configuration error');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        parent_name: name,
        source: 'website_trial',
        child_age: childAge,
        primary_concern: primaryConcern,
        trial_started: new Date().toISOString()
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      // Check if user already exists
      if (authError.message.includes('already registered')) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            error: 'This email is already registered. Please sign in instead.',
            code: 'USER_EXISTS'
          })
        };
      }
      
      throw authError;
    }

    // Insert into user_profiles table
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        email: email.toLowerCase().trim(),
        parent_name: name,
        phone: phone || null,
        child_age_range: childAge,
        primary_concern: primaryConcern,
        source: 'website_trial',
        trial_started_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      // Continue anyway - user can still login
    }

    // Store lead information for marketing
    const { error: leadError } = await supabase
      .from('trial_leads')
      .insert({
        email: email.toLowerCase().trim(),
        name: name,
        phone: phone || null,
        child_age: childAge,
        primary_concern: primaryConcern,
        status: 'trial_started',
        created_at: new Date().toISOString()
      });

    // Email HTML content
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
                      Your account is ready! Here's everything you need to get started with Zivvy.
                    </p>
                    
                    <!-- Login Credentials Box -->
                    <div style="background: linear-gradient(135deg, rgba(107, 91, 149, 0.05), rgba(212, 165, 116, 0.05)); border-left: 4px solid #6b5b95; padding: 20px; margin: 30px 0; border-radius: 8px;">
                      <h3 style="margin: 0 0 16px 0; color: #6b5b95; font-size: 18px;">Your Login Details:</h3>
                      <p style="margin: 0 0 8px 0; color: #2C2546; font-size: 16px;">
                        <strong>Email:</strong> ${email}
                      </p>
                      <p style="margin: 0; color: #2C2546; font-size: 16px;">
                        <strong>Temporary Password:</strong> <span style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${tempPassword}</span>
                      </p>
                      <p style="margin: 16px 0 0 0; color: #87a08e; font-size: 14px; font-style: italic;">
                        ✨ You'll be prompted to create your own password on first login
                      </p>
                    </div>

                    <!-- Next Steps -->
                    <h3 style="color: #2C2546; margin: 30px 0 16px 0;">Quick Start Guide:</h3>
                    <ol style="color: #4b5563; font-size: 16px; line-height: 1.8; padding-left: 20px;">
                      <li>Download the Zivvy app (links coming soon)</li>
                      <li>Sign in with your email and temporary password</li>
                      <li>Set up ${childAge} year old's profile</li>
                      <li>Add your ${primaryConcern} therapy exercises</li>
                      <li>Watch Zivvy create your perfect schedule!</li>
                    </ol>

                    <!-- Support -->
                    <p style="color: #87a08e; font-size: 14px; text-align: center; margin: 30px 0 0 0; padding-top: 30px; border-top: 1px solid #f0f0f0;">
                      Questions? Reply to this email or contact us at hello@zivvy.app<br>
                      We're here to help you succeed!
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: #2C2546; padding: 30px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #C9E4B4; font-size: 16px; font-weight: 600;">
                      Your trial includes everything!
                    </p>
                    <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 14px;">
                      No limits • No credit card • Just results
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

    // Send emails using Brevo
    const emailData = JSON.stringify({
      sender: { name: 'Zivvy Team', email: 'hello@zivvy.app' },
      to: [{ email, name }],
      subject: '🎉 Welcome to Zivvy - Your Login Details Inside',
      htmlContent: userEmailHtml
    });

    // Send admin notification
    const adminData = JSON.stringify({
      sender: { name: 'Zivvy System', email: 'hello@zivvy.app' },
      to: [{ email: 'hello@zivvy.app', name: 'Zivvy Team' }],
      subject: `New Trial Signup: ${name}`,
      htmlContent: `
        <h2>New Trial Account Created!</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Child's Age:</strong> ${childAge}</p>
        <p><strong>Primary Concern:</strong> ${primaryConcern}</p>
        <p><strong>User ID:</strong> ${authData.user.id}</p>
        <p><strong>Temp Password:</strong> ${tempPassword}</p>
        <hr>
        <p>Remember to follow up in 3 days!</p>
      `
    });

    // Send emails via Brevo
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

    const sendEmail = (data) => {
      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let responseData = '';
          res.on('data', (chunk) => { responseData += chunk; });
          res.on('end', () => {
            if (res.statusCode === 201 || res.statusCode === 200) {
              resolve(true);
            } else {
              console.error('Email send failed:', responseData);
              resolve(false); // Don't fail the whole process
            }
          });
        });
        req.on('error', (err) => {
          console.error('Email error:', err);
          resolve(false); // Don't fail the whole process
        });
        req.write(data);
        req.end();
      });
    };

    // Send both emails
    await Promise.all([
      sendEmail(emailData),
      sendEmail(adminData)
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Account created successfully',
        userId: authData.user.id
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