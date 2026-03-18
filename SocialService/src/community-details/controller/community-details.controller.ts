import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Id } from '../../common/annotation/id.annotation';
import { UpdateCommunityDetailsDto } from '../payload/update-community-details.dto';
import { CommunityDetailsService } from '../service/community-details.service';

@ApiTags('community-details')
@Controller('communities/:id/details')
export class CommunityDetailsController {
  constructor(private readonly service: CommunityDetailsService) {}

  @Get()
  @ApiOperation({ summary: 'Get community details' })
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update community details (owner only)' })
  update(@Id() userId: string, @Param('id') id: string, @Body() dto: UpdateCommunityDetailsDto) {
    return this.service.update(userId, id, dto);
  }
}

