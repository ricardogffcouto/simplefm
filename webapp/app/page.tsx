'use client';

import { NewGameForm } from '@/components/NewGameForm';
import { GameDashboard } from '@/components/GameDashboard';
import { useGameEngine } from '@/hooks/useGameEngine';

export default function HomePage() {
  const {
    game,
    humanTeam,
    availableTeams,
    startNewGame,
    resetGame,
    playCurrentMatch,
    advanceWeekWithoutMatch,
    currentMatch,
    rosterByPosition,
    leagueTable,
    selectedTab,
    setSelectedTab,
    weekNews
  } = useGameEngine();

  return (
    <div className="flex w-full max-w-6xl flex-col gap-8 py-6">
      {!game && (
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="card-surface pitch-gradient flex flex-col justify-between p-8 text-white">
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-[0.4em] text-accent">SimpleFM web edition</span>
              <h1 className="text-3xl font-bold sm:text-4xl">
                Command every transfer, tactic and fixture from any device.
              </h1>
              <p className="text-subtle text-sm sm:text-base">
                We reimagined the original Kivy prototype as a responsive experience inspired by hattrick.org. Manage your
                academy, negotiate wages and climb the pyramid with the same simulation depth.
              </p>
            </div>
            <p className="text-xs text-subtle">
              Powered by the original SimpleFM engine · Optimised for touch devices · Deployed on Vercel
            </p>
          </div>
          <NewGameForm availableTeams={availableTeams} onStart={startNewGame} />
        </div>
      )}

      {game && humanTeam && (
        <GameDashboard
          game={game}
          humanTeam={humanTeam}
          currentMatch={currentMatch}
          rosterByPosition={rosterByPosition}
          leagueTable={leagueTable}
          weekNews={weekNews}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          onPlayMatch={playCurrentMatch}
          onSimulateWeek={advanceWeekWithoutMatch}
        />
      )}

      {game && (
        <button
          onClick={resetGame}
          className="mx-auto mt-4 w-fit rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-wide text-subtle transition hover:border-accent hover:text-accent"
        >
          Start another career
        </button>
      )}
    </div>
  );
}
