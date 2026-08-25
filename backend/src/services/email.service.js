const nodemailer = require('nodemailer');
const config = require('../config/env.config');
const { logger } = require('../middleware/errorHandler.middleware');

/**
 * Email Notification Service
 * Handles all email communications
 */

/**
 * Escape HTML special characters to prevent XSS in email templates
 */
const escapeHtml = (text) => {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, char => map[char]);
};

// Create reusable transporter
let transporter = null;

const createTransporter = () => {
  if (!config.features.email) {
    logger.warn('Email service not configured. Set EMAIL_HOST in environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465, // true for 465, false for other ports
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
};

// Initialize transporter
if (config.features.email) {
  transporter = createTransporter();
  
  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      logger.error('Email service initialization failed:', error);
    } else {
      logger.info('✓ Email service ready');
    }
  });
}

/**
 * Send email
 * @param {Object} options - Email options
 * @returns {Promise}
 */
const sendEmail = async (options) => {
  if (!transporter) {
    logger.warn('Email not sent - service not configured');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: `${options.fromName || 'TalentBridge'} <${config.email.from}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

/**
 * Send email via Promailer API
 * @param {Object} options - Email options
 * @returns {Promise}
 */

const sendEmailViaPromailer = async (options) => {
 if (!transporter) {
    logger.warn('Email not sent - service not configured');
    return { success: false, message: 'Email service not configured' };
  }
try {
    const mailOptions = {
      from: `${options.fromName || 'TalentBridge'} <${config.email.from}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await axios.post(config.promailer.URL, mailOptions, {
      headers: {
        'Authorization': `Bearer ${config.promailer.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    logger.info('Email sent:', {
      messageId: info.data.messageId,
      to: options.to,
      subject: options.subject
    });

    return { success: true, messageId: info.data.messageId };
  } catch (error) {
    logger.error('Failed to send email:', error);
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
          <h2>Hi ${escapeHtml(user.first_name)}!</h2>
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
          
          <p>Best regards,<br>The Employee Referral Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailViaPromailer({
    to: user.email,
    subject: 'Welcome to TalentBridge!',
    html,
    text: `Hi ${user.first_name}, Welcome to TalentBridge! Start browsing jobs and connecting with referrers at ${config.frontendUrl}`
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
          <h2>Hi ${escapeHtml(referrer.first_name)}!</h2>
          <p>You have received a new referral request from <strong>${escapeHtml(requester.first_name)} ${escapeHtml(requester.last_name)}</strong>.</p>
          
          <div class="job-card">
            <h3>${escapeHtml(job.title)}</h3>
            <p><strong>Company:</strong> ${escapeHtml(job.Organization?.name || 'N/A')}</p>
            <p><strong>Location:</strong> ${escapeHtml(job.location)}</p>
            <p><strong>Experience Level:</strong> ${escapeHtml(job.experience_level)}</p>
          </div>

          <p><strong>Requester Details:</strong></p>
          <ul>
            <li>Email: ${escapeHtml(requester.email)}</li>
            <li>Type: ${escapeHtml(requester.user_type)}</li>
            ${requester.phone ? `<li>Phone: ${escapeHtml(requester.phone)}</li>` : ''}
          </ul>

          <p style="text-align: center;">
            <a href="${config.frontendUrl}/referrals" class="button">View Request</a>
          </p>

          <p>Review the request and decide if you'd like to provide a referral.</p>
          
          <p>Best regards,<br>The TalentBridge Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailViaPromailer({
    to: referrer.email,
    subject: `New Referral Request for ${job.title}`,
    html,
    text: `Hi ${referrer.first_name}, You have a new referral request from ${requester.first_name} ${requester.last_name} for ${job.title}. View at ${config.frontendUrl}/referrals`
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
          <h2>Hi ${escapeHtml(requester.first_name)}!</h2>
          
          <div class="success">
            <strong>Your referral request has been accepted!</strong>
          </div>

          <p><strong>${escapeHtml(referrer.first_name)} ${escapeHtml(referrer.last_name)}</strong> has agreed to provide a referral for:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2e7d32;">
            <h3>${escapeHtml(job.title)}</h3>
            <p><strong>Company:</strong> ${escapeHtml(job.Organization?.name || 'N/A')}</p>
          </div>

          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Check your dashboard for referrer details</li>
            <li>Follow up with ${escapeHtml(referrer.first_name)} if needed</li>
            <li>Prepare your application materials</li>
            <li>Keep track of your application status</li>
          </ol>

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

  return sendEmailViaPromailer({
    to: requester.email,
    subject: `Your Referral Request for ${escapeHtml(job.title)} Has Been Accepted! 🎉`,
    html,
    text: `Hi ${escapeHtml(requester.first_name)}, Good news! ${escapeHtml(referrer.first_name)} ${escapeHtml(referrer.last_name)} has accepted your referral request for ${escapeHtml(job.title)}. View details at ${config.frontendUrl}/my-referrals`
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
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
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
          <h2>Hi ${escapeHtml(user.first_name)}!</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>

          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>

          <div class="warning">
            <strong>⚠️ Security Notice:</strong><br>
            This link will expire in 1 hour. If you didn't request this reset, please ignore this email and your password will remain unchanged.
          </div>

          <p>Or copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>

          <p>If you have any questions or concerns, please contact our support team.</p>
          
          <p>Best regards,<br>The TalentBridge Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailViaPromailer({
    to: user.email,
    subject: 'Password Reset Request',
    html,
    text: `Hi ${escapeHtml(user.first_name)}, Reset your password at: ${resetUrl}. This link expires in 1 hour.`
  });
};

/**
 * Send bulk email to multiple users
 */
const sendBulkEmail = async (recipients, subject, message) => {
  const promises = recipients.map(recipient => {
    const html = `
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
            <h2>Hi ${escapeHtml(recipient.first_name)}!</h2>
            ${escapeHtml(message)}
            <p>Best regards,<br>The TalentBridge Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
            <p><a href="${config.frontendUrl}/unsubscribe">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return sendEmailViaPromailer({
      to: recipient.email,
      subject,
      html,
      text: escapeHtml(message).replace(/<[^>]*>/g, '') // Strip HTML tags
    });
  });

  const results = await Promise.allSettled(promises);
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  logger.info(`Bulk email sent: ${successful} successful, ${failed} failed`);
  
  return { successful, failed, total: recipients.length };
};

/**
 * Send new job notification
 */
const sendNewJobNotification = async (user, job) => {
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
          <h1>New Job Match! 💼</h1>
        </div>
        <div class="content">
          <h2>Hi ${escapeHtml(user.first_name)}!</h2>
          <p>We found a new job that matches your profile:</p>
          
          <div class="job-card">
            <h3>${escapeHtml(job.title)}</h3>
            <p><strong>Company:</strong> ${escapeHtml(job.Organization?.name || 'N/A')}</p>
            <p><strong>Location:</strong> ${escapeHtml(job.location)}</p>
            <p><strong>Experience:</strong> ${escapeHtml(job.experience_level)}</p>
            <p><strong>Type:</strong> ${escapeHtml(job.job_type)} - ${escapeHtml(job.remote_type)}</p>
          </div>

          <p style="text-align: center;">
            <a href="${config.frontendUrl}/jobs/${job.id}" class="button">View Job</a>
          </p>

          <p>Don't miss this opportunity! Apply now or request a referral.</p>
          
          <p>Best regards,<br>The TalentBridge Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
          <p><a href="${config.frontendUrl}/settings/notifications">Manage Email Preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailViaPromailer({
    to: user.email,
    subject: `New Job: ${escapeHtml(job.title)} at ${escapeHtml(job.Organization?.name || 'Company')}`,
    html,
    text: `Hi ${escapeHtml(user.first_name)}, Check out this new job: ${escapeHtml(job.title)} at ${escapeHtml(job.Organization?.name)}. View at ${config.frontendUrl}/jobs/${job.id}`
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
          <h2>Hi ${escapeHtml(user.first_name)}!</h2>
          <p>Thank you for registering with TalentBridge. To complete your registration and access all features, please verify your email address.</p>
          
          <div class="info-box">
            <strong>⚠️ Important:</strong> You must verify your email to:
            <ul>
              <li>Post job openings</li>
              <li>Request and provide referrals</li>
              <li>Access full platform features</li>
            </ul>
          </div>

          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>

          <p><small>This link will expire in 24 hours. If you didn't create an account, please ignore this email.</small></p>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666; font-size: 12px;">${verificationUrl}</p>

          <p>Best regards,<br>The TalentBridge Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailViaPromailer({
    to: user.email,
    subject: '🔐 Verify Your Email - TalentBridge',
    html,
    text: `Hi ${escapeHtml(user.first_name)}, Please verify your email by clicking: ${verificationUrl}. This link expires in 24 hours.`
  });
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
  const jobDetailsUrl = `${config.frontendUrl}/jobs/${job.id}`;

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
        .badge { display: inline-block; padding: 6px 12px; background: #fff3e0; color: #e65100; border-radius: 4px; font-size: 12px; font-weight: bold; margin-top: 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .button.approve { background: #2e7d32; }
        .button.reject { background: #d32f2f; }
        .info-row { margin: 10px 0; }
        .info-label { font-weight: bold; color: #666; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .urgent { background: #ffebee; border: 2px solid #f44336; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ New Job Pending Approval</h1>
        </div>
        <div class="content">
          <div class="urgent">
            <strong>Action Required:</strong> A new job posting is waiting for your review and approval.
          </div>

          <div class="job-card">
            <h2 style="margin-top: 0; color: #1976d2;">${escapeHtml(job.title)}</h2>
            <span class="badge">🔔 PENDING APPROVAL</span>
            
            <div style="margin-top: 20px;">
              <div class="info-row">
                <span class="info-label">Company:</span> ${escapeHtml(job.organization?.name || 'N/A')}
              </div>
              <div class="info-row">
                <span class="info-label">Location:</span> ${escapeHtml(job.location)}
              </div>
              <div class="info-row">
                <span class="info-label">Job Type:</span> ${escapeHtml(job.job_type)}
              </div>
              <div class="info-row">
                <span class="info-label">Experience Level:</span> ${escapeHtml(job.experience_level)}
              </div>
              <div class="info-row">
                <span class="info-label">Remote Type:</span> ${escapeHtml(job.remote_type)}
              </div>
            </div>

            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
              <div class="info-row">
                <span class="info-label">Posted By:</span> ${escapeHtml(poster.first_name)} ${escapeHtml(poster.last_name)} (${escapeHtml(poster.email)})
              </div>
              <div class="info-row">
                <span class="info-label">Posted At:</span> ${new Date(job.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>📋 Job Description Preview:</strong>
            <p style="margin: 10px 0; color: #666;">
              ${escapeHtml(job.description ? job.description.substring(0, 200) + '...' : 'No description provided')}
            </p>
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <strong>Review this job and take action:</strong>
          </p>

          <p style="text-align: center;">
            <a href="${adminUrl}" class="button">Go to Admin Dashboard</a>
          </p>

          <p style="text-align: center; font-size: 12px; color: #666; margin-top: 20px;">
            Or view job details: <a href="${jobDetailsUrl}">${jobDetailsUrl}</a>
          </p>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <strong>Quick Actions:</strong><br>
            • <strong>Approve:</strong> If the job meets all guidelines and is legitimate<br>
            • <strong>Reject:</strong> If it violates policies, has incomplete information, or is suspicious<br>
            • <strong>Review:</strong> Check job description, requirements, and company details
          </p>

          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            ⏰ Please review this job within 24 hours to maintain a good experience for job posters.
          </p>
          
          <p>Best regards,<br>TalentBridge Admin Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
          <p>This is an automated notification. You are receiving this because you are an admin.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send to all admins
  const emailPromises = adminEmails.map(adminEmail => 
    sendEmail({
      to: adminEmail,
      subject: `⚠️ New Job Pending Approval: ${escapeHtml(job.title)}`,
      html,
      text: `New job pending approval: ${escapeHtml(job.title)} at ${escapeHtml(job.organization?.name || 'N/A')}. Posted by ${escapeHtml(poster.first_name)} ${escapeHtml(poster.last_name)}. Review at ${adminUrl}`
    })
  );

  await Promise.all(emailPromises);
  logger.info(`Job approval notification sent to ${adminEmails.length} admins`);
};

/**
 * Send job approved notification to job poster
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
        .header { background: linear-gradient(135deg, #2e7d32 0%, #43a047 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        .success-box { background: #e8f5e9; border: 2px solid #4caf50; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .job-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50; }
        .badge { display: inline-block; padding: 6px 12px; background: #c8e6c9; color: #1b5e20; border-radius: 4px; font-size: 12px; font-weight: bold; margin-top: 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .info-row { margin: 10px 0; }
        .info-label { font-weight: bold; color: #666; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Job Approved!</h1>
        </div>
        <div class="content">
          <h2>Hi ${escapeHtml(poster.first_name)}!</h2>
          
          <div class="success-box">
            <h3 style="color: #2e7d32; margin-top: 0;">✅ Your job posting has been approved!</h3>
            <p style="margin-bottom: 0;">Your job is now live and visible to all candidates on our platform.</p>
          </div>

          <div class="job-card">
            <h3 style="margin-top: 0; color: #1976d2;">${escapeHtml(job.title)}</h3>
            <span class="badge">✓ APPROVED & LIVE</span>
            
            <div style="margin-top: 20px;">
              <div class="info-row">
                <span class="info-label">Company:</span> ${escapeHtml(job.organization?.name || 'N/A')}
              </div>
              <div class="info-row">
                <span class="info-label">Location:</span> ${escapeHtml(job.location)}
              </div>
              <div class="info-row">
                <span class="info-label">Job Type:</span> ${job.job_type}
              </div>
              <div class="info-row">
                <span class="info-label">Approved At:</span> ${new Date(job.approvedAt).toLocaleString()}
              </div>
            </div>
          </div>

          <p><strong>What's Next?</strong></p>
          <ul>
            <li>Your job is now visible to thousands of candidates</li>
            <li>You will receive notifications when candidates request referrals</li>
            <li>Monitor applications through your dashboard</li>
            <li>You can edit or deactivate the job anytime</li>
          </ul>

          <p style="text-align: center; margin: 30px 0;">
            <a href="${jobUrl}" class="button">View Your Job Posting</a>
          </p>

          <p>Thank you for using our platform to find great talent!</p>
          
          <p>Best regards,<br>The TalentBridge Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailViaPromailer({
    to: poster.email,
    subject: `✅ Your Job Posting "${job.title}" Has Been Approved!`,
    html,
    text: `Hi ${poster.first_name}, Great news! Your job posting "${job.title}" has been approved and is now live on our platform. View it at ${jobUrl}`
  });
};

/**
 * Send job rejected notification to job poster
 */
const sendJobRejectedEmail = async (job, poster, reason) => {
  const supportUrl = `${config.frontendUrl}/support`;
  const guidelinesUrl = `${config.frontendUrl}/guidelines`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        .rejection-box { background: #ffebee; border: 2px solid #f44336; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .job-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336; }
        .reason-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .info-row { margin: 10px 0; }
        .info-label { font-weight: bold; color: #666; }
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
          
          <div class="rejection-box">
            <h3 style="color: #d32f2f; margin-top: 0;">❌ Job Posting Not Approved</h3>
            <p>We've reviewed your job posting and unfortunately it doesn't meet our current guidelines.</p>
          </div>

          <div class="job-card">
            <h3 style="margin-top: 0;">${job.title}</h3>
            
            <div style="margin-top: 15px;">
              <div class="info-row">
                <span class="info-label">Company:</span> ${job.organization?.name || 'N/A'}
              </div>
              <div class="info-row">
                <span class="info-label">Location:</span> ${job.location}
              </div>
            </div>
          </div>

          <div class="reason-box">
            <strong>📋 Reason for Rejection:</strong>
            <p style="margin: 10px 0 0 0;">${reason}</p>
          </div>

          <p><strong>What You Can Do:</strong></p>
          <ul>
            <li>Review our <a href="${guidelinesUrl}">posting guidelines</a></li>
            <li>Address the issues mentioned above</li>
            <li>Submit a new job posting with the corrections</li>
            <li>Contact our support team if you have questions</li>
          </ul>

          <p style="text-align: center; margin: 30px 0;">
            <a href="${supportUrl}" class="button">Contact Support</a>
          </p>

          <p>We appreciate your understanding and look forward to your next submission.</p>
          
          <p>Best regards,<br>The TalentBridge Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailViaPromailer({
    to: poster.email,
    subject: `Job Posting Update: "${job.title}" - Action Required`,
    html,
    text: `Hi ${poster.first_name}, Your job posting "${job.title}" was not approved. Reason: ${reason}. Please review our guidelines and submit a corrected version.`
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
