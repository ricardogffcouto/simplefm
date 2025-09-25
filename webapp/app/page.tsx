'use client';

import { useEffect, useState } from 'react';
import { StartScreen } from '@/components/StartScreen';
import { NewGameForm } from '@/components/NewGameForm';
import { LoadGameScreen } from '@/components/LoadGameScreen';
import { GameDashboard } from '@/components/GameDashboard';
import { useGameEngine } from '@/hooks/useGameEngine';

export default function HomePage() {
  const {
    game,
    humanTeam,
    availableTeams,
    startNewGame,
    resetGame,
    advanceWeekWithoutMatch,
    currentMatch,
    leagueTable,
    selectedTab,
    setSelectedTab,
    weekNews,
    allowedTactics,
    currentTactic,
    setHumanTactic,
    swapPlayerStatuses,
    liveMatch,
    isMatchLive,
    matchTimeline,
    autoPlaying,
    startLiveMatch,
    playLiveMinute,
    toggleAutoPlay,
    finishLiveMatch,
    makeMatchSubstitution,
    refreshTransferTargets,
    buyPlayer,
    sellPlayer,
    renewContract,
    postMatchSummary,
    dismissPostMatchSummary
  } = useGameEngine();

  type Screen = 'start' | 'new-game' | 'load-game' | 'career';
  const [screen, setScreen] = useState<Screen>('start');

  useEffect(() => {
    if (game && screen !== 'career') {
      setScreen('career');
    }
    if (!game && screen === 'career') {
      setScreen('start');
    }
  }, [game, screen]);

  const handleStartGame = (payload: Parameters<typeof startNewGame>[0]) => {
    startNewGame(payload);
    setScreen('career');
  };

  const handleReset = () => {
    resetGame();
    setScreen('start');
  };

  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-8">
      {screen === 'start' && (
        <StartScreen onNewGame={() => setScreen('new-game')} onLoadGame={() => setScreen('load-game')} />
      )}

      {screen === 'new-game' && (
        <NewGameForm availableTeams={availableTeams} onStart={handleStartGame} onCancel={() => setScreen('start')} />
      )}

      {screen === 'load-game' && <LoadGameScreen onBack={() => setScreen('start')} />}

      {screen === 'career' && game && humanTeam && (
        <GameDashboard
          game={game}
          humanTeam={humanTeam}
          currentMatch={currentMatch}
          leagueTable={leagueTable}
          weekNews={weekNews}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          onSimulateWeek={advanceWeekWithoutMatch}
          allowedTactics={allowedTactics}
          currentTactic={currentTactic}
          onSetTactic={setHumanTactic}
          onSwapPlayers={swapPlayerStatuses}
          liveMatch={liveMatch}
          isMatchLive={isMatchLive}
          matchTimeline={matchTimeline}
          autoPlaying={autoPlaying}
          onStartLiveMatch={startLiveMatch}
          onPlayMinute={playLiveMinute}
          onToggleAutoPlay={toggleAutoPlay}
          onFinishLiveMatch={finishLiveMatch}
          onMakeSubstitution={makeMatchSubstitution}
          onRefreshTransferList={refreshTransferTargets}
          onBuyPlayer={buyPlayer}
          onSellPlayer={sellPlayer}
          onRenewContract={renewContract}
          onResetCareer={handleReset}
          postMatchSummary={postMatchSummary}
          onDismissSummary={dismissPostMatchSummary}
        />
      )}
    </div>
  );
}
