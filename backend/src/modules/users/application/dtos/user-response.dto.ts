export class UserResponseDto {
	id!: string;
	email!: string;
	full_name!: string | null;
	avatar_url!: string | null;
	bio!: string | null;
	role!: string;
	agents_count!: number;
	created_at!: string;
	updated_at!: string;
}
