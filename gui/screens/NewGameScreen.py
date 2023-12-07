#!/usr/bin/python
#encoding: utf-8

import os
import re

import lib.constants
import lib.db
from gui import constants
from gui.widgets.GlobalWidgets import Information
from kivy.app import App
from kivy.uix.screenmanager import Screen
from kivy.uix.textinput import TextInput
from lib.Game import Game


class NameTextInput(TextInput):
    def insert_text(self, substring, from_undo=False):
        if re.match("^[A-Za-z0-9 ]*$", substring):
            return super(NameTextInput, self).insert_text(substring, from_undo=from_undo)

    def on_text(self, *args):
        if len(self.text) > 16:
            self.text = self.text[:16]

class NewGameScreen(Screen):
    def show_hide_create_new_team(self):
        if self.ids[constants.IdNames.TEAMS.value].text == constants.CREATE_NEW_TEAM:
                    self.ids[constants.IdNames.NEW_TEAM.value].size_hint_y = 0.4
                    self.ids[constants.IdNames.SPACING.value].size_hint_y = 0.1
                    self.ids[constants.IdNames.NEW_TEAM.value].opacity = 1
                else:
                    self.ids[constants.IdNames.NEW_TEAM.value].size_hint_y = 0.001
                    self.ids[constants.IdNames.NEW_TEAM.value].opacity = 0
                    self.ids[constants.IdNames.SPACING.value].size_hint_y = 0.5

    def can_start_new_game(self):
        if self.ids[constants.IdNames.GAME_NAME.value].text == "" or "{}.sfm".format(self.ids[constants.IdNames.GAME_NAME.value].text) in os.listdir(App.get_running_app().get_games_folder()):
                    popup = Information()
                    popup.title = constants.INVALID_GAME_NAME
                    popup.information = constants.GAME_NAME_EMPTY_OR_EXISTS
                    popup.open()
                    return False
        
                if self.ids[constants.IdNames.MANAGER_NAME.value].text == "":
                    popup = Information()
                    popup.title = constants.INVALID_MANAGER_NAME
                    popup.information = constants.MANAGER_NAME_EMPTY
                    popup.open()
                    return False
        
                if self.ids[constants.IdNames.TEAMS.value].text == constants.CREATE_NEW_TEAM:
                    if self.ids[constants.IdNames.NEW_TEAM_NAME.value].text not in [team['name'] for team in lib.db.TEAMS]:
                        if len(self.ids[constants.IdNames.NEW_TEAM_NAME.value].text) > 0:
                            self.new_game()
                            return True
                        else:
                            popup = Information()
                            popup.title = constants.INVALID_TEAM
                            popup.information = constants.TEAM_NAME_EMPTY
                            popup.open()
                            return False
                    else:
                popup = Information()
                popup.title = 'Invalid team'
                popup.information = 'You should choose a name different from the current teams.'
                popup.open()
                return False
        else:
            if self.ids['teams'].text != "":
                self.new_game()
                return True
            else:
                popup = Information()
                popup.title = 'Invalid team'
                popup.information = 'Please select a team.'
                popup.open()

    def new_game(self):
        APP = App.get_running_app()
        APP.GAME = Game(name = self.ids['game_name'].text)

        prev_div = None
        prev_pos = None

        if self.ids['teams'].text == "Create new team":
            name = self.ids['new_team_name'].text
            prev_div = int(self.ids['new_team_prev_div'].text)
            prev_pos = int(self.ids['new_team_prev_pos'].text)
            color = self.ids['new_team_color'].text
            country = [country['id'] for country in lib.db.COUNTRIES if country['name'] == self.ids['new_team_country'].text][0]
        else:
            name = self.ids['teams'].text
            color = [team['color'] for team in lib.db.TEAMS if team['name'] == name][0]
            country = [team['country'] for team in lib.db.TEAMS if team['name'] == name][0]

        manager = {'name' : self.ids['manager_name'].text}
        human_team = {'name' : name, 'color': color, 'country': country, 'prev_pos': prev_pos, 'prev_div': prev_div}

        APP.GAME.start(human_team = human_team, manager = manager)
        APP.GAME.start_of_season()
        APP.setup_game_gui()
        self.manager.current = APP.GAME.last_screen

    def on_pre_enter(self):
        allowed_teams = lib.sfm_glob.COMPETITION['TEAMS PER DIVISION'] * lib.sfm_glob.COMPETITION['TOTAL_NUMBER_OF_DIVISIONS']
        self.ids['teams'].values = ['Create new team'] + [team['name'] for team in lib.db.TEAMS][:allowed_teams]

        self.ids['new_team_prev_div'].values = [str(d) for d in range(1, lib.sfm_glob.COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] + 1)]
        self.ids['new_team_prev_div'].text = self.ids['new_team_prev_div'].values[0]

        self.ids['new_team_prev_pos'].values = [str(p) for p in range(1, lib.sfm_glob.COMPETITION['TEAMS PER DIVISION'] + 1)]
        self.ids['new_team_prev_pos'].text = self.ids['new_team_prev_pos'].values[0]

        self.ids['new_team_color'].values = sorted([c['name'] for c in lib.db.COLORS])
        self.ids['new_team_color'].text = self.ids['new_team_color'].values[0]

        self.ids['new_team_country'].values = sorted([c['name'] for c in lib.db.COUNTRIES])
        self.ids['new_team_country'].text = self.ids['new_team_country'].values[0]

        self.show_hide_create_new_team()

