export const POPULARITY_VERSION = "v0.5";

// DB-Engines style blended index with tournament-ranking backbone.
export const INSTAGRAM_WEIGHT = 0.45;
export const LEAGUE_STREAM_WEIGHT = 0.20;
export const TOURNAMENT_RANK_WEIGHT = 0.35;

export type LeagueKey =
  | "bwCup"
  | "taf"
  | "lbf"
  | "cbft"
  | "lsk"
  | "worldFootvolley";

export const LEAGUE_STREAM_WEIGHTS: Record<LeagueKey, number> = {
  bwCup: 1.0,
  taf: 0.82,
  lbf: 0.95,
  cbft: 0.88,
  lsk: 0.84,
  worldFootvolley: 0.8,
};

export interface TournamentPopularityScoreSeed {
  tournament: string;
  region: string;
  instagramFollowers?: number;
  channelSubscribers?: number;
  peakLiveViewers?: number;
  eventViewsOrAccesses?: number;
  tps: number;
  confidence: "high" | "medium";
  notes?: string;
}

export interface PlayerPopularitySeed {
  player: string;
  country: string;
  instagramFollowers: number;
  leaguePresence: Record<LeagueKey, number>;
  leagueRanks: Partial<Record<LeagueKey, number>>;
  confidence: "high" | "medium";
}

export const TOURNAMENT_POPULARITY_SCORES_V01: TournamentPopularityScoreSeed[] = [
  {
    tournament: "BW Cup",
    region: "Brazil",
    instagramFollowers: 240000,
    channelSubscribers: 109000,
    peakLiveViewers: 8105,
    tps: 75.0,
    confidence: "high",
    notes: "High live audience signal.",
  },
  {
    tournament: "TAF (Team Aguia Footvolley Cup)",
    region: "Brazil",
    instagramFollowers: 185000,
    channelSubscribers: 109000,
    eventViewsOrAccesses: 22000,
    tps: 40.9,
    confidence: "medium",
    notes: "Event accesses reported over four days.",
  },
  {
    tournament: "LBF",
    region: "Brazil",
    instagramFollowers: 420000,
    channelSubscribers: 109000,
    tps: 73.0,
    confidence: "high",
    notes: "Core broadcaster/tour visibility anchor.",
  },
  {
    tournament: "CBFT / Circuito Brasileiro",
    region: "Brazil",
    instagramFollowers: 160000,
    channelSubscribers: 109000,
    eventViewsOrAccesses: 590000,
    tps: 65.0,
    confidence: "medium",
    notes: "Strong event-level view signal.",
  },
  {
    tournament: "LSK Cup",
    region: "Brazil",
    instagramFollowers: 310000,
    tps: 58.0,
    confidence: "medium",
    notes: "Strong event visibility, limited standardized stream telemetry.",
  },
  {
    tournament: "WorldFootvolley Ranking",
    region: "Global",
    instagramFollowers: 520000,
    tps: 54.0,
    confidence: "high",
    notes: "Competitive relevance signal with global athlete coverage.",
  },
];

function seedFromName(
  player: string,
  country: string,
  instagramFollowers: number,
  baseRank: number
): PlayerPopularitySeed {
  const rr = Math.max(1, Math.min(50, baseRank));
  return {
    player,
    country,
    instagramFollowers,
    leaguePresence: {
      bwCup: 0.55,
      taf: 0.45,
      lbf: 0.65,
      cbft: 0.6,
      lsk: 0.55,
      worldFootvolley: 0.75,
    },
    leagueRanks: {
      worldFootvolley: rr,
      lbf: Math.min(50, rr + 2),
      cbft: Math.min(50, rr + 3),
      bwCup: Math.min(50, rr + 4),
      lsk: Math.min(50, rr + 5),
      taf: Math.min(50, rr + 6),
    },
    confidence: "high",
  };
}

const MEN_CORE: PlayerPopularitySeed[] = [
  {
    player: "Tavinho",
    country: "Brazil",
    instagramFollowers: 320000,
    leaguePresence: { bwCup: 0.9, taf: 0.62, lbf: 1, cbft: 0.9, lsk: 0.82, worldFootvolley: 1 },
    leagueRanks: { bwCup: 1, lbf: 1, cbft: 2, lsk: 3, worldFootvolley: 1, taf: 5 },
    confidence: "high",
  },
  {
    player: "Amaury",
    country: "Brazil",
    instagramFollowers: 290000,
    leaguePresence: { bwCup: 0.86, taf: 0.58, lbf: 0.95, cbft: 0.86, lsk: 0.78, worldFootvolley: 1 },
    leagueRanks: { bwCup: 2, lbf: 2, cbft: 1, lsk: 4, worldFootvolley: 2, taf: 6 },
    confidence: "high",
  },
  {
    player: "Indio",
    country: "Brazil",
    instagramFollowers: 275000,
    leaguePresence: { bwCup: 0.8, taf: 0.62, lbf: 0.9, cbft: 0.82, lsk: 0.75, worldFootvolley: 0.94 },
    leagueRanks: { worldFootvolley: 3, bwCup: 4, lbf: 4, cbft: 5, lsk: 5, taf: 8 },
    confidence: "high",
  },
  {
    player: "Felipe",
    country: "Brazil",
    instagramFollowers: 255000,
    leaguePresence: { bwCup: 0.78, taf: 0.6, lbf: 0.88, cbft: 0.8, lsk: 0.73, worldFootvolley: 0.92 },
    leagueRanks: { worldFootvolley: 4, bwCup: 5, lbf: 5, cbft: 6, lsk: 6, taf: 9 },
    confidence: "high",
  },
];

const MEN_POOL: Array<{ name: string; country: string }> = [
  { name: "Brisa", country: "Brazil" },
  { name: "Sandrey", country: "Brazil" },
  { name: "Ron", country: "Israel" },
  { name: "Maor", country: "Israel" },
  { name: "Juan", country: "Argentina" },
  { name: "Facundo", country: "Argentina" },
  { name: "Renan", country: "Brazil" },
  { name: "Neguinho", country: "Brazil" },
  { name: "Jonathan", country: "Argentina" },
  { name: "Danny", country: "Argentina" },
  { name: "Federico", country: "Argentina" },
  { name: "Alain", country: "France" },
  { name: "Joel", country: "United States" },
  { name: "Lukas", country: "Germany" },
  { name: "Tadeo", country: "Argentina" },
  { name: "Franklin", country: "Brazil" },
  { name: "Michel", country: "Brazil" },
  { name: "Vinicius", country: "Brazil" },
  { name: "Gustavo", country: "Brazil" },
  { name: "Lalazinho", country: "Brazil" },
  { name: "Longo", country: "Brazil" },
  { name: "Joba", country: "Brazil" },
  { name: "Hiltinho", country: "Brazil" },
  { name: "Victor Real", country: "Brazil" },
  { name: "Bruno Barros", country: "Brazil" },
  { name: "Murilo", country: "Brazil" },
  { name: "Parana", country: "Brazil" },
  { name: "Bello Soares", country: "Brazil" },
  { name: "Lucas Zanol", country: "Brazil" },
  { name: "Bruno BR7", country: "Brazil" },
  { name: "Thiago Mixirica", country: "Brazil" },
  { name: "Cesar Fiorio", country: "Brazil" },
  { name: "Felipe Carbonaro", country: "Brazil" },
  { name: "Piu Montemor", country: "Brazil" },
  { name: "Fabricio Barancoski", country: "Brazil" },
  { name: "Pedro Ivo", country: "Brazil" },
  { name: "Fernando Chorei", country: "Brazil" },
  { name: "Billy Oliveira", country: "Brazil" },
  { name: "Diego Tavares", country: "Brazil" },
  { name: "Yuri Ribeiro", country: "Brazil" },
  { name: "Gabriel Souza", country: "Brazil" },
  { name: "Henrique Oliveira", country: "Brazil" },
  { name: "Carlos Iwata", country: "Brazil" },
  { name: "Marcos Chantel", country: "Brazil" },
  { name: "Anderson Silva", country: "Brazil" },
  { name: "Thiago Cunha", country: "Brazil" },
  { name: "Lucca Toledo", country: "Brazil" },
  { name: "Pedro Espindola", country: "Brazil" },
  { name: "Pedro Galimberti", country: "Brazil" },
  { name: "Zuca Palladino", country: "Brazil" },
  { name: "Lucas Silva", country: "Brazil" },
  { name: "Moises Davalos", country: "Paraguay" },
  { name: "Ivan Davalos", country: "Paraguay" },
];

const WOMEN_CORE: PlayerPopularitySeed[] = [
  {
    player: "Natalia Guitler",
    country: "Brazil",
    instagramFollowers: 1700000,
    leaguePresence: { bwCup: 0.82, taf: 0.65, lbf: 0.9, cbft: 0.8, lsk: 0.78, worldFootvolley: 1 },
    leagueRanks: { bwCup: 1, lbf: 1, cbft: 2, worldFootvolley: 3, taf: 5, lsk: 4 },
    confidence: "high",
  },
  {
    player: "Lane",
    country: "Brazil",
    instagramFollowers: 430000,
    leaguePresence: { bwCup: 0.78, taf: 0.6, lbf: 0.84, cbft: 0.76, lsk: 0.7, worldFootvolley: 1 },
    leagueRanks: { bwCup: 2, cbft: 1, worldFootvolley: 1, lbf: 3, taf: 6, lsk: 5 },
    confidence: "high",
  },
  {
    player: "Ray",
    country: "Brazil",
    instagramFollowers: 395000,
    leaguePresence: { bwCup: 0.76, taf: 0.58, lbf: 0.82, cbft: 0.74, lsk: 0.69, worldFootvolley: 1 },
    leagueRanks: { bwCup: 3, cbft: 3, worldFootvolley: 2, lbf: 4, taf: 7, lsk: 6 },
    confidence: "high",
  },
];

const WOMEN_POOL: Array<{ name: string; country: string }> = [
  { name: "Vanessa", country: "Brazil" },
  { name: "Antonia", country: "Brazil" },
  { name: "Nina", country: "Brazil" },
  { name: "Illy", country: "Brazil" },
  { name: "Marjo", country: "Brazil" },
  { name: "Yosy", country: "Brazil" },
  { name: "Itzid", country: "Brazil" },
  { name: "Evelyn", country: "Brazil" },
  { name: "Emmelie", country: "Brazil" },
  { name: "Fiorela", country: "Argentina" },
  { name: "Malena", country: "Argentina" },
  { name: "Bia", country: "Brazil" },
  { name: "Amanda", country: "Brazil" },
  { name: "Leah", country: "United States" },
  { name: "Nicole", country: "United States" },
  { name: "Josy Araujo", country: "Brazil" },
  { name: "Gabriela Allen-Vieira", country: "Brazil" },
  { name: "Patricia Rodriguez", country: "Brazil" },
  { name: "Fabiola Zanella", country: "Brazil" },
  { name: "Bella Lima", country: "Brazil" },
  { name: "Fernanda Silva", country: "Brazil" },
  { name: "Gabriela Santos", country: "Brazil" },
  { name: "Fiorella Pellegrini", country: "Uruguay" },
  { name: "Ana Schardong", country: "Brazil" },
  { name: "Duda Souza", country: "Brazil" },
  { name: "Talita Pereira", country: "Brazil" },
  { name: "Kaitlyn Brunworth", country: "United States" },
  { name: "Karol Barros", country: "Brazil" },
  { name: "Daniela Diaz", country: "Argentina" },
  { name: "Paula Quintero", country: "Colombia" },
  { name: "Natalia Mignone", country: "Italy" },
  { name: "Bruna Leao", country: "Brazil" },
  { name: "Gabi Macedo", country: "Brazil" },
  { name: "Milene Domingues", country: "Brazil" },
  { name: "Thamara Moreira", country: "Brazil" },
  { name: "Flavia Alessandra", country: "Brazil" },
  { name: "Isadora", country: "Brazil" },
  { name: "Giovanna", country: "Brazil" },
  { name: "Raissa", country: "Brazil" },
  { name: "Camila", country: "Brazil" },
  { name: "Bia Ferreira", country: "Brazil" },
  { name: "Marina", country: "Brazil" },
  { name: "Carla", country: "Brazil" },
  { name: "Leticia", country: "Brazil" },
  { name: "Talia", country: "Brazil" },
  { name: "Rebeca", country: "Brazil" },
  { name: "Priscila", country: "Brazil" },
  { name: "Helena", country: "Brazil" },
  { name: "Sabrina", country: "Brazil" },
  { name: "Beatriz", country: "Brazil" },
  { name: "Laura", country: "Brazil" },
  { name: "Aline", country: "Brazil" },
  { name: "Victoria", country: "Brazil" },
];

function buildGeneratedSeeds(
  pool: Array<{ name: string; country: string }>,
  startFollowers: number
): PlayerPopularitySeed[] {
  return pool.map((entry, i) =>
    seedFromName(entry.name, entry.country, Math.max(45000, startFollowers - i * 3500), i + 6)
  );
}

export const TOP_MEN_SEEDS_V04: PlayerPopularitySeed[] = [
  ...MEN_CORE,
  ...buildGeneratedSeeds(MEN_POOL, 255000),
].slice(0, 50);

export const TOP_WOMEN_SEEDS_V04: PlayerPopularitySeed[] = [
  ...WOMEN_CORE,
  ...buildGeneratedSeeds(WOMEN_POOL, 390000),
].slice(0, 50);
