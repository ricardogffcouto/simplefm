#!/usr/bin/python
#encoding: utf-8


import gui.helpers
from kivy.app import App
from kivy.uix.screenmanager import Screen
from gui.widgets.GlobalWidgets import SwappableList, Information, Confirmation
from kivy.graphics import Color

class PlayersTransferList(SwappableList):
    screen = None

    def refresh(self):
        players = sorted(ACTIVE_TEAM.players_to_buy, key=lambda player: (-player.skill, player.current_value(), player.position))
        
        gui.helpers.generate_player_list_data(self, players)
            
        if len(players) == 0:
            self.data = [{
                'object': None, 
                'name': "No players in the transfer list", 
                "position": "", 
                "age":"", 
                "skill":"", 
                "salary":"", 
                "value":"", 
                "contract":""
                }]

        self.color_label_background()
        self.screen.selection_changed(self.children[0].selected_nodes)


class TransferList(Screen):
    def selection_changed(self, nodes):
        if nodes:
            self.ids['buy_button'].clickable = True
        else:
            self.ids['buy_button'].clickable = False

    def confirm_buy_player(self):
        def _buy_player():
            popup.dismiss()
            ACTIVE_TEAM.buy_player(player)
            self.on_pre_enter()

        global ACTIVE_TEAM
        player = self.ids['transfer_list'].selected
        if player is not None:
            if ACTIVE_TEAM.has_place_to_buy_player():
                if ACTIVE_TEAM.has_money_to_buy_player(player):
                    popup = Confirmation()
                    popup.title = 'Buy player'
                    popup.text = 'Do you want to buy\n{} {}?\nSkill: {}\nValue: {}'.format(player.pos_to_str(), player.name, int(player.skill), gui.helpers.money_to_str(player.current_value()))
                    popup.yes = _buy_player
                    popup.open()
                else:
                    popup = Information()
                    popup.title = 'Not enough money'
                    popup.information = "You do not have enough money\nto buy this player."
            else:
                popup = Information()
                popup.title = 'Maximum amount of players'
                popup.information = "You can only have 22 players\nin your team."
            popup.open()

    def on_pre_enter(self):
        global GAME
        GAME = App.get_running_app().GAME
        global ACTIVE_TEAM
        ACTIVE_TEAM = GAME.human_teams[0]

        ACTIVE_TEAM.order_players_by_playing_status()
        self.ids['transfer_list'].screen = self
        self.ids['transfer_list'].selected = None
        self.ids['transfer_list'].clear_selection()
        self.ids['transfer_list'].refresh()
        self.ids['header'].text_right = 'Money: {}'.format(gui.helpers.money_to_str(ACTIVE_TEAM.money))
