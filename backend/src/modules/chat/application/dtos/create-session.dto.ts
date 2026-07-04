import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateSessionDto {
	@IsString()
	agent_id!: string;

	@IsOptional()
	@IsBoolean()
	test_mode?: boolean;
}
