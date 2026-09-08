export type UserType = "founder" | "developer" | "both";
export type ActiveRole = "founder" | "developer";

// user_type: hesabın gerçek tipi ("both" = fikir sahibi + yazılımcı ortak arıyor)
// active_role: "both" hesaplar için şu an hangi modda gezindiği (sidebar'daki rol anahtarı)
export function getActiveRole(
  userType: UserType | null | undefined,
  activeRole: ActiveRole | null | undefined
): ActiveRole | null {
  if (userType === "both") return activeRole ?? "founder";
  if (userType === "founder" || userType === "developer") return userType;
  return null;
}

export function canActAsDeveloper(userType: UserType | null | undefined) {
  return userType === "developer" || userType === "both";
}

export function canActAsFounder(userType: UserType | null | undefined) {
  return userType === "founder" || userType === "both";
}
