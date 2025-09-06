<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Brevo (SendinBlue) API configuration
$api_key = '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'; // Replace with your actual Brevo API key
$sender_email = 'hello@zivvy.app';
$sender_name = 'Zivvy Support';

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$phone = $data['phone'] ?? '';
$message = $data['message'] ?? '';

// Validate required fields
if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(['error' => 'Required fields missing']);
    exit;
}

// Email HTML template
$email_template = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Zivvy</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; background-color: #faf8f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #faf8f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(107, 91, 149, 0.1);">
                    
                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 40px 20px 30px 20px; background: linear-gradient(135deg, #6b5b95 0%, #8073a3 100%); border-radius: 16px 16px 0 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center">
                                        <!-- Logo and Brand -->
                                        <div style="display: inline-block;">
                                            <img src="https://zivvy.app/assets/logo-white.png" alt="Zivvy" width="50" height="50" style="display: inline-block; vertical-align: middle; margin-right: 12px;">
                                            <span style="font-size: 32px; font-weight: 700; color: #ffffff; vertical-align: middle;">Zivvy</span>
                                        </div>
                                        <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                                            Making therapy homework manageable for families
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px;">
                            <h1 style="margin: 0 0 20px 0; color: #2C2546; font-size: 28px; font-weight: 700; text-align: center;">
                                Thank You for Reaching Out! 💜
                            </h1>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Dear ' . htmlspecialchars($name) . ',
                            </p>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Thank you for contacting Zivvy! We\'ve received your message and truly appreciate you taking the time to reach out. Your journey to making therapy homework more manageable is important to us.
                            </p>
                            
                            <div style="background: linear-gradient(135deg, rgba(107, 91, 149, 0.05), rgba(212, 165, 116, 0.05)); border-radius: 12px; padding: 20px; margin: 30px 0;">
                                <h3 style="margin: 0 0 12px 0; color: #6b5b95; font-size: 18px;">Your Message:</h3>
                                <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6; font-style: italic;">
                                    "' . htmlspecialchars($message) . '"
                                </p>
                            </div>
                            
                            <p style="margin: 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                <strong>What happens next?</strong><br>
                                Our team will review your message and get back to you within 24 hours. We\'re here to support you and answer any questions about how Zivvy can help your family stay consistent with therapy exercises.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- CTA Section -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #faf8f5; border-radius: 12px; padding: 24px;">
                                <tr>
                                    <td align="center">
                                        <h3 style="margin: 0 0 16px 0; color: #2C2546; font-size: 20px;">
                                            Ready to Start Your Journey?
                                        </h3>
                                        <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
                                            Join thousands of families who\'ve transformed therapy homework from a source of stress into a daily win.
                                        </p>
                                        <a href="https://zivvy.app/start-trial" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6b5b95, #5a4a7d); color: #ffffff; text-decoration: none; border-radius: 100px; font-weight: 700; font-size: 16px;">
                                            Start Your 5-Day Free Trial
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- App Download Section (placeholder for future) -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 16px 0; color: #6b5b95; font-size: 14px; font-weight: 600;">
                                            Coming Soon to Your Favorite App Store
                                        </p>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td style="padding: 0 8px;">
                                                    <a href="#" style="display: inline-block;">
                                                        <img src="https://zivvy.app/assets/app-store-badge.png" alt="Download on App Store" width="120" style="display: block; border-radius: 8px;">
                                                    </a>
                                                </td>
                                                <td style="padding: 0 8px;">
                                                    <a href="#" style="display: inline-block;">
                                                        <img src="https://zivvy.app/assets/google-play-badge.png" alt="Get it on Google Play" width="135" style="display: block;">
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background: #2C2546; border-radius: 0 0 16px 16px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 12px 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                                            Follow us for daily tips and encouragement
                                        </p>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://facebook.com/zivvyapp" style="display: inline-block; width: 32px; height: 32px; background: #1877F2; border-radius: 50%; text-align: center; line-height: 32px;">
                                                        <span style="color: white; font-size: 18px;">f</span>
                                                    </a>
                                                </td>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://instagram.com/zivvyapp" style="display: inline-block; width: 32px; height: 32px; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); border-radius: 50%; text-align: center; line-height: 32px;">
                                                        <span style="color: white; font-size: 18px;">📷</span>
                                                    </a>
                                                </td>
                                                <td style="padding: 0 6px;">
                                                    <a href="https://twitter.com/zivvyapp" style="display: inline-block; width: 32px; height: 32px; background: #1DA1F2; border-radius: 50%; text-align: center; line-height: 32px;">
                                                        <span style="color: white; font-size: 18px;">𝕏</span>
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="margin: 20px 0 8px 0; color: rgba(255,255,255,0.7); font-size: 12px;">
                                            © 2024 Zivvy. All rights reserved.
                                        </p>
                                        <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 12px;">
                                            <a href="https://zivvy.app/privacy" style="color: #C9E4B4; text-decoration: none;">Privacy Policy</a> • 
                                            <a href="https://zivvy.app/terms" style="color: #C9E4B4; text-decoration: none;">Terms of Service</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
';

// Prepare the API request for Brevo
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => "https://api.brevo.com/v3/smtp/email",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => "",
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => "POST",
    CURLOPT_POSTFIELDS => json_encode([
        "sender" => [
            "name" => $sender_name,
            "email" => $sender_email
        ],
        "to" => [
            [
                "email" => $email,
                "name" => $name
            ]
        ],
        "subject" => "Thank you for contacting Zivvy! 💜",
        "htmlContent" => $email_template,
        "replyTo" => [
            "email" => $sender_email,
            "name" => $sender_name
        ]
    ]),
    CURLOPT_HTTPHEADER => [
        "accept: application/json",
        "api-key: " . $api_key,
        "content-type: application/json"
    ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);
curl_close($curl);

if ($err) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email']);
} else {
    // Also send a notification to your team
    $admin_notification = "
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> $name</p>
        <p><strong>Email:</strong> $email</p>
        <p><strong>Phone:</strong> $phone</p>
        <p><strong>Message:</strong> $message</p>
    ";
    
    // Send admin notification
    curl_setopt_array($curl, [
        CURLOPT_URL => "https://api.brevo.com/v3/smtp/email",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => "POST",
        CURLOPT_POSTFIELDS => json_encode([
            "sender" => ["name" => "Zivvy Contact Form", "email" => $sender_email],
            "to" => [["email" => "hello@zivvy.app", "name" => "Zivvy Team"]],
            "subject" => "New Contact Form Submission from " . $name,
            "htmlContent" => $admin_notification
        ]),
        CURLOPT_HTTPHEADER => [
            "accept: application/json",
            "api-key: " . $api_key,
            "content-type: application/json"
        ],
    ]);
    
    curl_exec($curl);
    
    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
}
?>