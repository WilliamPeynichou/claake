import { BadRequestException } from "@nestjs/common";
import { PdfKnowledgeExtractionService } from "./pdf-knowledge-extraction.service";

jest.mock("pdf-parse", () => ({
	PDFParse: jest.fn().mockImplementation(() => ({
		getText: jest.fn().mockResolvedValue({ text: "Texte PDF utile\n\n\nSuite" }),
		destroy: jest.fn().mockResolvedValue(undefined),
	})),
}));

describe("PdfKnowledgeExtractionService", () => {
	const service = new PdfKnowledgeExtractionService();

	it("extracts and normalizes a validated PDF", async () => {
		await expect(service.extract(makePdf())).resolves.toBe("Texte PDF utile\n\nSuite");
	});

	it("rejects a non-PDF", async () => {
		const file = makePdf();
		file.buffer = Buffer.from("hello");
		file.mimetype = "text/plain";
		file.originalname = "doc.txt";
		await expect(service.extract(file)).rejects.toBeInstanceOf(BadRequestException);
	});
});

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
