# coding: latin1
from . import sfm_glob
from . import helpers
import random
import pickle
from .Player import Player
from .Team import Team
from .Division import Division
from operator import attrgetter
from . import db
from .Manager import Manager

class Game(object):
    def team_skill_per_division(self, division_id, team_id):
        total_teams = sfm_glob.COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] * sfm_glob.COMPETITION['TEAMS PER DIVISION']
        step = (sfm_glob.TEAM['MAX_SKILL'] - sfm_glob.TEAM['MIN_DIV_SKILL']) / float(total_teams)
        team_id_total = (division_id - 1) * sfm_glob.COMPETITION['TEAMS PER DIVISION'] + (team_id - 1)
        return sfm_glob.TEAM['MAX_SKILL'] - team_id_total * step

    # START OF GAME
    def start(self, human_team = None, manager = None):
        all_teams = db.TEAMS
        if human_team:
            if human_team['prev_div'] and human_team['prev_pos']:
                human_team_index = (human_team['prev_div'] - 1) * sfm_glob.COMPETITION['TEAMS PER DIVISION'] + human_team['prev_pos'] - 1
                all_teams.insert(human_team_index, human_team)

        # Create all teams
        for division_id in range(sfm_glob.COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] + 1):
            # Create division and put teams in the division
            new_division = Division(name = "League " + str(division_id + 1), level = division_id)
            teams_in_division = sfm_glob.COMPETITION['TEAMS PER DIVISION']
            if division_id == sfm_glob.COMPETITION['TOTAL_NUMBER_OF_DIVISIONS']:
                teams_in_division = sfm_glob.COMPETITION['EXTRA_TEAMS']
                new_division = Division(name = "Extra Teams", level = division_id, playable= False)

            teams = []
            for team_id in range(teams_in_division):
                name = all_teams[division_id * sfm_glob.COMPETITION['TEAMS PER DIVISION'] + team_id]['name']
                country = db.TEAMS[division_id * sfm_glob.COMPETITION['TEAMS PER DIVISION'] + team_id]['country']
                color = db.TEAMS[division_id * sfm_glob.COMPETITION['TEAMS PER DIVISION'] + team_id]['color']
                team = Team(name = name, country = country, color = color, avg_skill = self.team_skill_per_division(division_id + 1, team_id + 1), division = new_division)
                teams.append(team)

                if human_team:
                    if human_team['name'] == name:
                        prev_div = division_id
                        prev_pos = team_id
                        h_team = team

            new_division.teams = teams
            # Put division in the Game
            self.divisions.append(new_division)

        if human_team:
            self.create_human_team(h_team, prev_div, prev_pos, manager)

    def save(self, folder):
        f = open('{}/{}.sfm'.format(folder, self.name), 'wb')
        pickle.dump(self.__dict__, f)
        f.close()

    # HUMAN TEAM
    def create_human_team(self, human_team, prev_div, prev_pos, manager):
        human_team.human = True
        positions = sfm_glob.TEAM["STARTING_AMOUNT_OF_PLAYERS_PER_POS"]
        positions[random.randint(1, 2)] -= 1

        # Create players for human team
        for position, amount in enumerate(positions):
            for i in range(amount):
                if i <= (amount / 2):
                    min_skill = int(helpers.min_max(human_team.avg_skill, 1, 20))
                    max_skill = int(helpers.min_max(human_team.avg_skill + 1, 1, 20))
                else:
                    min_skill = int(helpers.min_max(human_team.avg_skill - 3, 1, 20))
                    max_skill = int(helpers.min_max(human_team.avg_skill - 1, 1, 20))
                skill = random.randint(min_skill, max_skill)

                same_country = 0.55 + 0.125 * prev_div
                country = None
                if random.random() <= same_country:
                    country = human_team.country

                human_team.players.append(Player(skill = skill, position = position, country = country, team = human_team))

        human_team.weekly_sponsorship = human_team.division.sponsorship_per_end_of_season_position(pos = min(max(prev_pos, 4), 13)) #min(max) to prevent small money in beginning
        human_team.change_finances("Sponsors", human_team.weekly_sponsorship)
        human_team.change_finances("Prize Money", human_team.division.money_per_end_of_season_position(pos = min(max(prev_pos, 4), 13))) #min(max) to prevent small money in beginning
        human_team.set_playing_tactic()
        human_team.set_transfer_list()
        human_team.order_players_by_playing_status()
        human_manager = Manager(name = manager['name'], team = human_team, human = True)
        human_manager.update_stats()
        human_team.manager = human_manager
        self.human_teams.append(human_team)
        self.managers.append(human_manager)

    def _create_ai_team(self, team, prev_div, prev_pos):
        positions = sfm_glob.TEAM["STARTING_AMOUNT_OF_PLAYERS_PER_POS"]
        team.players = []

        # Create players for human team
        for position, amount in enumerate(positions):
            for i in range(amount):
                min_skill = int(helpers.min_max(team.avg_skill - 1, 1, 20))
                max_skill = int(helpers.min_max(team.avg_skill + 1, 1, 20))

                skill = random.randint(min_skill, max_skill)

                team.players.append(Player(skill = skill, position = position, country = team.country, team = team))

        team.weekly_sponsorship = team.division.sponsorship_per_end_of_season_position(pos = prev_pos)
        team.change_finances("Sponsors", team.weekly_sponsorship)
        team.change_finances("Prize Money", team.division.money_per_end_of_season_position(pos = prev_pos))
        team.set_playing_tactic()
        team.set_transfer_list()
        team.order_players_by_playing_status()

    # START OF SEASON
    def start_of_season(self):
        self.season += 1
        self.week = 0
        for div in self.divisions:
            div.start_of_season()

        for man in self.managers:
            man.new_season()

    # END OF SEASON
    def is_season_over(self):
        if self.week >= sfm_glob.COMPETITION['TOTAL GAMES']:
            return True
        return False

    def promoted_and_demoted_teams(self):
        promoted = [[] for x in range(len(self.divisions))]
        demoted = [[] for x in range(len(self.divisions))]

        for div in self.divisions:
            if div.playable:
                div.order_table_by_position()

                promoted[div.level] = div.teams[:sfm_glob.COMPETITION['PROMOTED AND DEMOTED']]
                demoted[div.level] = div.teams[-sfm_glob.COMPETITION['PROMOTED AND DEMOTED']:]
            else:
                promoted[div.level] = self.divisions[-1].teams[:sfm_glob.COMPETITION['PROMOTED AND DEMOTED']]

        return (promoted, demoted)

    def end_of_season(self):
        def _promotions_and_demotions():
            promoted, demoted = self.promoted_and_demoted_teams()

            for div in self.divisions:
                div.order_table_by_position()
                if div.level != self.divisions[-1].level:
                    div.teams = div.teams[:-sfm_glob.COMPETITION['PROMOTED AND DEMOTED']][sfm_glob.COMPETITION['PROMOTED AND DEMOTED']:]
                else:
                    div.teams = div.teams[sfm_glob.COMPETITION['PROMOTED AND DEMOTED']:]

            for div in self.divisions:
                if div.level == 0:
                    div.teams += promoted[div.level]
                if div.level != self.divisions[-1].level:
                    div.teams += promoted[div.level + 1]
                    div.teams += demoted[div.level - 1]
                else:
                    div.teams += demoted[div.level - 1]

        def _update_team_skills():
            '''Redefines team average skills for all teams according to their positions and divisions'''
            for div in self.divisions:
                if div.playable:
                    div.order_table_by_position()
                for pos, team in enumerate(div.teams):
                    team.avg_skill = self.team_skill_per_division(div.level + 1, pos + 1)
                    if not div.playable:
                        team.avg_skill += 1

        def _is_game_over():
            if human_team in self.divisions[-1].teams:
                return True

        for div in self.divisions:
            div.end_of_season()
        self.order_divisions_by_level()
        _update_team_skills()
        _promotions_and_demotions()

        if len(self.human_teams) > 0:
            human_team = self.human_teams[0]

            if _is_game_over():
                self.ended = True


    # WEEKLY
    def next_week(self):
        def _is_game_over():
            if human_team.fan_happiness < sfm_glob.TEAM_GOALS['MIN_FAN_HAPPINESS_FOR_FIRING']:
                prob = 1 - helpers.value01(sfm_glob.TEAM_GOALS['MIN_FAN_HAPPINESS_FOR_FIRING'], sfm_glob.TEAM_GOALS["MIN_FAN_HAPPINESS"], sfm_glob.TEAM_GOALS["MAX_FAN_HAPPINESS"])
                if random.uniform(0, 1) <= prob:
                    return True
                return False

        for division in self.divisions:
            division.next_week(week = self.week)
        self.week += 1

        if len(self.human_teams) > 0:
            human_team = self.human_teams[0]

            if _is_game_over():
                self.ended = True

        for manager in self.managers:
            manager.update_stats()

    def simulate_weekly_matches(self):
        for division in self.divisions:
            division.simulate_weekly_matches(week = self.week)

    # DIVISIONS
    def order_divisions_by_level(self):
        self.divisions.sort(key=attrgetter('level'))

    # INFORMATION
    def year(self):
        return sfm_glob.GAME['STARTING YEAR'] + self.season - 1

    def __init__(self, name = None, week = None, season = None, divisions = None, human_teams = None, managers = None, career = None, last_screen = None, ended = False):
        self.name = name

        if week is None:
            week = 0
        self.week = week

        if season is None:
            season = 0
        self.season = season

        if divisions is None:
            divisions = []
        self.divisions = divisions

        if human_teams is None:
            human_teams = []
        self.human_teams = human_teams

        if managers is None:
            managers = []
        self.managers = managers

        if last_screen is None:
            last_screen = "MainScreen"
        self.last_screen = last_screen

        self.ended = ended
