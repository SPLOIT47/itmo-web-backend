import { Module } from '@nestjs/common';
import { CommunityModule } from '../community/community.module';
import { CommunityDetailsController } from './controller/community-details.controller';
import { CommunityDetailsService } from './service/community-details.service';
import { CommunityDetailsRepository } from './repository/community-details.repository';

@Module({
  imports: [CommunityModule],
  controllers: [CommunityDetailsController],
  providers: [CommunityDetailsService, CommunityDetailsRepository],
})
export class CommunityDetailsModule {}

