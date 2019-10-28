#!/usr/bin/python
#encoding: utf-8


import gui.helpers
from kivy.uix.screenmanager import Screen
from kivy.app import App

class Finances(Screen):
    def refresh(self):
        self.on_pre_enter()

    def on_pre_enter(self):
        global GAME
        GAME = App.get_running_app().GAME
        global ACTIVE_TEAM
        ACTIVE_TEAM = GAME.human_teams[0]

        self.ids["expense"].data = [{
            'name': key,
            'weekly': gui.helpers.money_to_str(value)}
            for key, value in ACTIVE_TEAM.weekly_finances.items() if (key == "Salaries" or key == "Bought Players")]

        for data in self.ids["expense"].data:
            for key, value in ACTIVE_TEAM.weekly_finances.items():
                if key == data['name']:
                    data['yearly'] = gui.helpers.money_to_str(ACTIVE_TEAM.yearly_finances[key])

        self.ids["expense"].data.extend([{
            "name" : "Total",
            "weekly": gui.helpers.money_to_str(ACTIVE_TEAM.finances_weekly_expense()),
            "yearly": gui.helpers.money_to_str(ACTIVE_TEAM.finances_yearly_expense())
        }])

        self.ids["expense"].color_label_background()

        self.ids["income"].data = [{
            'name': key,
            'weekly': gui.helpers.money_to_str(value)}
            for key, value in ACTIVE_TEAM.weekly_finances.items() if (key == "Prize Money" or key == "Sold Players" or key == "Sponsors")]

        for data in self.ids["income"].data:
            for key, value in ACTIVE_TEAM.weekly_finances.items():
                if key == data['name']:
                    data['yearly'] = gui.helpers.money_to_str(ACTIVE_TEAM.yearly_finances[key])

        self.ids["income"].data.extend([{
            "name" : "Total",
            "weekly": gui.helpers.money_to_str(ACTIVE_TEAM.finances_weekly_income()),
            "yearly": gui.helpers.money_to_str(ACTIVE_TEAM.finances_yearly_income())
        }])

        self.ids["income"].color_label_background()

        weekly_balance = ACTIVE_TEAM.finances_weekly_income() - ACTIVE_TEAM.finances_weekly_expense()
        yearly_balance = ACTIVE_TEAM.finances_yearly_income() - ACTIVE_TEAM.finances_yearly_expense()

        balance = gui.helpers.money_to_str(weekly_balance)
        balance = "+" + balance if weekly_balance > 0 else balance

        self.ids["balance"].weekly = "[color=ffffff][b]" + balance + "[/b][/color]"

        balance = gui.helpers.money_to_str(yearly_balance)

        balance = "+" + balance if yearly_balance > 0 else balance

        self.ids["balance"].yearly = "[color=ffffff][b]" + balance + "[/b][/color]"

        self.ids["money"].weekly = ""
        self.ids["money"].yearly = "[color=ffffff][b]" + gui.helpers.money_to_str(ACTIVE_TEAM.money) + "[/b][/color]"

        self.ids["goal"].text = 'SEASON GOAL: {}'.format(gui.helpers.season_points_per_week_to_text(ACTIVE_TEAM.min_pos_per_season_points_per_week()))

        self.ids["fan_happiness"].size_hint_x = min(1, (ACTIVE_TEAM.fan_happiness + 1) / 100.0)

        self.ids["fan_happiness"].color = gui.helpers.get_color_red_to_green(ACTIVE_TEAM.fan_happiness, 0, 100)

        self.ids["weekly_news"].data = [{"text" : n} for n in ACTIVE_TEAM.weekly_news.str_list()]

        self.ids["weekly_news"].color_label_background()

        sy1 = gui.helpers.recycle_view_adjust_size_hint_y_to_window(self.ids["expense"], self.manager.size_hint_y)
        sy2 = gui.helpers.recycle_view_adjust_size_hint_y_to_window(self.ids["income"], self.manager.size_hint_y)
        sy3 = gui.helpers.recycle_view_adjust_size_hint_y_to_window(self.ids["weekly_news"], self.manager.size_hint_y)
        self.ids['spacing'].size_hint_y = max(0.001, 0.64 - sy1 - sy2 - sy3)