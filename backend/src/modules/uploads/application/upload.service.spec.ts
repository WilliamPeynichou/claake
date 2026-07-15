import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { UploadService } from "./upload.service";

function createStorage() {
	return {
		uploadPrivateObject: jest.fn().mockResolvedValue(undefined),
		removePrivateObjects: jest.fn().mockResolvedValue(undefined),
		createSignedUrl: jest
			.fn()
			.mockResolvedValue(
				"https://storage.example.test/object/sign/agent-files-private/uploads/user/file.png?token=short-lived",
			),
	};
}

function createPrisma(overrides: Record<string, unknown> = {}) {
	return {
		agent: {
			findUnique: jest.fn().mockResolvedValue(null),
		},
		chatSession: {
			findUnique: jest.fn().mockResolvedValue(null),
		},
		chatMessage: {
			findUnique: jest.fn().mockResolvedValue(null),
		},
		uploadedFile: {
			create: jest
				.fn()
				.mockImplementation(({ data }) => Promise.resolve({ id: "file-1", ...data })),
			findUnique: jest.fn(),
			findMany: jest.fn(),
			delete: jest.fn(),
		},
		...overrides,
	};
}

function createFile(params: Partial<Express.Multer.File> = {}): Express.Multer.File {
	const buffer = params.buffer ?? Buffer.from("not-a-real-png");
	return {
		fieldname: "file",
		originalname: params.originalname ?? "payload.png",
		encoding: "7bit",
		mimetype: params.mimetype ?? "image/png",
		size: params.size ?? buffer.length,
		buffer,
		stream: undefined as any,
		destination: "",
		filename: "",
		path: "",
	} as Express.Multer.File;
}

describe("UploadService — validation et isolation des fichiers", () => {
	it("rejette un fichier dont le MIME déclaré ne correspond pas à la signature binaire", async () => {
		const storage = createStorage();
		const service = new UploadService(createPrisma() as any, storage as any);

		await expect(
			service.upload(
				createFile({ mimetype: "image/png", originalname: "payload.png" }),
				"user-1",
				{},
			),
		).rejects.toBeInstanceOf(BadRequestException);

		expect(storage.uploadPrivateObject).not.toHaveBeenCalled();
	});

	it("rejette un upload dépassant 10 Mo avant tout stockage", async () => {
		const storage = createStorage();
		const service = new UploadService(createPrisma() as any, storage as any);
		const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

		await expect(
			service.upload(
				createFile({
					buffer: pngHeader,
					mimetype: "image/png",
					originalname: "large.png",
					size: 10 * 1024 * 1024 + 1,
				}),
				"user-1",
				{},
			),
		).rejects.toBeInstanceOf(BadRequestException);

		expect(storage.uploadPrivateObject).not.toHaveBeenCalled();
	});

	it("empêche d'attacher un fichier à une session appartenant à un autre utilisateur", async () => {
		const storage = createStorage();
		const prisma = createPrisma({
			chatSession: {
				findUnique: jest.fn().mockResolvedValue({ userId: "other-user", agentId: "agent-1" }),
			},
		});
		const service = new UploadService(prisma as any, storage as any);

		await expect(
			service.upload(createFile(), "user-1", { sessionId: "session-1" }),
		).rejects.toBeInstanceOf(ForbiddenException);

		expect(storage.uploadPrivateObject).not.toHaveBeenCalled();
	});

	it("stocke les uploads runtime par chemin privé et retourne une URL signée courte", async () => {
		const storage = createStorage();
		const prisma = createPrisma();
		const service = new UploadService(prisma as any, storage as any);
		const pngBuffer = PNG;

		const record = await service.upload(
			createFile({ buffer: pngBuffer, mimetype: "image/png", originalname: "safe.png" }),
			"user-1",
			{},
		);

		expect(storage.uploadPrivateObject).toHaveBeenCalledWith(
			expect.stringMatching(/^uploads\/user-1\/unattached\/.+\.png$/),
			pngBuffer,
			"image/png",
		);
		expect(prisma.uploadedFile.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					url: expect.not.stringContaining("/object/public/"),
				}),
			}),
		);
		expect(storage.createSignedUrl).toHaveBeenCalledWith(
			expect.stringMatching(/^uploads\/user-1\/unattached\/.+\.png$/),
		);
		expect(record.url).toContain("/object/sign/");
	});

	const PNG = Buffer.from(
		"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
		"base64",
	);
	const PDF = Buffer.from("%PDF-1.4\n1 0 obj\n<< >>\nendobj\n%%EOF\n");

	function prismaWithSessionAgent(capabilities: Record<string, unknown> | null) {
		return createPrisma({
			chatSession: {
				findUnique: jest
					.fn()
					.mockResolvedValue({ userId: "user-1", agentId: "agent-1", agent: { capabilities } }),
			},
		});
	}

	it("supprime l'objet privé si la persistance DB échoue", async () => {
		const storage = createStorage();
		const databaseError = new Error("database unavailable");
		const prisma = createPrisma({
			uploadedFile: {
				create: jest.fn().mockRejectedValue(databaseError),
			},
		});
		const service = new UploadService(prisma as any, storage as any);

		await expect(
			service.upload(
				createFile({ buffer: PNG, mimetype: "image/png", originalname: "safe.png" }),
				"user-1",
				{},
			),
		).rejects.toBe(databaseError);

		const storagePath = storage.uploadPrivateObject.mock.calls[0]?.[0];
		expect(storage.removePrivateObjects).toHaveBeenCalledWith([storagePath]);
	});

	it("refuse les PDF avec actions actives", async () => {
		const storage = createStorage();
		const service = new UploadService(createPrisma() as any, storage as any);
		const activePdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /OpenAction 2 0 R >>\nendobj\n%%EOF\n");

		await expect(
			service.upload(
				createFile({
					buffer: activePdf,
					mimetype: "application/pdf",
					originalname: "active.pdf",
				}),
				"user-1",
				{},
			),
		).rejects.toBeInstanceOf(BadRequestException);
		expect(storage.uploadPrivateObject).not.toHaveBeenCalled();
	});

	it("refuse un fichier tronqué même si son en-tête ressemble à une image", async () => {
		const storage = createStorage();
		const service = new UploadService(createPrisma() as any, storage as any);
		const truncatedPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

		await expect(
			service.upload(
				createFile({
					buffer: truncatedPng,
					mimetype: "image/png",
					originalname: "truncated.png",
				}),
				"user-1",
				{},
			),
		).rejects.toBeInstanceOf(BadRequestException);
		expect(storage.uploadPrivateObject).not.toHaveBeenCalled();
	});

	it("refuse une image si l'agent ne supporte pas les images", async () => {
		const storage = createStorage();
		const service = new UploadService(
			prismaWithSessionAgent({ images: false, files: true }) as any,
			storage as any,
		);

		await expect(
			service.upload(
				createFile({ buffer: PNG, mimetype: "image/png", originalname: "a.png" }),
				"user-1",
				{
					sessionId: "session-1",
				},
			),
		).rejects.toBeInstanceOf(BadRequestException);
		expect(storage.uploadPrivateObject).not.toHaveBeenCalled();
	});

	it("refuse un PDF si l'agent ne supporte pas les fichiers", async () => {
		const storage = createStorage();
		const service = new UploadService(
			prismaWithSessionAgent({ images: true, files: false }) as any,
			storage as any,
		);

		await expect(
			service.upload(
				createFile({ buffer: PDF, mimetype: "application/pdf", originalname: "a.pdf" }),
				"user-1",
				{
					sessionId: "session-1",
				},
			),
		).rejects.toBeInstanceOf(BadRequestException);
		expect(storage.uploadPrivateObject).not.toHaveBeenCalled();
	});

	it("accepte une image si l'agent supporte les images", async () => {
		const storage = createStorage();
		const service = new UploadService(
			prismaWithSessionAgent({ images: true, files: false }) as any,
			storage as any,
		);

		await service.upload(
			createFile({ buffer: PNG, mimetype: "image/png", originalname: "a.png" }),
			"user-1",
			{ sessionId: "session-1" },
		);
		expect(storage.uploadPrivateObject).toHaveBeenCalled();
	});

	it("refuse tout en chat si capabilities est null", async () => {
		const storage = createStorage();
		const service = new UploadService(prismaWithSessionAgent(null) as any, storage as any);

		await expect(
			service.upload(
				createFile({ buffer: PNG, mimetype: "image/png", originalname: "a.png" }),
				"user-1",
				{
					sessionId: "session-1",
				},
			),
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it("ne restreint pas les uploads auteur (agentId seul) par capabilities", async () => {
		const storage = createStorage();
		const service = new UploadService(
			createPrisma({
				agent: { findUnique: jest.fn().mockResolvedValue({ creatorId: "user-1" }) },
			}) as any,
			storage as any,
		);

		await service.upload(
			createFile({ buffer: PNG, mimetype: "image/png", originalname: "a.png" }),
			"user-1",
			{ agentId: "agent-1" },
		);
		expect(storage.uploadPrivateObject).toHaveBeenCalled();
	});
});
