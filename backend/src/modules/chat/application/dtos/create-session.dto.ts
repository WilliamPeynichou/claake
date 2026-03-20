import { IsString } from "class-validator";

export class CreateSessionDto {
	@IsString()
	agent_id!: string;
}
