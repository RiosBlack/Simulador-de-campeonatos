import { cn } from "@/_utils/cn";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
};

export function Card({ children, className, glow }: CardProps) {
  return (
    <div
      className={cn(
        "gradient-card rounded-2xl p-4 md:p-6",
        glow && "glow-ring",
        className,
      )}
    >
      {children}
    </div>
  );
}
