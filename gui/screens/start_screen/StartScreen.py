from kivy.uix.screenmanager import Screen

from gui.screens.constants import ScreenName


class StartScreen(Screen):
    def new_game(self):
        self.manager.current = ScreenName.NEW_GAME

    def load_game(self):
        self.manager.current = ScreenName.LOAD_GAME
