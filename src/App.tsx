import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig } from "motion/react";
import { AmbientWorld, ScreenTransition, TopBar } from "./components/GameUI";
import {
  ArchiveScreen,
  CharacterSelectScreen,
  HomeScreen,
  HowToPlayScreen,
  PassDeviceScreen,
  PlayerCountScreen,
  SettingsScreen,
} from "./components/SetupScreens";
import { MatchArena, RevealScreen, WinnerScreen } from "./components/MatchScreens";
import { createMatch, lockAction, resolveRound } from "./game/engine";
import type { Action, CharacterId, MatchState, RoundResolution } from "./game/types";
import { useGameAudio } from "./hooks/useGameAudio";
import { useGameMusic } from "./hooks/useGameMusic";

type Screen =
  | "home"
  | "player-count"
  | "character-select"
  | "pass-device"
  | "match"
  | "reveal"
  | "winner"
  | "how-to"
  | "archive"
  | "settings";

interface RevealData {
  lockedState: MatchState;
  resolution: RoundResolution;
}

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [settingsReturn, setSettingsReturn] = useState<Screen>("home");
  const [soundOn, setSoundOn] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [selections, setSelections] = useState<CharacterId[]>([]);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [revealData, setRevealData] = useState<RevealData | null>(null);
  const [winnerId, setWinnerId] = useState<string | undefined>();
  const protocol = match?.protocol ?? "normal";
  const playSound = useGameAudio(soundOn);
  const musicVolume = screen === "match" || screen === "reveal"
    ? protocol === "final" ? 0.26 : protocol === "deadlock" ? 0.22 : 0.18
    : screen === "winner" ? 0.2 : 0.12;
  const startMusic = useGameMusic(soundOn, musicVolume);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reduceMotion ? "true" : "false";
  }, [reduceMotion]);

  const navigate = (next: Screen, cue: "confirm" | "transition" = "transition") => {
    startMusic();
    playSound(cue);
    setScreen(next);
  };

  const openSettings = () => {
    setSettingsReturn(screen);
    navigate("settings");
  };

  const choosePlayerCount = (count: number) => {
    setPlayerCount(count);
    setSelections([]);
    navigate("character-select", "confirm");
  };

  const lockCharacter = (characterId: CharacterId) => {
    if (selections.includes(characterId) || selections.length >= playerCount) return;
    startMusic();
    playSound("confirm");
    setSelections((current) => [...current, characterId]);
  };

  const beginMatch = () => {
    const initialMatch = createMatch(selections);
    setMatch(initialMatch);
    setActivePlayerId(initialMatch.players[0].id);
    setWinnerId(undefined);
    setRevealData(null);
    navigate("pass-device", "transition");
  };

  const lockPlayerAction = (action: Action) => {
    if (!match || !activePlayerId) return;
    const lockedState = lockAction(match, activePlayerId, action);
    setMatch(lockedState);
    startMusic();
    playSound("confirm");

    const nextPlayer = lockedState.players.find((player) => player.alive && !player.lockedAction);
    if (nextPlayer) {
      setActivePlayerId(nextPlayer.id);
      setScreen("pass-device");
      return;
    }

    const resolution = resolveRound(lockedState);
    setRevealData({ lockedState, resolution });
    setScreen("reveal");
    playSound("transition");
  };

  const continueAfterReveal = () => {
    if (!revealData) return;
    const { resolution } = revealData;
    const survivors = resolution.state.players.filter((player) => player.alive);
    setMatch(resolution.state);
    setRevealData(null);

    if (resolution.winnerId || survivors.length === 0) {
      setWinnerId(resolution.winnerId);
      setScreen("winner");
      playSound(resolution.winnerId ? "winner" : "damage");
      return;
    }

    setActivePlayerId(survivors[0].id);
    setScreen("pass-device");
    playSound("transition");
  };

  const rematch = () => {
    const newMatch = createMatch(selections);
    setMatch(newMatch);
    setActivePlayerId(newMatch.players[0].id);
    setWinnerId(undefined);
    setRevealData(null);
    navigate("pass-device", "confirm");
  };

  const returnHome = () => {
    setMatch(null);
    setRevealData(null);
    setActivePlayerId(null);
    setSelections([]);
    setWinnerId(undefined);
    navigate("home");
  };

  const backAction = () => {
    if (screen === "settings") {
      setScreen(settingsReturn);
      return;
    }
    if (screen === "character-select") {
      setSelections([]);
      setScreen("player-count");
      return;
    }
    if (screen === "player-count" || screen === "how-to" || screen === "archive") {
      setScreen("home");
      return;
    }
    returnHome();
  };

  const activePlayer = match?.players.find((player) => player.id === activePlayerId);
  const showTopBar = screen !== "home" && screen !== "winner";
  const toggleSound = () => {
    startMusic();
    setSoundOn((current) => !current);
  };
  const playBattleCue = (cue: Parameters<typeof playSound>[0]) => {
    startMusic();
    playSound(cue);
  };

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
      <div className="app-shell">
        <AmbientWorld protocol={protocol}>
          {showTopBar && (
            <TopBar
              title={screen === "match" || screen === "pass-device" || screen === "reveal" ? "LOCAL PROTOCOL" : undefined}
              onBack={backAction}
              soundOn={soundOn}
              onSound={toggleSound}
              onSettings={screen === "match" || screen === "pass-device" ? openSettings : undefined}
            />
          )}
          <AnimatePresence mode="wait">
            <ScreenTransition transitionKey={screen}>
              {screen === "home" && (
                <HomeScreen
                  onStart={() => navigate("player-count", "confirm")}
                  onHowTo={() => navigate("how-to")}
                  onArchive={() => navigate("archive")}
                  onSettings={openSettings}
                />
              )}
              {screen === "player-count" && <PlayerCountScreen onSelect={choosePlayerCount} />}
              {screen === "character-select" && (
                <CharacterSelectScreen
                  playerCount={playerCount}
                  selections={selections}
                  onLock={lockCharacter}
                  onBegin={beginMatch}
                />
              )}
              {screen === "pass-device" && activePlayer && match && (
                <PassDeviceScreen player={activePlayer} round={match.round} onReady={() => navigate("match", "confirm")} />
              )}
              {screen === "match" && match && activePlayerId && (
                <MatchArena state={match} activePlayerId={activePlayerId} onLock={lockPlayerAction} onCue={playBattleCue} />
              )}
              {screen === "reveal" && revealData && (
                <RevealScreen
                  lockedState={revealData.lockedState}
                  resolution={revealData.resolution}
                  onContinue={continueAfterReveal}
                  reduceMotion={reduceMotion}
                  onCue={playBattleCue}
                />
              )}
              {screen === "winner" && match && (
                <WinnerScreen state={match} winnerId={winnerId} onRematch={rematch} onHome={returnHome} />
              )}
              {screen === "how-to" && <HowToPlayScreen />}
              {screen === "archive" && <ArchiveScreen />}
              {screen === "settings" && (
                <SettingsScreen
                  soundOn={soundOn}
                  reduceMotion={reduceMotion}
                  onSound={toggleSound}
                  onReduceMotion={() => setReduceMotion((current) => !current)}
                />
              )}
            </ScreenTransition>
          </AnimatePresence>
        </AmbientWorld>
      </div>
    </MotionConfig>
  );
}

export default App;
