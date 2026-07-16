import { RequestMethod, ValidationPipe } from "@nestjs/common";
import { NestFactory, Reflector } from "@nestjs/core";
import compression from "compression";
import helmet from "helmet";
import { AppModule } from "./app.module.js";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor.js";
import { ResponseTransformInterceptor } from "./common/interceptors/response-transform.interceptor.js";
import { SanitizeInterceptor } from "./common/interceptors/sanitize.interceptor.js";

declare global {
	var PhusionPassenger: unknown;
}

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		rawBody: true,
	});

	// CORS — must be first so OPTIONS preflight is handled before any other middleware
	const isProduction = process.env.NODE_ENV === "production";
	const productionOrigin = process.env.WEB_URL;
	if (isProduction && !productionOrigin) {
		throw new Error("WEB_URL is required in production for CORS");
	}
	app.enableCors({
		origin: isProduction
			? productionOrigin
			: [
					"http://localhost:3000",
					"http://localhost:3001",
					"http://localhost:5173",
					"tauri://localhost",
					"http://localhost:8081",
					productionOrigin ?? "",
				].filter(Boolean),
		credentials: true,
		methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Stripe-Signature"],
	});

	// Compression
	app.use(compression());

	// Security headers
	app.use(
		helmet({
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"],
					baseUri: ["'self'"],
					formAction: ["'self'"],
					frameAncestors: ["'none'"],
					objectSrc: ["'none'"],
					scriptSrc: ["'self'"],
					styleSrc: ["'self'", "'unsafe-inline'"],
					imgSrc: ["'self'", "data:", "https:"],
				},
			},
			crossOriginEmbedderPolicy: false,
			crossOriginResourcePolicy: { policy: "same-site" },
			hsts: isProduction ? undefined : false,
		}),
	);

	app.setGlobalPrefix("v1", { exclude: [{ path: "health", method: RequestMethod.GET }] });
	app.enableShutdownHooks();

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	const reflector = app.get(Reflector);
	app.useGlobalFilters(new AllExceptionsFilter());
	app.useGlobalInterceptors(
		new SanitizeInterceptor(),
		new LoggingInterceptor(),
		new ResponseTransformInterceptor(reflector),
	);

	const port =
		typeof globalThis.PhusionPassenger !== "undefined" ? "passenger" : (process.env.PORT ?? 3001);
	await app.listen(port);
}
bootstrap();
