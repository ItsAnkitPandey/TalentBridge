const nodemailer = require('nodemailer');
const config = require('../config/env.config');
const { logger } = require('../middleware/errorHandler.middleware');

/**
 * Brevo (Sendinblue) Email Service
 * 300 emails/day FREE - Works on all platforms
 * Much better than Resend - supports sending from any email
 */

let transporter = null;

// Initialize Brevo SMTP
if (process.env.BREVO_SMTP_KEY) {
  transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_KEY,
    },
  });

  logger.info('✓ Brevo email service initialized');
} else {
  logger.warn('⚠️  Brevo not configured. Set BREVO_SMTP_KEY environment variable.');
}

/**
 * Send email via Brevo
 * @param {Object} options - Email options
 * @returns {Promise}
 */
const sendEmail = async (options) => {
  if (!transporter) {
    logger.warn('Email not sent - Brevo not configured');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: `${options.fromName || 'TalentBridge'} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('✓ Email sent via Brevo:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('✗ Failed to send email via Brevo:', {
      error: error.message,
      to: options.to,
      details: error.response || error
    });
    throw error;
  }
};

/**
 * Send welcome email to new users
 */
const sendWelcomeEmail = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to TalentBridge!</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.first_name}!</h2>
          <p>Thank you for joining TalentBridge. We're excited to have you on board!</p>
          
          <p><strong>What you can do:</strong></p>
          <ul>
            <li>Browse thousands of job opportunities</li>
            <li>Request referrals from employees</li>
            <li>Connect with professionals in your field</li>
            <li>${user.user_type === 'employee' ? 'Provide referrals and help others' : 'Get referred to your dream companies'}</li>
          </ul>

          <p style="text-align: center;">
            <a href="${config.frontendUrl}" class="button">Get Started</a>
          </p>

          <p>If you have any questions, feel free to reach out to our support team.</p>
          
          <p>Best regards,<br>The TalentBridge Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to TalentBridge!',
    html,
    text: `Hi ${user.first_name}, Welcome to TalentBridge! Start browsing jobs and connecting with referrers at ${config.frontendUrl}`
  });
};

/**
 * Send email verification
 */
const sendVerificationEmail = async (user, verificationUrl) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 15px 40px; background: #2e7d32; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .info-box { background: #e3f2fd; border-left: 4px solid #1976d2; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Verify Your Email</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.first_name}!</h2>
          <p>Thank you for registering with TalentBridge. To complete your registration, please verify your email address.</p>
          
          <div class="info-box">
            <strong>⚠️ Important:</strong> You must verify your email to access all features.
          </div>

          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>

          <p><small>This link will expire in 24 hours.</small></p>
          
          <p>Or copy this link: ${verificationUrl}</p>

          <p>Best regards,<br>The TalentBridge Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: '🔐 Verify Your Email - TalentBridge',
    html,
    text: `Hi ${user.first_name}, Please verify your email by clicking: ${verificationUrl}. This link expires in 24 hours.`
  });
};

/**
 * Send referral request notification
 */
const sendReferralRequestEmail = async (referrer, requester, job) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2e7d32; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        .job-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2; }
        .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Referral Request!</h1>
        </div>
        <div class="content">
          <h2>Hi ${referrer.first_name}!</h2>
          <p>You have received a new referral request from <strong>${requester.first_name} ${requester.last_name}</strong>.</p>
          
          <div class="job-card">
            <h3>${job.title}</h3>
            <p><strong>Company:</strong> ${job.Organization?.name || 'N/A'}</p>
            <p><strong>Location:</strong> ${job.location}</p>
          </div>

          <p style="text-align: center;">
            <a href="${config.frontendUrl}/referrals" class="button">View Request</a>
          </p>

          <p>Best regards,<br>The TalentBridge Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: referrer.email,
    subject: `New Referral Request for ${job.title}`,
    html,
    text: `Hi ${referrer.first_name}, You have a new referral request from ${requester.first_name} ${requester.last_name} for ${job.title}.`
  });
};

/**
 * Send referral acceptance notification
 */
const sendReferralAcceptedEmail = async (requester, referrer, job) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2e7d32; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Great News! 🎉</h1>
        </div>
        <div class="content">
          <h2>Hi ${requester.first_name}!</h2>
          
          <div class="success">
            <strong>Your referral request has been accepted!</strong>
          </div>

          <p><strong>${referrer.first_name} ${referrer.last_name}</strong> has agreed to provide a referral for: <strong>${job.title}</strong></p>

          <p style="text-align: center;">
            <a href="${config.frontendUrl}/my-referrals" class="button">View Details</a>
          </p>

          <p>Good luck with your application!</p>
          
          <p>Best regards,<br>The TalentBridge Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: requester.email,
    subject: `Your Referral Request for ${job.title} Has Been Accepted! 🎉`,
    html,
    text: `Hi ${requester.first_name}, Good news! ${referrer.first_name} ${referrer.last_name} has accepted your referral request for ${job.title}.`
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ed6c02; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.first_name}!</h2>
          <p>We received a request to reset your password.</p>

          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>

          <p><small>This link expires in 1 hour. If you didn't request this, ignore this email.</small></p>
          
          <p>Best regards,<br>The TalentBridge Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html,
    text: `Hi ${user.first_name}, Reset your password at: ${resetUrl}. This link expires in 1 hour.`
  });
};

/**
 * Send bulk email (non-blocking)
 */
const sendBulkEmail = async (recipients, subject, message) => {
  if (!transporter) {
    logger.warn('Bulk email not sent - Brevo not configured');
    return { success: false, message: 'Email service not configured' };
  }

  const totalRecipients = recipients.length;
  logger.info(`📧 Starting Brevo bulk email to ${totalRecipients} recipients`);

  // Send in background (non-blocking)
  setImmediate(async () => {
    let successful = 0;
    let failed = 0;

    for (const recipient of recipients) {
      try {
        await sendEmail({
          to: recipient.email,
          subject,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>TalentBridge</h1>
                </div>
                <div class="content">
                  <h2>Hi ${recipient.first_name}!</h2>
                  ${message}
                  <p>Best regards,<br>The TalentBridge Team</p>
                </div>
                <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: message.replace(/<[^>]*>/g, '')
        });
        successful++;
      } catch (error) {
        failed++;
        logger.error(`Failed to send bulk email to ${recipient.email}:`, error);
      }
    }

    logger.info(`✓ Brevo bulk email completed: ${successful} successful, ${failed} failed`);
  });

  return { 
    total: totalRecipients, 
    status: 'processing',
    message: 'Emails are being sent via Brevo in the background'
  };
};

/**
 * Send job approval notification to admins
 */
const sendJobApprovalNotification = async (job, poster, adminEmails) => {
  if (!adminEmails || adminEmails.length === 0) {
    logger.warn('No admin emails found for job approval notification');
    return;
  }

  const adminUrl = `${config.frontendUrl}/admin`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ed6c02 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        .job-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ed6c02; }
        .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ New Job Pending Approval</h1>
        </div>
        <div class="content">
          <p>A new job posting is waiting for review.</p>

          <div class="job-card">
            <h3>${job.title}</h3>
            <p><strong>Company:</strong> ${job.organization?.name || 'N/A'}</p>
            <p><strong>Location:</strong> ${job.location}</p>
            <p><strong>Posted By:</strong> ${poster.first_name} ${poster.last_name}</p>
          </div>

          <p style="text-align: center;">
            <a href="${adminUrl}" class="button">Review Job</a>
          </p>

          <p>Best regards,<br>TalentBridge Admin Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send to all admins
  const emailPromises = adminEmails.map(adminEmail => 
    sendEmail({
      to: adminEmail,
      subject: `⚠️ New Job Pending Approval: ${job.title}`,
      html,
      text: `New job pending approval: ${job.title}. Review at ${adminUrl}`
    }).catch(err => logger.error(`Failed to send to ${adminEmail}:`, err))
  );

  await Promise.allSettled(emailPromises);
};

/**
 * Send job approved notification
 */
const sendJobApprovedEmail = async (job, poster) => {
  const jobUrl = `${config.frontendUrl}/jobs/${job.id}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2e7d32; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        .success { background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
        .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Job Approved!</h1>
        </div>
        <div class="content">
          <h2>Hi ${poster.first_name}!</h2>
          
          <div class="success">
            <h3>✅ Your job posting has been approved!</h3>
            <p>${job.title} is now live.</p>
          </div>

          <p style="text-align: center;">
            <a href="${jobUrl}" class="button">View Job</a>
          </p>

          <p>Best regards,<br>The TalentBridge Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: poster.email,
    subject: `✅ Your Job "${job.title}" Has Been Approved!`,
    html,
    text: `Hi ${poster.first_name}, Your job "${job.title}" has been approved and is now live!`
  });
};

/**
 * Send job rejected notification
 */
const sendJobRejectedEmail = async (job, poster, reason) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #d32f2f; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Job Posting Review Update</h1>
        </div>
        <div class="content">
          <h2>Hi ${poster.first_name},</h2>
          <p>Your job posting "${job.title}" was not approved.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please review and resubmit.</p>
          <p>Best regards,<br>The TalentBridge Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: poster.email,
    subject: `Job Posting Update: "${job.title}"`,
    html,
    text: `Hi ${poster.first_name}, Your job "${job.title}" was not approved. Reason: ${reason}`
  });
};

/**
 * Send new job notification
 */
const sendNewJobNotification = async (user, job) => {
  const jobUrl = `${config.frontendUrl}/jobs/${job.id}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1976d2; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Job Alert!</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.first_name}!</h2>
          <p>A new job matching your interests has been posted:</p>
          <h3>${job.title}</h3>
          <p><strong>Company:</strong> ${job.Organization?.name || 'N/A'}</p>
          <p><strong>Location:</strong> ${job.location}</p>
          
          <p style="text-align: center;">
            <a href="${jobUrl}" class="button">View Job</a>
          </p>

          <p>Best regards,<br>The TalentBridge Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `New Job: ${job.title}`,
    html,
    text: `Hi ${user.first_name}, Check out this new job: ${job.title}. View at ${jobUrl}`
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendReferralRequestEmail,
  sendReferralAcceptedEmail,
  sendPasswordResetEmail,
  sendBulkEmail,
  sendNewJobNotification,
  sendJobApprovalNotification,
  sendJobApprovedEmail,
  sendJobRejectedEmail,
};
