import { useState, type CSSProperties, type MouseEventHandler, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  GearSix,
  Hexagon,
  LockKey,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react";
import { characterById, type Character } from "../data/characters";
import type { PlayerState, Protocol } from "../game/types";

export const motionTokens = {
  fast: 0.18,
  normal: 0.32,
  cinematic: 0.65,
  spring: { type: "spring" as const, stiffness: 320, damping: 28 },
};

interface GameButtonProps {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
}

export function GameButton({ children, variant = "ghost", icon, className = "", ...props }: GameButtonProps) {
  return (
    <motion.button
      whileHover={props.disabled ? undefined : { y: -2, scale: 1.015 }}
      whileTap={props.disabled ? undefined : { y: 1, scale: 0.975 }}
      transition={motionTokens.spring}
      className={`game-button game-button-${variant} ${className}`}
      {...props}
    >
      <span>{children}</span>
      {icon && <span className="game-button-icon">{icon}</span>}
    </motion.button>
  );
}

export function AmbientWorld({ protocol = "normal", children }: { protocol?: Protocol; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <main className={`world protocol-${protocol}`}>
      <motion.div
        className="world-backdrop"
        animate={reduce ? undefined : { scale: [1, 1.018, 1], x: [0, -5, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="world-vignette" />
      <div className="world-grid" />
      <div className="world-noise" />
      <div className="world-content">{children}</div>
    </main>
  );
}

export function TopBar({
  title,
  onBack,
  soundOn,
  onSound,
  onSettings,
}: {
  title?: string;
  onBack?: () => void;
  soundOn: boolean;
  onSound: () => void;
  onSettings?: () => void;
}) {
  return (
    <header className="top-bar">
      <div className="top-bar-side">
        {onBack && (
          <button className="icon-button" onClick={onBack} aria-label="Go back">
            <ArrowLeft size={19} weight="bold" />
          </button>
        )}
        <span className="top-mark">死局</span>
      </div>
      {title && <span className="top-title">{title}</span>}
      <div className="top-bar-side top-bar-side-right">
        <button className="icon-button" onClick={onSound} aria-label={soundOn ? "Mute sound" : "Enable sound"}>
          {soundOn ? <SpeakerHigh size={19} /> : <SpeakerSlash size={19} />}
        </button>
        {onSettings && (
          <button className="icon-button" onClick={onSettings} aria-label="Open settings">
            <GearSix size={19} />
          </button>
        )}
      </div>
    </header>
  );
}

export function CharacterArt({
  character,
  variant = "full",
  className = "",
}: {
  character: Character;
  variant?: "full" | "portrait" | "thumbnail";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const artStyle = { "--character-accent": character.accent, "--character-accent-rgb": character.accentRgb } as CSSProperties;
  return (
    <div className={`character-art character-art-${variant} ${failed ? "art-fallback" : ""} ${className}`} style={artStyle}>
      <div className="fallback-figure" aria-hidden="true">
        <span>{character.hanzi}</span>
      </div>
      {!failed && (
        <img
          src={character.artwork[variant]}
          alt={`${character.pinyin} character artwork`}
          onError={() => setFailed(true)}
          draggable={false}
        />
      )}
    </div>
  );
}

export function HealthDisplay({ player, compact = false }: { player: PlayerState; compact?: boolean }) {
  return (
    <div className={`core-row ${compact ? "compact" : ""}`} aria-label={`${player.hp} of ${player.maxHp} health cores`}>
      {Array.from({ length: player.maxHp }, (_, index) => (
        <Hexagon
          key={index}
          className={index < player.hp ? "core-live" : "core-empty"}
          size={compact ? 13 : 18}
          weight={index < player.hp ? "fill" : "regular"}
        />
      ))}
    </div>
  );
}

export function AmmoDisplay({ ammo, max = 3, compact = false }: { ammo: number; max?: number; compact?: boolean }) {
  return (
    <div className={`ammo-row ${compact ? "compact" : ""}`} aria-label={`${ammo} of ${max} ammunition`}>
      {Array.from({ length: max }, (_, index) => (
        <span key={index} className={`ammo-shell ${index < ammo ? "ammo-loaded" : ""}`} />
      ))}
    </div>
  );
}

export function PlayerHUD({ player, active = false, locked = false }: { player: PlayerState; active?: boolean; locked?: boolean }) {
  const character = characterById[player.characterId];
  return (
    <motion.div
      layout
      className={`player-hud ${active ? "player-hud-active" : ""} ${!player.alive ? "player-hud-out" : ""}`}
      style={{ "--character-accent": character.accent, "--character-accent-rgb": character.accentRgb } as CSSProperties}
    >
      <CharacterArt character={character} variant="portrait" />
      <div className="hud-identity">
        <span className="hud-hanzi">{character.hanzi}</span>
        <span>{character.pinyin}</span>
        <small>PLAYER {String(player.seat).padStart(2, "0")}</small>
      </div>
      <div className="hud-resources">
        <HealthDisplay player={player} compact />
        <AmmoDisplay ammo={player.ammo} compact />
      </div>
      <span className="hud-status">
        {!player.alive ? "TERMINATED" : locked ? <><LockKey size={12} /> LOCKED</> : active ? "CHOOSING" : "STANDBY"}
      </span>
    </motion.div>
  );
}

export function ScreenTransition({ children, transitionKey }: { children: ReactNode; transitionKey: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={transitionKey}
      className="screen-transition"
      initial={reduce ? false : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
      animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
      exit={reduce ? undefined : { opacity: 0, clipPath: "inset(100% 0 0 0)" }}
      transition={{ duration: reduce ? 0 : motionTokens.normal, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
