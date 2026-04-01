declare const _default: () => {
    port: number;
    database: {
        url: string;
    };
    minio: {
        endpoint: string;
        port: number;
        accessKey: string;
        secretKey: string;
        bucket: string;
        useSSL: boolean;
    };
    upload: {
        maxSizeBytes: number;
    };
};
export default _default;
