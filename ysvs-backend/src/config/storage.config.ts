import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default
}));
