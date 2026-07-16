import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RealtimeGateway } from './realtime.gateway';

/**
 * موديول realtime عام — بيوفّر RealtimeGateway لكل السيستم.
 * Global عشان أي service يقدر يحقنه بدون import متكرر.
 */
@Global()
@Module({
  imports: [PrismaModule, AuthModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
