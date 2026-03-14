export class AgentResponseDto {
	id!: string;
	name!: string;
	slug!: string;
	description!: string;
	long_description!: string | null;
	category!: string;
	tags!: string[];
	models!: string[];
	mode!: string;
	config_url!: string | null;
	image_url!: string | null;
	screenshots!: string[];
	pricing_model!: string;
	price!: number;
	credit_cost!: number;
	status!: string;
	permissions!: Record<string, unknown> | null;
	download_count!: number;
	rating!: number;
	review_count!: number;
	creator_id!: string;
	creator_name!: string | null;
	created_at!: string;
	updated_at!: string;
}
