#!/usr/bin/python
#encoding: utf-8

from kivy.uix.screenmanager import Screen, ScreenManager
from kivy.app import App
import gui.helpers

class ManagerStatsScreen(Screen):
    def on_pre_enter(self):
        global GAME
        GAME = App.get_running_app().GAME
        global ACTIVE_TEAM
        ACTIVE_TEAM = GAME.human_teams[0]
        MANAGER = ACTIVE_TEAM.manager
        MANAGER.update_stats()
        career_stats = MANAGER.career_stats()

        self.ids['myteam'].text = MANAGER.name
        self.ids['myteam'].bcolor = App.get_running_app().current_team_color()
        self.ids['myteam'].text_left = "Return to main menu"
        self.ids['myteam'].text_right = "Points\n[b]{}[/b]".format(MANAGER.points())
        self.ids['myteam'].screen = self

        data = []
        for key in MANAGER.career_stats_order():
            data.append({'name': key, 'value': str(career_stats[key])})

        self.ids['career_stats'].data = data
        self.ids['career_stats'].color_label_background()

        self.ids['yearly_stats'].data = [{
            'year': str(2018 + len(MANAGER.yearly_stats) - 1 - season),
            'division': year_stats['div'],
            'position': '[color={}][b]{}[/b][/color]'.format('#009900' if year_stats['pos'] <= 3 else '#CC0000' if year_stats['pos'] >= 14 else '#333333', str(year_stats['pos'])),
            'wins': str(year_stats['Wins']),
            'draws': str(year_stats['Draws']),
            'losses': str(year_stats['Losses']),
            'goals_for': str(year_stats['Goals For']),
            'goals_against': str(year_stats['Goals Against']),
            'goal_difference': str(year_stats['Goals For'] - year_stats['Goals Against']),
            'points': str(year_stats['pts'])}
        for season, year_stats in enumerate(MANAGER.yearly_stats[::-1])]
        self.ids['yearly_stats'].color_label_background()

        sy1 = gui.helpers.recycle_view_adjust_size_hint_y_to_window(self.ids["career_stats"], self.manager.size_hint_y)
        sy2 = gui.helpers.recycle_view_adjust_size_hint_y_to_window(self.ids["yearly_stats"], self.manager.size_hint_y)
        self.ids['spacing'].size_hint_y = max(0.001, 0.75 - sy1 - sy2)
