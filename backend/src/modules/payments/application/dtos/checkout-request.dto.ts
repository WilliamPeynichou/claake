import { IsString } from "class-validator";

export class CheckoutRequestDto {
	@IsString()
	agent_id!: string;
}
