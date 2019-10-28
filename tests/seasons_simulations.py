
import lib.sfm_glob
from lib.Team import Team
from lib.Game import Game
from lib.Division import Division
import os
import time

GAME = Game()

# Create all teams
amount_of_teams = 16
weeks = (amount_of_teams - 1) * 2
divisions = 4
seasons = 30

GAME.start()

def seasons_simulation():
    for season in range(seasons):
        GAME.start_of_season()
        for div in GAME.divisions:
            for team in div.teams:
                team.tactic = [4, 3, 3]

        for i in range(30):
            GAME.simulate_weekly_matches()
            GAME.next_week()

        os.system('clear')
        print('Year ' + str(GAME.year()))
        print('-------\n')

        for div in GAME.divisions:
            if div.playable:
                div.order_table_by_position()
                print(div.name)
                div.print_table()
                print('\n')

        print('-------\n')
        GAME.end_of_season()

def money_season_simulation():
    for season in range(seasons):
        GAME.start_of_season()
        for i, div in enumerate(GAME.divisions):
            for j, team in enumerate(div.teams):
                GAME._create_ai_team(team, i, j)
        for i in range(30):
            GAME.simulate_weekly_matches()
            GAME.next_week()

        os.system('clear')
        print('Year ' + str(GAME.year()))
        print('-------\n')

        for div in GAME.divisions:
            if div.playable:
                div.order_table_by_position()
                print(div.name)
                for team in div.teams:
                    print(team.name[:4] + "\t\t" + str(int(team.money)))
                print('\n')

        print('-------\n')
        GAME.end_of_season()

seasons_simulation()

# human_team = teams[-1]
# human_team.human = True
# positions = [2, 6, 6, 4]
#
# # Create players for human team
# for i in range(18):
#     for idx, pos in enumerate(positions):
#         if pos != 0:
#             position = idx
#             positions[idx] -= 1
#             break
#
#     skill = random.randint(13, 16)
#
#     human_team.players.append(Player(skill = skill, position = position))

# human_team.set_playing_tactic([4, 3, 3])
# human_team.order_players_by_playing_status()
# for player in human_team.players:
#     print player.name + "\t" + str(player.position) + "\t" + str(player.skill) + ' ' + str(player.playing_status)
