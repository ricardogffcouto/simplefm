'use client';

interface StartScreenProps {
  onNewGame: () => void;
  onLoadGame: () => void;
}

export function StartScreen({ onNewGame, onLoadGame }: StartScreenProps) {
  return (
    <div className="kivy-start-wrapper">
      <div className="kivy-start-screen" role="menu" aria-label="Start menu">
        <h1 className="kivy-start-title">Simple FM</h1>
        <button type="button" className="kivy-start-button" onClick={onNewGame}>
          New Game
        </button>
        <div aria-hidden="true" />
        <button type="button" className="kivy-start-button" onClick={onLoadGame}>
          Load Game
        </button>
        <div aria-hidden="true" />
      </div>
    </div>
  );
}
