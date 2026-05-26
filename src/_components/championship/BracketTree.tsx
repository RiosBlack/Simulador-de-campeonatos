"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import { Card } from "@/_components/ui/Card";
import { stageLabel } from "@/_utils/format";

export type BracketMatch = {
  id: string;
  stage: string;
  homeName: string;
  awayName: string;
  homeLogo: string;
  awayLogo: string;
  homeScore?: number | null;
  awayScore?: number | null;
  played: boolean;
  homeStandIn?: string | null;
  awayStandIn?: string | null;
};

type BracketTreeProps = {
  matches: BracketMatch[];
};

export function BracketTree({ matches }: BracketTreeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced || !ref.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".bracket-match", {
        opacity: 0,
        y: 20,
        stagger: 0.08,
        duration: 0.5,
        ease: "power2.out",
      });
    }, ref);

    return () => ctx.revert();
  }, [matches]);

  const byStage = matches.reduce(
    (acc, m) => {
      if (!acc[m.stage]) acc[m.stage] = [];
      acc[m.stage]!.push(m);
      return acc;
    },
    {} as Record<string, BracketMatch[]>,
  );

  const stageOrder = ["R32", "R16", "QF", "SF", "FINAL", "THIRD_PLACE"];

  return (
    <div ref={ref} className="flex gap-4 overflow-x-auto pb-4 lg:gap-6">
      {stageOrder.map((stage) => {
        const stageMatches = byStage[stage];
        if (!stageMatches?.length) return null;

        return (
          <div key={stage} className="flex min-w-[200px] flex-col gap-3">
            <h3 className="text-center text-xs font-bold uppercase tracking-wider text-accent">
              {stageLabel(stage)}
            </h3>
            {stageMatches.map((match) => (
              <Card key={match.id} className="bracket-match p-3">
                <MatchRow
                  name={match.homeName}
                  logo={match.homeLogo}
                  score={match.homeScore}
                  played={match.played}
                  standIn={match.homeStandIn}
                />
                <div className="my-1 text-center text-xs text-muted">vs</div>
                <MatchRow
                  name={match.awayName}
                  logo={match.awayLogo}
                  score={match.awayScore}
                  played={match.played}
                  standIn={match.awayStandIn}
                />
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function MatchRow({
  name,
  logo,
  score,
  played,
  standIn,
}: {
  name: string;
  logo: string;
  score?: number | null;
  played: boolean;
  standIn?: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Image src={logo} alt="" width={24} height={24} unoptimized />
        <div>
          <p className="text-sm font-medium">{name}</p>
          {standIn && (
            <p className="text-[10px] text-accent">Stand-in ativo</p>
          )}
        </div>
      </div>
      {played && (
        <span className="text-lg font-bold tabular-nums">{score ?? 0}</span>
      )}
    </div>
  );
}
