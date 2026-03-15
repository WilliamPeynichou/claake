import type { AdminPermissions } from "../../domain/entities/user.entity.js";

export class UserResponseDto {
	id!: string;
	email!: string;
	display_name!: string | null;
	avatar_url!: string | null;
	bio!: string | null;
	role!: string;
	admin_permissions!: AdminPermissions | null;
	has_stripe_account!: boolean;
	agents_count!: number;
	created_at!: string;
	updated_at!: string;
}
