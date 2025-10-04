"""Screen to select and load an existing save file."""

from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Vertical
from textual.widgets import Button, Footer, Header, ListItem, ListView, Static

from .base import StateScreen


class LoadGameScreen(StateScreen):
    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        with Vertical(id="load-layout"):
            yield Static("[bold]Choose a saved career[/bold]", id="load-title")
            yield ListView(id="games-list")
            yield Button("Load", id="load", variant="success")
            yield Button("Back", id="back", variant="warning")
        yield Footer()

    def on_mount(self) -> None:
        self.refresh_games()

    def refresh_games(self) -> None:
        list_view = self.query_one("#games-list", ListView)
        list_view.clear()
        self._games = self.app.state.list_saved_games()

        if not self._games:
            list_view.append(ListItem(Static("No saved games found."), disabled=True))
        else:
            for name in self._games:
                list_view.append(ListItem(Static(name)))

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "load":
            self._load_selected()
        elif event.button.id == "back":
            self.app.pop_screen()

    def _load_selected(self) -> None:
        list_view = self.query_one("#games-list", ListView)
        if not getattr(self, "_games", None):
            self.app.notify("No saved games to load", severity="warning")
            return

        index = list_view.index
        if index is None or index < 0 or index >= len(self._games):
            self.app.notify("Select a save first", severity="warning")
            return

        name = self._games[index]
        try:
            self.app.state.load_game(name)
        except Exception as exc:
            self.app.notify(str(exc), severity="error")
            return

        self.app.notify(f"Loaded {name}", severity="information")
        self.app.show_main()

