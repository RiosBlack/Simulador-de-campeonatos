import type { ApiFootballTeam } from "@/_lib/api-football";

/**
 * Seleções extras para completar 48 quando a API só retorna a lista da Copa de 2022 (32).
 * IDs oficiais API-Football (seleções nacionais, national=true).
 * Validar via GET /teams?country={Country} antes de adicionar novos itens.
 */
export const WORLD_CUP_2026_SUPPLEMENT_TEAMS: ApiFootballTeam[] = [
  {
    id: 8,
    name: "Colombia",
    code: "COL",
    country: "Colombia",
    logoUrl: "https://media.api-sports.io/football/teams/8.png",
  },
  {
    id: 768,
    name: "Italy",
    code: "ITA",
    country: "Italy",
    logoUrl: "https://media.api-sports.io/football/teams/768.png",
  },
  {
    id: 5,
    name: "Sweden",
    code: "SWE",
    country: "Sweden",
    logoUrl: "https://media.api-sports.io/football/teams/5.png",
  },
  {
    id: 1090,
    name: "Norway",
    code: "NOR",
    country: "Norway",
    logoUrl: "https://media.api-sports.io/football/teams/1090.png",
  },
  {
    id: 775,
    name: "Austria",
    code: "AUT",
    country: "Austria",
    logoUrl: "https://media.api-sports.io/football/teams/775.png",
  },
  {
    id: 772,
    name: "Ukraine",
    code: "UKR",
    country: "Ukraine",
    logoUrl: "https://media.api-sports.io/football/teams/772.png",
  },
  {
    id: 32,
    name: "Egypt",
    code: "EGY",
    country: "Egypt",
    logoUrl: "https://media.api-sports.io/football/teams/32.png",
  },
  {
    id: 19,
    name: "Nigeria",
    code: "NIG",
    country: "Nigeria",
    logoUrl: "https://media.api-sports.io/football/teams/19.png",
  },
  {
    id: 1532,
    name: "Algeria",
    code: "ALG",
    country: "Algeria",
    logoUrl: "https://media.api-sports.io/football/teams/1532.png",
  },
  {
    id: 2383,
    name: "Chile",
    code: "CHI",
    country: "Chile",
    logoUrl: "https://media.api-sports.io/football/teams/2383.png",
  },
  {
    id: 2379,
    name: "Peru",
    code: "PER",
    country: "Peru",
    logoUrl: "https://media.api-sports.io/football/teams/2379.png",
  },
  {
    id: 2339,
    name: "Paraguay",
    code: "PAR",
    country: "Paraguay",
    logoUrl: "https://media.api-sports.io/football/teams/2339.png",
  },
  {
    id: 11,
    name: "Panama",
    code: "PAN",
    country: "Panama",
    logoUrl: "https://media.api-sports.io/football/teams/11.png",
  },
  {
    id: 1533,
    name: "Uzbekistan",
    code: "UZB",
    country: "Uzbekistan",
    logoUrl: "https://media.api-sports.io/football/teams/1533.png",
  },
  {
    id: 1548,
    name: "Jordan",
    code: "JOR",
    country: "Jordan",
    logoUrl: "https://media.api-sports.io/football/teams/1548.png",
  },
  {
    id: 1501,
    name: "Ivory Coast",
    code: "CIV",
    country: "Ivory Coast",
    logoUrl: "https://media.api-sports.io/football/teams/1501.png",
  },
];
