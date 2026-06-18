"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Button } from "@/_components/ui/Button";
import { Card } from "@/_components/ui/Card";
import type { SimulatedKnockoutMatch } from "@/_services/knockout-simulation.service";

type Props = {
  matches: SimulatedKnockoutMatch[];
};

export function KnockoutSimulateButton({ matches }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const modal =
    open && mounted ? (
      <div
        className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="knockout-simulate-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/70"
          aria-label="Fechar simulação"
          onClick={close}
        />

        <Card className="relative z-10 flex max-h-[min(90vh,820px)] w-full max-w-2xl flex-col overflow-hidden bg-surface p-0 shadow-2xl">
          <div className="border-b border-border px-4 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="knockout-simulate-title"
                  className="text-lg font-bold"
                >
                  Simulação dos 16-avos
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Baseada na classificação atual dos grupos. Nada é salvo no
                  sistema.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={close}
              >
                Fechar
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto px-4 py-4 sm:px-6">
            <ul className="space-y-3">
              {matches.map((match) => (
                <li key={match.slot}>
                  <Card className="p-3 sm:p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
                      Jogo {match.slot + 1}
                    </p>
                    {match.ownerConflict && (
                      <p className="mb-2 text-xs font-medium text-amber-200/90">
                        Mesmo participante nas duas seleções
                      </p>
                    )}
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
                      <SimulatedSide side={match.home} />
                      <span className="shrink-0 px-1 text-xs font-medium text-muted">
                        vs
                      </span>
                      <span className="w-full flex justify-end">
                        <SimulatedSide side={match.away} />
                      </span>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    ) : null;

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Simular
      </Button>

      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}

function SimulatedSide({
  side,
}: {
  side: SimulatedKnockoutMatch["home"];
}) {
  if (!side) {
    return (
      <div className="min-w-0 rounded-lg bg-surface-elevated/50 px-2 py-2 text-center text-sm text-muted sm:px-3">
        A definir
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg bg-surface-elevated/50 px-2 py-2 sm:px-3">
      {side.logoUrl ? (
        <Image
          src={side.logoUrl}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0 object-contain"
        />
      ) : (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-border text-[10px]">
          ?
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{side.teamName}</p>
        <p className="truncate text-xs text-muted">{side.label}</p>
        {side.ownerName && (
          <p className="truncate text-xs text-muted/80">{side.ownerName}</p>
        )}
      </div>
    </div>
  );
}
