// netlify/functions/create-trial-account.js
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Generate a readable temporary password
function generateTempPassword() {
  const words = ['Welcome', 'Start', 'Begin', 'Happy', 'Family'];
  const numbers = Math.floor(Math.random() * 900) + 100;
  const special = '!';
  return words[Math.floor(Math.random() * words.length)] + numbers + special;
}

// Send email function - MOVED TO TOP
function sendEmail(data) {
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
        
        // Send a "welcome back" email to existing user
        const existingUserEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Welcome Back to Zivvy</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #faf8f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf8f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(107, 91, 149, 0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #6b5b95 0%, #8073a3 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 700;">Zivvy</h1>
                        <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                          Welcome back!
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #2C2546; font-size: 24px; margin: 0 0 20px 0;">
                          Hi ${name}, you already have a Zivvy account! 
                        </h2>
                        
                        <div style="background: #faf8f5; border-radius: 12px; padding: 20px; margin: 20px 0;">
                          <p style="color: #2C2546; font-size: 16px; line-height: 1.8; margin: 0;">
                            Good news - your account is already set up with email: <strong>${email}</strong>
                          </p>
                        </div>

                        <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 20px 0;">
                          To access your account:
                        </p>
                        
                        <ul style="color: #4b5563; font-size: 16px; line-height: 2; padding-left: 20px;">
                          <li>Open the Zivvy app</li>
                          <li>Sign in with your existing password</li>
                          <li>If you forgot your password, tap "Forgot Password" on the login screen</li>
                        </ul>

                        <div style="background: linear-gradient(135deg, rgba(107, 91, 149, 0.05), rgba(212, 165, 116, 0.05)); border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                          <p style="color: #6b5b95; font-size: 16px; font-weight: 600; margin: 0;">
                            Your 5-day trial is still active with all features unlocked!
                          </p>
                        </div>

                        <p style="color: #87a08e; font-size: 14px; text-align: center; margin: 30px 0 0 0; padding-top: 30px; border-top: 1px solid #f0f0f0;">
                          Need help accessing your account? Just reply to this email.<br>
                          hello@zivvy.app
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background: #2C2546; padding: 30px; text-align: center;">
                        <h3 style="margin: 0 0 8px 0; color: #ffffff; font-size: 24px;">Zivvy</h3>
                        <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                          © 2024 Zivvy. All rights reserved.
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
        
        // Send the welcome back email
        const emailData = JSON.stringify({
          sender: { name: 'Zivvy Team', email: 'hello@zivvy.app' },
          to: [{ email, name }],
          subject: 'Welcome back to Zivvy! (Account already exists)',
          htmlContent: existingUserEmailHtml
        });
        
        // Now sendEmail is available
        await sendEmail(emailData);
        
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            success: true,
            existing: true,
            message: 'Welcome back! Check your email for login instructions.'
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

    // New user welcome email HTML
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
                <!-- Header with Zivvy Branding -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6b5b95 0%, #8073a3 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 700; letter-spacing: 1px;">Zivvy</h1>
                    <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                      Your therapy homework companion
                    </p>
                    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">
                      Made with 💜 by parents, for parents
                    </p>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #2C2546; font-size: 26px; margin: 0 0 20px 0; text-align: center;">
                      Welcome to Zivvy, ${name}! 🎉
                    </h2>
                    
                    <!-- Why Zivvy exists -->
                    <div style="background: linear-gradient(135deg, rgba(107, 91, 149, 0.05), rgba(212, 165, 116, 0.05)); border-radius: 12px; padding: 20px; margin: 0 0 30px 0; border-left: 4px solid #6b5b95;">
                      <p style="color: #2C2546; font-size: 16px; line-height: 1.8; margin: 0;">
                        <strong>Why Zivvy?</strong> Because therapy homework shouldn't feel like homework. 
                        We turn overwhelming exercise lists into simple daily routines that actually happen.
                      </p>
                    </div>

                    <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
                      Your ${childAge} year old's ${primaryConcern} therapy exercises are about to become 
                      so much easier to manage. No more guilt. No more missed sessions. Just steady progress.
                    </p>
                    
                    <!-- Login Box - Prominent Zivvy branded -->
                    <div style="background: linear-gradient(135deg, #6b5b95, #8073a3); padding: 24px; margin: 30px 0; border-radius: 12px; box-shadow: 0 10px 30px rgba(107, 91, 149, 0.2);">
                      <h3 style="margin: 0 0 4px 0; color: #ffffff; font-size: 18px; text-align: center;">
                        Your Zivvy Account is Ready!
                      </h3>
                      <p style="margin: 0 0 16px 0; color: rgba(255,255,255,0.9); font-size: 14px; text-align: center;">
                        Download the app and sign in with:
                      </p>
                      <div style="background: white; border-radius: 8px; padding: 20px; margin: 16px 0;">
                        <p style="margin: 0 0 12px 0; color: #2C2546; font-size: 15px;">
                          <strong style="color: #6b5b95;">Email:</strong><br>
                          <span style="font-size: 17px;">${email}</span>
                        </p>
                        <p style="margin: 0; color: #2C2546; font-size: 15px;">
                          <strong style="color: #6b5b95;">Temporary Password:</strong><br>
                          <span style="background: #faf8f5; padding: 6px 12px; border-radius: 4px; font-family: monospace; font-weight: bold; font-size: 17px; display: inline-block; margin-top: 4px;">${tempPassword}</span>
                        </p>
                      </div>
                    </div>

                    <!-- Download Apps -->
                    <div style="background: #f8f8f8; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
                      <h3 style="color: #2C2546; margin: 0 0 16px 0;">📱 Download Zivvy Now</h3>
                      
                      <!-- App Store Buttons (placeholder for now) -->
                      <div style="margin: 20px 0;">
                        <a href="#" style="display: inline-block; margin: 0 8px;">
                          <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&amp;releaseDate=1276560000&h=7e7b68fad19738b5649a1bfb78ff46e9" alt="Download on App Store" style="height: 40px;">
                        </a>
                        <a href="#" style="display: inline-block; margin: 0 8px;">
                          <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style="height: 60px; margin-top: -10px;">
                        </a>
                      </div>
                    </div>

                    <!-- What Zivvy Does -->
                    <h3 style="color: #2C2546; margin: 30px 0 16px 0;">Your Zivvy will help you:</h3>
                    <div style="background: white; border: 1px solid rgba(107, 91, 149, 0.1); border-radius: 8px; padding: 20px;">
                      <ul style="color: #4b5563; font-size: 15px; line-height: 2; margin: 0; padding-left: 20px;">
                        <li><strong style="color: #6b5b95;">Schedule smart:</strong> Exercises timed around meals, naps, and energy</li>
                        <li><strong style="color: #87a08e;">Stay consistent:</strong> Gentle reminders that respect your time</li>
                        <li><strong style="color: #d4a574;">Track progress:</strong> See improvements week by week</li>
                        <li><strong style="color: #6b5b95;">Share with therapists:</strong> One-tap progress reports</li>
                      </ul>
                    </div>

                    <!-- Personal touch -->
                    <div style="margin: 40px 0 30px 0; text-align: center;">
                      <p style="color: #6b5b95; font-size: 16px; font-weight: 600; margin: 0;">
                        "Small steps, every day, with Zivvy by your side."
                      </p>
                    </div>

                    <!-- Support -->
                    <div style="background: #faf8f5; border-radius: 8px; padding: 20px; text-align: center;">
                      <p style="color: #2C2546; font-size: 15px; margin: 0 0 8px 0; font-weight: 600;">
                        Need help getting started?
                      </p>
                      <p style="color: #4b5563; font-size: 14px; margin: 0;">
                        Reply to this email anytime - we're real parents who understand.<br>
                        <a href="mailto:hello@zivvy.app" style="color: #6b5b95; text-decoration: none;">hello@zivvy.app</a>
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: #2C2546; padding: 30px; text-align: center;">
                    <h3 style="margin: 0 0 8px 0; color: #ffffff; font-size: 24px; font-weight: 700;">Zivvy</h3>
                    <p style="margin: 0 0 16px 0; color: #C9E4B4; font-size: 15px;">
                      Your therapy homework companion
                    </p>
                    <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.7); font-size: 14px;">
                      5-day free trial • No credit card required
                    </p>
                    <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                      © 2024 Zivvy. All rights reserved.
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