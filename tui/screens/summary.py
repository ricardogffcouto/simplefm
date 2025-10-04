"""Weekly summary overlay shown after a match or simulation."""

from __future__ import annotations

from rich.console import Group
from rich.table import Table

from textual.app import ComposeResult
from textual.containers import Vertical
from textual.widgets import Button, Footer, Header, ListItem, ListView, Static

from .base import StateScreen


class SummaryScreen(StateScreen):
    def __init__(self, summary: dict) -> None:
        super().__init__()
        self.summary = summary

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        with Vertical(id="summary-layout"):
            yield Static(id="match-summary")
            yield Static(id="finance-summary")
            yield Static("Training highlights", classes="list-title")
            yield ListView(id="training-list")
            yield Static("News", classes="list-title")
            yield ListView(id="news-list")
            yield Button("Return to dashboard", id="close", variant="success")
        yield Footer()

    def on_mount(self) -> None:
        self._render_match()
        self._render_finances()
        self._render_training()
        self._render_news()

    def _render_match(self) -> None:
        match = self.summary.get("match")
        if not match:
            self.query_one("#match-summary", Static).update("[bold]No match played this week.[/bold]")
            return
        table = Table(title="Match result", expand=True)
        table.add_column("Opponent")
        table.add_column("Score")
        table.add_column("Result")
        table.add_row(match["opponent"], match["score"], match["result"])
        if match["goals"]:
            goals = Table(title="Goals", expand=True)
            goals.add_column("Minute")
            goals.add_column("Player")
            goals.add_column("Team")
            for goal in match["goals"]:
                goals.add_row(str(goal["minute"]), goal["player"], goal["team"])
            self.query_one("#match-summary", Static).update(Group(table, goals))
        else:
            self.query_one("#match-summary", Static).update(table)

    def _render_finances(self) -> None:
        finances = self.summary.get("finances", {})
        table = Table(title="Finances", expand=True)
        table.add_column("Category")
        table.add_column("Weekly")
        table.add_column("Season")
        for key, values in finances.get("income", {}).items():
            table.add_row(f"Income – {key}", values["weekly"], values["yearly"])
        table.add_row("Income – Total", finances.get("income_total", ""), finances.get("income_total_yearly", ""))
        for key, values in finances.get("expense", {}).items():
            table.add_row(f"Expense – {key}", values["weekly"], values["yearly"])
        table.add_row("Expense – Total", finances.get("expense_total", ""), finances.get("expense_total_yearly", ""))
        table.add_row("Balance", finances.get("balance_weekly", ""), finances.get("balance_yearly", ""))
        table.add_row("Cash", finances.get("cash", ""), "")
        table.add_row("Season goal", str(finances.get("goal", "")), "")
        table.add_row("Fan happiness", str(finances.get("fan_happiness", "")), "")
        self.query_one("#finance-summary", Static).update(table)

    def _render_training(self) -> None:
        training = self.summary.get("training", [])
        list_view = self.query_one("#training-list", ListView)
        list_view.clear()
        highlights = [entry for entry in training if entry.get("training")]
        if not highlights:
            list_view.append(ListItem(Static("No major training changes."), disabled=True))
            return
        for entry in highlights:
            player = entry["player"]
            change = entry.get("training", "")
            list_view.append(ListItem(Static(f"{player.name} ({player.position}) {change}")))

    def _render_news(self) -> None:
        news = self.summary.get("news", [])
        list_view = self.query_one("#news-list", ListView)
        list_view.clear()
        if not news:
            list_view.append(ListItem(Static("No news this week."), disabled=True))
            return
        for item in news:
            list_view.append(ListItem(Static(item)))

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "close":
            self.app.pop_screen()

