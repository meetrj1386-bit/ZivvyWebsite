const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const data = JSON.parse(event.body);
  const { name, email, phone, message } = data;

  const emailHtml = `
    <h2>Thank you for contacting Zivvy!</h2>
    <p>Dear ${name},</p>
    <p>We've received your message and will get back to you within 24 hours.</p>
    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
      <strong>Your message:</strong><br>
      ${message}
    </div>
    <p>Best regards,<br>The Zivvy Team</p>
  `;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY, // Set this in Netlify dashboard
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Zivvy Support', email: 'hello@zivvy.app' },
        to: [{ email, name }],
        subject: 'Thank you for contacting Zivvy!',
        htmlContent: emailHtml
      })
    });

    if (response.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Email sent successfully' })
      };
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send email' })
    };
  }
};