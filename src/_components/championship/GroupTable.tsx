import Image from "next/image";
import {
  RedCardIcon,
  YellowCardIcon,
} from "@/_components/championship/CardCountDisplay";
import type { StandingRow } from "@/_services/standings.service";

type GroupTableProps = {
  letter: string;
  rows: StandingRow[];
  qualifiedTeamIds: Set<number>;
};

export function GroupTable({ letter, rows, qualifiedTeamIds }: GroupTableProps) {
  return (
    <div className="min-w-0">
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-7" />
          <col />
          <col className="w-7" />
          <col className="w-8" />
          <col className="w-8" />
          <col className="w-7" />
          <col className="w-7" />
        </colgroup>
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="pb-2 pr-1">#</th>
            <th className="pb-2 pr-1">Seleção</th>
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
            const qualified = qualifiedTeamIds.has(row.teamId);
            return (
            <tr
              key={row.teamId}
              className={
                qualified
                  ? "border-b border-accent/25 bg-accent/12 last:border-0"
                  : "border-b border-border/50 last:border-0"
              }
            >
              <td
                className={`py-2 pr-1 font-bold ${qualified ? "text-accent-dim" : "text-accent"}`}
              >
                {row.position}
              </td>
              <td className="min-w-0 py-2 pr-1">
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
      <p className="mt-2 text-xs text-muted">Grupo {letter}</p>
    </div>
  );
}
