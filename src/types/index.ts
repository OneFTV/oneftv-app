export enum TournamentFormat {
  ROUND_ROBIN = 'ROUND_ROBIN',
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  GROUP_KNOCKOUT = 'GROUP_KNOCKOUT',
  KING_OF_THE_BEACH = 'KING_OF_THE_BEACH',
}

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  REFEREE = 'REFEREE',
  PLAYER = 'PLAYER',
}

export enum PlayerLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  ELITE = 'ELITE',
}

export enum GameStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED',
}

export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  role: UserRole
  phoneNumber?: string
  createdAt: Date
  updatedAt: Date
}

export interface Player {
  id: string
  userId: string
  tournamentId: string
  user: User
  level: PlayerLevel
  team?: string
  joinedAt: Date
  withdrawnAt?: Date | null
}

export interface Tournament {
  id: string
  name: string
  description?: string
  format: TournamentFormat
  status: TournamentStatus
  startDate: Date
  endDate: Date
  location: string
  organizerId: string
  organizer: User
  maxParticipants: number
  currentParticipants: number
  registrationDeadline: Date
  numCourts: number
  hoursPerDay: number
  avgGameMinutes: number
  createdAt: Date
  updatedAt: Date
  players?: Player[]
  games?: Game[]
  groups?: TournamentGroup[]
}

export interface Game {
  id: string
  tournamentId: string
  tournament: Tournament
  team1PlayerIds: string[]
  team2PlayerIds: string[]
  team1Players?: Player[]
  team2Players?: Player[]
  courtNumber: number
  scheduledTime: Date
  status: GameStatus
  team1Score?: number
  team2Score?: number
  refereeId?: string
  referee?: User
  startedAt?: Date | null
  completedAt?: Date | null
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface TournamentGroup {
  id: string
  tournamentId: string
  tournament: Tournament
  name: string
  playerIds: string[]
  players?: Player[]
  games?: Game[]
  standings?: GroupStanding[]
  createdAt: Date
  updatedAt: Date
}

export interface GroupStanding {
  id: string
  groupId: string
  group: TournamentGroup
  playerId: string
  player: Player
  wins: number
  draws: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  pointDifferential: number
  totalPoints: number
  position: number
  createdAt: Date
  updatedAt: Date
}

export interface GameResult {
  gameId: string
  team1Score: number
  team2Score: number
  notes?: string
  confirmedBy?: string
  confirmedAt?: Date
}

export interface BracketNode {
  id: string
  round: number
  position: number
  team1PlayerId?: string
  team2PlayerId?: string
  team1Player?: Player
  team2Player?: Player
  winnerId?: string
  winner?: Player
  loserPlayerId?: string
  loserPlayer?: Player
}

export interface Bracket {
  id: string
  tournamentId: string
  tournament: Tournament
  name: string
  nodes: BracketNode[]
  createdAt: Date
  updatedAt: Date
}

export interface TournamentCreateInput {
  name: string
  description?: string
  format: TournamentFormat
  startDate: Date
  endDate: Date
  location: string
  maxParticipants: number
  registrationDeadline: Date
  numCourts: number
  hoursPerDay: number
  avgGameMinutes: number
}

export interface PlayerRegistration {
  playerId: string
  playerName: string
  email: string
  level: PlayerLevel
  team?: string
  registeredAt: Date
}

export interface TournamentStats {
  totalParticipants: number
  totalGames: number
  completedGames: number
  pendingGames: number
  totalCourtsInUse: number
  averageGameDuration: number
}

export interface Standing {
  position: number
  playerId: string
  playerName: string
  wins: number
  losses: number
  draws: number
  pointsFor: number
  pointsAgainst: number
  pointDifferential: number
  totalPoints: number
}

export interface BracketStanding extends Standing {
  round: number
  seed: number
  status: 'eliminated' | 'advancing' | 'champion'
}

export interface ScheduleBlock {
  date: Date
  courtNumber: number
  games: ScheduledGameInfo[]
}

export interface ScheduledGameInfo {
  id: string
  team1PlayerNames: string[]
  team2PlayerNames: string[]
  ScheduledTime: Date
  status: GameStatus
  team1Score?: number
  team2Score?: number
}

export interface TournamentSession {
  userId: string
  tournamentId: string
  role: UserRole
  joinedAt: Date
}

export interface AuthSession {
  user?: {
    id: string
    email: string
    name: string
    role: UserRole
  }
  expires: string
}

export interface ApiResponse<T> {
  success: boolean
  Jdata?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TournamentFormData {
  name: string
  description: string
  format: TournamentFormat
  startDate: string
  endDate: string
  location: string
  maxParticipants: string
  registrationDeadline: string
  numCourts: string
  hoursPerDay: string
  avgGameMinutes: string
}

export interface GameUpdateInput {
  team1Score: number
  team2Score: number
  status: GameStatus
  refereeId?: string
  notes?: string
}

export interface PlayerFilterOptions {
  level?: PlayerLevel
  team?: string
  status?: 'active' | 'withdrawn'
  searchQuery?: string
}

export interface ScheduleOptions {
  numCourts: number
  startTime: Date
  avgGameMinutes: number
  respectBreakTimes: boolean
  breakDurationMinutes?: number
}

export interface KotBGroupOptions {
  groupSize: number
  advancePerGroup: number
  wildcardSlots: number
}

export interface TournamentPhase {
  id: string
  name: string
  type: 'group' | 'knockout' | 'final'
  startDate: Date
  endDate: Date
  games: Game[]
  standingOÎˆÜ›İ\İ[™[™Ö×BŸB‚™^Ü[\™˜XÙHX]Ú\\İÜHÂˆ^Y\ŒRYˆİš[™Âˆ^Y\Œ’Yˆİš[™Âˆ^Y\ŒS˜[YNˆİš[™Âˆ^Y\Œ“˜[YNˆİš[™Âˆ^Y\ŒUÚ[œÎˆ[X™\‚ˆ^Y\Œ•Ú[œÎˆ[X™\‚ˆ˜]ÜÎˆ[X™\‚ˆ\İX]ÚÎˆ]BŸB‚™^Ü[\™˜XÙHİ\›˜[Y[›İYšXØ][ÛˆÂˆYˆİš[™Âˆ\Ù\’Yˆİš[™Âˆİ\›˜[Y[Yˆİš[™Âˆ\N‚ˆ	ÙØ[YWÜØÚY[Y	Âˆ	ÙØ[YWÜİ\Y	Âˆ	ÙØ[YWØÛÛ\]Y	Âˆ	İİ\›˜[Y[İ\]Y	Âˆ	Ü™YÚ\İ˜][Û—Ü™[Z[™\‰Âˆ	ÚÛ›ØÚÛİ]ØY˜[˜Ù[Y[	Âˆ]Nˆİš[™ÂˆY\ÜØYÙNˆİš[™Âˆ™XYˆ›ÛÛX[‚ˆØÜ™X]Y]ˆ]BŸB‚™^Ü[\™˜XÙH^Ü]HÂˆİ\›˜[Y[ˆİ\›˜[Y[ˆ^Y\œÎˆ^Y\–×BˆØ[Y\ÎˆØ[YV×Bˆİ[™[™ÜÎˆİ[™[™Ö×BˆØÚY[NˆØÚY[P›ØÚÖ×Bˆ3Ü›X]ˆ	ØÜİ‰È	ÚœÛÛ‰È	Ü‰ÂŸB