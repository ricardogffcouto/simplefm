#!/usr/bin/python
#encoding: utf-8

from kivy.uix.screenmanager import Screen, ScreenManager
from kivy.app import App
import gui.helpers

class TeamScreens(ScreenManager):
    def change_screen(self, screen_name):
        self.current = screen_name
        footer = self.parent.parent.ids["footer"]
        for i in footer.ids:
            footer.ids[i].selected = False
            if i == screen_name:
                footer.ids[i].selected = True

class MainScreen(Screen):
    def go_to_game(self):
        self.manager.change_screen("MatchScreen")

    def on_pre_enter(self):
        global GAME
        GAME = App.get_running_app().GAME
        global ACTIVE_TEAM
        ACTIVE_TEAM = GAME.human_teams[0]

        footer = self.ids["footer"]
        for i in footer.ids:
            footer.ids[i].selected = False
            if i == self.ids["content"].current:
                footer.ids[i].selected = True

        self.ids['myteam'].text = '{} ({})'.format(ACTIVE_TEAM.name, gui.helpers.table_position_to_str(ACTIVE_TEAM.league_position()))
        self.ids['myteam'].bcolor = App.get_running_app().current_team_color()
        self.ids['myteam'].screen = self
        self.ids["content"].get_screen("DivisionAllMatchesTablesScreen").results = False
        self.ids['content'].get_screen("MainTeam").on_pre_enter()
        self.ids['myteam'].text_right = 'Week {}\n{}'.format(GAME.week + 1, GAME.year())
        self.ids['myteam'].text_left = ACTIVE_TEAM.manager.name