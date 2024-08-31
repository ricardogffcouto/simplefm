from kivy.app import App
from kivy.uix.screenmanager import Screen
from kivy.uix.textinput import TextInput
from gui.widgets.GlobalWidgets import Information
from lib.Game import Game
import lib.db
import lib.constants
import os
import re

class NameTextInput(TextInput):
    def insert_text(self, substring, from_undo=False):
        if re.match("^[A-Za-z0-9 ]*$", substring):
            return super(NameTextInput, self).insert_text(substring, from_undo=from_undo)

    def on_text(self, *args):
        if len(self.text) > 16:
            self.text = self.text[:16]

class NewGameScreen(Screen):
    def show_hide_create_new_team(self):
        if self.ids['teams'].text == "Create new team":
            self.ids['new_team'].size_hint_y = 0.4
            self.ids['spacing'].size_hint_y = 0.1
            self.ids['new_team'].opacity = 1
        else:
            self.ids['new_team'].size_hint_y = 0.001
            self.ids['new_team'].opacity = 0
            self.ids['spacing'].size_hint_y = 0.5

    def can_start_new_game(self):
        if self.ids['game_name'].text == "" or "{}.sfm".format(self.ids['game_name'].text) in os.listdir(App.get_running_app().get_games_folder()):
            popup = Information()
            popup.title = 'Invalid game name'
            popup.information = "Your game name is empty or already exists."
            popup.open()
            return False

        if self.ids['manager_name'].text == "":
            popup = Information()
            popup.title = 'Invalid manager name'
            popup.information = "Your manager name is empty."
            popup.open()
            return False

        if self.ids['teams'].text == "Create new team":
            if self.ids['new_team_name'].text not in [team['name'] for team in lib.db.TEAMS]:
                if len(self.ids['new_team_name'].text) > 0:
                    self.new_game()
                    return True
                else:
                    popup = Information()
                    popup.title = 'Invalid team'
                    popup.information = "Your team name can't be empty."
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
        allowed_teams = lib.constants.COMPETITION['TEAMS PER DIVISION'] * lib.constants.COMPETITION['TOTAL_NUMBER_OF_DIVISIONS']
        self.ids['teams'].values = ['Create new team'] + [team['name'] for team in lib.db.TEAMS][:allowed_teams]

        self.ids['new_team_prev_div'].values = [str(d) for d in range(1, lib.constants.COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] + 1)]
        self.ids['new_team_prev_div'].text = self.ids['new_team_prev_div'].values[0]

        self.ids['new_team_prev_pos'].values = [str(p) for p in range(1, lib.constants.COMPETITION['TEAMS PER DIVISION'] + 1)]
        self.ids['new_team_prev_pos'].text = self.ids['new_team_prev_pos'].values[0]

        self.ids['new_team_color'].values = sorted([c['name'] for c in lib.db.COLORS])
        self.ids['new_team_color'].text = self.ids['new_team_color'].values[0]

        self.ids['new_team_country'].values = sorted([c['name'] for c in lib.db.COUNTRIES])
        self.ids['new_team_country'].text = self.ids['new_team_country'].values[0]

        self.show_hide_create_new_team()

        diad_output = [data["result"] for data in self.record.data]
        for location_index, output in enumerate(diad_output):
            for diad_data in output:
                diad_data |= self.record_locations[location_index].service_location_output

