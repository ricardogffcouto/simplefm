"""Manager statistics screen."""

from __future__ import annotations

from rich.table import Table

from textual.app import ComposeResult
from textual.containers import Vertical
from textual.widgets import Button, Footer, Header, Static

from .base import StateScreen


class ManagerStatsScreen(StateScreen):
    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        with Vertical(id="manager-layout"):
            yield Static(id="manager-header")
            yield Static(id="career-table")
            yield Static(id="yearly-table")
            yield Button("Return", id="close", variant="success")
        yield Footer()

    def on_mount(self) -> None:
        stats = self.app.state.manager_stats()
        header = f"[bold]{stats['name']}[/bold] – Career points: {stats['points']}"
        self.query_one("#manager-header", Static).update(header)

        career = Table(title="Career totals", expand=True)
        career.add_column("Stat")
        career.add_column("Value")
        for key in stats["career_order"]:
            career.add_row(key, str(stats["career"][key]))
        self.query_one("#career-table", Static).update(career)

        yearly = Table(title="Season by season", expand=True)
        yearly.add_column("Year")
        yearly.add_column("Division")
        yearly.add_column("Pos")
        yearly.add_column("W")
        yearly.add_column("D")
        yearly.add_column("L")
        yearly.add_column("GF")
        yearly.add_column("GA")
        yearly.add_column("Pts")
        starting_year = self.app.state.game.year() if self.app.state.game else 0
        for offset, season in enumerate(stats["yearly"]):
            year = starting_year - offset
            yearly.add_row(
                str(year),
                season.get("div", "-"),
                str(season.get("pos", "-")),
                str(season.get("Wins", "-")),
                str(season.get("Draws", "-")),
                str(season.get("Losses", "-")),
                str(season.get("Goals For", "-")),
                str(season.get("Goals Against", "-")),
                str(season.get("pts", "-")),
            )
        self.query_one("#yearly-table", Static).update(yearly)

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "close":
            self.app.pop_screen()

