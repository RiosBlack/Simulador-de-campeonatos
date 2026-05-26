import Image from "next/image";
import { Card } from "@/_components/ui/Card";
import { Badge } from "@/_components/ui/Badge";
import { stageLabel } from "@/_utils/format";

type MatchCardProps = {
  homeName: string;
  awayName: string;
  homeLogo: string;
  awayLogo: string;
  homeScore?: number | null;
  awayScore?: number | null;
  stage: string;
  played: boolean;
  scheduledAt?: Date | string | null;
};

export function MatchCard({
  homeName,
  awayName,
  homeLogo,
  awayLogo,
  homeScore,
  awayScore,
  stage,
  played,
  scheduledAt,
}: MatchCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Badge variant="muted">{stageLabel(stage)}</Badge>
        {!played && scheduledAt && (
          <span className="text-xs text-muted">
            {new Date(scheduledAt).toLocaleDateString("pt-BR")}
          </span>
        )}
        {played && <Badge variant="live">Final</Badge>}
      </div>
      <div className="flex items-center justify-between gap-4">
        <TeamSide name={homeName} logo={homeLogo} />
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums">
            {played ? `${homeScore ?? 0} - ${awayScore ?? 0}` : "vs"}
          </p>
        </div>
        <TeamSide name={awayName} logo={awayLogo} align="right" />
      </div>
    </Card>
  );
}

function TeamSide({
  name,
  logo,
  align = "left",
}: {
  name: string;
  logo: string;
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
      <span className="max-w-[90px] truncate text-xs font-medium">{name}</span>
    </div>
  );
}
