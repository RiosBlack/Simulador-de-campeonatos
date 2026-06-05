import { MatchCard } from "@/_components/championship/MatchCard";
import { stageLabel } from "@/_utils/format";

export type MatchListItem = {
  id: string;
  stage: string;
  played: boolean;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
  homeScorePen: number | null;
  awayScorePen: number | null;
  roundNumber: number | null;
  groupLetter: string | null;
  scheduledAt: Date | null;
  homePlayerName?: string | null;
  awayPlayerName?: string | null;
};

type TeamInfo = { name: string; logoUrl: string };

type MatchListProps = {
  matches: MatchListItem[];
  teamById: Record<number, TeamInfo>;
};

export function MatchList({ matches, teamById }: MatchListProps) {
  if (matches.length === 0) return null;

  const groupMatches = matches.filter((m) => m.stage === "GROUP");
  const koMatches = matches.filter((m) => m.stage !== "GROUP");

  const groupLetters = [
    ...new Set(groupMatches.map((m) => m.groupLetter).filter(Boolean)),
  ] as string[];

  return (
    <div className="space-y-8">
      {groupLetters.map((letter) => (
        <MatchSection
          key={`group-${letter}`}
          title={`Grupo ${letter}`}
          matches={groupMatches.filter((m) => m.groupLetter === letter)}
          teamById={teamById}
        />
      ))}
      {groupMatches.some((m) => !m.groupLetter) && (
        <MatchSection
          title="Fase de grupos"
          matches={groupMatches.filter((m) => !m.groupLetter)}
          teamById={teamById}
        />
      )}
      {koMatches.length > 0 && (
        <KnockoutSections matches={koMatches} teamById={teamById} />
      )}
    </div>
  );
}

function KnockoutSections({
  matches,
  teamById,
}: {
  matches: MatchListItem[];
  teamById: Record<number, TeamInfo>;
}) {
  const stages = [...new Set(matches.map((m) => m.stage))];

  return (
    <>
      {stages.map((stage) => (
        <MatchSection
          key={stage}
          title={stageLabel(stage)}
          matches={matches.filter((m) => m.stage === stage)}
          teamById={teamById}
        />
      ))}
    </>
  );
}

function MatchSection({
  title,
  matches,
  teamById,
}: {
  title: string;
  matches: MatchListItem[];
  teamById: Record<number, TeamInfo>;
}) {
  if (matches.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <div className="space-y-3">
        {matches.map((match) => {
          const home = teamById[match.homeTeamId];
          const away = teamById[match.awayTeamId];
          if (!home || !away) return null;

          return (
            <MatchCard
              key={match.id}
              homeName={home.name}
              awayName={away.name}
              homePlayerName={match.homePlayerName}
              awayPlayerName={match.awayPlayerName}
              homeLogo={home.logoUrl}
              awayLogo={away.logoUrl}
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              homeScorePen={match.homeScorePen}
              awayScorePen={match.awayScorePen}
              stage={match.stage}
              played={match.played}
              roundNumber={match.roundNumber}
              scheduledAt={match.scheduledAt}
            />
          );
        })}
      </div>
    </div>
  );
}
