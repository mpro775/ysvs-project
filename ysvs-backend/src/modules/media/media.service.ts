import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadPath: string;
  private readonly maxFileSize: number;

  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private readonly allowedDocumentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  constructor(private configService: ConfigService) {
    this.uploadPath = this.configService.get<string>('storage.uploadPath') || './uploads';
    this.maxFileSize = this.configService.get<number>('storage.maxFileSize') || 5242880;

    // Ensure upload directory exists
    this.ensureDirectoryExists(this.uploadPath);
  }

  async uploadFile(
    file: Express.Multer.File,
    type: MediaType = MediaType.IMAGE,
    folder?: string,
  ): Promise<UploadedFile> {
    this.validateFile(file, type);

    const subFolder = folder || type;
    const uploadDir = path.join(this.uploadPath, subFolder);
    this.ensureDirectoryExists(uploadDir);

    const fileExtension = this.getFileExtension(file.originalname);
    const filename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadDir, filename);

    let result: UploadedFile;

    if (type === MediaType.IMAGE && this.isImage(file.mimetype)) {
      result = await this.processImage(file, filePath, filename, subFolder);
    } else {
      await fs.promises.writeFile(filePath, file.buffer);
      result = {
        originalName: file.originalname,
        filename,
        path: filePath,
        url: `/${subFolder}/${filename}`,
        size: file.size,
        mimetype: file.mimetype,
      };
    }

    this.logger.log(`File uploaded: ${filename}`);
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
    const fullPath = path.join(this.uploadPath, filePath);

    try {
      await fs.promises.unlink(fullPath);
      this.logger.log(`File deleted: ${filePath}`);
    } catch (error) {
      this.logger.warn(`Failed to delete file: ${filePath}`);
    }
  }

  private async processImage(
    file: Express.Multer.File,
    filePath: string,
    filename: string,
    folder: string,
  ): Promise<UploadedFile> {
    // Convert to WebP and optimize
    const webpFilename = filename.replace(/\.[^.]+$/, '.webp');
    const webpPath = filePath.replace(/\.[^.]+$/, '.webp');

    const image = sharp(file.buffer);
    const metadata = await image.metadata();

    // Resize if too large (max 2000px width)
    if (metadata.width && metadata.width > 2000) {
      image.resize(2000, null, { withoutEnlargement: true });
    }

    // Convert to WebP with quality optimization
    await image
      .webp({ quality: 85 })
      .toFile(webpPath);

    const stats = await fs.promises.stat(webpPath);
    const processedMetadata = await sharp(webpPath).metadata();

    return {
      originalName: file.originalname,
      filename: webpFilename,
      path: webpPath,
      url: `/${folder}/${webpFilename}`,
      size: stats.size,
      mimetype: 'image/webp',
      width: processedMetadata.width,
      height: processedMetadata.height,
    };
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

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
