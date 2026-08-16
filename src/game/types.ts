export type CharacterId = "ling" | "lie" | "ying" | "gang";

export type BaseActionType = "charge" | "shoot" | "guard";
export type ActionType = BaseActionType | "dodge-charge" | "dodge-shoot";

export interface Action {
  type: ActionType;
  targetPlayerId?: string;
}

export interface PlayerStats {
  shotsFired: number;
  hitsLanded: number;
  guardsUsed: number;
  abilityUsed: boolean;
}

export interface PlayerState {
  id: string;
  seat: number;
  characterId: CharacterId;
  hp: number;
  maxHp: number;
  ammo: number;
  guardStreak: number;
  alive: boolean;
  abilityUsed: boolean;
  lockedAction?: Action;
  stats: PlayerStats;
}

export type Protocol = "normal" | "deadlock" | "final";

export interface MatchConfig {
  deadlockRound: number;
  finalRound: number;
  maxAmmo: number;
}

export interface MatchState {
  round: number;
  protocol: Protocol;
  players: PlayerState[];
  config: MatchConfig;
}

export type ResolutionKind =
  | "charged"
  | "guarded"
  | "blocked"
  | "dodged"
  | "hit"
  | "feedback"
  | "eliminated";

export interface ResolutionEvent {
  kind: ResolutionKind;
  actorId: string;
  targetId?: string;
  value?: number;
}

export interface RoundResolution {
  state: MatchState;
  events: ResolutionEvent[];
  winnerId?: string;
}
