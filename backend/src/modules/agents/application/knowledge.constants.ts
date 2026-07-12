/**
 * Shared limits for persisted agent knowledge and all its ingestion paths.
 * The value is intentionally expressed in JavaScript characters because both
 * class-validator and PostgreSQL text operate on the stored string.
 */
export const MAX_KNOWLEDGE_CONTENT_CHARS = 200_000;
