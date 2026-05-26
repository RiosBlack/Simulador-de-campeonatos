import { cn } from "@/_utils/cn";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "live" | "muted";
  className?: string;
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "live" &&
          "bg-accent/20 text-accent ring-1 ring-accent/40 animate-pulse",
        variant === "default" && "bg-surface-elevated text-accent",
        variant === "muted" && "bg-border/50 text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
