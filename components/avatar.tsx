const SHADES = ["#2F5D50", "#5A6B8C", "#8C5A6B", "#6B8C5A", "#8C7A5A", "#5A7C8C"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function shadeFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return SHADES[hash % SHADES.length];
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-medium shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: shadeFor(name || "?") }}
    >
      {initials(name || "?")}
    </span>
  );
}
