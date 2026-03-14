export class DashboardStatsDto {
	agents_used!: number;
	conversations!: number;
	agents_published!: number;
	average_rating!: string;
}

export class AdminStatsDto {
	published_agents!: number;
	users!: number;
	pending_review!: number;
	chat_sessions!: number;
}
