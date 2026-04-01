import { PresignUploadRequest } from '../payload/request/presign-upload.request';
import { UploadMediaRequest } from '../payload/request/upload-media.request';
import { MediaFileResponse } from '../payload/response/media-file.response';
import { PresignUploadResponse } from '../payload/response/presign-upload.response';
import { PresignedUrlResponse } from '../payload/response/presigned-url.response';
import { MediaService } from '../service/media.service';
export declare class MediaController {
    private readonly media;
    constructor(media: MediaService);
    upload(ownerUserId: string, body: UploadMediaRequest, file: Express.Multer.File): Promise<MediaFileResponse>;
    getById(id: string): Promise<MediaFileResponse>;
    delete(requesterUserId: string, id: string): Promise<MediaFileResponse>;
    getUrl(id: string): Promise<PresignedUrlResponse>;
    deleteMe(userId: string): Promise<void>;
    presignUpload(ownerUserId: string, body: PresignUploadRequest): Promise<PresignUploadResponse>;
}
