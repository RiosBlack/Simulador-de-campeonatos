type CardIconProps = {
  className?: string;
};

export function YellowCardIcon({ className = "" }: CardIconProps) {
  return (
    <span
      className={`inline-block h-3.5 w-2 shrink-0 rounded-sm bg-yellow-400 ${className}`}
      title="Cartões amarelos"
      aria-hidden
    />
  );
}

export function RedCardIcon({ className = "" }: CardIconProps) {
  return (
    <span
      className={`inline-block h-3.5 w-2 shrink-0 rounded-sm bg-red-500 ${className}`}
      title="Cartões vermelhos"
      aria-hidden
    />
  );
}

type CardCountsProps = {
  yellow: number;
  red: number;
  size?: "sm" | "md";
};

export function CardCounts({ yellow, red, size = "sm" }: CardCountsProps) {
  const textClass = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <span className={`flex items-center gap-2 tabular-nums ${textClass}`}>
      <span className="flex items-center gap-1">
        <YellowCardIcon />
        {yellow}
      </span>
      <span className="flex items-center gap-1">
        <RedCardIcon />
        {red}
      </span>
    </span>
  );
}
