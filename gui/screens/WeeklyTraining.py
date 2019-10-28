#!/usr/bin/python
#encoding: utf-8

from kivy.app import App
from kivy.uix.screenmanager import Screen
import gui.helpers

class WeeklyTraining(Screen):
    def refresh(self):
        global GAME
        GAME = App.get_running_app().GAME
        global ACTIVE_TEAM
        ACTIVE_TEAM = GAME.human_teams[0]
        players = ACTIVE_TEAM.players

        self.ids["team_list"].data = [{
            'object': p,
            'position': p.pos_to_str(),
            'name': p.name,
            'age': str(p.age),
            'skill': str(p.skill),
            'weekly_training': gui.helpers.training_to_int(p.weekly_training)}
            for p in players]

        if not self.ids["team_list"].data:
            self.ids["team_list"].data = [{
            'name': "No changes in training this week."}]

        self.ids["team_list"].color_label_background()

    def on_pre_enter(self):
        self.refresh()
