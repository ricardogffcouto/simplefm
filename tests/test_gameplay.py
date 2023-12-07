import unittest
import os

from lib.Game import Game
from lib.Manager import Manager
from main import SimpleFMApp


# Change the current working directory
os.chdir('../')

class TestGameplay(unittest.TestCase):
    def test_promotion(self):
        # GAME = Game()
        # manager = {'name' : 'Ricardo'}
        # human_team = {'name' : 'Test', 'color': 'Blue', 'country': 'Por', 'prev_pos': 4, 'prev_div': 4}
        # GAME.start_screen(human_team = human_team, manager = manager)
        # GAME.start_of_season()
        #
        # for i in range(29):
        #     GAME.simulate_weekly_matches()
        #     GAME.next_week()
        #
        # GAME.human_teams[0].league_stats["Wins"] = 29
        # GAME.human_teams[0].league_stats["Draws"] = 0
        # GAME.human_teams[0].league_stats["Losses"] = 0

        APP = SimpleFMApp()
        APP.run()


