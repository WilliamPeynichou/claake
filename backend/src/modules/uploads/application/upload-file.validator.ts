import { BadRequestException } from "@nestjs/common";
import { extname } from "node:path";

export type ValidatedUploadFile = {
	mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "application/pdf";
	extension: ".jpg" | ".jpeg" | ".png" | ".webp" | ".gif" | ".pdf";
	type: "IMAGE" | "DOCUMENT";
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS_BY_MIME: Record<ValidatedUploadFile["mimeType"], string[]> = {
	"image/jpeg": [".jpg", ".jpeg"],
	"image/png": [".png"],
	"image/webp": [".webp"],
	"image/gif": [".gif"],
	"application/pdf": [".pdf"],
};

export function validateUploadFile(file: Express.Multer.File): ValidatedUploadFile {
	if (file.size > MAX_SIZE_BYTES) {
		throw new BadRequestException("Fichier trop volumineux (max 10 Mo).");
	}
	if (!file.buffer || file.buffer.length === 0) {
		throw new BadRequestException("Fichier vide ou illisible.");
	}

	const detectedMimeType = detectMimeType(file.buffer);
	if (!detectedMimeType) {
		throw new BadRequestException("Type de fichier non supporté.");
	}

	if (file.mimetype !== detectedMimeType) {
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

function detectMimeType(buffer: Buffer): ValidatedUploadFile["mimeType"] | null {
	if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
		return "image/jpeg";
	}
	if (
		buffer.length >= 8 &&
		buffer[0] === 0x89 &&
		buffer[1] === 0x50 &&
		buffer[2] === 0x4e &&
		buffer[3] === 0x47 &&
		buffer[4] === 0x0d &&
		buffer[5] === 0x0a &&
		buffer[6] === 0x1a &&
		buffer[7] === 0x0a
	) {
		return "image/png";
	}
	if (
		buffer.length >= 12 &&
		buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
		buffer.subarray(8, 12).toString("ascii") === "WEBP"
	) {
		return "image/webp";
	}
	if (
		buffer.length >= 6 &&
		(buffer.subarray(0, 6).toString("ascii") === "GIF87a" ||
			buffer.subarray(0, 6).toString("ascii") === "GIF89a")
	) {
		return "image/gif";
	}
	if (buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
		return "application/pdf";
	}
	return null;
}

function containsPdfActiveContent(buffer: Buffer): boolean {
	const head = buffer.subarray(0, Math.min(buffer.length, 1024 * 1024)).toString("latin1");
	return /\/(JavaScript|JS|AA|OpenAction|Launch|RichMedia)\b/i.test(head);
}
