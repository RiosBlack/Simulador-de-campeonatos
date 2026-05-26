"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import { Card } from "@/_components/ui/Card";
import { stageLabel } from "@/_utils/format";

export type BracketMatch = {
  id: string;
  bracketSlot?: number | null;
  stage: string;
  homeName: string;
  awayName: string;
  homeLogo: string;
  awayLogo: string;
  homeScore?: number | null;
  awayScore?: number | null;
  played: boolean;
  homeParticipant?: string | null;
  homeParticipantIsStandIn?: boolean;
  awayParticipant?: string | null;
  awayParticipantIsStandIn?: boolean;
  conflictPending?: boolean;
  // Placeholders (jogos futuros) não têm times definidos ainda
  isPlaceholder?: boolean;
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
            {stageMatches
              .slice()
              .sort((a, b) => (a.bracketSlot ?? 0) - (b.bracketSlot ?? 0))
              .map((match) => (
              <Card key={match.id} className="bracket-match p-3">
                {match.conflictPending && (
                  <p className="mb-2 text-center text-xs font-medium text-amber-200/90">
                    Aguardando escolha do participante
                  </p>
                )}
                <MatchRow
                  name={match.homeName}
                  logo={match.homeLogo}
                  participant={match.homeParticipant}
                  participantIsStandIn={match.homeParticipantIsStandIn}
                  conflictPending={match.conflictPending}
                  score={match.homeScore}
                  played={match.played}
                />
                <div className="my-1 text-center text-xs text-muted">vs</div>
                <MatchRow
                  name={match.awayName}
                  logo={match.awayLogo}
                  participant={match.awayParticipant}
                  participantIsStandIn={match.awayParticipantIsStandIn}
                  conflictPending={match.conflictPending}
                  score={match.awayScore}
                  played={match.played}
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
  participant,
  participantIsStandIn,
  conflictPending,
  score,
  played,
}: {
  name: string;
  logo: string;
  participant?: string | null;
  participantIsStandIn?: boolean;
  conflictPending?: boolean;
  score?: number | null;
  played: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {logo ? (
          <Image src={logo} alt="" width={24} height={24} unoptimized />
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-border text-[10px] text-muted">
            ?
          </span>
        )}
        <div>
          <p className="text-sm font-medium">{name}</p>
          {conflictPending ? (
            <p className="text-xs text-amber-200/80">Aguardando escolha</p>
          ) : (
            participant && (
              <p
                className={`text-xs ${participantIsStandIn ? "text-accent" : "text-muted"}`}
              >
                {participantIsStandIn
                  ? `Stand-in: ${participant}`
                  : participant}
              </p>
            )
          )}
        </div>
      </div>
      {played && (
        <span className="text-lg font-bold tabular-nums">{score ?? 0}</span>
      )}
    </div>
  );
}
