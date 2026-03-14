export class AgentResponseDto {
	id!: string;
	name!: string;
	slug!: string;
	description!: string;
	long_description!: string | null;
	category!: string;
	tags!: string[];
	price!: number;
	price_type!: string;
	image_url!: string | null;
	screenshots!: string[];
	creator_id!: string;
	creator_name!: string | null;
	model!: string;
	mode!: string;
	version!: string;
	status!: string;
	downloads_count!: number;
	average_rating!: number;
	reviews_count!: number;
	sandbox_uses!: number;
	created_at!: string;
	updated_at!: string;
}
