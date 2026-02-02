import { registerAs } from '@nestjs/config';

function getCorsOrigins(): string[] {
  // CORS_ORIGINS allows multiple origins (comma-separated) for production
  const corsOrigins = process.env.CORS_ORIGINS;
  if (corsOrigins) {
    return corsOrigins.split(',').map((o) => o.trim()).filter(Boolean);
  }
  // Fallback to single FRONTEND_URL
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return [frontendUrl];
}

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  corsOrigins: getCorsOrigins(),
}));
