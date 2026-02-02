import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StreamingService } from './streaming.service';
import { StreamingController } from './streaming.controller';
import { StreamingGateway } from './streaming.gateway';
import { StreamConfig, StreamConfigSchema } from './schemas/stream-config.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StreamConfig.name, schema: StreamConfigSchema },
    ]),
  ],
  controllers: [StreamingController],
  providers: [StreamingService, StreamingGateway],
  exports: [StreamingService],
})
export class StreamingModule {}
