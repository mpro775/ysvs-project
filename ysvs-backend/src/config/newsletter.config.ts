import { registerAs } from '@nestjs/config';

export default registerAs('newsletter', () => ({
  doubleOptIn: (process.env.NEWSLETTER_DOUBLE_OPT_IN || 'false').toLowerCase() !== 'false',
  confirmTokenTtlHours: parseInt(process.env.NEWSLETTER_CONFIRM_TOKEN_TTL_HOURS || '48', 10),
  subscribeRateLimitPerMinute: parseInt(
    process.env.NEWSLETTER_SUBSCRIBE_RATE_LIMIT_PER_MINUTE || '6',
    10,
  ),
  unsubscribeRateLimitPerMinute: parseInt(
    process.env.NEWSLETTER_UNSUBSCRIBE_RATE_LIMIT_PER_MINUTE || '12',
    10,
  ),
}));
