from kivy.uix.screenmanager import Screen

from gui.screens.constants import ScreenName


class StartScreen(Screen):
    def go_to_new_game_screen(self):
        self.manager.current = ScreenName.NEW_GAME.value

    def go_to_load_game_screen(self):
        self.manager.current = ScreenName.LOAD_GAME.value
