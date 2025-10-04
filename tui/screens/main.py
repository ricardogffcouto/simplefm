"""Main in-game dashboard hosting all management views."""

from __future__ import annotations

from typing import Dict, Iterable, List, Optional, Type

from rich.table import Table

from textual.app import ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.reactive import reactive
from textual.widgets import Button, DataTable, Footer, Header, ListItem, ListView, Select, Static

from ..formatters import money_to_str, tactic_to_str, table_position_to_str, training_to_str
from ..state import PlayerSummary
from .base import StateScreen


NAVIGATION: Dict[str, str] = {
    "team": "Team",
    "training": "Training",
    "transfers": "Transfers",
    "info": "Information",
    "league": "League",
}


class PlayerList(ListView):
    """Reusable list widget showing players in a section."""

    def set_players(self, players: Iterable[PlayerSummary]) -> None:
        self.clear()
        for player in players:
            flags = []
            if player.injured:
                flags.append("inj")
            if not player.match_available:
                flags.append("na")
            if player.skill_change > 0:
                flags.append("+1")
            elif player.skill_change < 0:
                flags.append("-1")

            info = f"{player.position} {player.name} ({player.age})  Skill {player.skill}"
            if flags:
                info += "  [" + ", ".join(flags) + "]"
            item = ListItem(Static(info))
            setattr(item, "player_id", player.identifier)
            self.append(item)


class MainScreen(StateScreen):
    active_view = reactive("team")

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        with Vertical(id="main-layout"):
            with Horizontal(id="top-bar"):
                yield Static(id="game-header")
                yield Button("Manager stats", id="manager-stats", variant="primary")
            yield Container(id="content")
            with Horizontal(id="nav"):
                for view, label in NAVIGATION.items():
                    yield Button(label, id=f"nav-{view}")
        yield Footer()

    def on_mount(self) -> None:
        self._view_factories: Dict[str, Type[BaseView]] = {
            "team": TeamView,
            "training": TrainingView,
            "transfers": TransfersView,
            "info": InformationView,
            "league": LeagueView,
        }
        self._current_view: Optional[BaseView] = None
        self.refresh_header()
        self.show_view(self.active_view)

    def on_show(self) -> None:
        self.refresh_header()
        if self._current_view:
            self._current_view.refresh()

    def refresh_header(self) -> None:
        ctx = self.app.state.header_context()
        header = self.query_one("#game-header", Static)
        header.update(
            f"[b]{ctx['team']}[/b] | Manager: {ctx['manager']} | Week {ctx['week']} ({ctx['year']}) | "
            f"Cash: {ctx['money']} | Fan happiness: {ctx['fan_happiness']}"
        )

    def show_view(self, view_name: str) -> None:
        self.active_view = view_name
        content = self.query_one("#content", Container)
        for child in list(content.children):
            child.remove()
        view_cls = self._view_factories[view_name]
        view = view_cls(self)
        content.mount(view)
        self._current_view = view
        view.refresh()
        self._update_nav()

    def watch_active_view(self, _: str) -> None:
        self._update_nav()

    def _update_nav(self) -> None:
        for view, label in NAVIGATION.items():
            button = self.query_one(f"#nav-{view}", Button)
            button.variant = "success" if view == self.active_view else "default"

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "manager-stats":
            self.app.show_manager_stats()
            return

        for view in NAVIGATION:
            if event.button.id == f"nav-{view}":
                self.show_view(view)
                break


class BaseView(Vertical):
    def __init__(self, screen: MainScreen) -> None:
        super().__init__()
        self.screen = screen

    @property
    def app(self):  # pragma: no cover - typing helper
        return self.screen.app

    def refresh(self) -> None:
        raise NotImplementedError


class TeamView(BaseView):
    def compose(self) -> ComposeResult:
        yield Static(id="match-info")
        yield Select(id="tactic-select")
        with Horizontal(id="team-lists"):
            yield Vertical(Static("Starting XI", classes="list-title"), PlayerList(id="list-starting"))
            yield Vertical(Static("Bench", classes="list-title"), PlayerList(id="list-bench"))
            yield Vertical(Static("Reserves", classes="list-title"), PlayerList(id="list-reserves"))
        yield Static("Select two players to swap. Press ENTER on each selection.", id="swap-hint")
        yield Button("Go to match", id="go-match", variant="primary")

    def on_mount(self) -> None:
        self.selection: List[int] = []
        self.refresh()

    def refresh(self) -> None:
        state = self.app.state
        team = state.active_team
        if team is None:
            return
        self.selection.clear()
        overview = state.team_overview()
        self.query_one("#list-starting", PlayerList).set_players(overview["starting"])
        self.query_one("#list-bench", PlayerList).set_players(overview["bench"])
        self.query_one("#list-reserves", PlayerList).set_players(overview["reserves"])

        options = state.tactic_options()
        select = self.query_one("#tactic-select", Select)
        option_pairs = [(opt, opt) for opt in options]
        if hasattr(select, "set_options"):
            select.set_options(option_pairs)
        else:  # pragma: no cover - compatibility path
            select.options = option_pairs  # type: ignore[attr-defined]
        current = tactic_to_str(team.current_tactic())
        if current not in options:
            current = "Top skill"
        select.value = current

        opponent = state.next_opponent()
        if opponent:
            info = (
                f"Next: [b]{opponent['location']}[/b] vs {opponent['name']}  "
                f"Skill {opponent['avg_skill']}  Tactic {opponent['tactic']}"
            )
        else:
            info = "No scheduled opponent this week."
        self.query_one("#match-info", Static).update(info)

    def on_select_changed(self, event: Select.Changed) -> None:
        if event.select.id == "tactic-select" and event.value:
            self.app.state.set_tactic(event.value)
            self.refresh()

    def on_list_view_selected(self, event: ListView.Selected) -> None:
        item = event.item
        player_id = getattr(item, "player_id", None)
        if player_id is None:
            return
        self.selection.append(player_id)
        if len(self.selection) == 2:
            self._attempt_swap()

    def _attempt_swap(self) -> None:
        player_out, player_in = self.selection
        self.selection.clear()
        if not self.app.state.swap_players(player_out, player_in):
            self.app.notify("Swap not allowed", severity="warning")
            return
        self.app.notify("Players swapped", severity="information")
        self.refresh()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "go-match":
            self.app.show_match()


class TrainingView(BaseView):
    def compose(self) -> ComposeResult:
        table = DataTable(id="training-table", zebra_stripes=True)
        table.add_columns("Pos", "Player", "Age", "Skill", "Training")
        yield table

    def refresh(self) -> None:
        table = self.query_one("#training-table", DataTable)
        table.clear(rows=True)
        report = self.app.state.training_report()
        for entry in report:
            player = entry["player"]
            table.add_row(
                player.position,
                player.name,
                str(player.age),
                str(player.skill),
                training_to_str(player.weekly_training),
            )


class TransfersView(BaseView):
    def compose(self) -> ComposeResult:
        with Horizontal(id="transfers-layout"):
            with Vertical(id="transfer-targets"):
                yield Static("Transfer targets", classes="list-title")
                yield ListView(id="targets-list")
                yield Button("Buy player", id="buy", variant="success")
            with Vertical(id="transfer-squad"):
                yield Static("Your squad", classes="list-title")
                yield ListView(id="squad-list")
                with Horizontal():
                    yield Button("Sell", id="sell", variant="warning")
                    yield Button("Renew", id="renew", variant="primary")

    def refresh(self) -> None:
        state = self.app.state
        targets = self.query_one("#targets-list", ListView)
        targets.clear()
        self._targets = state.transfer_targets()
        if not self._targets:
            targets.append(ListItem(Static("No players available."), disabled=True))
        else:
            for player in self._targets:
                text = (
                    f"{player.position} {player.name} ({player.age}) Skill {player.skill} | "
                    f"Value {money_to_str(player.value)}"
                )
                item = ListItem(Static(text))
                setattr(item, "player_id", player.identifier)
                targets.append(item)

        squad = self.query_one("#squad-list", ListView)
        squad.clear()
        self._squad = self.app.state.squad_for_transfers()
        for player in self._squad:
            contract = "Contract" if player.contract else "No contract"
            text = (
                f"{player.position} {player.name} ({player.age}) Skill {player.skill} | "
                f"Salary {money_to_str(player.salary)} | Value {money_to_str(player.value)} | {contract}"
            )
            item = ListItem(Static(text))
            setattr(item, "player_id", player.identifier)
            squad.append(item)

    def _selected_target(self) -> Optional[int]:
        list_view = self.query_one("#targets-list", ListView)
        index = list_view.index
        if index is None or not self._targets or index >= len(self._targets):
            return None
        return self._targets[index].identifier

    def _selected_squad_player(self) -> Optional[int]:
        list_view = self.query_one("#squad-list", ListView)
        index = list_view.index
        if index is None or not self._squad or index >= len(self._squad):
            return None
        return self._squad[index].identifier

    def on_button_pressed(self, event: Button.Pressed) -> None:
        state = self.app.state
        if event.button.id == "buy":
            player_id = self._selected_target()
            if player_id is None:
                self.app.notify("Select a transfer target first", severity="warning")
                return
            try:
                state.buy_player(player_id)
            except Exception as exc:
                self.app.notify(str(exc), severity="error")
            else:
                self.app.notify("Player signed", severity="information")
            self.refresh()
        elif event.button.id == "sell":
            player_id = self._selected_squad_player()
            if player_id is None:
                self.app.notify("Select a player to sell", severity="warning")
                return
            try:
                state.sell_player(player_id)
            except Exception as exc:
                self.app.notify(str(exc), severity="error")
            else:
                self.app.notify("Player sold", severity="information")
            self.refresh()
        elif event.button.id == "renew":
            player_id = self._selected_squad_player()
            if player_id is None:
                self.app.notify("Select a player to renew", severity="warning")
                return
            try:
                state.renew_contract(player_id)
            except Exception as exc:
                self.app.notify(str(exc), severity="error")
            else:
                self.app.notify("Contract renewed", severity="information")
            self.refresh()


class InformationView(BaseView):
    def compose(self) -> ComposeResult:
        yield Static(id="finances-table")
        yield Static("Weekly news", classes="list-title")
        yield ListView(id="news-list")
        with Horizontal():
            yield Button("Continue week", id="continue", variant="success")
            yield Button("Refresh", id="refresh-info", variant="primary")

    def refresh(self) -> None:
        data = self.app.state.finances()
        table = Table(title="Finances", expand=True)
        table.add_column("Category")
        table.add_column("Weekly")
        table.add_column("Season")

        for key, values in data["income"].items():
            table.add_row(f"Income – {key}", values["weekly"], values["yearly"])
        table.add_row("Income – Total", data["income_total"], data["income_total_yearly"])
        for key, values in data["expense"].items():
            table.add_row(f"Expense – {key}", values["weekly"], values["yearly"])
        table.add_row("Expense – Total", data["expense_total"], data["expense_total_yearly"])
        table.add_row("Balance", data["balance_weekly"], data["balance_yearly"])
        table.add_row("Cash", data["cash"], "")
        table.add_row("Season goal", str(data["goal"]), "")
        table.add_row("Fan happiness", str(data["fan_happiness"]), "")

        self.query_one("#finances-table", Static).update(table)

        news_list = self.query_one("#news-list", ListView)
        news_list.clear()
        for message in data["news"]:
            news_list.append(ListItem(Static(message)))

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "continue":
            try:
                summary = self.app.state.continue_week()
            except Exception as exc:
                self.app.notify(str(exc), severity="error")
                return
            self.app.show_summary(summary)
        elif event.button.id == "refresh-info":
            self.refresh()


class LeagueView(BaseView):
    def compose(self) -> ComposeResult:
        yield Static(id="league-table")
        yield Static("Latest fixtures", classes="list-title")
        yield ListView(id="fixtures-list")
        with Horizontal():
            yield Button("Higher division", id="prev-div", variant="primary")
            yield Button("Lower division", id="next-div", variant="primary")

    def refresh(self) -> None:
        data = self.app.state.league_view()
        table = Table(title=data["division"], expand=True)
        table.add_column("Pos")
        table.add_column("Team")
        table.add_column("W")
        table.add_column("D")
        table.add_column("L")
        table.add_column("GD")
        table.add_column("Pts")

        for row in data["table"]:
            team_name = row["team"]
            if row["highlight"]:
                team_name = f"[bold]{team_name}[/bold]"
            table.add_row(
                table_position_to_str(row["position"]),
                team_name,
                str(row["wins"]),
                str(row["draws"]),
                str(row["losses"]),
                str(row["goal_difference"]),
                str(row["points"]),
            )

        self.query_one("#league-table", Static).update(table)

        fixtures = self.query_one("#fixtures-list", ListView)
        fixtures.clear()
        for match in data["fixtures"]:
            fixtures.append(ListItem(Static(f"{match['home']} {match['score']} {match['away']}")))

        self.query_one("#prev-div", Button).disabled = not data["has_higher"]
        self.query_one("#next-div", Button).disabled = not data["has_lower"]

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "prev-div":
            self.app.state.change_division(-1)
            self.refresh()
        elif event.button.id == "next-div":
            self.app.state.change_division(1)
            self.refresh()

