import { extname } from "node:path";
import { BadRequestException } from "@nestjs/common";

import fileType = require("file-type");

export type ValidatedUploadFile = {
	mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "application/pdf";
	extension: ".jpg" | ".jpeg" | ".png" | ".webp" | ".gif" | ".pdf";
	type: "IMAGE" | "DOCUMENT";
};

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS_BY_MIME: Record<ValidatedUploadFile["mimeType"], string[]> = {
	"image/jpeg": [".jpg", ".jpeg"],
	"image/png": [".png"],
	"image/webp": [".webp"],
	"image/gif": [".gif"],
	"application/pdf": [".pdf"],
};

export function validateUploadFile(file: Express.Multer.File): ValidatedUploadFile {
	if (!file.buffer || file.buffer.length === 0) {
		throw new BadRequestException("Fichier vide ou illisible.");
	}
	if (file.size > MAX_UPLOAD_SIZE_BYTES || file.buffer.length > MAX_UPLOAD_SIZE_BYTES) {
		throw new BadRequestException("Fichier trop volumineux (max 10 Mo).");
	}

	const detected = fileType(file.buffer);
	if (!detected || !isAllowedMimeType(detected.mime)) {
		throw new BadRequestException("Type de fichier non supporté.");
	}
	const detectedMimeType = detected.mime;
	if (!hasValidContainerStructure(file.buffer, detectedMimeType)) {
		throw new BadRequestException("Fichier tronqué ou illisible.");
	}

	if (file.mimetype.toLowerCase() !== detectedMimeType) {
		throw new BadRequestException("Type MIME incohérent avec le contenu du fichier.");
	}

	const extension = extname(file.originalname).toLowerCase();
	if (!ALLOWED_EXTENSIONS_BY_MIME[detectedMimeType].includes(extension)) {
		throw new BadRequestException("Extension de fichier incohérente avec le contenu.");
	}

	if (detectedMimeType === "application/pdf" && containsPdfActiveContent(file.buffer)) {
		throw new BadRequestException("PDF avec contenu actif non autorisé.");
	}

	return {
		mimeType: detectedMimeType,
		extension: extension as ValidatedUploadFile["extension"],
		type: detectedMimeType === "application/pdf" ? "DOCUMENT" : "IMAGE",
	};
}

function isAllowedMimeType(mime: string): mime is ValidatedUploadFile["mimeType"] {
	return Object.hasOwn(ALLOWED_EXTENSIONS_BY_MIME, mime);
}

function hasValidContainerStructure(
	buffer: Buffer,
	mimeType: ValidatedUploadFile["mimeType"],
): boolean {
	switch (mimeType) {
		case "image/jpeg":
			return buffer.length >= 4 && buffer.subarray(-2).equals(Buffer.from([0xff, 0xd9]));
		case "image/png":
			return buffer.length >= 20 && buffer.subarray(-8, -4).toString("ascii") === "IEND";
		case "image/gif":
			return buffer.length >= 14 && buffer.at(-1) === 0x3b;
		case "image/webp": {
			if (buffer.length < 20) return false;
			const declaredSize = buffer.readUInt32LE(4) + 8;
			return declaredSize <= buffer.length;
		}
		case "application/pdf":
			return buffer.length >= 12 && /%%EOF\s*$/i.test(buffer.subarray(-1024).toString("latin1"));
	}
}

function containsPdfActiveContent(buffer: Buffer): boolean {
	const head = buffer.subarray(0, Math.min(buffer.length, 1024 * 1024)).toString("latin1");
	return /\/(JavaScript|JS|AA|OpenAction|Launch|RichMedia)\b/i.test(head);
}
