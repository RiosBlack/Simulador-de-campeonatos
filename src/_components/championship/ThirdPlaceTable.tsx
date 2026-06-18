import Image from "next/image";
import {
  RedCardIcon,
  YellowCardIcon,
} from "@/_components/championship/CardCountDisplay";
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
    <div className="min-w-0">
      <p className="mb-1 text-sm font-semibold">Melhores 3º colocados</p>
      <p className="mb-3 text-xs text-muted">
        {qualifyingCount > 0
          ? `Os ${qualifyingCount} primeiros da lista avançam ao mata-mata`
          : "Nenhum 3º colocado avança neste formato"}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-md text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="pb-2 pr-2">#</th>
              <th className="pb-2 pr-2">Grupo</th>
              <th className="pb-2 pr-2">Seleção</th>
              <th className="pb-2 text-center">PJ</th>
              <th className="pb-2 text-center">Pts</th>
              <th className="pb-2 text-center">SG</th>
              <th className="pb-2 text-center">
                <span className="inline-flex justify-center">
                  <YellowCardIcon />
                </span>
              </th>
              <th className="pb-2 text-center">
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
                    className={`py-2 pr-2 font-bold tabular-nums ${qualified ? "text-emerald-400" : "text-muted"}`}
                  >
                    {row.rankAmongThirds}
                  </td>
                  <td className="py-2 pr-2 font-medium tabular-nums">
                    {row.groupLetter}
                  </td>
                  <td className="min-w-0 py-2 pr-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Image
                        src={row.logoUrl}
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5 shrink-0 object-contain"
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
                  <td className="py-2 text-center tabular-nums">{row.played}</td>
                  <td className="py-2 text-center font-bold tabular-nums">
                    {row.points}
                  </td>
                  <td
                    className={`py-2 text-center tabular-nums ${row.goalDifference >= 0 ? "text-accent" : "text-red-400"}`}
                  >
                    {row.goalDifference > 0 ? "+" : ""}
                    {row.goalDifference}
                  </td>
                  <td className="py-2 text-center tabular-nums">
                    {row.yellowCards}
                  </td>
                  <td className="py-2 text-center tabular-nums">
                    {row.redCards}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
