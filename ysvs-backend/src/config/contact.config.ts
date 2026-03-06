import { registerAs } from '@nestjs/config';

export default registerAs('contact', () => ({
  notifyTo: process.env.CONTACT_NOTIFY_TO || '',
  submitRateLimitPerMinute: parseInt(
    process.env.CONTACT_SUBMIT_RATE_LIMIT_PER_MINUTE || '5',
    10,
  ),
  autoAckEnabled:
    (process.env.CONTACT_AUTO_ACK_ENABLED || 'false').toLowerCase() === 'true',
}));
