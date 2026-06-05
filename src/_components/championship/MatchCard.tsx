import Image from "next/image";
import { Card } from "@/_components/ui/Card";
import { Badge } from "@/_components/ui/Badge";
import { CardCounts } from "@/_components/championship/CardCountDisplay";
import { stageLabel } from "@/_utils/format";

type MatchCardProps = {
  homeName: string;
  awayName: string;
  homePlayerName?: string | null;
  awayPlayerName?: string | null;
  homeLogo: string;
  awayLogo: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeScorePen?: number | null;
  awayScorePen?: number | null;
  homeYellowCards?: number;
  homeRedCards?: number;
  awayYellowCards?: number;
  awayRedCards?: number;
  stage: string;
  played: boolean;
  roundNumber?: number | null;
  scheduledAt?: Date | string | null;
};

export function MatchCard({
  homeName,
  awayName,
  homePlayerName,
  awayPlayerName,
  homeLogo,
  awayLogo,
  homeScore,
  awayScore,
  homeScorePen,
  awayScorePen,
  homeYellowCards,
  homeRedCards,
  awayYellowCards,
  awayRedCards,
  stage,
  played,
  roundNumber,
  scheduledAt,
}: MatchCardProps) {
  const hasPenalties =
    played &&
    homeScorePen != null &&
    awayScorePen != null &&
    homeScore === awayScore;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {roundNumber != null && (
            <Badge variant="muted">R{roundNumber}</Badge>
          )}
          <Badge variant="muted">{stageLabel(stage)}</Badge>
        </div>
        {!played && (
          <div className="flex items-center gap-2">
            {scheduledAt && (
              <span className="text-xs text-muted">
                {new Date(scheduledAt).toLocaleDateString("pt-BR")}
              </span>
            )}
            <Badge variant="live">Em breve</Badge>
          </div>
        )}
        {played && <Badge variant="live">Final</Badge>}
      </div>
      <div className="flex items-center justify-between gap-4">
        <TeamSide
          name={homeName}
          playerName={homePlayerName}
          logo={homeLogo}
          yellowCards={played ? homeYellowCards : undefined}
          redCards={played ? homeRedCards : undefined}
        />
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums">
            {played ? `${homeScore ?? 0} - ${awayScore ?? 0}` : "vs"}
          </p>
          {hasPenalties && (
            <p className="text-xs text-muted">
              pên. {homeScorePen} - {awayScorePen}
            </p>
          )}
        </div>
        <TeamSide
          name={awayName}
          playerName={awayPlayerName}
          logo={awayLogo}
          align="right"
          yellowCards={played ? awayYellowCards : undefined}
          redCards={played ? awayRedCards : undefined}
        />
      </div>
    </Card>
  );
}

function TeamSide({
  name,
  playerName,
  logo,
  yellowCards,
  redCards,
  align = "left",
}: {
  name: string;
  playerName?: string | null;
  logo: string;
  yellowCards?: number;
  redCards?: number;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-2 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <Image
        src={logo}
        alt={name}
        width={40}
        height={40}
        className="h-10 w-10 object-contain"
        unoptimized
      />
      <div className="flex max-w-[100px] flex-col items-center gap-0.5">
        <span className="w-full truncate text-xs font-medium">{name}</span>
        {playerName && (
          <span className="w-full truncate text-[10px] text-muted">
            {playerName}
          </span>
        )}
        {yellowCards != null && redCards != null && (
          <CardCounts yellow={yellowCards} red={redCards} />
        )}
      </div>
    </div>
  );
}
