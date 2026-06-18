import type { ApiFootballTeam } from "@/_lib/api-football";
import { localTeamLogoUrl } from "@/_utils/team-logo";

const logo = localTeamLogoUrl;

/**
 * 48 seleções da Copa do Mundo 2026 (12 grupos × 4), conforme sorteio oficial.
 * IDs validados na API-Football (national=true). Fonte canônica do sync.
 */
export const WORLD_CUP_2026_TEAMS: ApiFootballTeam[] = [
  // Grupo A
  { id: 16, name: "Mexico", code: "MEX", country: "Mexico", logoUrl: logo(16) },
  {
    id: 1531,
    name: "South Africa",
    code: "SOU",
    country: "South-Africa",
    logoUrl: logo(1531),
  },
  {
    id: 17,
    name: "South Korea",
    code: "KOR",
    country: "South-Korea",
    logoUrl: logo(17),
  },
  {
    id: 770,
    name: "Czech Republic",
    code: "CZE",
    country: "Czech-Republic",
    logoUrl: logo(770),
  },
  // Grupo B
  { id: 5529, name: "Canada", code: "CAN", country: "Canada", logoUrl: logo(5529) },
  {
    id: 1113,
    name: "Bosnia & Herzegovina",
    code: "BOS",
    country: "Bosnia",
    logoUrl: logo(1113),
  },
  { id: 1569, name: "Qatar", code: "QAT", country: "Qatar", logoUrl: logo(1569) },
  {
    id: 15,
    name: "Switzerland",
    code: "SUI",
    country: "Switzerland",
    logoUrl: logo(15),
  },
  // Grupo C
  { id: 6, name: "Brazil", code: "BRA", country: "Brazil", logoUrl: logo(6) },
  { id: 31, name: "Morocco", code: "MAR", country: "Morocco", logoUrl: logo(31) },
  { id: 2386, name: "Haiti", code: "HAI", country: "Haiti", logoUrl: logo(2386) },
  {
    id: 1108,
    name: "Scotland",
    code: "SCO",
    country: "Scotland",
    logoUrl: logo(1108),
  },
  // Grupo D
  {
    id: 2384,
    name: "USA",
    code: "USA",
    country: "USA",
    logoUrl: logo(2384),
  },
  {
    id: 2339,
    name: "Paraguay",
    code: "PAR",
    country: "Paraguay",
    logoUrl: logo(2339),
  },
  {
    id: 20,
    name: "Australia",
    code: "AUS",
    country: "Australia",
    logoUrl: logo(20),
  },
  {
    id: 777,
    name: "Turkey",
    code: "TUR",
    country: "Turkey",
    logoUrl: logo(777),
  },
  // Grupo E
  { id: 25, name: "Germany", code: "GER", country: "Germany", logoUrl: logo(25) },
  {
    id: 5530,
    name: "Curaçao",
    code: "CUW",
    country: "Curacao",
    logoUrl: logo(5530),
  },
  {
    id: 1501,
    name: "Ivory Coast",
    code: "CIV",
    country: "Ivory-Coast",
    logoUrl: logo(1501),
  },
  {
    id: 2382,
    name: "Ecuador",
    code: "ECU",
    country: "Ecuador",
    logoUrl: logo(2382),
  },
  // Grupo F
  {
    id: 1118,
    name: "Netherlands",
    code: "NED",
    country: "Netherlands",
    logoUrl: logo(1118),
  },
  { id: 12, name: "Japan", code: "JPN", country: "Japan", logoUrl: logo(12) },
  { id: 5, name: "Sweden", code: "SWE", country: "Sweden", logoUrl: logo(5) },
  { id: 28, name: "Tunisia", code: "TUN", country: "Tunisia", logoUrl: logo(28) },
  // Grupo G
  { id: 1, name: "Belgium", code: "BEL", country: "Belgium", logoUrl: logo(1) },
  { id: 32, name: "Egypt", code: "EGY", country: "Egypt", logoUrl: logo(32) },
  { id: 22, name: "Iran", code: "IRN", country: "Iran", logoUrl: logo(22) },
  {
    id: 4673,
    name: "New Zealand",
    code: "NZL",
    country: "New-Zealand",
    logoUrl: logo(4673),
  },
  // Grupo H
  { id: 9, name: "Spain", code: "ESP", country: "Spain", logoUrl: logo(9) },
  {
    id: 1533,
    name: "Cape Verde Islands",
    code: "CPV",
    country: "Cape-Verde-Islands",
    logoUrl: logo(1533),
  },
  {
    id: 23,
    name: "Saudi Arabia",
    code: "KSA",
    country: "Saudi-Arabia",
    logoUrl: logo(23),
  },
  { id: 7, name: "Uruguay", code: "URU", country: "Uruguay", logoUrl: logo(7) },
  // Grupo I
  { id: 2, name: "France", code: "FRA", country: "France", logoUrl: logo(2) },
  { id: 13, name: "Senegal", code: "SEN", country: "Senegal", logoUrl: logo(13) },
  { id: 1567, name: "Iraq", code: "IRQ", country: "Iraq", logoUrl: logo(1567) },
  { id: 1090, name: "Norway", code: "NOR", country: "Norway", logoUrl: logo(1090) },
  // Grupo J
  {
    id: 26,
    name: "Argentina",
    code: "ARG",
    country: "Argentina",
    logoUrl: logo(26),
  },
  { id: 1532, name: "Algeria", code: "ALG", country: "Algeria", logoUrl: logo(1532) },
  { id: 775, name: "Austria", code: "AUT", country: "Austria", logoUrl: logo(775) },
  { id: 1548, name: "Jordan", code: "JOR", country: "Jordan", logoUrl: logo(1548) },
  // Grupo K
  { id: 27, name: "Portugal", code: "POR", country: "Portugal", logoUrl: logo(27) },
  {
    id: 1508,
    name: "Congo DR",
    code: "COD",
    country: "Congo-DR",
    logoUrl: logo(1508),
  },
  {
    id: 1568,
    name: "Uzbekistan",
    code: "UZB",
    country: "Uzbekistan",
    logoUrl: logo(1568),
  },
  {
    id: 8,
    name: "Colombia",
    code: "COL",
    country: "Colombia",
    logoUrl: logo(8),
  },
  // Grupo L
  { id: 10, name: "England", code: "ENG", country: "England", logoUrl: logo(10) },
  { id: 3, name: "Croatia", code: "CRO", country: "Croatia", logoUrl: logo(3) },
  { id: 1504, name: "Ghana", code: "GHA", country: "Ghana", logoUrl: logo(1504) },
  { id: 11, name: "Panama", code: "PAN", country: "Panama", logoUrl: logo(11) },
];

export const WORLD_CUP_2026_TEAM_IDS = new Set(
  WORLD_CUP_2026_TEAMS.map((t) => t.id),
);
