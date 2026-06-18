type StandingsTableScrollProps = {
  children: React.ReactNode;
  minWidth?: string;
};

export function StandingsTableScroll({
  children,
  minWidth = "min-w-full",
}: StandingsTableScrollProps) {
  return (
    <div className="w-full max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
      <div className={minWidth}>{children}</div>
    </div>
  );
}
