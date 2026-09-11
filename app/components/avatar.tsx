const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
};

export default function Avatar({
  name,
  role,
  size = "md",
  avatarUrl,
}: {
  name: string | null;
  role: "founder" | "developer";
  size?: "sm" | "md" | "lg";
  avatarUrl?: string | null;
}) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name ?? "Profil fotoğrafı"}
        data-role={role}
        className={`shrink-0 rounded-full object-cover ${SIZE_CLASSES[size]}`}
      />
    );
  }

  return (
    <div
      data-role={role}
      className={`flex shrink-0 items-center justify-center rounded-full bg-coral font-bold text-white ${SIZE_CLASSES[size]}`}
    >
      {initial}
    </div>
  );
}
