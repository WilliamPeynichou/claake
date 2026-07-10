import { BadRequestException, Injectable } from "@nestjs/common";
import { PDFParse } from "pdf-parse";
import { validateUploadFile } from "../../../uploads/application/upload-file.validator.js";

const MAX_EXTRACTED_PDF_CHARS = 200_000;

@Injectable()
export class PdfKnowledgeExtractionService {
	async extract(file: Express.Multer.File): Promise<string> {
		const validated = validateUploadFile(file);
		if (validated.mimeType !== "application/pdf") {
			throw new BadRequestException("Seuls les fichiers PDF sont acceptés.");
		}

		const parser = new PDFParse({ data: file.buffer });
		try {
			const result = await parser.getText();
			const text = result.text
				.split(String.fromCharCode(0))
				.join("")
				.replace(/\n{3,}/g, "\n\n")
				.trim();
			if (!text) {
				throw new BadRequestException(
					"Ce PDF ne contient pas de texte extractible. Un OCR sera nécessaire.",
				);
			}
			return text.slice(0, MAX_EXTRACTED_PDF_CHARS);
		} catch (error) {
			if (error instanceof BadRequestException) throw error;
			throw new BadRequestException("Impossible d'extraire le texte de ce PDF.");
		} finally {
			await parser.destroy();
		}
	}
}
