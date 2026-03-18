import { Module } from '@nestjs/common';
import { CommunityController } from './controller/community.controller';
import { CommunityService } from './service/community.service';
import { CommunityRepository } from './repository/community.repository';

@Module({
  controllers: [CommunityController],
  providers: [CommunityService, CommunityRepository],
  exports: [CommunityRepository],
})
export class CommunityModule {}

