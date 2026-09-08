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
  const bg = role === "founder" ? "bg-coral" : "bg-periwinkle-dark";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name ?? "Profil fotoğrafı"}
        className={`shrink-0 rounded-full object-cover ${SIZE_CLASSES[size]}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${bg} ${SIZE_CLASSES[size]}`}
    >
      {initial}
    </div>
  );
}
