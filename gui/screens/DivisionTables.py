#!/usr/bin/python
#encoding: utf-8

from kivy.app import App
from kivy.uix.screenmanager import Screen
from gui.widgets.GlobalWidgets import ScrollableList
from kivy.uix.boxlayout import BoxLayout
import gui.helpers

class MatchResults(ScrollableList):
    current_week = None
    current_division = None

    def refresh(self):
        self.data = [{
            'week': "",
            'home_team': "[b]{}[/b]".format(match.teams[0].name) if match.teams[0] == ACTIVE_TEAM else match.teams[0].name,
            'home_goals': "[b]{}[/b]".format(match.score[0]) if match.finished and match.teams[0] == ACTIVE_TEAM else str(match.score[0]) if match.finished else "",
            'away_team': "[b]{}[/b]".format(match.teams[1].name) if match.teams[1] == ACTIVE_TEAM else match.teams[1].name,
            'away_goals': "[b]{}[/b]".format(match.score[1]) if match.finished and match.teams[1] == ACTIVE_TEAM else str(match.score[1]) if match.finished else "",
            'extra_info': "" if ACTIVE_TEAM not in match.teams else "[color={}][b]{}[/b][/color]".format(gui.helpers.COLORS["Red"], "L") if match.loser() == ACTIVE_TEAM else "[color={}][b]{}[/b][/color]".format(gui.helpers.COLORS["Green"], "W") if match.winner() == ACTIVE_TEAM else "[color={}][b]{}[/b][/color]".format(gui.helpers.COLORS["Yellow"], "D") if match.finished else ""}
            for match in self.current_division.matches[self.current_week]]

        highlight_data = [data for data in self.data if data['home_team'].strip('[b]').strip('[/b]') == ACTIVE_TEAM.name or data['away_team'].strip('[b]').strip('[/b]') == ACTIVE_TEAM.name]

        if len(highlight_data):
            self.color_label_background(highlight_data=highlight_data[0], highlight_color=gui.helpers.color(col=ACTIVE_TEAM.color, tint=0.6))
        else:
            self.color_label_background()

class LeagueTable(ScrollableList):
    current_division = None

    def refresh(self):
        self.current_division.order_table_by_position()
        self.data = [{
            'position': '[color={}][b]{}[/b][/color]'.format('#009900' if pos < 3 else '#CC0000' if pos >= 13 else '#333333', str(pos + 1)),
            'name': team.name,
            'wins': str(team.league_stats['Wins']),
            'draws': str(team.league_stats['Draws']),
            'losses': str(team.league_stats['Losses']),
            'goals_for': str(team.league_stats['Goals For']),
            'goals_against': str(team.league_stats['Goals Against']),
            'goal_difference': str(team.league_stats['Goals For'] - team.league_stats['Goals Against']) if team.league_stats['Goals For'] - team.league_stats['Goals Against'] <= 0 else "+{}".format(team.league_stats['Goals For'] - team.league_stats['Goals Against']),
            'points': str(team.league_points())}
            for pos, team in enumerate(self.current_division.teams)]

        highlight_data = [data for data in self.data if data['name'] == ACTIVE_TEAM.name]

        if len(highlight_data):
            self.color_label_background(highlight_data=highlight_data[0], highlight_color=gui.helpers.color(col=ACTIVE_TEAM.color, tint=0.6), bolden = True)
        else:
            self.color_label_background()

class DivisionMatchesTablesScreen(Screen):
    current_division = None
    current_week = None
    results = True

    def next_div(self):
        i = GAME.divisions.index(self.current_division)
        if i > 0:
            self.current_division = GAME.divisions[i - 1]
            self.refresh()

    def prev_div(self):
        i = GAME.divisions.index(self.current_division)
        if i < len(GAME.divisions) - 2:
            self.current_division = GAME.divisions[i + 1]
            self.refresh()

    def refresh(self):
        self.current_week = GAME.week

        current_week = self.current_week
        if self.results:
            current_week -= 1

        if not self.current_division:
            self.current_division = ACTIVE_TEAM.division

        self.ids['match_results'].current_division = self.current_division
        self.ids['match_results'].current_week = current_week
        self.ids['match_results'].refresh()
        self.ids["week"].text = '{} MATCHES:'.format(self.current_division.name)
        gui.helpers.recycle_view_adjust_size_hint_y_to_window(self.ids["match_results"], self.manager.size_hint_y)
        self.ids['league_table'].current_division = self.current_division
        self.ids['league_table'].refresh()
        gui.helpers.recycle_view_adjust_size_hint_y_to_window(self.ids["league_table"], self.manager.size_hint_y)

        i = GAME.divisions.index(self.current_division)
        if i > 0:
            self.ids["next_div"].label_text = GAME.divisions[i - 1].name
            self.ids["next_div"].clickable = True
            self.ids["next_div"].disabled = False
        else:
            self.ids["next_div"].label_text = ""
            self.ids["next_div"].clickable = False
            self.ids["next_div"].disabled = True

        if i < len(GAME.divisions) - 2:
            self.ids["prev_div"].label_text = GAME.divisions[i + 1].name
            self.ids["prev_div"].clickable = True
            self.ids["prev_div"].disabled = False
        else:
            self.ids["prev_div"].label_text = ""
            self.ids["prev_div"].clickable = False
            self.ids["prev_div"].disabled = True

    def on_pre_enter(self):
        global GAME
        GAME = App.get_running_app().GAME
        global ACTIVE_TEAM
        ACTIVE_TEAM = GAME.human_teams[0]
        self.current_division = ACTIVE_TEAM.division
        self.refresh()


class DivisionAllMatchesTablesScreen(Screen):
    current_division = None
    current_week = None
    results = True

    def refresh(self):
        self.current_week = GAME.week

        current_week = self.current_week
        if self.results:
            current_week -= 1

        if not self.current_division:
            self.current_division = ACTIVE_TEAM.division

        self.ids['match_results'].current_division = self.current_division
        self.ids['match_results'].current_week = current_week
        self.ids['match_results'].refresh()
        self.ids["week"].text = '{} MATCHES:'.format(self.current_division.name)
        gui.helpers.recycle_view_adjust_size_hint_y_to_window(self.ids["match_results"], self.manager.size_hint_y)
        self.ids['league_table'].current_division = self.current_division
        self.ids['league_table'].refresh()
        self.ids["league_table"].size_hint_y = 0.71 - self.ids["match_results"].size_hint_y


    def on_pre_enter(self):
        global GAME
        GAME = App.get_running_app().GAME
        global ACTIVE_TEAM
        ACTIVE_TEAM = GAME.human_teams[0]
        self.current_division = ACTIVE_TEAM.division
        self.refresh()

class AllMatchesScreen(Screen):
    def refresh(self):
        self.ids['match_results'].data = [{
            'week': "[color={}]{}[/color]".format(gui.helpers.COLORS["Red" if match.loser() == ACTIVE_TEAM else "Green" if match.winner() == ACTIVE_TEAM else "Yellow" if match.finished else "Black"], i+1),
            'home_team': "[b]{}[/b]".format(match.teams[0].name) if match.teams[0] == ACTIVE_TEAM else match.teams[0].name,
            'home_goals': "[b]{}[/b]".format(match.score[0]) if match.finished and match.teams[0] == ACTIVE_TEAM else str(match.score[0]) if match.finished else "",
            'away_team': "[b]{}[/b]".format(match.teams[1].name) if match.teams[1] == ACTIVE_TEAM else match.teams[1].name,
            'away_goals': "[b]{}[/b]".format(match.score[1]) if match.finished and match.teams[1] == ACTIVE_TEAM else str(match.score[1]) if match.finished else "",
            'extra_info': "[color={}][b]{}[/b][/color]".format(gui.helpers.COLORS["Red"], "L") if match.loser() == ACTIVE_TEAM else "[color={}][b]{}[/b][/color]".format(gui.helpers.COLORS["Green"], "W") if match.winner() == ACTIVE_TEAM else "[color={}][b]{}[/b][/color]".format(gui.helpers.COLORS["Yellow"], "D") if match.finished else ""}
            for i, match in enumerate(ACTIVE_TEAM.division.team_matches(ACTIVE_TEAM))]

        self.ids['match_results'].color_label_background()

    def on_pre_enter(self):
        global GAME
        GAME = App.get_running_app().GAME
        global ACTIVE_TEAM
        ACTIVE_TEAM = GAME.human_teams[0]
        self.refresh()