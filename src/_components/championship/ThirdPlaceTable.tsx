import Image from "next/image";
import {
  RedCardIcon,
  YellowCardIcon,
} from "@/_components/championship/CardCountDisplay";
import { StandingsTableScroll } from "@/_components/championship/StandingsTableScroll";
import type { RankedThirdPlace } from "@/_services/standings.service";

type ThirdPlaceTableProps = {
  rows: RankedThirdPlace[];
  qualifyingCount: number;
};

export function ThirdPlaceTable({
  rows,
  qualifyingCount,
}: ThirdPlaceTableProps) {
  if (rows.length === 0) return null;

  return (
    <div className="min-w-0 max-w-full">
      <p className="mb-1 text-sm font-semibold">Melhores 3º colocados</p>
      <p className="mb-3 text-xs text-muted">
        {qualifyingCount > 0
          ? `Os ${qualifyingCount} primeiros da lista avançam ao mata-mata`
          : "Nenhum 3º colocado avança neste formato"}
      </p>
      <StandingsTableScroll minWidth="min-w-[22rem] sm:min-w-full">
        <table className="w-full table-fixed text-xs sm:text-sm">
          <colgroup>
            <col className="w-[6%]" />
            <col className="w-[8%]" />
            <col className="w-[30%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border text-left text-[0.65rem] text-muted sm:text-xs">
              <th className="pb-1.5 pr-0.5 sm:pb-2 sm:pr-1">#</th>
              <th className="pb-1.5 pr-0.5 sm:pb-2 sm:pr-1">Grp</th>
              <th className="pb-1.5 pr-0.5 sm:pb-2 sm:pr-1">Seleção</th>
              <th className="pb-1.5 text-center sm:pb-2">PJ</th>
              <th className="pb-1.5 text-center sm:pb-2">Pts</th>
              <th className="pb-1.5 text-center sm:pb-2">SG</th>
              <th className="pb-1.5 text-center sm:pb-2">
                <span className="inline-flex justify-center">
                  <YellowCardIcon />
                </span>
              </th>
              <th className="pb-1.5 text-center sm:pb-2">
                <span className="inline-flex justify-center">
                  <RedCardIcon />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const qualified = row.rankAmongThirds <= qualifyingCount;
              return (
                <tr
                  key={row.teamId}
                  className={
                    qualified
                      ? "border-b border-emerald-500/25 bg-emerald-500/12 last:border-0"
                      : "border-b border-border/50 last:border-0"
                  }
                >
                  <td
                    className={`py-1.5 pr-0.5 font-bold tabular-nums sm:py-2 sm:pr-1 ${qualified ? "text-emerald-400" : "text-muted"}`}
                  >
                    {row.rankAmongThirds}
                  </td>
                  <td className="py-1.5 pr-0.5 font-medium tabular-nums sm:py-2 sm:pr-1">
                    {row.groupLetter}
                  </td>
                  <td className="min-w-0 py-1.5 pr-0.5 sm:py-2 sm:pr-1">
                    <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
                      <Image
                        src={row.logoUrl}
                        alt=""
                        width={20}
                        height={20}
                        className="h-4 w-4 shrink-0 object-contain sm:h-5 sm:w-5"
                        unoptimized
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium leading-tight">
                          {row.teamName}
                        </p>
                        {row.ownerName && (
                          <p className="truncate text-xs text-muted leading-tight">
                            {row.ownerName}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-1.5 text-center tabular-nums sm:py-2">
                    {row.played}
                  </td>
                  <td className="py-1.5 text-center font-bold tabular-nums sm:py-2">
                    {row.points}
                  </td>
                  <td
                    className={`py-1.5 text-center tabular-nums sm:py-2 ${row.goalDifference >= 0 ? "text-accent" : "text-red-400"}`}
                  >
                    {row.goalDifference > 0 ? "+" : ""}
                    {row.goalDifference}
                  </td>
                  <td className="py-1.5 text-center tabular-nums sm:py-2">
                    {row.yellowCards}
                  </td>
                  <td className="py-1.5 text-center tabular-nums sm:py-2">
                    {row.redCards}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </StandingsTableScroll>
    </div>
  );
}
