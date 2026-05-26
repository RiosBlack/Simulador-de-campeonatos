import { cn } from "@/_utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "primary" &&
          "gradient-accent text-background hover:opacity-90 shadow-[0_0_20px_rgba(163,255,94,0.3)]",
        variant === "secondary" &&
          "bg-surface-elevated text-foreground border border-border hover:border-accent/40",
        variant === "ghost" && "text-muted hover:text-accent hover:bg-surface",
        variant === "danger" && "bg-red-900/40 text-red-300 border border-red-800/50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
