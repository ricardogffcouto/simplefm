# coding: latin1
import lib.Game as Game
import lib.Manager as Manager
import lib.helpers as helpers
import lib.sfm_glob as glob
import os
import getch
import string


class ConsoleGUI(object):

    def refresh(self):
        os.system('clear')
        if self.screen == 'Team':
            self.show_header()
            self.show_team_players_screen()
            print('\nTEAM CHOICES:')
            choices = ['Replace Player', 'Change Tactic', 'Buy Player', 'Sell Player', 'Finances', 'Play!']
            choice = self.get_choice(choices)
            if choice == 'Change Tactic':
                self.screen = 'Change Tactic'
            elif choice == 'Play!':
                if self.HUMAN_TEAM.allowed_tits():
                    self.screen = 'Match'
                else:
                    print('You have injured or not allowed players in your team.')
                    print('Continue...')
                    getch.getch()
            elif choice == 'Replace Player':
                self.screen = 'Replace Player'
            elif choice == 'Buy Player':
                self.screen = 'Transfer List'
            elif choice == 'Sell Player':
                self.screen = 'Sell Player'
            elif choice == 'Finances':
                self.screen = 'Finances'

        elif self.screen == 'Change Tactic':
            self.show_header()
            self.show_team_players_screen()
            choice = self.act_choose_tactic()
            self.screen = 'Team'

        elif self.screen == 'Match':
            match = self.HUMAN_TEAM.next_match(self.GAME.week)
            print(match)
            if match.goal_last_minute():
                print('***** GOAL from ' + str(match.goalscorers[-1]['team'].name) + '!!!!!')
                print('\n')

            print('*' * 20)
            tits = [p for p in self.HUMAN.team.players if p.playing_status == 0]
            for player in tits:
                print(player)
            print('*' * 20)

            if not match.finished:
                choices = ['Play']
                if match.allow_substitution(self.HUMAN_TEAM):
                    choices += ['Substitution']

                choice = self.get_choice(choices)
                if choice == 'Play':
                    match.minute()
                elif choice == 'Substitution':
                    self.screen = 'Substitution'
                if match.injured_player_out is not None:
                    print('Player injured...')
                    choices = ['Wait', 'Replace']
                    choice = self.get_choice(choices)
                    while choice == 'Wait':
                        choice = self.get_choice(choices)
                    if choice == 'Replace':
                        self.screen = 'Substitution Injured'
            else:
                print('Continue...')
                getch.getch()
                self.screen = 'Weekly matches'

        elif self.screen == 'Replace Player':
            self.show_header()
            replaced = self.act_replace_player(in_match = False)
            if replaced:
                another = self.ask_for_more_replacements()
                if not another:
                    self.screen = 'Team'
            else:
                self.screen = 'Team'

        elif self.screen == 'Substitution':
            match = self.HUMAN_TEAM.next_match(self.GAME.week)
            self.show_header()
            replaced = self.act_replace_player(in_match = True)
            if replaced:
                match.substitution_made_by_team(self.HUMAN_TEAM)
            self.screen = 'Match'

        elif self.screen == 'Substitution Injured':
            match = self.HUMAN_TEAM.next_match(self.GAME.week)
            self.show_header()
            replaced = self.act_replace_injured_player(player_out = match.injured_player_out)
            if replaced:
                match.substitution_made_by_team(self.HUMAN_TEAM)
            self.screen = 'Match'

        elif self.screen == 'Weekly matches':
            print('WEEK ' + str(self.GAME.week + 1) + ' MATCHES:\n')
            print(self.HUMAN_TEAM.division.name)
            print('*' * 50)
            print('\n')
            self.GAME.simulate_weekly_matches()
            self.HUMAN_TEAM.division.print_weekly_matches(self.GAME.week)
            print('\n')
            print('Continue...')
            getch.getch()
            self.screen = 'Division Table'

        elif self.screen == 'Division Table':
            print('WEEK ' + str(self.GAME.week + 1) + '\n')
            print(self.HUMAN_TEAM.division.name + ' TABLE:')
            print('*' * 50)
            print('\n')
            self.HUMAN_TEAM.division.print_table()
            print('\n')
            print('Continue...')
            getch.getch()
            self.screen = 'Next week'

        elif self.screen == 'Next week':
            self.GAME.next_week()
            if self.GAME.is_season_over():
                self.screen = 'End of Season'
            else:
                self.screen = 'Player New Contract'

        elif self.screen == 'End of Season':
            print('END OF SEASON')
            print('Continue...')
            getch.getch()
            self.GAME.end_of_season()
            self.screen = 'Start of Season'

        elif self.screen == 'Start of Season':
            print('START OF SEASON ' + str(self.GAME.year() + 1))
            print('Continue...')
            getch.getch()
            self.GAME.start_of_season()
            self.screen = 'Junior Team'

        elif self.screen == 'Junior Team':
            print('PLAYERS PROMOTED TO MAIN TEAM:')
            for player in self.HUMAN_TEAM.players_promoted_to_main_team:
                print(player)
            print('\n')
            print('Continue...')
            getch.getch()
            self.screen = 'Team'

        elif self.screen == 'Player New Contract':
            if self.GAME.week <= sfm_glob.TRANSFERS['LAST_WEEK']:
                if self.HUMAN_TEAM.player_asking_for_new_contract is not None:
                    self.show_team_players_screen()
                    player = self.HUMAN_TEAM.player_asking_for_new_contract
                    print('\nPLAYER WANTS A NEW CONTRACT!')
                    print('Your player ' + player.name + ' wants a new contract!')
                    print(player)
                    print('Wanted salary:')
                    print(helpers.money_to_str(player.wanted_salary))
                    if self.HUMAN_TEAM.has_place_to_sell_player():
                        print("If you don't renew it, he wants to be sold immediately!")
                        choices = ['Renew', 'Sell']
                        choice = self.get_choice(choices)
                        if choice == 'Sell':
                            self.HUMAN_TEAM.sell_player(player)
                        elif choice == 'Renew':
                            player.renew_contract()
                    else:
                        print("You have to renew his contract to keep your minimum of 11 players :(")
                        print('Continue...')
                        getch.getch()
                        player.renew_contract()

            self.screen = 'Transfer List'

        elif self.screen == 'Transfer List':
            print('Your team:')
            self.show_team_players_screen()
            print('\n')
            print('TRANSFER LIST')
            if self.HUMAN_TEAM.has_place_to_buy_player():
                print('Do you want to buy any of this players?')
                print('Your money: ' + helpers.money_to_str(self.HUMAN_TEAM.money))
                print('\n')
                choices = self.HUMAN_TEAM.players_to_buy + ['No']
                choice = self.get_choice(choices)
                if choice == 'No':
                    self.screen = 'Team'
                else:
                    player = choice
                    if self.HUMAN_TEAM.has_money_to_buy_player(player):
                        print('BUY:')
                        print(player)
                        print('\nConfirm?')
                        choices = ['Yes', 'No']
                        choice = self.get_choice(choices)
                        if choice == 'Yes':
                            self.HUMAN_TEAM.buy_player(player)
                    else:
                        print("You don't have enough money :(")
                        print('Continue...')
                        getch.getch()
            else:
                print("You don't have a place for more players in your team... Maximum 22 players :(")
                print('Continue...')
                getch.getch()
                self.screen = 'Team'

        elif self.screen == 'Sell Player':
            if self.HUMAN_TEAM.has_place_to_sell_player():
                print('\nSELL PLAYER:')
                players = [p for p in self.HUMAN.team.players if p.contract <= 0] + ['No']
                player = self.get_choice(players)
                if player == 'No':
                    self.screen = 'Team'
                else:
                    print('SELL:')
                    print(player)
                    print('\nConfirm?')
                    choices = ['Yes', 'No']
                    choice = self.get_choice(choices)
                    if choice == 'Yes':
                        self.HUMAN_TEAM.sell_player(player)
                        self.screen = 'Team'
            else:
                print("You can't sell players... Minimum 11 players :(")
                print('Continue...')
                getch.getch()

        elif self.screen == 'Finances':
            print('FINANCES\n')
            for key, value in self.HUMAN_TEAM.weekly_finances.items():
                print(key, '\t- ', helpers.money_to_str(value))
            print('Continue...')
            getch.getch()
            self.screen = 'Team'


        self.refresh()

    def act_replace_injured_player(self, player_out):
        print('\nREPLACE INJURED PLAYER:')
        print('INJURED:')
        print(player_out)
        match = self.HUMAN_TEAM.next_match(self.GAME.week)
        if match.allow_substitution(self.HUMAN_TEAM):
            print('IN:')
            if player_out.position == 0:
                subs = [p for p in self.HUMAN.team.players if p.playing_status == 1 and p.position == 0 and p.match_available()]
            else:
                subs = [p for p in self.HUMAN.team.players if p.playing_status == 1 and p.position != 0 and p.match_available()]

            if len(subs) < 0:
                print("No available players in bench...")
                print('Continue...')
                getch.getch()
                return False

            player_in = self.get_choice(subs)
            print('OUT: ' + player_out.__str__())
            print('IN:  ' + player_in.__str__())
            print('\nConfirm?')
            choices = ['Yes', 'No']
            confirm = self.get_choice(choices)
            if confirm == 'Yes':
                self.HUMAN_TEAM.replace_player(player_in = player_in, player_out = player_out, in_match = True)
                return True
            else:
                return False
        else:
            print("No more substitutions allowed...")
            print('Continue...')
            getch.getch()

    def act_replace_player(self, in_match):
        print('\nREPLACE PLAYER:')
        match = self.HUMAN_TEAM.next_match(self.GAME.week)
        if (in_match and match.allow_substitution(self.HUMAN_TEAM)) or not in_match:
            tits = [p for p in self.HUMAN.team.players if p.playing_status == 0 and p.match_available()]
            if len(tits) > 0:
                print('OUT:')
                player_out = self.get_choice(tits)
            else:
                print('No players to change...')
                getch.getch()
                return False

            print('IN:')
            if player_out.position == 0:
                subs = [p for p in self.HUMAN.team.players if p.playing_status == 1 and p.position == 0 and p.match_available()]
            else:
                subs = [p for p in self.HUMAN.team.players if p.playing_status == 1 and p.position != 0 and p.match_available()]

            if len(subs) < 0:
                print("You can't replace the GK because you don't have another")
                self.get_choice(['OK'])
                return False

            player_in = self.get_choice(subs)
            print('OUT: ' + player_out.__str__())
            print('IN:  ' + player_in.__str__())
            print('\nConfirm?')
            choices = ['Yes', 'No']
            confirm = self.get_choice(choices)
            if confirm == 'Yes':
                self.HUMAN_TEAM.replace_player(player_in = player_in, player_out = player_out, in_match = in_match)
                return True
            else:
                return False
        else:
            print("No more substitutions allowed...")
            print('Continue...')
            getch.getch()

    def ask_for_more_replacements(self):
        print('Players replaced!')
        print('Another?')
        choices = ['Yes', 'No']
        another = self.get_choice(choices)
        if another == 'Yes':
            return True
        else:
            return False

    def get_choice(self, options):
        char = ''
        opt_str = ''
        if len(options) < 0:
            options = ['Back']

        for i, opt in enumerate(options):
            choice = i + 1
            if choice >= 10:
                choice = string.lowercase[i - 9]
            opt_str += '| ' + str(choice) + ' | ' + str(opt) + ' |\n'

        while True:
            print(opt_str)
            char = getch.getch()
            for i, opt in enumerate(options):
                choice = i + 1
                if choice >= 10:
                    choice = string.lowercase[i - 9]
                if char == str(choice):
                    return opt

            print('Invalid option. Select again:')

    def show_header(self):
        print('*' * 50)
        print('Week ' + str(self.GAME.week + 1) + ' | Year ' + str(self.GAME.year()))
        print('Next game vs. ' + self.HUMAN_TEAM.next_match_to_str(self.GAME.week))
        opponent = self.HUMAN_TEAM.next_opponent(self.GAME.week)
        print(helpers.tactic_to_str(opponent.tactic))
        print('Skill: ' + '▮' * int(round(opponent.average_skill(), 0)))
        print('*' * 50)


    def show_team_players_screen(self):
        tits = [p for p in self.HUMAN.team.players if p.playing_status == 0 and p.match_available()]
        subs = [p for p in self.HUMAN.team.players if p.playing_status == 1 and p.match_available()]
        injured = [p for p in self.HUMAN.team.players if not p.match_available()]
        for player in tits:
            print(player)
        print('\n')
        for player in subs:
            print(player)
        print('\n')
        for player in injured:
            print(player)

    def act_choose_tactic(self):
        allowed_tactics = self.HUMAN_TEAM.list_of_allowed_tactics()
        print('\nCHANGE TACTIC:')
        tactic = self.get_choice(allowed_tactics)
        self.HUMAN_TEAM.set_playing_tactic(tactic)

    def __init__(self):
        self.GAME = Game.Game()
        self.GAME.start()

        self.HUMAN_TEAM = self.GAME.create_human_team()

        self.HUMAN = Manager.Manager(name = 'Ricardo', game = self.GAME, team = self.HUMAN_TEAM, human = True)
        self.GAME.managers.append(self.HUMAN)

        self.screen = 'Team'


GUI = ConsoleGUI()
GUI.refresh()
