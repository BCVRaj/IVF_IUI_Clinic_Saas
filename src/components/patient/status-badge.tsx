import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  label: string;
  tone?: "success" | "warning" | "neutral" | "danger";
  className?: string;
};

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        tone === "success" && "bg-emerald-100 text-emerald-800",
        tone === "warning" && "bg-amber-100 text-amber-700",
        tone === "neutral" && "bg-slate-200 text-slate-600",
        tone === "danger" && "bg-rose-100 text-rose-700",
        className
      )}
    >
      {label}
    </span>
  );
}
