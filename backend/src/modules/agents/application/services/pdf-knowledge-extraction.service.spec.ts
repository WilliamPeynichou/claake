import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PDFParse } from "pdf-parse";
import { PdfKnowledgeExtractionService } from "./pdf-knowledge-extraction.service";

const getText = jest.fn();
const destroy = jest.fn().mockResolvedValue(undefined);

jest.mock("pdf-parse", () => ({
	PDFParse: jest.fn().mockImplementation(() => ({ getText, destroy })),
}));

describe("PdfKnowledgeExtractionService", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		getText.mockResolvedValue({ text: "Texte PDF utile\n\n\nSuite" });
		global.fetch = jest.fn();
	});

	it("extracts and normalizes a validated PDF without calling OCR", async () => {
		const service = makeService();

		await expect(service.extract(makePdf())).resolves.toBe("Texte PDF utile\n\nSuite");
		expect(global.fetch).not.toHaveBeenCalled();
		expect(destroy).toHaveBeenCalled();
	});

	it("uses Mistral OCR 4 when the PDF has no extractible text", async () => {
		getText.mockResolvedValue({ text: "  " });
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: jest.fn().mockResolvedValue({
				pages: [{ markdown: "Page une" }, { markdown: "Page deux" }],
			}),
		});
		const file = makePdf();
		const service = makeService("secret");

		await expect(service.extract(file)).resolves.toBe("Page une\n\nPage deux");
		expect(global.fetch).toHaveBeenCalledWith(
			"https://api.mistral.ai/v1/ocr",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({ Authorization: "Bearer secret" }),
			}),
		);
		const request = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit;
		expect(JSON.parse(String(request.body))).toEqual({
			model: "mistral-ocr-latest",
			document: {
				type: "document_url",
				document_url: `data:application/pdf;base64,${file.buffer.toString("base64")}`,
			},
		});
	});

	it("reports missing OCR configuration for an image-only PDF", async () => {
		getText.mockResolvedValue({ text: "" });

		await expect(makeService().extract(makePdf())).rejects.toThrow(
			"Ce PDF nécessite un OCR, mais le service OCR Mistral n'est pas configuré.",
		);
	});

	it("reports a Mistral OCR provider failure", async () => {
		getText.mockResolvedValue({ text: "" });
		(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 });

		await expect(makeService("secret").extract(makePdf())).rejects.toThrow(
			"Impossible d'analyser ce PDF avec l'OCR Mistral.",
		);
	});

	it("rejects a non-PDF", async () => {
		const file = makePdf();
		file.buffer = Buffer.from("hello");
		file.mimetype = "text/plain";
		file.originalname = "doc.txt";
		await expect(makeService().extract(file)).rejects.toBeInstanceOf(BadRequestException);
		expect(PDFParse).not.toHaveBeenCalled();
	});
});

function makeService(apiKey?: string): PdfKnowledgeExtractionService {
	return new PdfKnowledgeExtractionService(
		new ConfigService(apiKey ? { MISTRAL_API_KEY: apiKey } : {}),
	);
}

function makePdf(): Express.Multer.File {
	const buffer = Buffer.from("%PDF-1.4\n1 0 obj\n<< >>\nendobj\n");
	return {
		fieldname: "file",
		originalname: "doc.pdf",
		encoding: "7bit",
		mimetype: "application/pdf",
		size: buffer.length,
		buffer,
		stream: null as never,
		destination: "",
		filename: "",
		path: "",
	};
}
