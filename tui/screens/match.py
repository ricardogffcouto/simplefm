"""Live match centre replicating the classic SimpleFM flow."""

from __future__ import annotations

from typing import List, Tuple

from textual.app import ComposeResult
from textual.containers import Horizontal, Vertical
from textual.reactive import reactive
from textual.widgets import Button, Footer, Header, ListItem, ListView, Static

from ..state import PlayerSummary
from .base import StateScreen


class MatchPlayerList(ListView):
    def set_players(self, players: List[PlayerSummary]) -> None:
        self.clear()
        for player in players:
            info = f"{player.position} {player.name} ({player.age}) Skill {player.skill}"
            if player.injured:
                info += " [injured]"
            item = ListItem(Static(info))
            setattr(item, "player_id", player.identifier)
            self.append(item)


class MatchScreen(StateScreen):
    auto_running = reactive(False)

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        with Vertical(id="match-layout"):
            yield Static(id="scoreboard")
            yield Static(id="possession")
            with Horizontal(id="match-content"):
                with Vertical():
                    yield Static("Timeline", classes="list-title")
                    yield ListView(id="timeline")
                with Vertical(id="match-controls"):
                    yield Button("Play minute", id="play", variant="success")
                    yield Button("Auto-play", id="auto", variant="primary")
                    yield Button("Finish match", id="finish", variant="warning")
                    yield Button("Substitution", id="sub", variant="primary")
                    yield Static(id="subs-left")
                    yield Static(id="status-message")
            with Horizontal(id="match-lists"):
                with Vertical():
                    yield Static("On the pitch", classes="list-title")
                    yield MatchPlayerList(id="on-pitch")
                with Vertical():
                    yield Static("Bench", classes="list-title")
                    yield MatchPlayerList(id="bench")
        yield Footer()

    def on_mount(self) -> None:
        self._auto_task = None
        self._selection: List[Tuple[str, int]] = []
        try:
            self.app.state.begin_match()
        except Exception as exc:
            self.app.notify(str(exc), severity="error")
            self.app.pop_screen()
            return
        self.refresh()

    def on_unmount(self) -> None:
        self._stop_auto()

    def refresh(self) -> None:
        try:
            ctx = self.app.state.match_context()
        except Exception as exc:
            self.app.notify(str(exc), severity="error")
            self.app.pop_screen()
            return

        scoreboard = (
            f"{ctx['home']} {ctx['score'][0]} - {ctx['score'][1]} {ctx['away']}" +
            f"    Minute: {ctx['minutes']}'"
        )
        self.query_one("#scoreboard", Static).update(scoreboard)

        possession = (
            f"Possession: {ctx['possession'][0]}% - {ctx['possession'][1]}%"
            f"    Last 5': {ctx['last_five'][0]}% - {ctx['last_five'][1]}%"
        )
        self.query_one("#possession", Static).update(possession)

        timeline = self.query_one("#timeline", ListView)
        timeline.clear()
        if ctx['goalscorers']:
            for goal in ctx['goalscorers']:
                timeline.append(ListItem(Static(f"{goal['minute']}' {goal['player']} ({goal['team']})")))
        else:
            timeline.append(ListItem(Static("No events yet."), disabled=True))

        self.query_one("#on-pitch", MatchPlayerList).set_players(ctx['on_pitch'])
        self.query_one("#bench", MatchPlayerList).set_players(ctx['bench'])

        subs_left = f"Substitutions left: {ctx['subs_left']}"
        if ctx['injured_player']:
            subs_left += f"  |  Injured: {ctx['injured_player'].name}"
        self.query_one("#subs-left", Static).update(subs_left)

        status = "Match finished" if ctx['finished'] else ""
        self.query_one("#status-message", Static).update(status)

        self.query_one("#play", Button).disabled = ctx['finished']
        self.query_one("#auto", Button).label = "Stop auto" if self.auto_running else "Auto-play"
        self.query_one("#auto", Button).disabled = ctx['finished']
        self.query_one("#sub", Button).disabled = not ctx['allow_substitution']
        self.query_one("#finish", Button).label = "Continue" if ctx['finished'] else "Finish match"

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "play":
            self._stop_auto()
            self.app.state.play_minute()
            self._after_tick()
        elif event.button.id == "auto":
            if self.auto_running:
                self._stop_auto()
            else:
                self._start_auto()
        elif event.button.id == "finish":
            if self._is_match_finished():
                self._complete_match()
            else:
                self.app.state.finish_match()
                self._after_tick()
        elif event.button.id == "sub":
            self._prompt_substitution()

    def _start_auto(self) -> None:
        if not self.auto_running:
            self.auto_running = True
            self._auto_task = self.set_interval(0.5, self._auto_tick)

    def _stop_auto(self) -> None:
        if self.auto_running and self._auto_task:
            self._auto_task.cancel()
        self.auto_running = False
        self._auto_task = None

    def _auto_tick(self) -> None:
        self.app.state.auto_play_tick()
        self._after_tick()
        if self._is_match_finished():
            self._stop_auto()

    def _after_tick(self) -> None:
        self.refresh()
        if self._is_match_finished() and not self.auto_running:
            self.app.notify("Match finished", severity="information")

    def _is_match_finished(self) -> bool:
        try:
            return self.app.state.match_context()["finished"]
        except Exception:
            return False

    def _complete_match(self) -> None:
        self._stop_auto()
        summary = self.app.state.finalize_match()
        self.app.show_summary(summary)
        self.app.pop_screen()

    def _prompt_substitution(self) -> None:
        ctx = self.app.state.match_context()
        if not ctx["allow_substitution"]:
            self.app.notify("No substitutions left", severity="warning")
            return
        self._selection.clear()
        self.app.notify("Select the player to replace and then the substitute", severity="information")

    def on_list_view_selected(self, event: ListView.Selected) -> None:
        if event.list_view.id not in {"on-pitch", "bench"}:
            return
        player_id = getattr(event.item, "player_id", None)
        if player_id is None:
            return
        self._selection.append((event.list_view.id, player_id))
        if len(self._selection) == 2:
            self._make_substitution()

    def _make_substitution(self) -> None:
        ctx = self.app.state.match_context()
        injured = ctx["injured_player"]
        on_pitch = next((pid for list_id, pid in self._selection if list_id == "on-pitch"), None)
        bench = next((pid for list_id, pid in self._selection if list_id == "bench"), None)
        self._selection.clear()

        if bench is None:
            self.app.notify("Choose a player from the bench", severity="warning")
            return

        if on_pitch is None:
            if injured is not None:
                on_pitch = injured.identifier
            else:
                self.app.notify("Choose a player on the pitch", severity="warning")
                return

        success = self.app.state.make_substitution(on_pitch, bench)
        if not success:
            self.app.notify("Substitution not allowed", severity="error")
        else:
            self.app.notify("Substitution made", severity="information")
        self.refresh()

