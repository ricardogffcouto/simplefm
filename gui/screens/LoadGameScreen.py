#!/usr/bin/python
#encoding: utf-8

from kivy.app import App
from kivy.uix.screenmanager import Screen
from gui.widgets.GlobalWidgets import Information, Confirmation
from lib.Game import Game
import pickle
import os


class LoadGameScreen(Screen):
    def delete_game(self):
        def _delete_game():
            folder = App.get_running_app().get_games_folder()
            os.remove("{}/{}.sfm".format(folder, self.ids['games'].selected.name))
            popup.dismiss()
            self.ids['games'].selected = None
            self.refresh()

        if self.ids['games'].selected:
            popup = Confirmation()
            popup.title = 'Game'
            popup.text = 'Delete game {}?'.format(self.ids['games'].selected.name)
            popup.yes = _delete_game
            popup.open()
        else:
            popup = Information()
            popup.title = 'No game selected'
            popup.information = "You need to select a game."
            popup.open()


    def setup_game(self, game):
        App.get_running_app().GAME = game
        App.get_running_app().setup_game_gui()
        self.manager.current = game.last_screen

    def load_last_game(self):
        last_game = self.ids['games'].data[0]['object']
        self.setup_game(last_game)

    def load_game(self):
        if self.ids['games'].selected:
            self.setup_game(self.ids['games'].selected)
        else:
            popup = Information()
            popup.title = 'No game selected'
            popup.information = "You need to select a game."
            popup.open()

    def get_saved_games_data(self):
        data = []
        folder = App.get_running_app().get_games_folder()
        games_file_names = os.listdir(folder)

        for file_name in games_file_names:
            file_path = os.path.join(folder, file_name)
            if os.path.getsize(file_path) > 0:      
                with open(file_path, "rb") as f:
                    unpickler = pickle.Unpickler(f)
                    game_dict = unpickler.load()
                    f.close()
                    game = Game()
                    game.__dict__.update(game_dict)
                    team = game.human_teams[0]

                    data += [{
                        'object': game,
                        'name': str(game.name),
                        'team_name': team.name,
                        'current_div': team.division.name,
                        'current_pos': str(team.division.team_position(team)),
                        'week': str(game.week + 1) if game.week < 30 else "End of ",
                        'year': str(game.year())}]

        return data

    def refresh(self):
        self.ids['games'].data = self.get_saved_games_data()
        self.ids['games'].color_label_background()

    def on_pre_enter(self):
        self.refresh()