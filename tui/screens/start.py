"""Start screen with the retro banner and primary actions."""

from __future__ import annotations

from rich.panel import Panel

from textual.app import ComposeResult
from textual.containers import Vertical
from textual.widgets import Button, Footer, Header, Static

from .base import StateScreen

ASCII_TITLE = """[bold #FCE300]╔═══════════════════════════════════════╗[/]
[bold #FCE300]║[/]   [bold white]Simple Football Manager[/]   [bold #FCE300]║[/]
[bold #FCE300]╚═══════════════════════════════════════╝[/]"""


class StartScreen(StateScreen):
    def compose(self) -> ComposeResult:
        yield Header()
        with Vertical(id="start-layout"):
            yield Static(Panel.fit(ASCII_TITLE, border_style="#FCE300"), id="title")
            yield Button("New Game", id="new-game", variant="success")
            yield Button("Load Game", id="load-game", variant="primary")
            yield Button("Quit", id="quit", variant="error")
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "new-game":
            self.app.show_new_game()
        elif event.button.id == "load-game":
            self.app.show_load_game()
        elif event.button.id == "quit":
            self.app.exit()

