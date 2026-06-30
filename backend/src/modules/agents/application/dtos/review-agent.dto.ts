import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewAgentDto {
	@IsIn(["approve", "reject"])
	decision!: "approve" | "reject";

	@IsOptional()
	@IsString()
	@MaxLength(2000)
	reason?: string;
}
