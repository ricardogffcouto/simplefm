'use client';

interface LoadGameScreenProps {
  onBack: () => void;
}

export function LoadGameScreen({ onBack }: LoadGameScreenProps) {
  return (
    <div className="kivy-panel w-full max-w-3xl overflow-hidden">
      <header className="kivy-header px-6 py-4 text-center text-lg font-semibold uppercase tracking-[0.3em]">
        Load Game
      </header>
      <div className="space-y-4 px-6 py-6 text-sm">
        <p>
          The original SimpleFM prototype loads career saves from the local filesystem. The web port keeps the same flow, so loading
          careers will be added when browser storage support is complete.
        </p>
        <p className="kivy-subtle">
          For now, start a new game from the main menu. Career progress is kept only while this page remains open.
        </p>
      </div>
      <footer className="kivy-footer flex justify-end gap-3 px-6 py-4">
        <button type="button" className="kivy-button kivy-button--secondary" onClick={onBack}>
          Back
        </button>
      </footer>
    </div>
  );
}
