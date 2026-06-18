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
          <div key={stage} className="flex min-w-[350px] flex-col gap-3">
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
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <MatchSide
                      name={match.homeName}
                      logo={match.homeLogo}
                      participant={match.homeParticipant}
                      participantIsStandIn={match.homeParticipantIsStandIn}
                      conflictPending={match.conflictPending}
                    />
                    <div className="shrink-0 px-1 text-center">
                      {match.played ? (
                        <span className="text-sm font-bold tabular-nums">
                          {match.homeScore ?? 0} - {match.awayScore ?? 0}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">vs</span>
                      )}
                    </div>
                    <MatchSide
                      name={match.awayName}
                      logo={match.awayLogo}
                      participant={match.awayParticipant}
                      participantIsStandIn={match.awayParticipantIsStandIn}
                      conflictPending={match.conflictPending}
                      align="right"
                    />
                  </div>
                </Card>
              ))}
          </div>
        );
      })}
    </div>
  );
}

function MatchSide({
  name,
  logo,
  participant,
  participantIsStandIn,
  conflictPending,
  align = "left",
}: {
  name: string;
  logo: string;
  participant?: string | null;
  participantIsStandIn?: boolean;
  conflictPending?: boolean;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${align === "right" ? "flex-row-reverse text-right" : ""}`}
    >
      {logo ? (
        <Image
          src={logo}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0 object-contain"
          unoptimized
        />
      ) : (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-border text-[10px] text-muted">
          ?
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        {conflictPending ? (
          <p className="text-xs text-amber-200/80">Aguardando escolha</p>
        ) : (
          participant && (
            <p
              className={`truncate text-xs ${participantIsStandIn ? "text-accent" : "text-muted"}`}
            >
              {participantIsStandIn
                ? `Stand-in: ${participant}`
                : participant}
            </p>
          )
        )}
      </div>
    </div>
  );
}
