#!/usr/bin/python
#encoding: utf-8

from gui.screens.StartScreen import StartScreen
from gui.screens.LoadGameScreen import LoadGameScreen
from gui.screens.NewGameScreen import NewGameScreen

from gui.screens.MainScreen import MainScreen
from gui.screens.MatchScreen import MatchScreen, MainMatchScreen, SubstitutionScreen, InjuredSubstitutionScreen
from gui.screens.WeeklyInformationScreen import WeeklyInformationScreen

from gui.screens.MainTeam import MainTeam
from gui.screens.WeeklyTraining import WeeklyTraining
from gui.screens.DivisionTables import DivisionMatchesTablesScreen, DivisionAllMatchesTablesScreen, AllMatchesScreen
from gui.screens.Finances import Finances
from gui.screens.TransferList import TransferList
from gui.screens.TransferTeam import TransferTeam
from gui.screens.EndofSeason import EndofSeason
from gui.screens.ManagerStatsScreen import ManagerStatsScreen

import os
from kivy.lang import Builder
from kivy.app import App
from kivy.uix.screenmanager import ScreenManager
import gui.helpers


class SimpleFMScreenManager(ScreenManager):
    def change_screen(self, screen):
        self.previous_screen = self.current
        self.current = screen

class SimpleFMApp(App):
    GAME = None
    def get_games_folder(self):
        root_folder = self.user_data_dir
        games_folder = os.path.join(root_folder, 'games')
        if not os.path.exists(games_folder):
            os.makedirs(games_folder)
        return games_folder


    def current_team_color(self, a=None):
        color = gui.helpers.color('')
        if self.GAME:
            color = gui.helpers.color(self.GAME.human_teams[0].color)
        if a:
            color[3] = a
        return color

    def setup_game_gui(self):
        main_team_screens = [
            MainTeam(name='MainTeam'),
            Finances(name='Finances'),
            TransferList(name='TransferList'),
            TransferTeam(name='TransferTeam'),
            WeeklyTraining(name='WeeklyTraining'),
            DivisionAllMatchesTablesScreen(name='DivisionAllMatchesTablesScreen'),
            AllMatchesScreen(name='AllMatchesScreen')
        ]

        match_screens = [
            MainMatchScreen(name='MainMatchScreen'),
            SubstitutionScreen(name='SubstitutionScreen'),
            InjuredSubstitutionScreen(name='InjuredSubstitutionScreen')
        ]

        weekly_screens = [
            DivisionMatchesTablesScreen(name='DivisionMatchesTablesScreen'),
            Finances(name='Finances'),
            EndofSeason(name='EndofSeason')

        ]

        for screen in main_team_screens:
            self.root.get_screen('MainScreen').ids["content"].add_widget(screen)

        for screen in match_screens:
            self.root.get_screen('MatchScreen').ids["content"].add_widget(screen)

        for screen in weekly_screens:
            self.root.get_screen('WeeklyInformationScreen').ids["content"].add_widget(screen)

    def setup_gui(self):
        path = os.path.dirname(os.path.abspath(__file__))

        Builder.load_file(path + '/gui/widgets/GlobalWidgets.kv')

        Builder.load_file(path + '/gui/widgets/GlobalLabels.kv')

        kv_files = ["MainScreen",
                    "MainTeam",
                    "TransferList",
                    "MatchScreen",
                    "WeeklyTraining",
                    "DivisionTables",
                    "StartScreen",
                    "Finances",
                    "TransferTeam",
                    "WeeklyInformationScreen",
                    "EndofSeason",
                    "LoadGameScreen",
                    "NewGameScreen",
                    "ManagerStatsScreen"
                    ]

        for name in kv_files:
            Builder.load_file(path + '/gui/screens/' + name + '.kv')

        screens = [
            StartScreen(name='StartScreen'),
            LoadGameScreen(name='LoadGameScreen'),
            NewGameScreen(name='NewGameScreen'),
            MainScreen(name='MainScreen'),
            MatchScreen(name='MatchScreen'),
            ManagerStatsScreen(name='ManagerStatsScreen'),
            WeeklyInformationScreen(name='WeeklyInformationScreen')
        ]

        sm = SimpleFMScreenManager()

        for screen in screens:
            sm.add_widget(screen)

        sm.current = 'StartScreen'
        return sm

    def build(self):
        root = self.setup_gui()
        return root

    def on_stop(self):
        folder = self.get_games_folder()
        if self.GAME:
            self.GAME.last_screen = self.root.current
            self.GAME.save(folder)
        return True

    def on_pause(self):
        folder = self.get_games_folder()
        if self.GAME:
            self.GAME.last_screen = self.root.current
            self.GAME.save(folder)
        return True

    def on_resume(self):
        pass


if __name__ == "__main__":
    SimpleFMApp().run()
