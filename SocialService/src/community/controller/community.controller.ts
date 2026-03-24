import { Body, Controller, Delete, Get, Param, Patch, Post, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Id } from '../../common/annotation/id.annotation';
import { CreateCommunityDto } from '../payload/create-community.dto';
import { SearchCommunityQuery } from '../payload/search-community.query';
import { UpdateCommunityDto } from '../payload/update-community.dto';
import { CommunityService } from '../service/community.service';

@ApiTags('communities')
@Controller('communities')
export class CommunityController {
  constructor(private readonly service: CommunityService) {}

  @Post()
  @ApiOperation({ summary: 'Create community' })
  create(@Id() userId: string, @Body() dto: CreateCommunityDto) {
    return this.service.create(userId, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search communities' })
  search(@Query() query: SearchCommunityQuery) {
    return this.service.search(query.q);
  }

  @Get('me')
  @ApiOperation({ summary: 'My communities' })
  my(@Id() userId: string) {
    return this.service.my(userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update community (owner only)' })
  update(@Id() userId: string, @Param('id') id: string, @Body() dto: UpdateCommunityDto) {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete community' })
  delete(@Id() userId: string, @Param('id') id: string) {
    return this.service.softDelete(userId, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get community' })
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join community' })
  join(@Id() userId: string, @Param('id') id: string) {
    return this.service.join(userId, id);
  }

  @Delete(':id/join')
  @ApiOperation({ summary: 'Leave community' })
  leave(@Id() userId: string, @Param('id') id: string) {
    return this.service.leave(userId, id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List members' })
  members(@Param('id') id: string) {
    return this.service.members(id);
  }

  @Delete('me/members')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyCommunityMemberships(@Id() userId: string): Promise<void> {
    const communities = await this.service.my(userId);

    for (const c of communities) {
      await this.service.leave(userId, c.communityId);
    }
  }
}

