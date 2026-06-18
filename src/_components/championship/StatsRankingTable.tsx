import Image from "next/image";
import { StandingsTableScroll } from "@/_components/championship/StandingsTableScroll";
import type { StatsRankingRow } from "@/_services/stats.service";

type StatsRankingTableProps = {
  rows: StatsRankingRow[];
  valueLabel: string;
  emptyMessage?: string;
  showLogo?: boolean;
};

export function StatsRankingTable({
  rows,
  valueLabel,
  emptyMessage = "Nenhum registro ainda.",
  showLogo = false,
}: StatsRankingTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <StandingsTableScroll>
      <table className="w-full table-fixed text-xs sm:text-sm">
        <colgroup>
          <col className="w-[12%]" />
          <col />
          <col className="w-[18%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-border text-left text-[0.65rem] text-muted sm:text-xs">
            <th className="pb-1.5 pr-1 sm:pb-2">#</th>
            <th className="pb-1.5 pr-1 sm:pb-2">
              {showLogo ? "Seleção" : "Jogador"}
            </th>
            <th className="pb-1.5 text-center sm:pb-2">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.rank}-${row.name}`}
              className="border-b border-border/50 last:border-0"
            >
              <td className="py-1.5 pr-1 font-bold text-accent sm:py-2">
                {row.rank}
              </td>
              <td className="min-w-0 py-1.5 pr-1 sm:py-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  {showLogo && row.logoUrl && (
                    <Image
                      src={row.logoUrl}
                      alt=""
                      width={20}
                      height={20}
                      className="h-4 w-4 shrink-0 object-contain sm:h-5 sm:w-5"
                      unoptimized
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium leading-tight">
                      {row.name}
                    </p>
                    {row.subtitle && (
                      <p className="truncate text-xs text-muted leading-tight">
                        {row.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-1.5 text-center font-bold tabular-nums sm:py-2">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </StandingsTableScroll>
  );
}
