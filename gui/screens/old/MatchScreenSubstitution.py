#!/usr/bin/python
#encoding: utf-8


import lib.helpers as helpers
from kivy.app import App
from kivy.uix.screenmanager import Screen
from gui.widgets.GlobalWidgets import SwappableList, Information
from kivy.uix.popup import Popup
from kivy.uix.spinner import Spinner
from kivy.clock import Clock

class ConfirmNotReplacingInjuredPlayer(Popup):
    def confirmed(self):
        MATCH.injured_player_out = None
        self.screen.manager.current = "MatchScreen"
        self.dismiss()


class ConfirmSubstitution(Popup):
    def substitution(self):

        self.dismiss()

class MatchScreenSubstitution(Screen):
    def back(self):
        if MATCH.injured_player_out is not None:
            popup = ConfirmNotReplacingInjuredPlayer()
            popup.player_out_name = MATCH.injured_player_out.name
            popup.screen = self
            popup.open()
        else:
            self.manager.current = "MatchScreen"

    def confirm_substitution(self):
        if self.ids["tits_list"].selected is not None and self.ids["subs_list"].selected is not None:
            if MATCH.allow_substitution(ACTIVE_TEAM):
                player_out = self.ids["tits_list"].selected
                player_in = self.ids["subs_list"].selected
                if ACTIVE_TEAM.can_replace_player(player_in, player_out):
                    popup = ConfirmSubstitution()
                    popup.player_out = player_out
                    popup.player_in = player_in
                    popup.player_out_name = popup.player_out.name
                    popup.player_in_name = popup.player_in.name
                    popup.screen = self
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
        self.minutes = str(MATCH.minutes) + "'"
        self.home_team = MATCH.teams[0].name
        self.home_goals = str(MATCH.score[0])
        self.away_team = MATCH.teams[1].name
        self.away_goals = str(MATCH.score[1])
        self.home_possession = MATCH.ball_possession()[0]
        self.home_possession_last_5_minutes = MATCH.ball_possession_last_5_minutes()[0]
        ACTIVE_TEAM.order_players_by_playing_status()

        if MATCH.injured_player_out is not None:
            self.ids['tits_list'].data = [{
                'object': MATCH.injured_player_out,
                'position': MATCH.injured_player_out.pos_to_str(),
                'name': MATCH.injured_player_out.name,
                'age': str(MATCH.injured_player_out.age),
                'skill': str(MATCH.injured_player_out.skill)}]
        else:
            self.ids['tits_list'].data = []

        self.ids['tits_list'].data.extend([{
            'object': p,
            'position': p.pos_to_str(),
            'name': p.name,
            'age': str(p.age),
            'skill': str(int(p.skill))}
            for p in ACTIVE_TEAM.players if p.playing_status == 0])

        self.ids['subs_list'].data = [{
            'object': p,
            'position': p.pos_to_str(),
            'name': p.name,
            'age': str(p.age),
            'skill': str(int(p.skill))}
            for p in ACTIVE_TEAM.players if p.playing_status == 1]

    def on_pre_enter(self):
        global GAME
        GAME = App.get_running_app().GAME
        global ACTIVE_TEAM
        ACTIVE_TEAM = GAME.human_teams[0]
        global MATCH
        MATCH = ACTIVE_TEAM.next_match(GAME.week)
        self.refresh()
