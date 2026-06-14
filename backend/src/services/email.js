/**
 * Smart Email Service Router
 * Automatically uses Resend on production (Render/Vercel/Netlify) and Gmail SMTP locally
 */

// Check if we should use Resend
const useResend = 
  process.env.USE_RESEND === 'true' || 
  (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY);

if (useResend && process.env.RESEND_API_KEY) {
  console.log('📧 Using Resend email service (Works on all platforms)');
  module.exports = require('./email.resend');
} else {
  console.log('📧 Using Gmail SMTP email service (Local development only)');
  module.exports = require('./email.service');
}
