"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MinioService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinioService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const minio_1 = require("minio");
let MinioService = MinioService_1 = class MinioService {
    config;
    logger = new common_1.Logger(MinioService_1.name);
    client;
    bucket;
    constructor(config) {
        this.config = config;
        const endpoint = this.config.get('minio.endpoint', { infer: true });
        const port = this.config.get('minio.port', { infer: true });
        const useSSL = this.config.get('minio.useSSL', { infer: true });
        const accessKey = this.config.get('minio.accessKey', { infer: true });
        const secretKey = this.config.get('minio.secretKey', { infer: true });
        this.bucket = this.config.get('minio.bucket', { infer: true });
        this.client = new minio_1.Client({ endPoint: endpoint, port, useSSL, accessKey, secretKey });
    }
    async onModuleInit() {
        const exists = await this.client.bucketExists(this.bucket);
        if (!exists) {
            this.logger.warn(`Bucket "${this.bucket}" does not exist. Creating...`);
            await this.client.makeBucket(this.bucket);
            this.logger.log(`Bucket "${this.bucket}" created`);
        }
    }
    getBucket() {
        return this.bucket;
    }
    async uploadObject(params) {
        await this.client.putObject(params.bucket, params.objectKey, params.body, params.size, {
            'Content-Type': params.mimeType,
        });
    }
    async removeObject(params) {
        await this.client.removeObject(params.bucket, params.objectKey);
    }
    async statObject(params) {
        return await this.client.statObject(params.bucket, params.objectKey);
    }
    async getPresignedDownloadUrl(params) {
        const expires = params.expiresSeconds ?? 60 * 10;
        return await this.client.presignedGetObject(params.bucket, params.objectKey, expires);
    }
    async getPresignedUploadUrl(params) {
        const expires = params.expiresSeconds ?? 60 * 10;
        return await this.client.presignedPutObject(params.bucket, params.objectKey, expires);
    }
};
exports.MinioService = MinioService;
exports.MinioService = MinioService = MinioService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MinioService);
