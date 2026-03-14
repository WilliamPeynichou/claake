import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor.js";
import { ResponseTransformInterceptor } from "./common/interceptors/response-transform.interceptor.js";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: [
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:5173",
			"tauri://localhost",
			"http://localhost:8081",
			process.env.WEB_URL ?? "",
		].filter(Boolean),
		credentials: true,
	});

	app.setGlobalPrefix("v1");

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	app.useGlobalFilters(new AllExceptionsFilter());
	app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseTransformInterceptor());

	const port = process.env.PORT ?? 3001;
	await app.listen(port);
}
bootstrap();
