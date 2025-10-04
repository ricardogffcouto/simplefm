"""Screen for creating a new SimpleFM career."""

from __future__ import annotations

from typing import Optional

from textual.app import ComposeResult
from textual.containers import Grid, Vertical
from textual.reactive import reactive
from textual.widgets import Button, Footer, Header, Input, Select, Static

from lib import constants

from .base import StateScreen


class NewGameScreen(StateScreen):
    custom_enabled = reactive(False)

    def compose(self) -> ComposeResult:
        state = self.app.state

        yield Header(show_clock=True)
        with Vertical(id="form-layout"):
            yield Static("[bold]Create a new career[/bold]", id="form-title")
            yield Input(placeholder="Game name", id="game-name")
            yield Input(placeholder="Manager name", id="manager-name")

            team_options = [(team["name"], team["name"]) for team in state.list_selectable_teams()]
            team_options.append(("Create custom club", "__custom__"))
            yield Select(team_options, id="team-select", prompt="Choose team", value=team_options[0][1] if team_options else None)

            with Grid(id="custom-section"):
                yield Input(placeholder="Custom club name", id="custom-name")
                yield Select([(c, c) for c in state.list_countries()], id="custom-country", prompt="Country")
                yield Select([(c, c) for c in state.list_colors()], id="custom-color", prompt="Primary colour")

                divisions = [(str(i), str(i)) for i in range(1, constants.COMPETITION["TOTAL_NUMBER_OF_DIVISIONS"] + 1)]
                yield Select(divisions, id="custom-division", prompt="Starting division", value=divisions[0][1])

                positions = [(str(i), str(i)) for i in range(1, constants.COMPETITION["TEAMS PER DIVISION"] + 1)]
                yield Select(positions, id="custom-position", prompt="Previous season position", value=positions[0][1])

            yield Button("Create game", id="create", variant="success")
            yield Button("Back", id="back", variant="warning")
        yield Footer()

    def on_mount(self) -> None:
        self._update_custom_visibility()

    def watch_custom_enabled(self, enabled: bool) -> None:
        self._update_custom_visibility()

    def _update_custom_visibility(self) -> None:
        custom = self.query_one("#custom-section")
        custom.display = "block" if self.custom_enabled else "none"

    def on_select_changed(self, event: Select.Changed) -> None:
        if event.select.id == "team-select":
            self.custom_enabled = event.value == "__custom__"

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "create":
            self._create_game()
        elif event.button.id == "back":
            self.app.pop_screen()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _create_game(self) -> None:
        state = self.app.state

        game_name = self.query_one("#game-name", Input).value.strip()
        manager_name = self.query_one("#manager-name", Input).value.strip()
        team_value = self.query_one("#team-select", Select).value

        team_name: Optional[str] = None
        custom: Optional[dict] = None

        if team_value == "__custom__":
            custom_name = self.query_one("#custom-name", Input).value.strip()
            custom_country = self.query_one("#custom-country", Select).value
            custom_color = self.query_one("#custom-color", Select).value
            custom_division = self.query_one("#custom-division", Select).value
            custom_position = self.query_one("#custom-position", Select).value

            custom = {
                "name": custom_name,
                "country": custom_country,
                "color": custom_color,
                "prev_div": custom_division,
                "prev_pos": custom_position,
            }
        else:
            team_name = team_value

        try:
            state.start_new_game(
                game_name=game_name,
                manager_name=manager_name,
                team_name=team_name,
                custom_team=custom,
            )
        except Exception as exc:
            self.app.notify(str(exc), severity="error")
            return

        self.app.notify("Career created", severity="information")
        self.app.show_main()

