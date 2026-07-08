import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { UploadService } from "./application/upload.service.js";
import { UploadStorageService } from "./application/upload-storage.service.js";
import { UploadController } from "./infrastructure/controllers/upload.controller.js";

@Module({
	imports: [PrismaModule, ConfigModule],
	controllers: [UploadController],
	providers: [UploadService, UploadStorageService],
	exports: [UploadService],
})
export class UploadsModule {}
