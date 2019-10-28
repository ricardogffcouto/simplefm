#!/usr/bin/python
#encoding: utf-8

from kivy.app import App
from kivy.uix.screenmanager import Screen, ScreenManager
from gui.widgets.GlobalWidgets import Information
import gui.helpers

class InformationScreens(ScreenManager):
    def change_screen(self, screen_name):
        self.current = screen_name
        footer = self.parent.parent.ids["footer"]
        for i in footer.ids:
            footer.ids[i].selected = False
            if i == screen_name:
                footer.ids[i].selected = True

    def refresh(self):
        for screen in self.screens:
            screen.refresh()

class WeeklyInformationScreen(Screen):
    screen_order = ["DivisionMatchesTablesScreen", "Finances", "EndofSeason"]
    def change_screens_by_order(self):
        def _is_game_ended():
            if GAME.ended and self.ids["content"].current != "DivisionMatchesTablesScreen":
                popup = Information()
                popup.title = 'Game over'
                popup.information = "You got fired for having bad results."
                popup.open()
                self.manager.current = "StartScreen"
                return False

        def _new_season():
            GAME.end_of_season()
            GAME.start_of_season()

        _is_game_ended()

        if self.ids["content"].current == "DivisionMatchesTablesScreen":
            self.ids["content"].current = "Finances"

        elif self.ids["content"].current == 'Finances':
            if GAME.is_season_over():
                self.ids["content"].current = "EndofSeason"
            else:
                self.manager.current = "MainScreen"

        elif self.ids["content"].current == 'EndofSeason':
            _new_season()
            _is_game_ended()
            self.ids["content"].current = "Finances"

        self.refresh()

    def refresh(self):
        if self.ids["content"].current == "DivisionMatchesTablesScreen":
            self.ids["header"].text = ACTIVE_TEAM.name
        elif self.ids["content"].current == "Finances":
            self.ids["header"].text = "Weekly Information"
        elif self.ids["content"].current == "EndofSeason":
            self.ids["header"].text = "End of season {}".format(GAME.year())

    def on_pre_enter(self):
        global GAME
        GAME = App.get_running_app().GAME
        global ACTIVE_TEAM
        ACTIVE_TEAM = GAME.human_teams[0]
        self.ids['header'].bcolor = App.get_running_app().current_team_color()
        self.ids["content"].get_screen("DivisionMatchesTablesScreen").results = True
        self.ids["content"].current = "DivisionMatchesTablesScreen"
        self.ids["content"].refresh()
        self.refresh()
