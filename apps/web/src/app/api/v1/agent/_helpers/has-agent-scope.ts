export type AgentScope =
  | "feedbacks:read"
  | "feedbacks:update_status"
  | "feedbacks:create";

export function hasAgentScope(
  tokenScopes: string[],
  required: AgentScope,
): boolean {
  return tokenScopes.includes(required);
}
