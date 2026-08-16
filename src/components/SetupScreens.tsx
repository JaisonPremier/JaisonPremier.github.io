import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  CaretLeft,
  CaretRight,
  Crosshair,
  Lightning,
  Play,
  Shield,
  UsersThree,
} from "@phosphor-icons/react";
import { characters, characterById } from "../data/characters";
import type { CharacterId, PlayerState } from "../game/types";
import { AmmoDisplay, CharacterArt, GameButton, HealthDisplay, motionTokens } from "./GameUI";

export function HomeScreen({
  onStart,
  onHowTo,
  onArchive,
  onSettings,
}: {
  onStart: () => void;
  onHowTo: () => void;
  onArchive: () => void;
  onSettings: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <section className="home-screen">
      <div className="home-brand">
        <motion.span
          className="home-kicker"
          initial={reduce ? false : { opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.14, ...motionTokens.spring }}
        >
          SIMULTANEOUS COMBAT PROTOCOL
        </motion.span>
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="home-hanzi">死局</span>
          <span className="home-pinyin">SǏ JÚ</span>
          <span className="home-title">DEADLOCK</span>
        </motion.h1>
        <p className="home-copy">Choose in secret. Reveal together. Survive the protocol.</p>
        <div className="home-actions">
          <GameButton variant="primary" onClick={onStart} icon={<ArrowRight size={19} weight="bold" />}>
            START
          </GameButton>
          <button className="text-action" onClick={onHowTo}><BookOpen size={17} /> HOW TO PLAY</button>
        </div>
      </div>

      <div className="home-fighters">
        <motion.img
          className="home-group-art"
          src="/characters/group.png"
          alt="LING, LIE, YING, and GANG standing together"
          initial={reduce ? false : { opacity: 0, y: 38, scale: 1.025 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          draggable={false}
        />
      </div>

      <nav className="home-nav" aria-label="Secondary navigation">
        <button onClick={onArchive}>ARCHIVE</button>
        <button onClick={onSettings}>SETTINGS</button>
        <span>2-4 PLAYERS</span>
      </nav>
    </section>
  );
}

export function PlayerCountScreen({ onSelect }: { onSelect: (count: number) => void }) {
  return (
    <section className="count-screen content-safe">
      <div className="count-copy">
        <UsersThree size={34} weight="thin" />
        <h2>SELECT PLAYERS</h2>
        <p>Pass one device. Every choice stays hidden until all fighters lock.</p>
      </div>
      <div className="count-options">
        {[2, 3, 4].map((count) => (
          <motion.button
            key={count}
            className="count-option"
            onClick={() => onSelect(count)}
            whileHover={{ x: 10 }}
            whileTap={{ scale: 0.98 }}
            transition={motionTokens.spring}
          >
            <span className="count-number">0{count}</span>
            <span>{count === 2 ? "DUEL" : count === 3 ? "TRIAD" : "FULL DEADLOCK"}</span>
            <ArrowRight size={24} />
          </motion.button>
        ))}
      </div>
    </section>
  );
}

export function CharacterSelectScreen({
  playerCount,
  selections,
  onLock,
  onBegin,
}: {
  playerCount: number;
  selections: CharacterId[];
  onLock: (characterId: CharacterId) => void;
  onBegin: () => void;
}) {
  const currentSeat = Math.min(selections.length + 1, playerCount);
  const initial = characters.find((character) => !selections.includes(character.id))?.id ?? characters[0].id;
  const [focused, setFocused] = useState<CharacterId>(initial);
  const character = characterById[focused];
  const isTaken = selections.includes(focused);
  const complete = selections.length === playerCount;

  useEffect(() => {
    if (isTaken && !complete) {
      const next = characters.find((candidate) => !selections.includes(candidate.id));
      if (next) setFocused(next.id);
    }
  }, [complete, isTaken, selections]);

  const moveFocus = (direction: number) => {
    const index = characters.findIndex((candidate) => candidate.id === focused);
    const next = characters[(index + direction + characters.length) % characters.length];
    setFocused(next.id);
  };

  return (
    <section
      className="character-select"
      style={{ "--character-accent": character.accent, "--character-accent-rgb": character.accentRgb } as CSSProperties}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={character.id}
          className="character-stage"
          initial={{ opacity: 0, x: 28, filter: "blur(10px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: -24, filter: "blur(8px)" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <CharacterArt character={character} />
        </motion.div>
      </AnimatePresence>

      <div className="character-meta">
        <span className="select-player">PLAYER {String(currentSeat).padStart(2, "0")}</span>
        <AnimatePresence mode="wait">
          <motion.div
            key={character.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: motionTokens.normal }}
          >
            <span className="select-number">{character.number}</span>
            <h2>{character.hanzi}</h2>
            <h3>{character.pinyin}</h3>
            <div className="ability-copy">
              <strong>{character.ability.name}</strong>
              <span>{character.ability.short}</span>
              <p>{character.ability.description}</p>
              <div className="ability-explanation">
                <small>HOW IT WORKS</small>
                <p>{character.ability.plain}</p>
                <small>EXAMPLE</small>
                <p>{character.ability.example}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        {!complete ? (
          <GameButton
            variant="primary"
            disabled={isTaken}
            onClick={() => onLock(focused)}
            icon={<ArrowRight size={18} weight="bold" />}
          >
            {isTaken ? "FIGHTER LOCKED" : "LOCK FIGHTER"}
          </GameButton>
        ) : (
          <GameButton variant="primary" onClick={onBegin} icon={<Play size={18} weight="fill" />}>
            ENTER DEADLOCK
          </GameButton>
        )}
      </div>

      <div className="select-controls">
        <button onClick={() => moveFocus(-1)} aria-label="Previous fighter"><CaretLeft size={20} /></button>
        <div className="fighter-strip">
          {characters.map((candidate) => {
            const takenAt = selections.indexOf(candidate.id);
            return (
              <button
                key={candidate.id}
                className={`${candidate.id === focused ? "focused" : ""} ${takenAt >= 0 ? "taken" : ""}`}
                onClick={() => setFocused(candidate.id)}
                aria-label={`View ${candidate.pinyin}`}
              >
                <CharacterArt character={candidate} variant="thumbnail" />
                <span>{candidate.number}</span>
                <strong>{candidate.hanzi}</strong>
                {takenAt >= 0 && <small>P{takenAt + 1}</small>}
              </button>
            );
          })}
        </div>
        <button onClick={() => moveFocus(1)} aria-label="Next fighter"><CaretRight size={20} /></button>
      </div>
    </section>
  );
}

export function PassDeviceScreen({ player, round, onReady }: { player: PlayerState; round: number; onReady: () => void }) {
  const character = characterById[player.characterId];
  return (
    <section
      className="pass-screen"
      style={{ "--character-accent": character.accent, "--character-accent-rgb": character.accentRgb } as CSSProperties}
    >
      <div className="pass-art"><CharacterArt character={character} /></div>
      <div className="pass-copy">
        <span>TURN {String(round).padStart(2, "0")}</span>
        <span>PASS DEVICE TO</span>
        <h2>{character.hanzi}</h2>
        <h3>{character.pinyin}</h3>
        <p>PLAYER {String(player.seat).padStart(2, "0")}</p>
        <GameButton variant="primary" onClick={onReady} icon={<ArrowRight size={19} weight="bold" />}>
          TAP WHEN READY
        </GameButton>
      </div>
    </section>
  );
}

export function HowToPlayScreen() {
  const steps = [
    { name: "CHARGE", detail: "Gain 1 ammo. You cannot charge when you already have 3.", icon: <Lightning size={32} weight="duotone" /> },
    { name: "SHOOT", detail: "Spend 1 ammo, choose one living opponent, and deal 1 damage if they do not defend.", icon: <Crosshair size={32} weight="duotone" /> },
    { name: "GUARD", detail: "Block every normal shot aimed at you this round. You may guard twice in a row.", icon: <Shield size={32} weight="duotone" /> },
  ];
  return (
    <section className="tutorial-screen content-safe">
      <header className="tutorial-title">
        <span>HOW TO PLAY</span>
        <h2>CHOOSE IN SECRET.<br />SURVIVE THE REVEAL.</h2>
        <p>Two to four players share one device. The last fighter with HP remaining wins.</p>
      </header>

      <ol className="tutorial-flow" aria-label="Round sequence">
        <li><span>01</span><strong>PASS</strong><p>Give the device to the named player. Previous choices stay hidden.</p></li>
        <li><span>02</span><strong>CHOOSE</strong><p>Select one action and a target if you shoot, then lock it.</p></li>
        <li><span>03</span><strong>REVEAL</strong><p>After every living player locks, all actions appear together.</p></li>
        <li><span>04</span><strong>RESOLVE</strong><p>Defense, shots, damage, ammo, and abilities resolve simultaneously.</p></li>
      </ol>

      <div className="tutorial-actions">
        {steps.map((step, index) => (
          <motion.article key={step.name} whileHover={{ y: -7 }} transition={motionTokens.spring}>
            <span className="tutorial-index">0{index + 1}</span>
            {step.icon}
            <h3>{step.name}</h3>
            <p>{step.detail}</p>
          </motion.article>
        ))}
      </div>

      <section className="tutorial-rules">
        <div className="tutorial-section-heading">
          <h3>Rules that decide the fight</h3>
          <p>These details explain every result you will see during reveal.</p>
        </div>
        <div className="tutorial-rule-grid">
          <article><strong>STARTING STATE</strong><p>Most fighters start with 3 HP and 0 ammo. LÍNG starts with 1 ammo. GĀNG starts with 4 HP.</p></article>
          <article><strong>AMMO</strong><p>Maximum ammo is 3. CHARGE adds 1. SHOOT costs 1 before the attack resolves.</p></article>
          <article><strong>GUARD LIMIT</strong><p>GUARD blocks every shot aimed at you, not only one. After two guards in a row, choose CHARGE or SHOOT to reset the streak.</p></article>
          <article><strong>SIMULTANEOUS ACTIONS</strong><p>A fighter reduced to 0 HP still performs the action they locked that round. Two successful shots against one target deal 2 damage.</p></article>
          <article><strong>SECRET INFORMATION</strong><p>LOCKED only means a player submitted a choice. It never reveals the action before everyone is ready.</p></article>
          <article><strong>ESCALATION</strong><p>From round 9, GUARD may be used only once in a row. From round 12, GUARD is disabled.</p></article>
        </div>
      </section>

      <section className="tutorial-fighters">
        <div className="tutorial-section-heading">
          <h3>Know the four fighters</h3>
          <p>Every fighter follows the same three-action game and adds one simple advantage.</p>
        </div>
        <div className="tutorial-fighter-grid">
          {characters.map((character) => (
            <article key={character.id} style={{ "--character-accent": character.accent, "--character-accent-rgb": character.accentRgb } as CSSProperties}>
              <CharacterArt character={character} variant="portrait" />
              <div><span>{character.number}</span><h4>{character.hanzi} {character.pinyin}</h4><strong>{character.ability.name}</strong><p>{character.ability.plain}</p></div>
            </article>
          ))}
        </div>
      </section>

      <footer className="tutorial-rule">
        <strong>LAST PLAYER ALIVE WINS</strong>
        <span>If every remaining fighter reaches 0 HP in the same reveal, the match ends in mutual termination.</span>
      </footer>
    </section>
  );
}

export function ArchiveScreen() {
  const [focused, setFocused] = useState<CharacterId>("ling");
  const character = characterById[focused];
  return (
    <section
      className="archive-screen"
      style={{ "--character-accent": character.accent, "--character-accent-rgb": character.accentRgb } as CSSProperties}
    >
      <div className="archive-heading">
        <span>COMBATANT ARCHIVE</span>
        <h2>四式</h2>
        <p>Four surviving combat protocols. No origin records remain.</p>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={focused}
          className="archive-feature"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.32 }}
        >
          <CharacterArt character={character} />
          <div className="archive-feature-copy">
            <span>{character.number}</span>
            <h3>{character.hanzi}</h3>
            <h4>{character.pinyin}</h4>
            <strong>{character.ability.name}</strong>
            <p>{character.ability.plain}</p>
            <div className="archive-example"><span>EXAMPLE</span>{character.ability.example}</div>
            <blockquote>{character.lore}</blockquote>
          </div>
        </motion.div>
      </AnimatePresence>
      <nav className="archive-nav" aria-label="Combatant archive">
        {characters.map((candidate) => (
          <button key={candidate.id} className={candidate.id === focused ? "active" : ""} onClick={() => setFocused(candidate.id)}>
            <span>{candidate.number}</span><strong>{candidate.hanzi}</strong><small>{candidate.pinyin}</small>
          </button>
        ))}
      </nav>
    </section>
  );
}

export function SettingsScreen({
  soundOn,
  reduceMotion,
  onSound,
  onReduceMotion,
}: {
  soundOn: boolean;
  reduceMotion: boolean;
  onSound: () => void;
  onReduceMotion: () => void;
}) {
  const settings = useMemo(() => [
    { name: "MUSIC + SOUND", description: "Background soundtrack and layered combat feedback", value: soundOn, action: onSound },
    { name: "REDUCED MOTION", description: "Shorten transitions and disable ambient movement", value: reduceMotion, action: onReduceMotion },
  ], [onReduceMotion, onSound, reduceMotion, soundOn]);
  return (
    <section className="settings-screen content-safe">
      <div className="settings-title">
        <span>SYSTEM CONTROL</span>
        <h2>SETTINGS</h2>
        <p>Audio never starts until you interact. Motion respects your system preference.</p>
      </div>
      <div className="settings-list">
        {settings.map((setting) => (
          <button key={setting.name} onClick={setting.action} role="switch" aria-checked={setting.value}>
            <span><strong>{setting.name}</strong><small>{setting.description}</small></span>
            <span className={`switch-track ${setting.value ? "on" : ""}`}><i /></span>
          </button>
        ))}
      </div>
    </section>
  );
}
