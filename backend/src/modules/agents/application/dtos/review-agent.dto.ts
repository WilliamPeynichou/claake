import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export type ReviewAgentDecision = "approve" | "reject" | "suspend" | "back_to_draft";

export class ReviewAgentDto {
	@IsIn(["approve", "reject", "suspend", "back_to_draft"])
	decision!: ReviewAgentDecision;

	@IsOptional()
	@IsString()
	@MaxLength(2000)
	reason?: string;
}
