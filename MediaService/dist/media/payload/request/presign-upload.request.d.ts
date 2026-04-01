import { type MediaKind } from './upload-media.request';
export declare class PresignUploadRequest {
    originalFilename: string;
    mimeType: string;
    kind: MediaKind;
}
