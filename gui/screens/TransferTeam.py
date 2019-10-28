#!/usr/bin/python
#encoding: utf-8


import gui.helpers
from kivy.app import App
from kivy.uix.screenmanager import Screen
from gui.widgets.GlobalWidgets import SwappableList, Information, Confirmation

class YourTeamList(SwappableList):
    screen = None

    def refresh(self):
        players = ACTIVE_TEAM.players
        self.data = [{
            'object': p,
            'position': p.pos_to_str(),
            'name': p.name,
            'age': str(p.age),
            'skill': str(p.skill),
            'salary': gui.helpers.money_to_str(p.salary),
            'value': gui.helpers.money_to_str(p.current_value()),
            'contract': "*" if p.contract else gui.helpers.money_to_str(p.wanted_salary) if p.wants_new_contract else ""}
            for index, p in enumerate(sorted(players, key=lambda player: (player.position, -player.current_value())))]

        self.color_label_background()
        self.screen.selection_changed(self.children[0].selected_nodes)

class TransferTeam(Screen):
    def selection_changed(self, nodes):
        if nodes:
            self.ids['sell_button'].clickable = True
            self.ids['renew_button'].clickable = True
        else:
            self.ids['sell_button'].clickable = False
            self.ids['renew_button'].clickable = False

    def confirm_renew_contract(self):
        def _renew_contract():
            popup.dismiss()
            ACTIVE_TEAM.renew_contract(player)
            self.on_pre_enter()

        global ACTIVE_TEAM
        player = self.ids['team_list'].selected
        if player is not None:
            if not player.contract:
                player.set_renew_contract_wanted_salary()
                popup = Confirmation()
                popup.title = 'Renew contract'
                popup.text = 'Do you want to renew the contract of\n{} {}?\nOld contract: {}\nNew contract: {}'.format(player.pos_to_str(), player.name, gui.helpers.money_to_str(player.salary), gui.helpers.money_to_str(player.wanted_salary))
                popup.yes = _renew_contract
                popup.open()
            else:
                Information().show(title='Already has contract', information = "The player already has a contract\nfor this season.")

    def confirm_sell_player(self):
        def _sell_player():
            popup.dismiss()
            ACTIVE_TEAM.sell_player(player)
            self.on_pre_enter()

        global ACTIVE_TEAM
        player = self.ids['team_list'].selected
        if player is not None:
            if ACTIVE_TEAM.has_place_to_sell_player():
                if (ACTIVE_TEAM.has_at_least_one_gk() and player.position == 0) or player.position != 0:
                    if not player.contract:
                        if not player.injured():
                            popup = Confirmation()
                            popup.title = 'Buy player'
                            popup.text = 'Do you want to sell\n{} {}?\nSkill: {}\nValue: {}'.format(player.pos_to_str(), player.name, player.skill, gui.helpers.money_to_str(player.current_value()))
                            popup.yes = _sell_player
                            popup.open()
                        else:
                            Information().show(title="Can't be sold", information="You can't sell an injured player.")
                    else:
                        Information().show(title="Can't be sold", information="The player already has a contract\nfor this season.")
                else:
                    Information().show(title="Can't sell goalkeeper", information="You need to have at least 1 GK in your team.")
            else:
                Information().show(title='Minimum amount of players', information = "You need to have at least\n11 players in your team.")

    def on_pre_enter(self):
        global GAME
        GAME = App.get_running_app().GAME
        global ACTIVE_TEAM
        ACTIVE_TEAM = GAME.human_teams[0]

        ACTIVE_TEAM.order_players_by_playing_status()
        self.ids['team_list'].screen = self
        self.ids['team_list'].selected = None
        self.ids['team_list'].clear_selection()
        self.ids['team_list'].refresh()
        self.ids['header'].text_right = 'Money: {}'.format(gui.helpers.money_to_str(ACTIVE_TEAM.money))