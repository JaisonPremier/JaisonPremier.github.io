import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Check,
  Crosshair,
  Lightning,
  LockKey,
  Shield,
  SkipForward,
  Sparkle,
} from "@phosphor-icons/react";
import { characterById } from "../data/characters";
import { guardLimit, validateAction } from "../game/engine";
import type { Action, BaseActionType, MatchState, ResolutionEvent, RoundResolution } from "../game/types";
import type { SoundCue } from "../hooks/useGameAudio";
import { AmmoDisplay, CharacterArt, GameButton, HealthDisplay, PlayerHUD, motionTokens } from "./GameUI";

interface MatchArenaProps {
  state: MatchState;
  activePlayerId: string;
  onLock: (action: Action) => void;
  onCue: (cue: SoundCue) => void;
}

const actionOptions: { id: BaseActionType; label: string; detail: string; icon: typeof Lightning }[] = [
  { id: "charge", label: "CHARGE", detail: "+1 AMMO", icon: Lightning },
  { id: "shoot", label: "SHOOT", detail: "COST 1", icon: Crosshair },
  { id: "guard", label: "GUARD", detail: "BLOCK ALL", icon: Shield },
];

export function MatchArena({ state, activePlayerId, onLock, onCue }: MatchArenaProps) {
  const active = state.players.find((player) => player.id === activePlayerId)!;
  const character = characterById[active.characterId];
  const [selected, setSelected] = useState<BaseActionType | null>(null);
  const [targetId, setTargetId] = useState<string | undefined>();
  const [phase, setPhase] = useState(false);
  const opponents = state.players.filter((player) => player.alive && player.id !== active.id);

  const action = useMemo<Action | null>(() => {
    if (!selected) return null;
    const type = phase && selected !== "guard" ? `dodge-${selected}` as Action["type"] : selected;
    return { type, targetPlayerId: selected === "shoot" ? targetId : undefined };
  }, [phase, selected, targetId]);

  const error = action ? validateAction(state, active.id, action) : null;
  const canPhase = active.characterId === "ying" && !active.abilityUsed;

  const selectAction = (id: BaseActionType) => {
    onCue(id);
    setSelected(id);
    if (id !== "shoot") setTargetId(undefined);
    if (id === "guard") setPhase(false);
  };

  return (
    <section
      className="match-arena"
      style={{ "--character-accent": character.accent, "--character-accent-rgb": character.accentRgb } as CSSProperties}
    >
      <div className="round-readout">
        <span>TURN {String(state.round).padStart(2, "0")}</span>
        <strong>{state.protocol === "normal" ? "NORMAL PROTOCOL" : state.protocol === "deadlock" ? "DEADLOCK STATE" : "FINAL PROTOCOL"}</strong>
      </div>

      <div className="arena-opponents">
        {state.players.map((player) => (
          <button
            key={player.id}
            className={`opponent-target ${targetId === player.id ? "targeted" : ""}`}
            disabled={selected !== "shoot" || player.id === active.id || !player.alive}
            onClick={() => {
              onCue("target");
              setTargetId(player.id);
            }}
            aria-label={player.id === active.id ? "Current player" : `Target player ${player.seat}`}
          >
            <PlayerHUD player={player} active={player.id === active.id} locked={Boolean(player.lockedAction)} />
            {targetId === player.id && <span className="target-lock"><Crosshair size={16} weight="bold" /> TARGET</span>}
          </button>
        ))}
      </div>

      <motion.div className="active-character" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
        <CharacterArt character={character} />
        <div className="active-identity">
          <span>YOUR FIGHTER</span>
          <h2>{character.hanzi}</h2>
          <h3>{character.pinyin}</h3>
          <div><HealthDisplay player={active} /><AmmoDisplay ammo={active.ammo} /></div>
          <aside className="active-passive">
            <span>{character.ability.name}</span>
            <p>{character.ability.plain}</p>
          </aside>
        </div>
      </motion.div>

      <div className="action-console">
        <div className="action-heading">
          <span>CHOOSE IN SECRET</span>
          <strong>{selected === "shoot" && !targetId ? "SELECT A TARGET" : selected ? `${selected.toUpperCase()} READY` : "SELECT ACTION"}</strong>
        </div>
        <div className="action-options">
          {actionOptions.map((option) => {
            const Icon = option.icon;
            const disabled =
              (option.id === "charge" && active.ammo >= state.config.maxAmmo) ||
              (option.id === "shoot" && active.ammo < 1) ||
              (option.id === "guard" && active.guardStreak >= guardLimit(state));
            return (
              <motion.button
                key={option.id}
                className={`action-option ${selected === option.id ? "selected" : ""}`}
                onClick={() => selectAction(option.id)}
                disabled={disabled}
                whileHover={disabled ? undefined : { y: -5 }}
                whileTap={disabled ? undefined : { scale: 0.96 }}
                transition={motionTokens.spring}
              >
                <Icon size={28} weight={selected === option.id ? "fill" : "duotone"} />
                <strong>{option.label}</strong>
                <span>{disabled ? option.id === "guard" ? "UNAVAILABLE" : option.id === "charge" ? "AMMO FULL" : "NO AMMO" : option.detail}</span>
              </motion.button>
            );
          })}
        </div>

        {canPhase && (
          <button
            className={`phase-control ${phase ? "selected" : ""}`}
            onClick={() => {
              if (selected !== "guard") {
                onCue("dodge");
                setPhase((current) => !current);
              }
            }}
            disabled={!selected || selected === "guard"}
            aria-pressed={phase}
          >
            <Sparkle size={18} weight={phase ? "fill" : "regular"} />
            <span><strong>PHASE DODGE</strong><small>1 USE</small></span>
            <i>{phase ? "ARMED" : "OFF"}</i>
          </button>
        )}

        <div className="action-lock-row">
          <span className={error ? "action-error" : ""} role="status">
            {error ?? (action ? "Action will remain hidden until reveal." : `Guard limit: ${guardLimit(state)} consecutive.`)}
          </span>
          <GameButton
            variant="primary"
            disabled={!action || Boolean(error)}
            onClick={() => action && onLock(action)}
            icon={<LockKey size={18} weight="fill" />}
          >
            LOCK ACTION
          </GameButton>
        </div>
      </div>
    </section>
  );
}

function actionLabel(action: Action | undefined, state: MatchState) {
  if (!action) return "NO ACTION";
  const target = state.players.find((player) => player.id === action.targetPlayerId);
  const targetCharacter = target ? characterById[target.characterId] : null;
  const base = action.type.replace("dodge-", "").toUpperCase();
  const phase = action.type.startsWith("dodge-") ? "PHASE + " : "";
  return `${phase}${base}${targetCharacter ? ` TO ${targetCharacter.pinyin}` : ""}`;
}

function eventText(event: ResolutionEvent, state: MatchState) {
  const actor = state.players.find((player) => player.id === event.actorId);
  const target = state.players.find((player) => player.id === event.targetId);
  const actorName = actor ? characterById[actor.characterId].pinyin : "UNKNOWN";
  const targetName = target ? characterById[target.characterId].pinyin : "";
  const text: Record<ResolutionEvent["kind"], string> = {
    charged: `${actorName} LOADED +1`,
    guarded: `${actorName} DEFENDING`,
    blocked: `${targetName} BLOCKED ${actorName}`,
    dodged: `${targetName} PHASED PAST ${actorName}`,
    hit: `${actorName} HIT ${targetName}`,
    feedback: `${actorName} FEEDBACK +1`,
    eliminated: `${actorName} TERMINATED`,
  };
  return text[event.kind];
}

export function RevealScreen({
  lockedState,
  resolution,
  onContinue,
  reduceMotion,
  onCue,
}: {
  lockedState: MatchState;
  resolution: RoundResolution;
  onContinue: () => void;
  reduceMotion: boolean;
  onCue: (cue: SoundCue) => void;
}) {
  const systemReduce = useReducedMotion();
  const skipMotion = reduceMotion || Boolean(systemReduce);
  const [stage, setStage] = useState(skipMotion ? 2 : 0);
  const playedStages = useRef(new Set<number>());

  useEffect(() => {
    if (skipMotion) return;
    const revealTimer = window.setTimeout(() => setStage(1), 460);
    const resolveTimer = window.setTimeout(() => setStage(2), 1180);
    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(resolveTimer);
    };
  }, [skipMotion]);

  useEffect(() => {
    if (playedStages.current.has(stage)) return;
    playedStages.current.add(stage);
    if (stage === 1) {
      const actions = lockedState.players.map((player) => player.lockedAction?.type ?? "");
      if (actions.some((action) => action.includes("shoot"))) onCue("shoot");
      else if (actions.some((action) => action === "guard")) onCue("guard");
      else onCue("charge");
    }
    if (stage === 2) {
      if (resolution.events.some((event) => event.kind === "hit" || event.kind === "eliminated")) onCue("damage");
      else if (resolution.events.some((event) => event.kind === "dodged")) onCue("dodge");
      else if (resolution.events.some((event) => event.kind === "blocked")) onCue("guard");
      else onCue("confirm");
    }
  }, [lockedState.players, onCue, resolution.events, stage]);

  return (
    <section className={`reveal-screen reveal-stage-${stage}`}>
      <AnimatePresence mode="wait">
        {stage === 0 ? (
          <motion.div key="quiet" className="reveal-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.2 }}>
            <span>ALL ACTIONS LOCKED</span>
            <h2>静</h2>
          </motion.div>
        ) : (
          <motion.div key="reveal" className="reveal-board" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="reveal-heading">
              <span>TURN {String(lockedState.round).padStart(2, "0")}</span>
              <h2>REVEAL</h2>
              <strong>{stage === 1 ? "ACTIONS EXPOSED" : "RESOLUTION COMPLETE"}</strong>
            </div>
            <div className="reveal-actions">
              {lockedState.players.filter((player) => player.alive).map((player, index) => {
                const character = characterById[player.characterId];
                const after = resolution.state.players.find((candidate) => candidate.id === player.id)!;
                const playerEvents = resolution.events.filter((event) => event.actorId === player.id || event.targetId === player.id);
                return (
                  <motion.article
                    key={player.id}
                    style={{ "--character-accent": character.accent, "--character-accent-rgb": character.accentRgb } as CSSProperties}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: skipMotion ? 0 : index * 0.07 }}
                    className={!after.alive ? "reveal-eliminated" : ""}
                  >
                    <CharacterArt character={character} variant="portrait" />
                    <div className="reveal-player">
                      <span>{character.hanzi}</span><strong>{character.pinyin}</strong><small>PLAYER {String(player.seat).padStart(2, "0")}</small>
                    </div>
                    <div className="revealed-action">{actionLabel(player.lockedAction, lockedState)}</div>
                    {stage === 2 && (
                      <motion.div className="resolution-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <HealthDisplay player={after} compact />
                        {playerEvents.slice(0, 3).map((event, eventIndex) => (
                          <span key={`${event.kind}-${eventIndex}`}>{eventText(event, lockedState)}</span>
                        ))}
                      </motion.div>
                    )}
                  </motion.article>
                );
              })}
            </div>
            <GameButton
              variant="primary"
              className="reveal-continue"
              onClick={stage < 2 ? () => setStage(2) : onContinue}
              icon={stage < 2 ? <SkipForward size={18} weight="fill" /> : <ArrowRight size={18} weight="bold" />}
            >
              {stage < 2 ? "RESOLVE NOW" : resolution.winnerId || resolution.state.players.every((player) => !player.alive) ? "VIEW RESULT" : "NEXT TURN"}
            </GameButton>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function WinnerScreen({
  state,
  winnerId,
  onRematch,
  onHome,
}: {
  state: MatchState;
  winnerId?: string;
  onRematch: () => void;
  onHome: () => void;
}) {
  const winner = state.players.find((player) => player.id === winnerId);
  const character = winner ? characterById[winner.characterId] : null;
  const style = character
    ? { "--character-accent": character.accent, "--character-accent-rgb": character.accentRgb } as CSSProperties
    : undefined;

  return (
    <section className="winner-screen" style={style}>
      {character && winner ? (
        <>
          <motion.div className="winner-art" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
            <CharacterArt character={character} />
          </motion.div>
          <div className="winner-copy">
            <span>SURVIVOR</span>
            <h2>{character.hanzi}</h2>
            <h3>{character.pinyin}</h3>
            <strong>DEADLOCK RESOLVED</strong>
          </div>
          <div className="winner-stats">
            <div><strong>{state.round - 1}</strong><span>ROUNDS SURVIVED</span></div>
            <div><strong>{winner.stats.shotsFired}</strong><span>SHOTS FIRED</span></div>
            <div><strong>{winner.stats.hitsLanded}</strong><span>HITS LANDED</span></div>
            <div><strong>{winner.stats.guardsUsed}</strong><span>GUARDS USED</span></div>
          </div>
        </>
      ) : (
        <div className="draw-copy">
          <span>MUTUAL TERMINATION</span>
          <h2>零</h2>
          <h3>NO SURVIVOR</h3>
          <p>Every locked action resolved. The deadlock consumed all remaining fighters.</p>
        </div>
      )}
      <div className="winner-actions">
        <GameButton variant="primary" onClick={onRematch} icon={<Check size={18} weight="bold" />}>REMATCH</GameButton>
        <button className="text-action" onClick={onHome}>RETURN TO TITLE</button>
      </div>
    </section>
  );
}
