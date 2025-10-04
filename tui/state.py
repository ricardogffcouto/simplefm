"""Domain level state helpers backing the terminal UI."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import pickle
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from lib.Game import Game
from lib.Match import Match
from lib.Team import Team
from lib.Player import Player
from lib import constants, db, helpers as lib_helpers

from . import formatters


DEFAULT_SAVE_DIR = Path.home() / ".simplefm" / "games"


@dataclass
class PlayerSummary:
    """Light-weight representation of a player for UI consumption."""

    identifier: int
    name: str
    position: str
    age: int
    skill: int
    status: int
    country: Optional[str]
    salary: int
    contract: int
    wanted_salary: Optional[int]
    injured: bool
    match_available: bool
    weekly_training: float
    skill_change: int
    value: int

    @classmethod
    def from_player(cls, player: Player) -> "PlayerSummary":
        return cls(
            identifier=id(player),
            name=player.name,
            position=player.pos_to_str(),
            age=player.age,
            skill=int(player.skill),
            status=player.playing_status,
            country=getattr(player, "country", None),
            salary=getattr(player, "salary", 0),
            contract=getattr(player, "contract", 0),
            wanted_salary=getattr(player, "wanted_salary", None),
            injured=player.injured(),
            match_available=player.match_available(),
            weekly_training=getattr(player, "weekly_training", 0.0),
            skill_change=getattr(player, "skill_change_last_week", 0),
            value=getattr(player, "current_value", lambda: 0)(),
        )


def _group_players(players: Iterable[Player]) -> Dict[str, List[PlayerSummary]]:
    groups: Dict[str, List[PlayerSummary]] = {
        "starting": [],
        "bench": [],
        "reserves": [],
    }
    for player in players:
        summary = PlayerSummary.from_player(player)
        if player.playing_status == 0:
            groups["starting"].append(summary)
        elif player.playing_status == 1:
            groups["bench"].append(summary)
        else:
            groups["reserves"].append(summary)
    return groups


def _match_team_index(match: Match, team: Team) -> int:
    return 0 if match.teams[0] == team else 1


class SimpleFMState:
    """Container encapsulating the simulation state for the TUI."""

    def __init__(self, save_dir: Optional[Path] = None) -> None:
        self.saves_dir = Path(save_dir or DEFAULT_SAVE_DIR)
        self.saves_dir.mkdir(parents=True, exist_ok=True)

        self.game: Optional[Game] = None
        self.active_team: Optional[Team] = None
        self.current_match: Optional[Match] = None
        self.auto_play: bool = False
        self.last_summary: Optional[Dict[str, object]] = None
        self.active_division_index: int = 0

    # ------------------------------------------------------------------
    # Game bootstrap / persistence
    # ------------------------------------------------------------------

    def list_saved_games(self) -> List[str]:
        return sorted(p.stem for p in self.saves_dir.glob("*.sfm"))

    def list_selectable_teams(self) -> List[Dict[str, str]]:
        total = constants.COMPETITION["TEAMS PER DIVISION"] * constants.COMPETITION[
            "TOTAL_NUMBER_OF_DIVISIONS"
        ]
        return db.TEAMS[:total]

    def list_countries(self) -> List[str]:
        return sorted(country["name"] for country in db.COUNTRIES)

    def list_colors(self) -> List[str]:
        return sorted(color["name"] for color in db.COLORS)

    def start_new_game(
        self,
        *,
        game_name: str,
        manager_name: str,
        team_name: Optional[str] = None,
        custom_team: Optional[Dict[str, object]] = None,
    ) -> Game:
        if not game_name:
            raise ValueError("Game name is required")
        if not manager_name:
            raise ValueError("Manager name is required")
        if (self.saves_dir / f"{game_name}.sfm").exists():
            raise ValueError("A save with that name already exists")

        if team_name is None and custom_team is None:
            raise ValueError("Either an existing team or custom team configuration is required")

        game = Game(name=game_name)

        if custom_team:
            name = str(custom_team["name"])
            if not name:
                raise ValueError("Custom team name cannot be empty")
            prev_div = int(custom_team["prev_div"])
            prev_pos = int(custom_team["prev_pos"])
            color = str(custom_team["color"])
            country = str(custom_team["country"])
        else:
            name = str(team_name)
            matches = [team for team in db.TEAMS if team["name"] == name]
            if not matches:
                raise ValueError("Selected team was not found")
            template = matches[0]
            color = template["color"]
            country = template["country"]
            prev_div = template.get("prev_div")
            prev_pos = template.get("prev_pos")

        manager = {"name": manager_name}
        human_team = {
            "name": name,
            "color": color,
            "country": country,
            "prev_pos": prev_pos,
            "prev_div": prev_div,
        }

        game.start(human_team=human_team, manager=manager)
        game.start_of_season()

        self.game = game
        if not game.human_teams:
            raise RuntimeError("Unable to locate the human controlled team")
        self.active_team = game.human_teams[0]
        self.active_division_index = game.divisions.index(self.active_team.division)
        self.current_match = None
        self.last_summary = None
        return game

    def load_game(self, name: str) -> Game:
        path = self.saves_dir / f"{name}.sfm"
        if not path.exists():
            raise FileNotFoundError(path)

        with path.open("rb") as fh:
            data = pickle.load(fh)

        game = Game()
        game.__dict__.update(data)

        self.game = game
        if not game.human_teams:
            raise RuntimeError("Save file does not contain a human controlled team")
        self.active_team = game.human_teams[0]
        self.active_division_index = game.divisions.index(self.active_team.division)
        self.current_match = None
        self.last_summary = None
        return game

    def save_game(self) -> None:
        if not self.game:
            raise RuntimeError("No active game to save")
        self.game.save(str(self.saves_dir))

    # ------------------------------------------------------------------
    # UI helpers
    # ------------------------------------------------------------------

    def header_context(self) -> Dict[str, object]:
        self._ensure_game()
        assert self.game and self.active_team
        return {
            "game_name": self.game.name,
            "team": self.active_team.name,
            "manager": self.active_team.manager.name,
            "season": self.game.season,
            "week": self.game.week + 1,
            "year": self.game.year(),
            "money": formatters.money_to_str(self.active_team.money),
            "fan_happiness": self.active_team.fan_happiness,
        }

    def team_overview(self) -> Dict[str, List[PlayerSummary]]:
        self._ensure_game()
        assert self.active_team
        self.active_team.order_players_by_playing_status()
        return _group_players(self.active_team.players)

    def tactic_options(self) -> List[str]:
        self._ensure_game()
        assert self.active_team
        options = [formatters.tactic_to_str(tac) for tac in self.active_team.list_of_allowed_tactics()]
        options.append("Top skill")
        return options

    def set_tactic(self, tactic_label: str) -> None:
        self._ensure_game()
        assert self.active_team
        if tactic_label == "Top skill":
            self.active_team.set_playing_tactic()
        else:
            tactic = lib_helpers.str_to_tactic(tactic_label)
            if tactic == "Top skill":
                self.active_team.set_playing_tactic()
            else:
                self.active_team.set_playing_tactic(tactic)

    def swap_players(self, player_out_id: int, player_in_id: int) -> bool:
        self._ensure_game()
        assert self.active_team
        player_out = self._player_by_id(player_out_id)
        player_in = self._player_by_id(player_in_id)
        success = self.active_team.replace_player(player_in, player_out)
        if success:
            self.active_team.order_players_by_playing_status()
        return success

    def next_opponent(self) -> Optional[Dict[str, object]]:
        self._ensure_game()
        assert self.game and self.active_team
        opponent = self.active_team.next_opponent(self.game.week)
        if not opponent:
            return None
        return {
            "name": opponent.name,
            "avg_skill": int(round(opponent.avg_skill, 0)),
            "tactic": formatters.tactic_to_str(opponent.tactic) if opponent.tactic else "?",
            "location": self.active_team.next_match_to_str(self.game.week),
        }

    # ------------------------------------------------------------------
    # Match handling
    # ------------------------------------------------------------------

    def begin_match(self) -> Match:
        self._ensure_game()
        assert self.game and self.active_team
        if self.current_match and not self.current_match.finished:
            return self.current_match
        match = self.active_team.next_match(self.game.week)
        if match is None:
            raise RuntimeError("No scheduled match for this week")
        self.current_match = match
        self.auto_play = False
        return match

    def match_context(self) -> Dict[str, object]:
        if not self.current_match:
            raise RuntimeError("Match has not started")

        match = self.current_match
        assert self.active_team
        team_index = _match_team_index(match, self.active_team)
        opponent = match.teams[1 - team_index]
        substitutions_left = 3 - match.substitutions[team_index]

        return {
            "minutes": match.minutes,
            "score": tuple(match.score),
            "home": match.teams[0].name,
            "away": match.teams[1].name,
            "is_home": team_index == 0,
            "possession": match.ball_possession(),
            "last_five": match.ball_possession_last_5_minutes(),
            "goalscorers": [
                {
                    "minute": scorer["minute"],
                    "name": scorer["player"].name,
                    "team": scorer["team"].name,
                }
                for scorer in match.goalscorers
            ],
            "on_pitch": [PlayerSummary.from_player(p) for p in self.active_team.players if p.playing_status == 0],
            "bench": [PlayerSummary.from_player(p) for p in self.active_team.players if p.playing_status == 1],
            "subs_left": substitutions_left,
            "allow_substitution": match.allow_substitution(self.active_team),
            "injured_player": PlayerSummary.from_player(match.injured_player_out)
            if match.injured_player_out
            else None,
            "finished": match.finished,
            "opponent": opponent.name,
        }

    def play_minute(self) -> None:
        if not self.current_match:
            raise RuntimeError("Match has not started")
        self.current_match.minute()

    def auto_play_tick(self) -> None:
        if not self.current_match:
            raise RuntimeError("Match has not started")
        self.auto_play = True
        if not self.current_match.finished:
            self.current_match.minute()
        if self.current_match.finished:
            self.auto_play = False

    def finish_match(self) -> None:
        if not self.current_match:
            raise RuntimeError("Match has not started")
        self.current_match.simulate(90)
        self.auto_play = False

    def make_substitution(self, player_out_id: int, player_in_id: int) -> bool:
        if not self.current_match:
            raise RuntimeError("Match has not started")
        assert self.active_team
        player_out = self._player_by_id(player_out_id)
        player_in = self._player_by_id(player_in_id)
        if not self.current_match.allow_substitution(self.active_team):
            return False
        success = self.active_team.replace_player(
            player_in, player_out, in_match=True, match_minutes=self.current_match.minutes
        )
        if success:
            self.current_match.substitution_made_by_team(self.active_team)
        return success

    def finalize_match(self) -> Dict[str, object]:
        if not self.current_match:
            raise RuntimeError("Match has not started")
        summary = self._prepare_weekly_summary(self.current_match)
        assert self.game
        self.game.simulate_weekly_matches()
        self.game.next_week()
        self.last_summary = summary
        self.current_match = None
        return summary

    # ------------------------------------------------------------------
    # Training and transfers
    # ------------------------------------------------------------------

    def training_report(self) -> List[Dict[str, object]]:
        self._ensure_game()
        assert self.active_team
        return [
            {
                "player": PlayerSummary.from_player(player),
                "training": formatters.training_to_str(player.weekly_training),
            }
            for player in self.active_team.players
        ]

    def transfer_targets(self) -> List[PlayerSummary]:
        self._ensure_game()
        assert self.active_team
        players = sorted(
            self.active_team.players_to_buy,
            key=lambda player: (-player.skill, player.current_value(), player.position),
        )
        return [PlayerSummary.from_player(player) for player in players]

    def squad_for_transfers(self) -> List[PlayerSummary]:
        self._ensure_game()
        assert self.active_team
        players = sorted(self.active_team.players, key=lambda p: (p.position, -p.current_value()))
        return [PlayerSummary.from_player(player) for player in players]

    def buy_player(self, player_id: int) -> bool:
        self._ensure_game()
        assert self.active_team
        player = self._player_from_transfer_list(player_id)
        if not player:
            return False
        if not self.active_team.has_place_to_buy_player():
            raise ValueError("Squad already at maximum size")
        if not self.active_team.has_money_to_buy_player(player):
            raise ValueError("Insufficient funds")
        self.active_team.buy_player(player)
        return True

    def sell_player(self, player_id: int) -> bool:
        self._ensure_game()
        assert self.active_team
        player = self._player_by_id(player_id)
        if not self.active_team.has_place_to_sell_player():
            raise ValueError("You must keep at least 11 players")
        if player.position == 0 and not self.active_team.has_at_least_one_gk():
            raise ValueError("Selling would leave you without a goalkeeper")
        if player.contract:
            raise ValueError("Player already has a contract for the season")
        if player.injured():
            raise ValueError("Cannot sell an injured player")
        self.active_team.sell_player(player)
        return True

    def renew_contract(self, player_id: int) -> bool:
        self._ensure_game()
        assert self.active_team
        player = self._player_by_id(player_id)
        if player.contract:
            raise ValueError("Player already has a contract")
        player.set_renew_contract_wanted_salary()
        self.active_team.renew_contract(player)
        return True

    # ------------------------------------------------------------------
    # Information and progression
    # ------------------------------------------------------------------

    def finances(self) -> Dict[str, object]:
        self._ensure_game()
        assert self.active_team
        income_keys = {"Prize Money", "Sold Players", "Sponsors"}
        expense_keys = {"Salaries", "Bought Players"}

        def _totals(keys: Iterable[str]) -> Tuple[int, int]:
            weekly = sum(self.active_team.weekly_finances[key] for key in keys)
            yearly = sum(self.active_team.yearly_finances[key] for key in keys)
            return weekly, yearly

        weekly_income, yearly_income = _totals(income_keys)
        weekly_expense, yearly_expense = _totals(expense_keys)

        balance_weekly = weekly_income - weekly_expense
        balance_yearly = yearly_income - yearly_expense

        return {
            "income": {
                key: {
                    "weekly": formatters.money_to_str(self.active_team.weekly_finances[key]),
                    "yearly": formatters.money_to_str(self.active_team.yearly_finances[key]),
                }
                for key in income_keys
            },
            "expense": {
                key: {
                    "weekly": formatters.money_to_str(self.active_team.weekly_finances[key]),
                    "yearly": formatters.money_to_str(self.active_team.yearly_finances[key]),
                }
                for key in expense_keys
            },
            "income_total": formatters.money_to_str(weekly_income),
            "income_total_yearly": formatters.money_to_str(yearly_income),
            "expense_total": formatters.money_to_str(weekly_expense),
            "expense_total_yearly": formatters.money_to_str(yearly_expense),
            "balance_weekly": formatters.money_to_str(balance_weekly),
            "balance_yearly": formatters.money_to_str(balance_yearly),
            "cash": formatters.money_to_str(self.active_team.money),
            "goal": self.active_team.min_pos_per_season_points_per_week(),
            "fan_happiness": self.active_team.fan_happiness,
            "news": self.active_team.weekly_news.str_list(),
        }

    def continue_week(self) -> Dict[str, object]:
        self._ensure_game()
        assert self.game and self.active_team
        match = self.active_team.next_match(self.game.week)
        summary = self._prepare_weekly_summary(match)
        self.game.simulate_weekly_matches()
        self.game.next_week()
        self.last_summary = summary
        return summary

    def league_view(self) -> Dict[str, object]:
        self._ensure_game()
        assert self.game
        division = self.game.divisions[self.active_division_index]
        division.order_table_by_position()
        table = [
            {
                "position": index + 1,
                "team": team.name,
                "wins": team.league_stats["Wins"],
                "draws": team.league_stats["Draws"],
                "losses": team.league_stats["Losses"],
                "goal_difference": team.goal_difference(),
                "points": team.league_points(),
                "highlight": getattr(self.active_team, "name", None) == team.name,
            }
            for index, team in enumerate(division.teams)
        ]

        week_index = max(0, min(self.game.week - 1, len(division.matches) - 1))
        fixtures = [
            {
                "home": match.teams[0].name,
                "away": match.teams[1].name,
                "score": f"{match.score[0]}-{match.score[1]}" if match.finished else "vs",
            }
            for match in division.matches[week_index]
        ]

        total_playable = len(self.game.divisions) - 1
        return {
            "division": division.name,
            "table": table,
            "fixtures": fixtures,
            "has_lower": self.active_division_index < total_playable - 1,
            "has_higher": self.active_division_index > 0,
        }

    def change_division(self, direction: int) -> None:
        self._ensure_game()
        assert self.game
        new_index = self.active_division_index + direction
        new_index = max(0, min(new_index, len(self.game.divisions) - 2))
        self.active_division_index = new_index

    def manager_stats(self) -> Dict[str, object]:
        self._ensure_game()
        assert self.active_team
        manager = self.active_team.manager
        manager.update_stats()
        career_stats = manager.career_stats()
        return {
            "name": manager.name,
            "points": manager.points(),
            "career": career_stats,
            "career_order": manager.career_stats_order(),
            "yearly": list(reversed(manager.yearly_stats)),
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _ensure_game(self) -> None:
        if not self.game or not self.active_team:
            raise RuntimeError("No active game")

    def _player_by_id(self, player_id: int) -> Player:
        assert self.active_team
        for player in self.active_team.players:
            if id(player) == int(player_id):
                return player
        raise ValueError(f"Unknown player id {player_id}")

    def _player_from_transfer_list(self, player_id: int) -> Optional[Player]:
        assert self.active_team
        for player in self.active_team.players_to_buy:
            if id(player) == int(player_id):
                return player
        return None

    def _prepare_weekly_summary(self, match: Optional[Match]) -> Dict[str, object]:
        self._ensure_game()
        assert self.active_team
        if match is None:
            match = self.active_team.next_match(self.game.week) if self.game else None

        match_summary = None
        if match:
            team_index = _match_team_index(match, self.active_team)
            opponent = match.teams[1 - team_index]
            result = "Draw"
            if match.score[team_index] > match.score[1 - team_index]:
                result = "Win"
            elif match.score[team_index] < match.score[1 - team_index]:
                result = "Loss"
            match_summary = {
                "opponent": opponent.name,
                "score": f"{match.score[team_index]}-{match.score[1 - team_index]}",
                "result": result,
                "goals": [
                    {
                        "minute": goal["minute"],
                        "player": goal["player"].name,
                        "team": goal["team"].name,
                    }
                    for goal in match.goalscorers
                ],
            }

        return {
            "match": match_summary,
            "finances": self.finances(),
            "training": self.training_report(),
            "news": self.active_team.weekly_news.str_list(),
        }

