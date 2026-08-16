import { describe, expect, it } from "vitest";
import { createMatch, guardLimit, lockAction, protocolForRound, resolveRound, validateAction } from "./engine";

describe("DEADLOCK engine", () => {
  it("initializes character passives", () => {
    const match = createMatch(["ling", "gang"]);
    expect(match.players[0].ammo).toBe(1);
    expect(match.players[1].hp).toBe(4);
  });

  it("resolves simultaneous shots even when both players are eliminated", () => {
    let match = createMatch(["ling", "lie"]);
    match.players = match.players.map((player) => ({ ...player, hp: 1, ammo: 1 }));
    match = lockAction(match, "player-1", { type: "shoot", targetPlayerId: "player-2" });
    match = lockAction(match, "player-2", { type: "shoot", targetPlayerId: "player-1" });
    const result = resolveRound(match);
    expect(result.state.players.every((player) => !player.alive)).toBe(true);
    expect(result.events.filter((event) => event.kind === "hit")).toHaveLength(2);
  });

  it("blocks every incoming shot with one guard", () => {
    let match = createMatch(["ling", "lie", "gang"]);
    match.players = match.players.map((player) => ({ ...player, ammo: 1 }));
    match = lockAction(match, "player-1", { type: "shoot", targetPlayerId: "player-3" });
    match = lockAction(match, "player-2", { type: "shoot", targetPlayerId: "player-3" });
    match = lockAction(match, "player-3", { type: "guard" });
    const result = resolveRound(match);
    expect(result.state.players[2].hp).toBe(4);
    expect(result.events.filter((event) => event.kind === "blocked")).toHaveLength(2);
  });

  it("lets YING dodge while charging and consumes the ability", () => {
    let match = createMatch(["ling", "ying"]);
    match = lockAction(match, "player-1", { type: "shoot", targetPlayerId: "player-2" });
    match = lockAction(match, "player-2", { type: "dodge-charge" });
    const result = resolveRound(match);
    expect(result.state.players[1].hp).toBe(3);
    expect(result.state.players[1].ammo).toBe(1);
    expect(result.state.players[1].abilityUsed).toBe(true);
  });

  it("reloads LIE by exactly one only after a successful hit", () => {
    let match = createMatch(["lie", "gang"]);
    match.players[0] = { ...match.players[0], ammo: 2 };
    match = lockAction(match, "player-1", { type: "shoot", targetPlayerId: "player-2" });
    match = lockAction(match, "player-2", { type: "charge" });
    const result = resolveRound(match);
    expect(result.state.players[0].ammo).toBe(2);
    expect(result.events.some((event) => event.kind === "feedback")).toBe(true);
  });

  it("tightens guard limits during escalation", () => {
    const match = createMatch(["ling", "gang"]);
    expect(guardLimit(match)).toBe(2);
    expect(guardLimit({ ...match, protocol: "deadlock" })).toBe(1);
    expect(guardLimit({ ...match, protocol: "final" })).toBe(0);
  });

  it("rejects invalid resource and target choices", () => {
    const match = createMatch(["ling", "gang"]);
    const fullAmmo = {
      ...match,
      players: match.players.map((player, index) => index === 0 ? { ...player, ammo: 3 } : player),
    };
    expect(validateAction(fullAmmo, "player-1", { type: "charge" })).toBe("Ammunition is already full.");
    expect(validateAction(match, "player-2", { type: "shoot", targetPlayerId: "player-1" })).toBe("One round is required to shoot.");
    expect(validateAction(match, "player-1", { type: "shoot", targetPlayerId: "player-1" })).toBe("Choose a living opponent.");
  });

  it("resets the guard streak after charge or shoot", () => {
    let match = createMatch(["ling", "gang"]);
    match.players[0] = { ...match.players[0], guardStreak: 2 };
    match = lockAction(match, "player-1", { type: "charge" });
    match = lockAction(match, "player-2", { type: "charge" });
    const result = resolveRound(match);
    expect(result.state.players[0].guardStreak).toBe(0);
  });

  it("does not reload LIE when a shot is blocked", () => {
    let match = createMatch(["lie", "gang"]);
    match.players[0] = { ...match.players[0], ammo: 1 };
    match = lockAction(match, "player-1", { type: "shoot", targetPlayerId: "player-2" });
    match = lockAction(match, "player-2", { type: "guard" });
    const result = resolveRound(match);
    expect(result.state.players[0].ammo).toBe(0);
    expect(result.events.some((event) => event.kind === "feedback")).toBe(false);
  });

  it("applies multiple successful attacks as simultaneous damage", () => {
    let match = createMatch(["ling", "lie", "ying"]);
    match.players = match.players.map((player) => ({ ...player, ammo: 1 }));
    match = lockAction(match, "player-1", { type: "shoot", targetPlayerId: "player-3" });
    match = lockAction(match, "player-2", { type: "shoot", targetPlayerId: "player-3" });
    match = lockAction(match, "player-3", { type: "shoot", targetPlayerId: "player-1" });
    const result = resolveRound(match);
    expect(result.state.players[2].hp).toBe(1);
    expect(result.state.players[0].hp).toBe(2);
  });

  it("detects a sole survivor", () => {
    let match = createMatch(["ling", "gang"]);
    match.players = match.players.map((player, index) => ({ ...player, hp: index === 1 ? 1 : player.hp }));
    match = lockAction(match, "player-1", { type: "shoot", targetPlayerId: "player-2" });
    match = lockAction(match, "player-2", { type: "charge" });
    const result = resolveRound(match);
    expect(result.winnerId).toBe("player-1");
  });

  it("enters escalation at configured round boundaries", () => {
    const config = { deadlockRound: 9, finalRound: 12, maxAmmo: 3 };
    expect(protocolForRound(8, config)).toBe("normal");
    expect(protocolForRound(9, config)).toBe("deadlock");
    expect(protocolForRound(12, config)).toBe("final");
  });
});
