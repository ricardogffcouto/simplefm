#!/usr/bin/python
#encoding: utf-8


import gui.helpers
from kivy.uix.screenmanager import Screen
from kivy.app import App

class EndofSeason(Screen):
    def refresh(self):
        self.on_pre_enter()

    def on_pre_enter(self):
        global GAME
        GAME = App.get_running_app().GAME
        global ACTIVE_TEAM
        ACTIVE_TEAM = GAME.human_teams[0]

        self.ids["expense"].data = [{
            'name': key,
            'weekly': ""}
            for key, value in ACTIVE_TEAM.weekly_finances.items() if (key == "Salaries" or key == "Bought Players")]

        for data in self.ids["expense"].data:
            for key, value in ACTIVE_TEAM.weekly_finances.items():
                if key == data['name']:
                    data['yearly'] = gui.helpers.money_to_str(ACTIVE_TEAM.yearly_finances[key])

        self.ids["expense"].data.extend([{
            "name" : "Total",
            "weekly": "",
            "yearly": gui.helpers.money_to_str(ACTIVE_TEAM.finances_yearly_expense())
        }])

        self.ids["expense"].color_label_background()

        self.ids["income"].data = [{
            'name': key,
            'weekly': ""}
            for key, value in ACTIVE_TEAM.weekly_finances.items() if (key == "Prize Money" or key == "Sold Players" or key == "Sponsors")]

        for data in self.ids["income"].data:
            for key, value in ACTIVE_TEAM.weekly_finances.items():
                if key == data['name']:
                    data['yearly'] = gui.helpers.money_to_str(ACTIVE_TEAM.yearly_finances[key])

        self.ids["income"].data.extend([{
            "name" : "Total",
            "weekly": "",
            "yearly": gui.helpers.money_to_str(ACTIVE_TEAM.finances_yearly_income())
        }])

        self.ids["income"].color_label_background()

        yearly_balance = ACTIVE_TEAM.finances_yearly_income() - ACTIVE_TEAM.finances_yearly_expense()

        self.ids["balance"].weekly = ""

        balance = gui.helpers.money_to_str(yearly_balance)
        balance = "+" + balance if yearly_balance > 0 else balance

        self.ids["balance"].yearly = "[color=ffffff][b]" + balance + "[/b][/color]"

        self.ids["money"].weekly = ""
        self.ids["money"].yearly = "[color=ffffff][b]" + gui.helpers.money_to_str(ACTIVE_TEAM.money) + "[/b][/color]"

        pos = ACTIVE_TEAM.division.team_position(ACTIVE_TEAM)

        self.ids["position_header"].text = "TEAM POSITION - {}".format(ACTIVE_TEAM.division.name)

        team_position = {
            'position': '[color={}][b]{}[/b][/color]'.format('#009900' if pos < 3 else '#CC0000' if pos >= 13 else '#333333', str(pos)),
            'name': ACTIVE_TEAM.name,
            'wins': str(ACTIVE_TEAM.league_stats['Wins']),
            'draws': str(ACTIVE_TEAM.league_stats['Draws']),
            'losses': str(ACTIVE_TEAM.league_stats['Losses']),
            'goals_for': str(ACTIVE_TEAM.league_stats['Goals For']),
            'goals_against': str(ACTIVE_TEAM.league_stats['Goals Against']),
            'goal_difference': str(ACTIVE_TEAM.league_stats['Goals For'] - ACTIVE_TEAM.league_stats['Goals Against']),
            'points': str(ACTIVE_TEAM.league_points())
        }

        for key, attr in team_position.items():
            setattr(self.ids['team_position'], key, attr)

        self.ids["goal"].text = 'SEASON GOAL: {}'.format(gui.helpers.season_points_per_week_to_text(ACTIVE_TEAM.min_pos_per_season_points_per_week()))

        goal_accomplished = True if pos <= ACTIVE_TEAM.min_pos_per_season_points_per_week() else False

        goal_color = '#009900' if goal_accomplished else '#CC0000'

        self.ids["goal_accomplishment"].text = '[color={}][b]{}[/b][/color]'.format(goal_color, "ACCOMPLISHED!" if goal_accomplished else "NOT ACCOMPLISHED")

        self.ids["fan_happiness"].size_hint_x = min(1, (ACTIVE_TEAM.fan_happiness + 1) / 100.0)

        self.ids["fan_happiness"].color = gui.helpers.get_color_red_to_green(ACTIVE_TEAM.fan_happiness, 0, 100)

        gui.helpers.recycle_view_adjust_size_hint_y_to_window(self.ids["expense"], self.manager.size_hint_y)
        gui.helpers.recycle_view_adjust_size_hint_y_to_window(self.ids["income"], self.manager.size_hint_y)
        self.ids['spacing'].size_hint_y = max(0.001, 0.45 - (self.ids["expense"].size_hint_y + self.ids['income'].size_hint_y))
