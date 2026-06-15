/**
 * Smart Email Service Router
 * Automatically uses Brevo (production) or Gmail SMTP (local)
 */

// Check if we should use Brevo (300 emails/day free, works everywhere)
const useBrevo = 
  process.env.USE_BREVO === 'true' || 
  (process.env.NODE_ENV === 'production' && process.env.BREVO_SMTP_KEY);

if (useBrevo && process.env.BREVO_SMTP_KEY) {
  console.log('📧 Using Brevo email service (300/day FREE, works on all platforms)');
  module.exports = require('./email.resend'); // File renamed to use Brevo
} else {
  console.log('📧 Using Gmail SMTP email service (Local development only)');
  module.exports = require('./email.service');
}
