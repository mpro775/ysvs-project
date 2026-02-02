import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { StreamConfig, StreamConfigDocument } from './schemas/stream-config.schema';
import { CreateStreamConfigDto, UpdateStreamConfigDto } from './dto';
import { StreamingGateway } from './streaming.gateway';

@Injectable()
export class StreamingService {
  private readonly logger = new Logger(StreamingService.name);
  private readonly CACHE_KEY = 'stream:status';
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor(
    @InjectModel(StreamConfig.name)
    private streamConfigModel: Model<StreamConfigDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private streamingGateway: StreamingGateway,
  ) {}

  async getStatus(): Promise<StreamConfig | null> {
    // Try cache first
    const cached = await this.cacheManager.get<StreamConfig>(this.CACHE_KEY);
    if (cached) {
      return cached;
    }

    // Get active stream
    const stream = await this.streamConfigModel
      .findOne({ isLive: true })
      .populate('event', 'titleAr titleEn slug')
      .exec();

    if (stream) {
      await this.cacheManager.set(this.CACHE_KEY, stream, this.CACHE_TTL);
    }

    return stream;
  }

  async createConfig(
    createStreamConfigDto: CreateStreamConfigDto,
  ): Promise<StreamConfig> {
    const config = new this.streamConfigModel(createStreamConfigDto);
    return config.save();
  }

  async updateConfig(
    id: string,
    updateStreamConfigDto: UpdateStreamConfigDto,
  ): Promise<StreamConfig> {
    const config = await this.streamConfigModel
      .findByIdAndUpdate(id, updateStreamConfigDto, { new: true })
      .exec();

    if (!config) {
      throw new NotFoundException('إعدادات البث غير موجودة');
    }

    await this.invalidateCache();
    return config;
  }

  async startStream(configId: string, userId: string): Promise<StreamConfig> {
    // Check if there's already an active stream
    const activeStream = await this.streamConfigModel.findOne({ isLive: true });
    if (activeStream) {
      throw new BadRequestException('يوجد بث نشط حالياً. يرجى إيقافه أولاً');
    }

    const config = await this.streamConfigModel.findById(configId);
    if (!config) {
      throw new NotFoundException('إعدادات البث غير موجودة');
    }

    if (!config.embedUrl) {
      throw new BadRequestException('رابط البث غير محدد');
    }

    config.isLive = true;
    config.startedAt = new Date();
    config.startedBy = userId as any;
    config.viewerCount = 0;
    await config.save();

    await this.invalidateCache();

    // Notify all connected clients
    this.streamingGateway.broadcastStreamStarted({
      isLive: true,
      provider: config.provider,
      embedUrl: config.embedUrl,
      titleAr: config.titleAr,
      titleEn: config.titleEn,
    });

    this.logger.log(`Stream started: ${configId}`);

    return config;
  }

  async stopStream(configId?: string): Promise<StreamConfig> {
    let config: StreamConfigDocument | null;

    if (configId) {
      config = await this.streamConfigModel.findById(configId);
    } else {
      config = await this.streamConfigModel.findOne({ isLive: true });
    }

    if (!config) {
      throw new NotFoundException('لا يوجد بث نشط');
    }

    config.isLive = false;
    config.endedAt = new Date();
    await config.save();

    await this.invalidateCache();

    // Notify all connected clients
    this.streamingGateway.broadcastStreamEnded();

    this.logger.log(`Stream stopped: ${config._id}`);

    return config;
  }

  async getHistory(limit: number = 10): Promise<StreamConfig[]> {
    return this.streamConfigModel
      .find({ endedAt: { $exists: true } })
      .populate('event', 'titleAr titleEn slug')
      .sort({ endedAt: -1 })
      .limit(limit)
      .exec();
  }

  async getCurrentConfig(): Promise<StreamConfig | null> {
    return this.streamConfigModel
      .findOne()
      .sort({ createdAt: -1 })
      .populate('event', 'titleAr titleEn slug')
      .exec();
  }

  async incrementViewerCount(configId: string): Promise<void> {
    await this.streamConfigModel.findByIdAndUpdate(configId, {
      $inc: { viewerCount: 1 },
    });
  }

  async decrementViewerCount(configId: string): Promise<void> {
    await this.streamConfigModel.findByIdAndUpdate(configId, {
      $inc: { viewerCount: -1 },
    });
  }

  async getViewerCount(): Promise<number> {
    const activeStream = await this.streamConfigModel.findOne({ isLive: true });
    return activeStream?.viewerCount || 0;
  }

  private async invalidateCache(): Promise<void> {
    await this.cacheManager.del(this.CACHE_KEY);
  }
}
