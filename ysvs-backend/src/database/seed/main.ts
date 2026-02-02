import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['log', 'error'],
  });
  const seedService = app.get(SeedService);
  const fresh = process.argv.includes('--fresh');
  await seedService.run(fresh);
  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('❌ فشل البذر:', err);
  process.exit(1);
});
