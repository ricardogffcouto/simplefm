import base64
import json
import pickle
from typing import Dict, List, Optional

from lib.Game import Game
from lib import constants
import lib.db as db

GAME: Optional[Game] = None
ACTIVE_TEAM = None
CURRENT_MATCH = None


POSITION_LABELS = {
    0: "GK",
    1: "DF",
    2: "MF",
    3: "FW",
}

PLAYING_STATUS = {
    0: "starter",
    1: "bench",
    2: "reserve",
}


def _color_hex(color_name: Optional[str]) -> str:
    if not color_name:
        return "#485C96"
    for color in db.COLORS:
        if color["name"].lower() == color_name.lower():
            return color["hex"]
    return "#485C96"


def _refresh_active_team():
    global ACTIVE_TEAM
    if GAME and GAME.human_teams:
        ACTIVE_TEAM = GAME.human_teams[0]
    else:
        ACTIVE_TEAM = None


def _player_payload(player, include_finances: bool = True) -> Dict:
    payload = {
        "id": id(player),
        "name": player.name,
        "age": int(player.age),
        "skill": float(player.skill),
        "position": POSITION_LABELS.get(player.position, "?"),
        "positionIndex": int(player.position),
        "status": PLAYING_STATUS.get(player.playing_status, "reserve"),
        "injury": int(player.injury),
        "contract": int(player.contract),
        "wantsNewContract": bool(player.wants_new_contract),
        "matchAvailable": bool(player.match_available()),
        "matchMinutes": int(player.match_minutes),
        "subMinutes": int(player.sub_minutes),
        "homegrown": bool(getattr(player, "is_homegrown", False)),
        "skillChangeLastWeek": float(getattr(player, "skill_change_last_week", 0)),
        "weeklyTraining": float(getattr(player, "weekly_training", 0)),
        "country": player.country,
    }
    if include_finances:
        payload.update(
            {
                "salary": int(player.salary),
                "value": int(player.current_value()),
                "wantedSalary": int(player.wanted_salary)
                if getattr(player, "wanted_salary", None)
                else None,
            }
        )
    return payload


def _goals_payload(match):
    goals = []
    for goal in match.goalscorers:
        goals.append(
            {
                "minute": int(goal["minute"]),
                "team": 0 if goal["team"] == match.teams[0] else 1,
                "playerId": id(goal["player"]),
                "player": goal["player"].name,
            }
        )
    return goals


def _division_table_payload(division):
    division.order_table_by_position()
    table = []
    for pos, team in enumerate(division.teams):
        table.append(
            {
                "position": pos + 1,
                "team": team.name,
                "wins": int(team.league_stats["Wins"]),
                "draws": int(team.league_stats["Draws"]),
                "losses": int(team.league_stats["Losses"]),
                "goalsFor": int(team.league_stats["Goals For"]),
                "goalsAgainst": int(team.league_stats["Goals Against"]),
                "goalDifference": int(team.goal_difference()),
                "points": int(team.league_points()),
                "teamColor": _color_hex(team.color),
            }
        )
    return table


def _division_matches_payload(division, week_index: int):
    if week_index < 0:
        return []
    if week_index >= len(division.matches):
        week_index = len(division.matches) - 1
    matches = []
    for match in division.matches[week_index]:
        matches.append(
            {
                "home": match.teams[0].name if match.teams[0] else None,
                "away": match.teams[1].name if match.teams[1] else None,
                "homeGoals": int(match.score[0]) if match.finished else None,
                "awayGoals": int(match.score[1]) if match.finished else None,
                "finished": bool(match.finished),
                "winner": match.winner().name if match.finished and match.winner() else None,
                "loser": match.loser().name if match.finished and match.loser() else None,
            }
        )
    return matches


def _season_goal_text(points_target: float) -> str:
    thresholds = [
        (13, "Avoid relegation"),
        (11, "Finish mid table"),
        (9, "Finish on the top half"),
        (6, "Finish above 6th place"),
        (3, "Finish on the top 3"),
        (1, "Be the champion"),
    ]
    for position, text in thresholds:
        if points_target <= position:
            return text
    return "Be the champion"


def get_new_game_metadata():
    allowed = (
        constants.COMPETITION["TEAMS PER DIVISION"]
        * constants.COMPETITION["TOTAL_NUMBER_OF_DIVISIONS"]
    )
    teams = [team["name"] for team in db.TEAMS[:allowed]]
    colors = sorted(db.COLORS, key=lambda c: c["name"])
    countries = sorted(db.COUNTRIES, key=lambda c: c["name"])
    return {
        "teams": teams,
        "colors": colors,
        "countries": countries,
        "defaultPrevDiv": 1,
        "defaultPrevPos": 1,
        "maxDiv": constants.COMPETITION["TOTAL_NUMBER_OF_DIVISIONS"],
        "maxPos": constants.COMPETITION["TEAMS PER DIVISION"],
    }


def _human_team_payload():
    _refresh_active_team()
    if not ACTIVE_TEAM:
        return None
    team = ACTIVE_TEAM
    return {
        "name": team.name,
        "color": team.color,
        "colorHex": _color_hex(team.color),
        "country": team.country,
        "division": team.division.name,
        "divisionLevel": team.division.level + 1,
        "position": team.division.team_position(team),
        "tactic": "-".join(map(str, team.current_tactic())),
        "manager": team.manager.name if team.manager else None,
        "week": GAME.week + 1,
        "maxWeeks": constants.COMPETITION["TOTAL GAMES"],
        "year": GAME.year(),
        "money": int(team.money),
        "fanHappiness": float(team.fan_happiness),
        "seasonGoalPosition": team.min_pos_per_season_points_per_week(),
        "seasonGoalText": _season_goal_text(team.min_pos_per_season_points_per_week()),
        "seasonPointsPerWeek": float(team.season_points_per_week),
        "weeklySponsorship": int(team.weekly_sponsorship),
        "weeklyFinances": {k: int(v) for k, v in team.weekly_finances.items()},
        "yearlyFinances": {k: int(v) for k, v in team.yearly_finances.items()},
    }


def start_new_game(game_name: str, manager_name: str, selected_team: Optional[str] = None, new_team: Optional[Dict] = None):
    global GAME, CURRENT_MATCH
    GAME = Game(name=game_name)

    if new_team:
        name = new_team["name"]
        color = new_team["color"]
        country_name = new_team["country"]
        prev_div = int(new_team.get("prev_div", 1))
        prev_pos = int(new_team.get("prev_pos", 1))
        country = next((c["id"] for c in db.COUNTRIES if c["name"] == country_name), country_name)
    else:
        name = selected_team
        team_data = next(team for team in db.TEAMS if team["name"] == name)
        color = team_data["color"]
        country = team_data["country"]
        prev_div = team_data.get("prev_div") if "prev_div" in team_data else None
        prev_pos = team_data.get("prev_pos") if "prev_pos" in team_data else None

    manager = {"name": manager_name}
    human_team = {
        "name": name,
        "color": color,
        "country": country,
        "prev_pos": prev_pos,
        "prev_div": prev_div,
    }

    GAME.start(human_team=human_team, manager=manager)
    GAME.start_of_season()
    _refresh_active_team()
    CURRENT_MATCH = None
    return get_dashboard()


def get_dashboard():
    payload = {
        "team": _human_team_payload(),
        "gameEnded": GAME.ended if GAME else False,
        "gameName": GAME.name if GAME else None,
    }
    if ACTIVE_TEAM:
        payload["table"] = _division_table_payload(ACTIVE_TEAM.division)
    return payload


def serialize_current_game() -> Optional[str]:
    if not GAME:
        return None
    data = pickle.dumps(GAME.__dict__)
    return base64.b64encode(data).decode("utf-8")


def load_game_from_blob(blob: str):
    global GAME, CURRENT_MATCH
    game_dict = pickle.loads(base64.b64decode(blob))
    GAME = Game()
    GAME.__dict__.update(game_dict)
    _refresh_active_team()
    CURRENT_MATCH = None
    return get_dashboard()


def inspect_game_blob(blob: str):
    game_dict = pickle.loads(base64.b64decode(blob))
    game = Game()
    game.__dict__.update(game_dict)
    team = game.human_teams[0]
    return {
        "name": game.name,
        "team": team.name,
        "division": team.division.name,
        "position": team.division.team_position(team),
        "week": game.week + 1,
        "year": game.year(),
        "colorHex": _color_hex(team.color),
    }


def _squad_payload():
    if not ACTIVE_TEAM:
        return None
    ACTIVE_TEAM.order_players_by_playing_status()
    players = [_player_payload(p) for p in ACTIVE_TEAM.players]
    allowed = ["-".join(map(str, tac)) for tac in ACTIVE_TEAM.list_of_allowed_tactics()]
    return {
        "players": players,
        "currentTactic": "-".join(map(str, ACTIVE_TEAM.current_tactic())),
        "allowedTactics": sorted(set(allowed)),
        "topSkillOption": True,
        "upcomingMatch": _upcoming_match_payload(),
    }


def _upcoming_match_payload():
    if not ACTIVE_TEAM:
        return None
    match = ACTIVE_TEAM.next_match(GAME.week)
    if not match:
        return None
    opponent = ACTIVE_TEAM.next_opponent(GAME.week)
    is_home = match.teams[0] == ACTIVE_TEAM
    return {
        "home": match.teams[0].name,
        "away": match.teams[1].name,
        "isHome": is_home,
        "opponent": opponent.name if opponent else None,
        "opponentSkill": float(opponent.avg_skill) if opponent else None,
        "opponentTactic": "-".join(map(str, opponent.current_tactic())) if opponent else None,
        "matchWeek": GAME.week + 1,
        "finished": bool(match.finished),
        "score": list(match.score),
        "homeColor": _color_hex(match.teams[0].color if match.teams[0] else None),
        "awayColor": _color_hex(match.teams[1].color if match.teams[1] else None),
    }


def get_squad_view():
    return _squad_payload()


def set_tactic(tactic: Optional[str]):
    if not ACTIVE_TEAM:
        return get_squad_view()
    if tactic and tactic.lower() == "top skill":
        ACTIVE_TEAM.set_playing_tactic()
    elif tactic:
        tac = [int(x) for x in tactic.split("-")]
        ACTIVE_TEAM.set_playing_tactic(tac)
    else:
        ACTIVE_TEAM.set_playing_tactic()
    ACTIVE_TEAM.order_players_by_playing_status()
    return get_squad_view()


def swap_players(player_out_id: int, player_in_id: int):
    if not ACTIVE_TEAM:
        return get_squad_view()
    player_out = ACTIVE_TEAM.id_to_player(player_out_id)
    player_in = ACTIVE_TEAM.id_to_player(player_in_id)
    if player_out and player_in:
        ACTIVE_TEAM.replace_player(player_in=player_in, player_out=player_out)
    ACTIVE_TEAM.order_players_by_playing_status()
    return get_squad_view()


def get_transfer_market():
    if not ACTIVE_TEAM:
        return None
    ACTIVE_TEAM.set_transfer_list()
    players = [_player_payload(p) for p in ACTIVE_TEAM.players_to_buy]
    return {
        "players": players,
        "money": int(ACTIVE_TEAM.money),
    }


def buy_player(player_id: int):
    if not ACTIVE_TEAM:
        return get_transfer_market()
    player = next((p for p in ACTIVE_TEAM.players_to_buy if id(p) == int(player_id)), None)
    if player:
        ACTIVE_TEAM.buy_player(player)
        ACTIVE_TEAM.order_players_by_playing_status()
    return get_transfer_market()


def get_roster():
    if not ACTIVE_TEAM:
        return None
    ACTIVE_TEAM.order_players_by_playing_status()
    players = [_player_payload(p) for p in ACTIVE_TEAM.players]
    return {
        "players": players,
        "money": int(ACTIVE_TEAM.money),
    }


def sell_player(player_id: int):
    if not ACTIVE_TEAM:
        return get_roster()
    player = ACTIVE_TEAM.id_to_player(player_id)
    if player:
        ACTIVE_TEAM.sell_player(player)
        ACTIVE_TEAM.order_players_by_playing_status()
    return get_roster()


def renew_contract(player_id: int):
    if not ACTIVE_TEAM:
        return get_roster()
    player = ACTIVE_TEAM.id_to_player(player_id)
    if player:
        ACTIVE_TEAM.renew_contract(player)
        ACTIVE_TEAM.order_players_by_playing_status()
    return get_roster()


def get_training_report():
    if not ACTIVE_TEAM:
        return []
    return [
        {
            "id": id(player),
            "name": player.name,
            "position": POSITION_LABELS.get(player.position, "?"),
            "skill": int(player.skill),
            "skillChange": int(player.skill_change_last_week),
            "weeklyTraining": float(player.weekly_training),
        }
        for player in ACTIVE_TEAM.players
    ]


def prepare_match():
    global CURRENT_MATCH
    if not ACTIVE_TEAM:
        return None
    match = ACTIVE_TEAM.next_match(GAME.week)
    CURRENT_MATCH = match
    return _match_payload()


def _match_payload():
    if not CURRENT_MATCH:
        return None
    match = CURRENT_MATCH
    return {
        "minute": int(match.minutes),
        "score": list(match.score),
        "finished": bool(match.finished),
        "possession": match.ball_possession(),
        "last5": match.ball_possession_last_5_minutes(),
        "goals": _goals_payload(match),
        "injuredPlayerId": id(match.injured_player_out) if match.injured_player_out else None,
        "allowSubstitution": bool(match.allow_substitution(ACTIVE_TEAM)),
        "substitutions": list(match.substitutions),
        "humanIndex": 0 if match.teams[0] == ACTIVE_TEAM else 1,
        "home": {
            "name": match.teams[0].name if match.teams[0] else None,
            "color": _color_hex(match.teams[0].color if match.teams[0] else None),
            "isHuman": bool(match.teams[0].human) if match.teams[0] else False,
        },
        "away": {
            "name": match.teams[1].name if match.teams[1] else None,
            "color": _color_hex(match.teams[1].color if match.teams[1] else None),
            "isHuman": bool(match.teams[1].human) if match.teams[1] else False,
        },
        "team": {
            "players": [_player_payload(p, include_finances=False) for p in ACTIVE_TEAM.players],
        },
    }


def simulate_minutes(minutes: int = 1):
    if not CURRENT_MATCH:
        return _match_payload()
    match = CURRENT_MATCH
    events: List[Dict] = []
    for _ in range(minutes):
        if match.finished:
            break
        before_goals = len(match.goalscorers)
        before_injured = match.injured_player_out
        progressed = match.minute()
        if not progressed:
            break
        if len(match.goalscorers) > before_goals:
            new_goals = match.goalscorers[before_goals:]
            for goal in new_goals:
                events.append(
                    {
                        "type": "goal",
                        "minute": int(goal["minute"]),
                        "team": 0 if goal["team"] == match.teams[0] else 1,
                        "player": goal["player"].name,
                        "playerId": id(goal["player"]),
                    }
                )
        if match.injured_player_out and match.injured_player_out != before_injured:
            events.append(
                {
                    "type": "injury",
                    "minute": int(match.minutes),
                    "player": match.injured_player_out.name,
                    "playerId": id(match.injured_player_out),
                }
            )
    payload = _match_payload()
    if payload is not None:
        payload["events"] = events
    return payload


def auto_play_match():
    return simulate_minutes(200)


def make_substitution(player_out_id: int, player_in_id: int):
    if not CURRENT_MATCH:
        return _match_payload()
    player_out = ACTIVE_TEAM.id_to_player(player_out_id)
    player_in = ACTIVE_TEAM.id_to_player(player_in_id)
    if player_in and player_out:
        if CURRENT_MATCH.allow_substitution(ACTIVE_TEAM) and ACTIVE_TEAM.can_substitute_player(player_in, player_out):
            ACTIVE_TEAM.replace_player(
                player_in=player_in,
                player_out=player_out,
                in_match=True,
                match_minutes=CURRENT_MATCH.minutes,
            )
            if CURRENT_MATCH.injured_player_out == player_out:
                CURRENT_MATCH.injured_player_out = None
            CURRENT_MATCH.substitution_made_by_team(ACTIVE_TEAM)
    return _match_payload()


def complete_match():
    global CURRENT_MATCH
    if not CURRENT_MATCH:
        return {
            "match": None,
            "summary": None,
        }
    match_info = _match_payload()
    GAME.simulate_weekly_matches()
    GAME.next_week()
    CURRENT_MATCH = None
    ACTIVE_TEAM.order_players_by_playing_status()
    summary = build_weekly_summary()
    return {
        "match": match_info,
        "summary": summary,
    }


def build_weekly_summary():
    team = ACTIVE_TEAM
    division = team.division
    last_week = GAME.week - 1
    return {
        "team": _human_team_payload(),
        "divisionTable": _division_table_payload(division),
        "weeklyResults": _division_matches_payload(division, last_week),
        "finances": {
            "weekly": {k: int(v) for k, v in team.weekly_finances.items()},
            "yearly": {k: int(v) for k, v in team.yearly_finances.items()},
            "balanceWeekly": int(team.finances_weekly_income() - team.finances_weekly_expense()),
            "balanceYearly": int(team.finances_yearly_income() - team.finances_yearly_expense()),
            "money": int(team.money),
        },
        "fanHappiness": float(team.fan_happiness),
        "weeklyNews": team.weekly_news.str_list(),
        "training": get_training_report(),
        "seasonEnded": GAME.is_season_over(),
        "gameEnded": GAME.ended,
    }


def progress_new_season():
    GAME.end_of_season()
    GAME.start_of_season()
    _refresh_active_team()
    ACTIVE_TEAM.order_players_by_playing_status()
    return get_dashboard()


def get_league_data():
    if not ACTIVE_TEAM:
        return None
    division = ACTIVE_TEAM.division
    return {
        "table": _division_table_payload(division),
        "fixtures": [
            {
                "week": i + 1,
                "home": match.teams[0].name if match.teams[0] else None,
                "away": match.teams[1].name if match.teams[1] else None,
                "homeGoals": int(match.score[0]) if match.finished else None,
                "awayGoals": int(match.score[1]) if match.finished else None,
                "finished": bool(match.finished),
            }
            for i, match in enumerate(division.team_matches(ACTIVE_TEAM))
        ],
    }


def get_manager_stats():
    if not ACTIVE_TEAM:
        return None
    manager = ACTIVE_TEAM.manager
    manager.update_stats()
    career = manager.career_stats()
    yearly = []
    start_year = constants.GAME.get("STARTING YEAR", 2023)
    for idx, stats in enumerate(manager.yearly_stats):
        year = start_year + idx
        yearly.append(
            {
                "year": year,
                "division": stats.get("div"),
                "divisionLevel": stats.get("div_level"),
                "position": stats.get("pos"),
                "wins": stats.get("Wins"),
                "draws": stats.get("Draws"),
                "losses": stats.get("Losses"),
                "goalsFor": stats.get("Goals For"),
                "goalsAgainst": stats.get("Goals Against"),
                "points": stats.get("pts"),
            }
        )
    return {
        "name": manager.name,
        "points": manager.points(),
        "career": career,
        "yearly": yearly,
    }


def export_state():
    return {
        "dashboard": get_dashboard(),
        "squad": get_squad_view(),
        "transfers": get_transfer_market(),
        "roster": get_roster(),
        "training": get_training_report(),
        "league": get_league_data(),
        "manager": get_manager_stats(),
    }
