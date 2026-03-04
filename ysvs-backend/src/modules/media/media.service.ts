import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { MediaType } from './dto/upload-file.dto';

export interface UploadedFile {
  originalName: string;
  filename: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
  width?: number;
  height?: number;
}

interface UploadBufferOptions {
  buffer: Buffer;
  originalName: string;
  mimetype: string;
  type?: MediaType;
  folder?: string;
  filename?: string;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly provider: 'local' | 'r2';
  private readonly uploadPath: string;
  private readonly maxFileSize: number;
  private readonly r2Bucket: string;
  private readonly r2PublicUrl: string;
  private readonly s3Client?: S3Client;

  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private readonly allowedDocumentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  constructor(private configService: ConfigService) {
    this.provider = (this.configService.get<string>('storage.provider') || 'local') as
      | 'local'
      | 'r2';
    this.uploadPath = this.configService.get<string>('storage.uploadPath') || './uploads';
    this.maxFileSize = this.configService.get<number>('storage.maxFileSize') || 5242880;
    this.r2Bucket = this.configService.get<string>('storage.r2Bucket') || '';
    this.r2PublicUrl = this.configService.get<string>('storage.r2PublicUrl') || '';

    if (this.provider === 'r2') {
      const accountId = this.configService.get<string>('storage.r2AccountId') || '';
      const accessKeyId = this.configService.get<string>('storage.r2AccessKeyId') || '';
      const secretAccessKey =
        this.configService.get<string>('storage.r2SecretAccessKey') || '';
      const region = this.configService.get<string>('storage.r2Region') || 'auto';

      if (
        !accountId ||
        !accessKeyId ||
        !secretAccessKey ||
        !this.r2Bucket ||
        !this.r2PublicUrl
      ) {
        throw new Error(
          'R2 storage is enabled but required environment variables are missing',
        );
      }

      this.s3Client = new S3Client({
        region,
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true,
      });
    }

    if (this.provider === 'local') {
      this.ensureDirectoryExists(this.uploadPath);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    type: MediaType = MediaType.IMAGE,
    folder?: string,
  ): Promise<UploadedFile> {
    this.validateFile(file, type);

    const subFolder = this.sanitizeFolder(folder || type);

    const fileExtension = this.getFileExtension(file.originalname);
    const originalFilename = `${uuidv4()}${fileExtension}`;

    if (type === MediaType.IMAGE && this.isImage(file.mimetype)) {
      const processed = await this.processImage(file);
      const finalFilename = originalFilename.replace(/\.[^.]+$/, '.webp');
      const key = `${subFolder}/${finalFilename}`;

      await this.storeFile(key, processed.buffer, processed.mimetype);

      const result: UploadedFile = {
        originalName: file.originalname,
        filename: finalFilename,
        path: key,
        url: this.buildPublicUrl(key),
        size: processed.size,
        mimetype: processed.mimetype,
        width: processed.width,
        height: processed.height,
      };

      this.logger.log(`File uploaded: ${finalFilename}`);
      return result;
    }

    const key = `${subFolder}/${originalFilename}`;
    await this.storeFile(key, file.buffer, file.mimetype);

    const result: UploadedFile = {
      originalName: file.originalname,
      filename: originalFilename,
      path: key,
      url: this.buildPublicUrl(key),
      size: file.size,
      mimetype: file.mimetype,
    };

    this.logger.log(`File uploaded: ${originalFilename}`);
    return result;
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    type: MediaType = MediaType.IMAGE,
    folder?: string,
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, type, folder));
    return Promise.all(uploadPromises);
  }

  async uploadBuffer(options: UploadBufferOptions): Promise<UploadedFile> {
    const {
      buffer,
      originalName,
      mimetype,
      type = MediaType.DOCUMENT,
      folder,
      filename,
    } = options;

    this.validateBuffer(buffer, mimetype, type);

    const subFolder = this.sanitizeFolder(folder || type);
    const extension = this.getFileExtension(originalName) || this.getDefaultExtension(mimetype);
    const finalFilename = this.buildBufferFilename(filename, extension);
    const key = `${subFolder}/${finalFilename}`;

    await this.storeFile(key, buffer, mimetype);

    const result: UploadedFile = {
      originalName,
      filename: finalFilename,
      path: key,
      url: this.buildPublicUrl(key),
      size: buffer.length,
      mimetype,
    };

    this.logger.log(`Buffer uploaded: ${finalFilename}`);
    return result;
  }

  async findAll(limit: number = 50, page: number = 1): Promise<{
    data: Array<{
      _id: string;
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
      folder?: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    total: number;
  }> {
    if (this.provider === 'r2') {
      return this.findAllR2(limit, page);
    }

    const files: Array<{
      _id: string;
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
      folder?: string;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    const scanDir = (dir: string, relativePath: string = '') => {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          scanDir(fullPath, relPath);
        } else if (entry.isFile()) {
          try {
            const stats = fs.statSync(fullPath);
            const ext = path.extname(entry.name).toLowerCase();
            const mimeType = this.getMimeType(ext);

            files.push({
              _id: relPath,
              filename: entry.name,
              originalName: entry.name,
              mimeType,
              size: stats.size,
              url: `/${relPath}`,
              folder: relativePath || undefined,
              createdAt: stats.birthtime,
              updatedAt: stats.mtime,
            });
          } catch {
            // Skip files we can't read
          }
        }
      }
    };

    scanDir(this.uploadPath);
    files.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = files.length;
    const skip = (page - 1) * limit;
    const paginatedData = files.slice(skip, skip + limit);

    return { data: paginatedData, total };
  }

  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (this.provider === 'r2') {
        await this.s3Client?.send(
          new DeleteObjectCommand({
            Bucket: this.r2Bucket,
            Key: filePath,
          }),
        );
      } else {
        const fullPath = path.join(this.uploadPath, filePath);
        await fs.promises.unlink(fullPath);
      }
      this.logger.log(`File deleted: ${filePath}`);
    } catch {
      this.logger.warn(`Failed to delete file: ${filePath}`);
    }
  }

  private async processImage(file: Express.Multer.File): Promise<{
    buffer: Buffer;
    size: number;
    mimetype: string;
    width?: number;
    height?: number;
  }> {
    // Convert to WebP and optimize
    const image = sharp(file.buffer);
    const metadata = await image.metadata();

    // Resize if too large (max 2000px width)
    if (metadata.width && metadata.width > 2000) {
      image.resize(2000, null, { withoutEnlargement: true });
    }

    // Convert to WebP with quality optimization
    const webpBuffer = await image.webp({ quality: 85 }).toBuffer();
    const processedMetadata = await sharp(webpBuffer).metadata();

    return {
      buffer: webpBuffer,
      size: webpBuffer.length,
      mimetype: 'image/webp',
      width: processedMetadata.width,
      height: processedMetadata.height,
    };
  }

  private async storeFile(key: string, buffer: Buffer, contentType: string): Promise<void> {
    if (this.provider === 'r2') {
      await this.s3Client?.send(
        new PutObjectCommand({
          Bucket: this.r2Bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );
      return;
    }

    const localPath = path.join(this.uploadPath, key);
    this.ensureDirectoryExists(path.dirname(localPath));
    await fs.promises.writeFile(localPath, buffer);
  }

  private async findAllR2(
    limit: number,
    page: number,
  ): Promise<{
    data: Array<{
      _id: string;
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
      folder?: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    total: number;
  }> {
    const response = await this.s3Client?.send(
      new ListObjectsV2Command({
        Bucket: this.r2Bucket,
      }),
    );

    const objects = response?.Contents || [];
    const files = objects
      .filter((obj) => obj.Key)
      .map((obj) => {
        const key = obj.Key as string;
        const filename = key.split('/').pop() || key;
        const folder = key.includes('/') ? key.substring(0, key.lastIndexOf('/')) : undefined;
        const ext = path.extname(filename).toLowerCase();

        return {
          _id: key,
          filename,
          originalName: filename,
          mimeType: this.getMimeType(ext),
          size: obj.Size || 0,
          url: this.buildPublicUrl(key),
          folder,
          createdAt: obj.LastModified || new Date(),
          updatedAt: obj.LastModified || new Date(),
        };
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = files.length;
    const skip = (page - 1) * limit;
    const paginatedData = files.slice(skip, skip + limit);

    return { data: paginatedData, total };
  }

  private buildPublicUrl(key: string): string {
    if (this.provider === 'r2') {
      if (this.r2PublicUrl) {
        return `${this.r2PublicUrl.replace(/\/$/, '')}/${key}`;
      }

      return key;
    }

    return `/${key.replace(/\\/g, '/')}`;
  }

  private sanitizeFolder(folder: string): string {
    const sanitized = folder
      .split('/')
      .map((part) => part.trim().replace(/[^a-zA-Z0-9_-]/g, ''))
      .filter(Boolean)
      .join('/');

    return sanitized || 'misc';
  }

  private validateFile(file: Express.Multer.File, type: MediaType): void {
    if (!file) {
      throw new BadRequestException('لم يتم تحديد ملف للرفع');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `حجم الملف يتجاوز الحد المسموح (${this.maxFileSize / 1024 / 1024}MB)`,
      );
    }

    const allowedTypes = this.getAllowedTypes(type);
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `نوع الملف غير مسموح. الأنواع المسموحة: ${allowedTypes.join(', ')}`,
      );
    }
  }

  private validateBuffer(buffer: Buffer, mimetype: string, type: MediaType): void {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('محتوى الملف فارغ');
    }

    if (buffer.length > this.maxFileSize) {
      throw new BadRequestException(
        `حجم الملف يتجاوز الحد المسموح (${this.maxFileSize / 1024 / 1024}MB)`,
      );
    }

    const allowedTypes = this.getAllowedTypes(type);
    if (!allowedTypes.includes(mimetype)) {
      throw new BadRequestException(
        `نوع الملف غير مسموح. الأنواع المسموحة: ${allowedTypes.join(', ')}`,
      );
    }
  }

  private getAllowedTypes(type: MediaType): string[] {
    switch (type) {
      case MediaType.IMAGE:
        return this.allowedImageTypes;
      case MediaType.DOCUMENT:
        return this.allowedDocumentTypes;
      default:
        return [...this.allowedImageTypes, ...this.allowedDocumentTypes];
    }
  }

  private isImage(mimetype: string): boolean {
    return this.allowedImageTypes.includes(mimetype);
  }

  private getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  private getDefaultExtension(mimetype: string): string {
    const extByType: Record<string, string> = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };

    return extByType[mimetype] || '';
  }

  private buildBufferFilename(filename: string | undefined, extension: string): string {
    if (!filename) {
      return `${uuidv4()}${extension}`;
    }

    const normalized = filename
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '');

    if (!normalized) {
      return `${uuidv4()}${extension}`;
    }

    if (path.extname(normalized)) {
      return normalized;
    }

    return `${normalized}${extension}`;
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
