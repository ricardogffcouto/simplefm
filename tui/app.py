"""Application entry-point for the SimpleFM Textual UI."""

from __future__ import annotations

from typing import Dict

from textual.app import App
from textual.binding import Binding

from .state import SimpleFMState
from .screens import (
    LoadGameScreen,
    MainScreen,
    ManagerStatsScreen,
    MatchScreen,
    NewGameScreen,
    StartScreen,
    SummaryScreen,
)


class SimpleFMTUI(App):
    """Main Textual application orchestrating all screens."""

    CSS_PATH = "tui/styles.css"
    BINDINGS = [
        Binding("ctrl+s", "save", "Save"),
        Binding("ctrl+q", "quit", "Quit"),
    ]

    def __init__(self) -> None:
        super().__init__()
        self.state = SimpleFMState()

    def on_mount(self) -> None:  # pragma: no cover - UI bootstrapping
        self.push_screen(StartScreen())

    def action_save(self) -> None:  # pragma: no cover - save shortcut
        try:
            self.state.save_game()
            self.notify("Game saved", severity="information")
        except Exception as exc:
            self.notify(f"Unable to save: {exc}", severity="error")

    # ------------------------------------------------------------------
    # Routing helpers used by the individual screens
    # ------------------------------------------------------------------

    def show_new_game(self) -> None:  # pragma: no cover - UI routing
        self.push_screen(NewGameScreen())

    def show_load_game(self) -> None:  # pragma: no cover - UI routing
        self.push_screen(LoadGameScreen())

    def show_main(self) -> None:  # pragma: no cover - UI routing
        self.push_screen(MainScreen())

    def show_match(self) -> None:  # pragma: no cover - UI routing
        self.push_screen(MatchScreen())

    def show_summary(self, summary: Dict[str, object]) -> None:  # pragma: no cover
        self.push_screen(SummaryScreen(summary))

    def show_manager_stats(self) -> None:  # pragma: no cover
        self.push_screen(ManagerStatsScreen())

