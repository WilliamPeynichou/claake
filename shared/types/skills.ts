export interface SkillResource {
	id: string;
	path: string;
	content: string;
	created_at: string;
}

export interface AgentSkill {
	id: string;
	agent_id: string;
	name: string;
	description: string | null;
	created_at: string;
	updated_at: string;
	resources: SkillResource[];
}
