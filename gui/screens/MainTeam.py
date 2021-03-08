#!/usr/bin/python
#encoding: utf-8


import gui.helpers
import lib.helpers
from kivy.app import App
from kivy.uix.screenmanager import Screen
from gui.widgets.GlobalWidgets import SwappableList, Information, ButtonWithImageAndText, Confirmation
from kivy.uix.popup import Popup
from kivy.uix.spinner import Spinner
from kivy.uix.button import Button
from kivy.core.window import Window


class TacticsSpinner(ButtonWithImageAndText, Spinner):
    pass

class TeamPlayersList(SwappableList):
    screen = None

    def swap(self, obj_out, obj_in):
        if ACTIVE_TEAM.can_replace_player(player_in = obj_in, player_out = obj_out):
            ACTIVE_TEAM.replace_player(player_in = obj_in, player_out = obj_out)
            self.refresh()
            return True
        else:
            return False

    def refresh(self):
        ACTIVE_TEAM.order_players_by_playing_status()
        players = ACTIVE_TEAM.players

        self.clear_selection()

        gui.helpers.generate_player_list_data(self, players, [0, 1, 2])

        self.screen.ids['tactic'].label_text = gui.helpers.tactic_to_str(ACTIVE_TEAM.current_tactic())

class MainTeam(Screen):
    def confirm_go_to_game(self):
        def _go_to_game():
            popup.dismiss()
            main_screen = self.parent.parent.parent
            main_screen.go_to_game()

        if ACTIVE_TEAM.allowed_tits():
            if ACTIVE_TEAM.amount_of_tits() == 11:
                if not ACTIVE_TEAM.are_available_players_outside_of_bench():
                    popup = Confirmation()
                    popup.title = 'Game'
                    popup.text = 'Play game?'
                    popup.yes = _go_to_game
                    popup.open()
                else:
                    popup = Confirmation()
                    popup.title = 'Game'
                    popup.text = 'You have available players\noutside of your bench.\nPlay game?'
                    popup.yes = _go_to_game
                    popup.open()
            else:
                popup = Confirmation()
                popup.title = 'Game'
                popup.text = 'You have less than 11 players\nin your team.\nPlay game?'
                popup.yes = _go_to_game
                popup.open()
        else:
            popup = Information()
            popup.title = 'Team not valid'
            popup.information = 'You have injured or not allowed\nplayers in your team.'

        popup.open()

    def tactic_spinner_update(self):
        allowed_tactics = ACTIVE_TEAM.list_of_allowed_tactics()
        values = []
        for tac in allowed_tactics:
            values.append(gui.helpers.tactic_to_str(tac))
        values.append('Top skill')
        self.ids['tactic'].values = values
        self.ids['tactic'].label_text = gui.helpers.tactic_to_str(ACTIVE_TEAM.current_tactic())

        self.ids['tactic'].selected = False
        if self.ids['tactic'].is_open:
            self.ids['tactic'].selected = True


    def change_playing_tactic(self):
        tactic = self.ids['tactic'].text
        if tactic:
            if tactic != 'Top skill':
                ACTIVE_TEAM.set_playing_tactic(lib.helpers.str_to_tactic(tactic))
            else:
                ACTIVE_TEAM.set_playing_tactic()
            self.ids['team_list'].refresh()
            self.ids['tactic'].label_text = gui.helpers.tactic_to_str(ACTIVE_TEAM.current_tactic())

    def on_pre_enter(self):
        global GAME
        GAME = App.get_running_app().GAME
        global ACTIVE_TEAM
        ACTIVE_TEAM = GAME.human_teams[0]

        self.ids['team_list'].screen = self
        print(self.ids['player_header'].extra_info)
        self.ids['tactic'].screen = self
        self.ids['tactic'].option_cls.on_release = self.change_playing_tactic
        self.tactic_spinner_update()
        self.ids['team_list'].refresh()
        opponent = ACTIVE_TEAM.next_opponent(GAME.week)
        if opponent:
            self.ids['game_info'].text = 'vs. [b]' + ACTIVE_TEAM.next_match_to_str(GAME.week) + "[/b]\nSkill: [b]" + str(int(round(opponent.avg_skill, 0))) + "[/b]\n" + gui.helpers.tactic_to_str(opponent.tactic)
        else:
            self.ids['game_info'].text = 'No match'