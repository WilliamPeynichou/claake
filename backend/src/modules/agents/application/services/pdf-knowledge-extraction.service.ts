import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PDFParse } from "pdf-parse";
import { validateUploadFile } from "../../../uploads/application/upload-file.validator.js";

const MAX_EXTRACTED_PDF_CHARS = 200_000;
const MISTRAL_OCR_MODEL = "mistral-ocr-latest";
const MISTRAL_OCR_TIMEOUT_MS = 30_000;

interface MistralOcrResponse {
	pages?: Array<{ markdown?: string }>;
}

@Injectable()
export class PdfKnowledgeExtractionService {
	private readonly logger = new Logger(PdfKnowledgeExtractionService.name);

	constructor(private readonly config: ConfigService) {}

	async extract(file: Express.Multer.File): Promise<string> {
		const validated = validateUploadFile(file);
		if (validated.mimeType !== "application/pdf") {
			throw new BadRequestException("Seuls les fichiers PDF sont acceptés.");
		}

		const parser = new PDFParse({ data: file.buffer });
		try {
			const result = await parser.getText();
			const text = this.normalizeText(result.text);
			if (text) return text.slice(0, MAX_EXTRACTED_PDF_CHARS);
		} catch (error) {
			this.logger.warn(
				`Local PDF extraction failed: ${error instanceof Error ? error.message : "unknown"}`,
			);
			throw new BadRequestException("Impossible d'extraire le texte de ce PDF.");
		} finally {
			await parser.destroy();
		}

		return this.extractWithMistralOcr(file.buffer);
	}

	private async extractWithMistralOcr(buffer: Buffer): Promise<string> {
		const apiKey = this.config.get<string>("MISTRAL_API_KEY");
		if (!apiKey) {
			throw new BadRequestException(
				"Ce PDF nécessite un OCR, mais le service OCR Mistral n'est pas configuré.",
			);
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), MISTRAL_OCR_TIMEOUT_MS);
		try {
			const response = await fetch("https://api.mistral.ai/v1/ocr", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					model: MISTRAL_OCR_MODEL,
					document: {
						type: "document_url",
						document_url: `data:application/pdf;base64,${buffer.toString("base64")}`,
					},
				}),
				signal: controller.signal,
			});
			if (!response.ok) throw new Error(`Mistral OCR returned ${response.status}`);

			const payload = (await response.json()) as MistralOcrResponse;
			const text = this.normalizeText(
				(payload.pages ?? []).map((page) => page.markdown ?? "").join("\n\n"),
			);
			if (!text) {
				throw new Error("Mistral OCR returned no text");
			}
			return text.slice(0, MAX_EXTRACTED_PDF_CHARS);
		} catch (error) {
			this.logger.warn(
				`Mistral OCR unavailable: ${error instanceof Error ? error.message : "unknown"}`,
			);
			throw new BadRequestException("Impossible d'analyser ce PDF avec l'OCR Mistral.");
		} finally {
			clearTimeout(timeout);
		}
	}

	private normalizeText(text: string): string {
		return text
			.split(String.fromCharCode(0))
			.join("")
			.replace(/\n{3,}/g, "\n\n")
			.trim();
	}
}
