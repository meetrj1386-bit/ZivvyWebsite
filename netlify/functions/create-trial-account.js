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
   
// Update the subject line and email content in create-trial-account.js

// Around line 186, update the subject:

// Replace the userEmailHtml with this more emotionally connected version:
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
                <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700;">Welcome to Your Calmer Life!</h1>
                <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                  Made with 💜 by parents, for parents
                </p>
              </td>
            </tr>
            
            <!-- Body -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="color: #2C2546; font-size: 24px; margin: 0 0 20px 0;">
                  Hi ${name}, we see you 💜
                </h2>
                
                <!-- Emotional connection paragraph -->
                <div style="background: linear-gradient(135deg, rgba(250, 248, 245, 1), rgba(245, 240, 235, 1)); border-radius: 12px; padding: 20px; margin: 0 0 30px 0;">
                  <p style="color: #6b5b95; font-size: 16px; line-height: 1.8; margin: 0; font-style: italic;">
                    "That feeling when the therapist gives you homework and you want to help your child SO badly... 
                    but then life happens. The guilt. The worry. We know, because we've been there too."
                  </p>
                </div>

                <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                  <strong>Here's the thing:</strong> You're already an amazing parent. You showed up. You're seeking help. 
                  Now let us handle the overwhelming part - the scheduling, the reminders, the tracking. 
                </p>

                <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
                  <strong>You focus on what matters:</strong> Those precious moments with your ${childAge} year old. 
                  We'll make sure they happen, gently, consistently, without the stress.
                </p>
                
                <!-- Login Credentials Box - More prominent -->
                <div style="background: #6b5b95; padding: 24px; margin: 30px 0; border-radius: 12px;">
                  <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 20px; text-align: center;">
                    🎯 Your Login Details (Save This!)
                  </h3>
                  <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0;">
                    <p style="margin: 0 0 8px 0; color: #2C2546; font-size: 16px;">
                      <strong>Email:</strong> ${email}
                    </p>
                    <p style="margin: 0; color: #2C2546; font-size: 16px;">
                      <strong>Password:</strong> <span style="background: #faf8f5; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-weight: bold;">${tempPassword}</span>
                    </p>
                  </div>
                  <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; text-align: center;">
                    You'll create your own password when you first sign in
                  </p>
                </div>

                <!-- App Download Section - Temporary but clear -->
                <div style="background: linear-gradient(135deg, rgba(135, 160, 142, 0.1), rgba(212, 165, 116, 0.1)); border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center; border: 2px dashed #87a08e;">
                  <h3 style="color: #2C2546; margin: 0 0 12px 0;">📱 App Coming Very Soon!</h3>
                  <p style="color: #4b5563; margin: 0 0 16px 0; font-size: 15px;">
                    We're putting final touches on the mobile app. You'll be the FIRST to know when it's ready (this week!).
                  </p>
                  <p style="color: #87a08e; font-size: 14px; margin: 0; font-weight: 600;">
                    For now, save this email - your login details are here!
                  </p>
                </div>

                <!-- What happens next -->
                <h3 style="color: #2C2546; margin: 30px 0 16px 0;">What happens in the next 24 hours:</h3>
                <div style="background: #faf8f5; border-radius: 8px; padding: 20px;">
                  <p style="color: #4b5563; font-size: 15px; line-height: 1.8; margin: 0;">
                    ✓ You'll get our "Quick Start Guide" email<br>
                    ✓ App download link arrives (as soon as it's live)<br>
                    ✓ You sign in and spend 10 minutes setting up<br>
                    ✓ Tomorrow, you wake up with a plan that actually works<br>
                    ✓ No more therapy homework guilt. Ever.
                  </p>
                </div>

                <!-- Personal note -->
                <div style="margin: 40px 0; padding: 20px; background: white; border-left: 4px solid #d4a574;">
                  <p style="color: #2C2546; font-size: 15px; line-height: 1.6; margin: 0;">
                    <strong>A note from our founder (also a special needs mom):</strong><br><br>
                    "I built Zivvy after crying in my car outside therapy, overwhelmed by all the exercises 
                    we were supposed to do at home. You're not failing. The system is just not built for real life. 
                    That's what we're fixing. Together. You've got this, and now you've got us too."
                  </p>
                </div>

                <!-- Support -->
                <p style="color: #87a08e; font-size: 14px; text-align: center; margin: 30px 0 0 0; padding-top: 30px; border-top: 1px solid #f0f0f0;">
                  <strong>Need help? Just reply to this email.</strong><br>
                  We're real parents who actually read and respond.<br>
                  hello@zivvy.app
                </p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background: #2C2546; padding: 30px; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #C9E4B4; font-size: 16px; font-weight: 600;">
                  Your village starts here
                </p>
                <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 14px;">
                  5 days free • No credit card • Just support
                </p>
                <p style="margin: 20px 0 0 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                  © 2024 Zivvy. Made with 💜 by parents who get it.
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
subject: '🌟 Your calm starts now - Login details inside (open this!)',
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