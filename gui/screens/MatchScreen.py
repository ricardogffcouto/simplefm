#!/usr/bin/python
#encoding: utf-8

from kivy.app import App
from kivy.clock import Clock
from gui.widgets.GlobalWidgets import Information, Confirmation
import gui.helpers
from kivy.uix.screenmanager import Screen, ScreenManager
from kivy.uix.modalview import ModalView
import functools

class GoalPopup(ModalView):
    pass

class MatchScreens(ScreenManager):
    pass

class MatchScreen(Screen):
    def refresh(self):
        self.ids['match_result'].minutes = str(MATCH.minutes) + "'"
        self.ids['match_result'].home_team = MATCH.teams[0].name
        self.ids['match_result'].home_goals = str(MATCH.score[0])
        self.ids['match_result'].away_team = MATCH.teams[1].name
        self.ids['match_result'].away_goals = str(MATCH.score[1])
        self.ids['match_result'].home_color = gui.helpers.match_team_color(MATCH.teams, home = True)
        self.ids['match_result'].away_color = gui.helpers.match_team_color(MATCH.teams, home = False)


        self.ids['total_possession'].ids['home_possession'].size_hint_x = MATCH.ball_possession()[0] * 0.01
        self.ids['total_possession'].ids['away_possession'].size_hint_x = 1 - MATCH.ball_possession()[0] * 0.01
        self.ids['total_possession'].label_text = "Total"
        self.ids['total_possession'].home_color = gui.helpers.match_team_color(MATCH.teams, home = True)
        self.ids['total_possession'].away_color = gui.helpers.match_team_color(MATCH.teams, home = False)

        self.ids['last_5_possession'].ids['home_possession'].size_hint_x = MATCH.ball_possession_last_5_minutes()[0] * 0.01
        self.ids['last_5_possession'].ids['away_possession'].size_hint_x = 1 - MATCH.ball_possession_last_5_minutes()[0] * 0.01
        self.ids['last_5_possession'].label_text = "Last 5'"
        self.ids['last_5_possession'].home_color = gui.helpers.match_team_color(MATCH.teams, home = True)
        self.ids['last_5_possession'].away_color = gui.helpers.match_team_color(MATCH.teams, home = False)
        self.ids["content"].current_screen.refresh()

    def on_pre_enter(self):
        global GAME
        GAME = App.get_running_app().GAME
        global ACTIVE_TEAM
        ACTIVE_TEAM = GAME.human_teams[0]
        global MATCH
        MATCH = ACTIVE_TEAM.next_match(GAME.week)
        self.refresh()

class MainMatchScreen(Screen):
    playing = False
    seconds_per_minute = 0.15
    disable_play = False

    def pause(self, *args):
        Clock.unschedule(self.minute)
        self.playing = False

    def enable_play_after_goal(self, *args):
        self.disable_play = False

    def play(self, *args):
        if not self.disable_play:
            Clock.schedule_interval(self.minute, self.seconds_per_minute)
            self.playing = True

    def end_match(self):
        GAME.simulate_weekly_matches()
        GAME.next_week()
        self.manager.parent.parent.manager.current = "WeeklyInformationScreen"

    def substitution(self):
        if MATCH.minutes > 0:
            if MATCH.allow_substitution(ACTIVE_TEAM):
                self.pause()
                self.manager.current = "SubstitutionScreen"
            else:
                popup = Information()
                popup.title = '3 substitutions made'
                popup.information = "You already made the maximum\nnumber of substitutions."
                popup.open()

    def injured_substitution(self):
        self.pause()
        if MATCH.allow_substitution(ACTIVE_TEAM):
            self.manager.current = "InjuredSubstitutionScreen"
        else:
            self.disable_play = False

    def play_pause(self):
        if self.playing:
            self.pause()
            self.ids["play_pause"].label_text = "Play"
        else:
            if not MATCH.finished:
                self.play()
                self.ids["play_pause"].label_text = "Pause"
            else:
                self.ids["play_pause"].label_text = "Continue"
                self.end_match()

    def goal_celebration(self):
        goal_popup_time = 2
        border_color = gui.helpers.match_team_color(MATCH.teams, home = True) if MATCH.goalscorers[-1]['team'] == MATCH.teams[0] else gui.helpers.match_team_color(MATCH.teams, home = False)
        popup = GoalPopup(border_color = border_color, auto_dismiss=False)
        popup.minute = str(MATCH.goalscorers[-1]['minute']) + "'"
        popup.goalscorer = MATCH.goalscorers[-1]['player'].name
        popup.score = "[b]{}[/b]-{}".format(MATCH.score[0], MATCH.score[1]) if MATCH.goalscorers[-1]['team'] == MATCH.teams[0] else "{}-[b]{}[/b]".format(MATCH.score[0], MATCH.score[1])
        popup.open()
        Clock.schedule_once(popup.dismiss, goal_popup_time)
        Clock.schedule_once(self.enable_play_after_goal, goal_popup_time)

        if MATCH.minutes != 45 and MATCH.minutes != 90:
            Clock.schedule_once(self.play, goal_popup_time)

    def minute(self, *args):
        if not self.disable_play:
            if not MATCH.finished:
                MATCH.minute()
                if MATCH.goal_last_minute() and not MATCH.finished:
                    self.disable_play = True
                    self.pause()
                    self.goal_celebration()

                if MATCH.injured_player_out is not None and not MATCH.finished:
                    Information().show(title = 'Player injured', information = MATCH.injured_player_out.name + " is injured.")
                    if not MATCH.finished:
                        self.disable_play = True
                        self.injured_substitution()
            else:
                self.pause()

            if MATCH.minutes == 45:
                self.pause()

            self.refresh()
            self.manager.parent.parent.refresh()

    def refresh(self):
        if MATCH:
            self.ids["home_goalscorers"].data = [{
                'name': goalscorer['player'].name,
                'goal_minute': str(goalscorer['minute']) + "'"}
                for goalscorer in MATCH.goalscorers if goalscorer["team"] == MATCH.teams[0]]
            self.ids["away_goalscorers"].data = [{
                'name': goalscorer['player'].name,
                'goal_minute': str(goalscorer['minute']) + "'"}
                for goalscorer in MATCH.goalscorers if goalscorer["team"] == MATCH.teams[1]]

            self.ids["home_goalscorers"].color_label_background()
            self.ids["away_goalscorers"].color_label_background()

            ACTIVE_TEAM.order_players_by_playing_status()
            gui.helpers.generate_player_list_data(self.ids['team_list'], ACTIVE_TEAM.players, [0], MATCH.minutes)

            gui.helpers.recycle_view_adjust_size_hint_y_to_window(self.ids["team_list"], 0.81)

            self.ids["goalscorers"].size_hint_y = 0.87 - (self.ids["team_list"].size_hint_y)

            self.ids["main_match_player_header"].bcolor = gui.helpers.match_team_color(MATCH.teams, home = True) if MATCH.teams[0].human else gui.helpers.match_team_color(MATCH.teams, home = False)

            if not MATCH.finished:
                if MATCH.minutes > 0:
                    self.ids['substitution'].disabled = False
                    self.ids['substitution'].clickable = False
                if self.playing:
                    self.ids['play_pause'].label_text = "Pause"
                else:
                    self.ids['play_pause'].label_text = "Play"
            else:
                self.ids['play_pause'].label_text = "Continue"
                self.ids['substitution'].disabled = True
                self.ids['substitution'].clickable = True

            self.ids["substitution"].clickable = False
            if MATCH.allow_substitution(ACTIVE_TEAM):
                self.ids["substitution"].clickable = True

    def on_pre_enter(self):
        global GAME
        GAME = App.get_running_app().GAME
        global ACTIVE_TEAM
        ACTIVE_TEAM = GAME.human_teams[0]
        global MATCH
        MATCH = ACTIVE_TEAM.next_match(GAME.week)
        p = GoalPopup()
        p.dismiss()
        self.refresh()


class SubstitutionScreen(Screen):
    def back(self):
        self.parent.current = "MainMatchScreen"

    def confirm_substitution(self):
        def _substitution(self):
            player_out = self.ids["team_list"].selected
            player_in = self.ids["subs_list"].selected
            ACTIVE_TEAM.replace_player(player_in = player_in, player_out = player_out, in_match = True, match_minutes = MATCH.minutes)
            if MATCH.injured_player_out == player_out:
                MATCH.injured_player_out = None
            MATCH.substitution_made_by_team(ACTIVE_TEAM)
            self.ids["team_list"].selected = None
            self.ids["subs_list"].selected = None
            self.ids["team_list"].clear_selection()
            self.ids["subs_list"].clear_selection()
            ACTIVE_TEAM.order_players_by_playing_status()
            popup.dismiss()
            self.refresh()

        if self.ids["team_list"].selected is not None and self.ids["subs_list"].selected is not None:
            if MATCH.allow_substitution(ACTIVE_TEAM):
                player_out = self.ids["team_list"].selected
                player_in = self.ids["subs_list"].selected
                if ACTIVE_TEAM.can_substitute_player(player_in, player_out):
                    popup = Confirmation()
                    popup.title = 'Replace player'
                    popup.text = 'Do you want to replace\n{} {} by\n{} {}?'.format(player_out.pos_to_str(), player_out.name, player_in.pos_to_str(), player_in.name)
                    popup.yes = functools.partial(_substitution, self)
                    popup.open()
                else:
                    Information().show(title = 'Substitution not valid', information = "You can't replace" + player_out.name + "\nfor" + player_in.name)
            else:
                Information().show(title = '3 substitutions made', information = "You already made the maximum\nnumber of substitutions.")
        else:
            popup = Information()
            popup.title = 'Select 2 players'
            popup.information = "You need to select 2 players\nto make a substitution."
            popup.open()

    def refresh(self):
        gui.helpers.generate_player_list_data(self.ids['team_list'], ACTIVE_TEAM.players, [0], MATCH.minutes)
        gui.helpers.generate_player_list_data(self.ids['subs_list'], ACTIVE_TEAM.players, [1], MATCH.minutes)

        gui.helpers.recycle_view_adjust_size_hint_y_to_window(self.ids["team_list"], self.manager.size_hint_y)
        if self.name == 'InjuredSubstitutionScreen':
            filler = 0.71
        else:
            filler = 0.82

        self.ids['subs_list'].size_hint_y = max(0.001, filler - (self.ids["team_list"].size_hint_y))

        self.ids["subs_information"].text = 'Substitutions left: '
        self.ids["subs_information"].text += str(3 - MATCH.substitutions[0]) if ACTIVE_TEAM == MATCH.teams[0] else str(3 - MATCH.substitutions[1])

        self.ids["substitution_player_header"].bcolor = gui.helpers.match_team_color(MATCH.teams, home = True) if MATCH.teams[0].human else gui.helpers.match_team_color(MATCH.teams, home = False)

    def on_pre_enter(self):
        self.refresh()

class InjuredSubstitutionScreen(SubstitutionScreen):
    def back(self):
        def _go_back():
            popup.dismiss()
            self.parent.current = "MainMatchScreen"
            self.parent.get_screen("MainMatchScreen").disable_play = False

        popup = Confirmation()
        popup.title = 'Injured player'
        popup.text = 'Are you sure you want to go back\nwithout replacing the injured player?'
        popup.yes = _go_back
        popup.open()

    def confirm_substitution(self):
        def _substitution(self):
            player_out = MATCH.injured_player_out
            player_in = self.ids["subs_list"].selected
            ACTIVE_TEAM.replace_player(player_in = player_in, player_out = player_out, in_match = True, match_minutes = MATCH.minutes)
            if MATCH.injured_player_out == player_out:
                MATCH.injured_player_out = None
            MATCH.substitution_made_by_team(ACTIVE_TEAM)
            self.ids["subs_list"].clear_selection()
            ACTIVE_TEAM.order_players_by_playing_status()
            self.refresh()
            popup.dismiss()
            self.parent.current = "MainMatchScreen"
            self.parent.get_screen("MainMatchScreen").disable_play = False

        if self.ids["subs_list"].selected is not None:
            if MATCH.allow_substitution(ACTIVE_TEAM):
                player_out = MATCH.injured_player_out
                player_in = self.ids["subs_list"].selected
                if ACTIVE_TEAM.can_substitute_player(player_in, player_out):
                    popup = Confirmation()
                    popup.title = 'Replace player'
                    popup.text = 'Do you want to replace\n{} {} by\n{} {}?'.format(player_out.pos_to_str(), player_out.name, player_in.pos_to_str(), player_in.name)
                    popup.yes = functools.partial(_substitution, self)
                    popup.open()
                else:
                    Information().show(title = 'Substitution not valid', information = "You can't replace " + player_out.name + "\nfor " + player_in.name)
            else:
                Information().show(title = '3 substitutions made', information = "You already made the maximum\nnumber of substitutions.")
        else:
            popup = Information()
            popup.title = 'Select 2 players'
            popup.information = "You need to select 2 players\nto make a substitution."
            popup.open()

    def on_pre_enter(self):
        p = MATCH.injured_player_out
        self.ids['injured_player'].bcolor = (1, 1, 1, 1)
        self.ids['injured_player'].object = p
        self.ids['injured_player'].position = p.pos_to_str()
        self.ids['injured_player'].name = p.name
        self.ids['injured_player'].age = str(p.age)
        self.ids['injured_player'].skill = str(p.skill)
        self.refresh()