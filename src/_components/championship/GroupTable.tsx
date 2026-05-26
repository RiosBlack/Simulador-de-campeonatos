import Image from "next/image";
import type { StandingRow } from "@/_services/standings.service";

type GroupTableProps = {
  letter: string;
  rows: StandingRow[];
};

export function GroupTable({ letter, rows }: GroupTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="pb-2 pr-2">#</th>
            <th className="pb-2">Seleção</th>
            <th className="pb-2 text-center">PJ</th>
            <th className="pb-2 text-center">Pts</th>
            <th className="pb-2 text-center">SG</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.teamId}
              className="border-b border-border/50 last:border-0"
            >
              <td className="py-2.5 pr-2 font-bold text-accent">
                {row.position}
              </td>
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <Image
                    src={row.logoUrl}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                    unoptimized
                  />
                  <div>
                    <p className="font-medium">{row.teamName}</p>
                    {row.ownerName && (
                      <p className="text-xs text-muted">{row.ownerName}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-2.5 text-center tabular-nums">{row.played}</td>
              <td className="py-2.5 text-center font-bold tabular-nums">
                {row.points}
              </td>
              <td
                className={`py-2.5 text-center tabular-nums ${row.goalDifference >= 0 ? "text-accent" : "text-red-400"}`}
              >
                {row.goalDifference > 0 ? "+" : ""}
                {row.goalDifference}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted">Grupo {letter}</p>
    </div>
  );
}
