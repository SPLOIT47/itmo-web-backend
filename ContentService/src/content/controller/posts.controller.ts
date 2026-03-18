import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post as HttpPost,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ContentService } from "../service/content.service";
import { Id } from "../annotation/id.annotation";
import { CreatePostDto } from "../dto/create-post.dto";
import { UpdatePostDto } from "../dto/update-post.dto";
import { CreateCommentDto } from "../dto/create-comment.dto";

@ApiTags("content")
@Controller()
export class PostsController {
    constructor(private readonly content: ContentService) {}

    @HttpPost("posts")
    createPost(@Id() userId: string, @Body() dto: CreatePostDto) {
        return this.content.createPost(userId, dto);
    }

    @Patch("posts/:id")
    updatePost(
        @Id() userId: string,
        @Param("id", new ParseUUIDPipe()) id: string,
        @Body() dto: UpdatePostDto,
    ) {
        return this.content.updatePost(userId, id, dto);
    }

    @Delete("posts/:id")
    deletePost(
        @Id() userId: string,
        @Param("id", new ParseUUIDPipe()) id: string,
    ) {
        return this.content.deletePost(userId, id);
    }

    @Get("posts/:id")
    getPost(@Param("id", new ParseUUIDPipe()) id: string) {
        return this.content.getPost(id);
    }

    @HttpPost("posts/:id/like")
    likePost(
        @Id() userId: string,
        @Param("id", new ParseUUIDPipe()) id: string,
    ) {
        return this.content.likePost(userId, id);
    }

    @Delete("posts/:id/like")
    unlikePost(
        @Id() userId: string,
        @Param("id", new ParseUUIDPipe()) id: string,
    ) {
        return this.content.unlikePost(userId, id);
    }

    @HttpPost("posts/:id/comments")
    addComment(
        @Id() userId: string,
        @Param("id", new ParseUUIDPipe()) id: string,
        @Body() dto: CreateCommentDto,
    ) {
        return this.content.addComment(userId, id, dto);
    }

    @Delete("comments/:id")
    deleteComment(
        @Id() userId: string,
        @Param("id", new ParseUUIDPipe()) id: string,
    ) {
        return this.content.deleteComment(userId, id);
    }
}

