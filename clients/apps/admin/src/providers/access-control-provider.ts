export type AdminPermission =
  | "users.read"
  | "users.suspend"
  | "rooms.read"
  | "rooms.close"
  | "moderation.read"
  | "moderation.decide"
  | "audit.read"
  | "feature_flags.update";

export function can(
  granted: ReadonlySet<AdminPermission>,
  permission: AdminPermission,
): boolean {
  return granted.has(permission);
}
