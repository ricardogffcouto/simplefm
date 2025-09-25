'use client';

interface StartScreenProps {
  onNewGame: () => void;
  onLoadGame: () => void;
}

export function StartScreen({ onNewGame, onLoadGame }: StartScreenProps) {
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-8 text-center">
      <div className="w-full rounded-3xl border-2 border-black/20 bg-black/70 px-10 py-12 shadow-xl">
        <div className="flex flex-col items-center gap-6">
          <h1
            className="text-4xl font-bold tracking-wide text-white"
            style={{ textShadow: '0 3px 6px rgba(0,0,0,0.6)' }}
          >
            Simple FM
          </h1>
          <p className="max-w-sm text-sm text-white/80">
            The original desktop flow recreated for the web. Manage your squad, train your talents and climb the league ladder one week at a time.
          </p>
          <div className="flex w-full flex-col gap-3">
            <button type="button" className="kivy-button" onClick={onNewGame}>
              New Game
            </button>
            <button type="button" className="kivy-button kivy-button--secondary" onClick={onLoadGame}>
              Load Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
