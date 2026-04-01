export declare const MEDIA_KINDS: readonly ["avatar", "cover", "post-image", "community-avatar", "community-cover", "attachment", "other"];
export type MediaKind = (typeof MEDIA_KINDS)[number];
export declare class UploadMediaRequest {
    kind: MediaKind;
}
