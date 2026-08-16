import { characterById } from "../data/characters";
import type {
  Action,
  MatchConfig,
  MatchState,
  PlayerState,
  Protocol,
  RoundResolution,
} from "./types";

export const defaultConfig: MatchConfig = {
  deadlockRound: 9,
  finalRound: 12,
  maxAmmo: 3,
};

export function protocolForRound(round: number, config: MatchConfig): Protocol {
  if (round >= config.finalRound) return "final";
  if (round >= config.deadlockRound) return "deadlock";
  return "normal";
}

export function createMatch(characterIds: PlayerState["characterId"][], config = defaultConfig): MatchState {
  return {
    round: 1,
    protocol: "normal",
    config,
    players: characterIds.map((characterId, index) => {
      const character = characterById[characterId];
      return {
        id: `player-${index + 1}`,
        seat: index + 1,
        characterId,
        hp: character.maxHp,
        maxHp: character.maxHp,
        ammo: character.startingAmmo,
        guardStreak: 0,
        alive: true,
        abilityUsed: false,
        stats: {
          shotsFired: 0,
          hitsLanded: 0,
          guardsUsed: 0,
          abilityUsed: false,
        },
      };
    }),
  };
}

export function guardLimit(state: MatchState): number {
  if (state.protocol === "final") return 0;
  if (state.protocol === "deadlock") return 1;
  return 2;
}

export function validateAction(state: MatchState, playerId: string, action: Action): string | null {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player || !player.alive) return "Player is not active.";
  if (player.lockedAction) return "Action is already locked.";

  const baseType = action.type.replace("dodge-", "") as "charge" | "shoot" | "guard";
  const usesDodge = action.type.startsWith("dodge-");

  if (usesDodge && (player.characterId !== "ying" || player.abilityUsed)) {
    return "Phase Dodge is unavailable.";
  }
  if (baseType === "charge" && player.ammo >= state.config.maxAmmo) {
    return "Ammunition is already full.";
  }
  if (baseType === "shoot") {
    if (player.ammo < 1) return "One round is required to shoot.";
    const target = state.players.find((candidate) => candidate.id === action.targetPlayerId);
    if (!target || !target.alive || target.id === player.id) return "Choose a living opponent.";
  }
  if (baseType === "guard" && player.guardStreak >= guardLimit(state)) {
    return state.protocol === "final" ? "Guard is disabled in Final Protocol." : "Guard limit reached.";
  }
  return null;
}

export function lockAction(state: MatchState, playerId: string, action: Action): MatchState {
  const error = validateAction(state, playerId, action);
  if (error) throw new Error(error);
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId ? { ...player, lockedAction: { ...action } } : player,
    ),
  };
}

export function allLivingPlayersLocked(state: MatchState): boolean {
  return state.players.filter((player) => player.alive).every((player) => Boolean(player.lockedAction));
}

export function resolveRound(state: MatchState): RoundResolution {
  if (!allLivingPlayersLocked(state)) throw new Error("Every living player must lock an action before reveal.");

  const players = state.players.map((player) => ({
    ...player,
    stats: { ...player.stats },
    lockedAction: player.lockedAction ? { ...player.lockedAction } : undefined,
  }));
  const events: RoundResolution["events"] = [];
  const damage = new Map<string, number>();
  const dodging = new Set(
    players
      .filter((player) => player.lockedAction?.type.startsWith("dodge-"))
      .map((player) => player.id),
  );
  const guarding = new Set(
    players.filter((player) => player.lockedAction?.type === "guard").map((player) => player.id),
  );

  players.forEach((player) => {
    if (!player.alive || !player.lockedAction) return;
    const baseType = player.lockedAction.type.replace("dodge-", "") as "charge" | "shoot" | "guard";

    if (player.lockedAction.type.startsWith("dodge-")) {
      player.abilityUsed = true;
      player.stats.abilityUsed = true;
    }
    if (baseType === "charge") {
      player.ammo = Math.min(state.config.maxAmmo, player.ammo + 1);
      events.push({ kind: "charged", actorId: player.id, value: 1 });
    }
    if (baseType === "guard") {
      player.stats.guardsUsed += 1;
      events.push({ kind: "guarded", actorId: player.id });
    }
    if (baseType !== "shoot") return;

    player.ammo -= 1;
    player.stats.shotsFired += 1;
    const targetId = player.lockedAction.targetPlayerId!;
    if (dodging.has(targetId)) {
      events.push({ kind: "dodged", actorId: player.id, targetId });
      return;
    }
    if (guarding.has(targetId)) {
      events.push({ kind: "blocked", actorId: player.id, targetId });
      return;
    }
    damage.set(targetId, (damage.get(targetId) ?? 0) + 1);
    player.stats.hitsLanded += 1;
    events.push({ kind: "hit", actorId: player.id, targetId, value: 1 });
    if (player.characterId === "lie") {
      player.ammo = Math.min(state.config.maxAmmo, player.ammo + 1);
      events.push({ kind: "feedback", actorId: player.id, value: 1 });
    }
  });

  players.forEach((player) => {
    const incoming = damage.get(player.id) ?? 0;
    if (incoming > 0) player.hp = Math.max(0, player.hp - incoming);
    if (player.hp === 0 && player.alive) {
      player.alive = false;
      events.push({ kind: "eliminated", actorId: player.id });
    }
    const baseType = player.lockedAction?.type.replace("dodge-", "");
    player.guardStreak = baseType === "guard" ? player.guardStreak + 1 : 0;
  });

  const survivors = players.filter((player) => player.alive);
  const nextRound = state.round + 1;
  const resolvedState: MatchState = {
    ...state,
    round: nextRound,
    protocol: protocolForRound(nextRound, state.config),
    players: players.map((player) => ({ ...player, lockedAction: undefined })),
  };

  return {
    state: resolvedState,
    events,
    winnerId: survivors.length === 1 ? survivors[0].id : undefined,
  };
}
