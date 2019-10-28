# coding: latin1
from .Match import Match
from operator import attrgetter
from . import sfm_glob
import random


class Division(object):
    # TEAMS MONEY
    def money_per_result(self):
        '''Amount of money a team gets per result

        Returns:
            tuple: (float: value for win, float: value for draw, float: value for loss)
        '''
        division_level = sfm_glob.COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] - self.level
        division_level_multiplier = pow(sfm_glob.MONEY['DIVISION_INFLUENCE_ON_MATCH_RESULT_PRIZE_MONEY'], division_level)
        win = int(sfm_glob.MONEY['MIN PER WIN'] * division_level_multiplier)
        draw = int(sfm_glob.MONEY['MIN PER DRAW'] * division_level_multiplier)
        money = {'Win' : win, 'Draw' : draw, 'Loss' : 0}
        return money

    def money_per_end_of_season_position(self, pos):
        '''Amount of money a team gets per end of season position

        Returns:
            float: amount the team gets
        '''
        pos -= 1
        division_level = sfm_glob.COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] - self.level
        division_level_multiplier = pow(sfm_glob.MONEY['DIVISION_INFLUENCE_ON_END_OF_SEASON_PRIZE_MONEY'], division_level)
        division_min_prize_money = sfm_glob.MONEY['MIN END OF SEASON'] * division_level_multiplier
        position = sfm_glob.COMPETITION['TEAMS PER DIVISION'] - pos
        increase_per_pos = division_min_prize_money * pow(position * sfm_glob.MONEY['POS_INFLUENCE_ON_END_OF_SEASON_PRIZE_MONEY'], 2)
        eos_money = division_min_prize_money + increase_per_pos
        return int(eos_money)

    def sponsorship_per_end_of_season_position(self, pos):
        '''Amount of money a team gets per end of season position

        Returns:
            float: amount the team gets
        '''
        pos -= 1
        division_level = sfm_glob.COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] - self.level - 1
        division_level_multiplier = pow(sfm_glob.MONEY['DIVISION_INFLUENCE_ON_SPONSORSHIP'], division_level)
        division_min_sponsors_money = sfm_glob.MONEY['MIN_SPONSORS'] * division_level_multiplier
        position = sfm_glob.COMPETITION['TEAMS PER DIVISION'] - pos
        increase_per_pos = division_min_sponsors_money * pow(position * sfm_glob.MONEY['POS_INFLUENCE_ON_SPONSORSHIP'], 2)
        sponsorship = int(division_min_sponsors_money + increase_per_pos)
        if pos <= 2:
            sponsorship *= sfm_glob.MONEY['TOP_3_MULTI'][pos]
        if pos >= 13:
            sponsorship *= sfm_glob.MONEY['BOT_3_MULTI'][pos - 13]
        return int(sponsorship)

    def _create_matches(self):
        """ Create a schedule for the self.teams in the list and return it"""
        s = []
        teams = self.teams
        if len(self.teams) % 2 == 1:
            teams = self.teams + [None]
        random.shuffle(teams)

        # manipulate map (array of indexes for list) instead of list itself
        # this takes advantage of even/odd indexes to determine home vs. away
        n = len(teams)
        map = list(range(n))
        mid = n // 2
        for i in range(n - 1):
            l1 = map[:mid]
            l2 = map[mid:]
            l2.reverse()
            week = []
            for j in range(mid):
                t1 = teams[l1[j]]
                t2 = teams[l2[j]]
                if t1 is None or t2 is None:
                    pass
                else:
                    if j == 0 and i % 2 == 1:
                        # flip the first match only, every other round
                        # (this is because the first match always involves the last player in the list)
                        week.append((t2, t1))
                    else:
                        week.append((t1, t2))
            s.append(week)
            # rotate list by n/2, leaving last element at the end
            map = map[mid:-1] + map[:mid] + map[-1:]

        season = []
        for week in s:
            weekly_matches = []
            for teams_match in week:
                weekly_matches.append(Match(teams = teams_match))
            season.append(weekly_matches)

        for week in s:
            weekly_matches = []
            for teams_match in week:
                weekly_matches.append(Match(teams = list(reversed(teams_match))))
            season.append(weekly_matches)
        self.matches = season

    def start_of_season(self):
        def _create_matches():
            """ Create a schedule for the self.teams in the list and return it"""
            s = []
            teams = self.teams
            if len(self.teams) % 2 == 1:
                teams = self.teams + [None]
            random.shuffle(teams)

            # manipulate map (array of indexes for list) instead of list itself
            # this takes advantage of even/odd indexes to determine home vs. away
            n = len(teams)
            map = list(range(n))
            mid = n // 2
            for i in range(n - 1):
                l1 = map[:mid]
                l2 = map[mid:]
                l2.reverse()
                week = []
                for j in range(mid):
                    t1 = teams[l1[j]]
                    t2 = teams[l2[j]]
                    if t1 is None or t2 is None:
                        pass
                    else:
                        if j == 0 and i % 2 == 1:
                            # flip the first match only, every other round
                            # (this is because the first match always involves the last player in the list)
                            week.append((t2, t1))
                        else:
                            week.append((t1, t2))
                s.append(week)
                # rotate list by n/2, leaving last element at the end
                map = map[mid:-1] + map[:mid] + map[-1:]

            season = []
            for week in s:
                weekly_matches = []
                for teams_match in week:
                    weekly_matches.append(Match(teams = teams_match))
                season.append(weekly_matches)

            for week in s:
                weekly_matches = []
                for teams_match in week:
                    weekly_matches.append(Match(teams = list(reversed(teams_match))))
                season.append(weekly_matches)
            self.matches = season

        def _set_season_points_per_week():
            teams = sorted(self.teams, key=lambda x: -x.average_skill())
            step = (sfm_glob.TEAM_GOALS['MAX_POINTS_PER_WEEK'] - sfm_glob.TEAM_GOALS['MIN_POINTS_PER_WEEK']) / float(sfm_glob.COMPETITION['TEAMS PER DIVISION'] - 1)
            for i, team in enumerate(teams):
                team.season_points_per_week = sfm_glob.TEAM_GOALS['MAX_POINTS_PER_WEEK'] - i * step

        _create_matches()
        for team in self.teams:
            if team is not None:
                team.start_of_season()
                team.division = self
        _set_season_points_per_week()


    def end_of_season(self):
        for team in self.teams:
            team.end_of_season()

    def team_position(self, team):
        self.order_table_by_position()
        for pos, t in enumerate(self.teams):
            if t == team:
                return pos + 1
        return False

    def team_matches(self, team):
        matches = []
        for week in self.matches:
            for match in week:
                if team in match.teams:
                    matches.append(match)

        return matches

    def average_skill(self):
        total_skill = 0
        for team in self.teams:
            total_skill += team.average_skill()
        return total_skill / float(len(self.teams))

    def next_week(self, week):
        def _weekly_give_money_to_teams(week):
            money_per_result = self.money_per_result()
            for match in self.matches[week]:
                if match.winner() is not None:
                    match.winner().change_finances('Prize Money', money_per_result['Win'])
                else:
                    for team in match.teams:
                        team.change_finances('Prize Money', money_per_result['Draw'])

        def _weekly_change_fan_happiness(week):
            for match in self.matches[week]:
                if match.winner() is not None:
                    match.winner().fan_happiness_change_with_result(3)
                    match.loser().fan_happiness_change_with_result(0)
                else:
                    for team in match.teams:
                        team.fan_happiness_change_with_result(1)

        if self.playable:
            for team in self.teams:
                team.next_week()

            _weekly_give_money_to_teams(week)
            _weekly_change_fan_happiness(week)

    def print_weekly_matches(self, week):
        for match in self.matches[week]:
            match.print_result()
            print('-------------------------\n')

    def print_table(self):
        self.order_table_by_position()
        print('   Name\t\tPts\tW\tD\tL\tG+\tG-\tGdiff\n')
        for pos, team in enumerate(self.teams):
            print(str(pos + 1) + '. ' + str(team.name) + '\t' + str(team.league_points()) + '\t' + str(team.league_stats['Wins']) + '\t' + str(team.league_stats['Draws']) + '\t' + str(team.league_stats['Losses']) + '\t' + str(team.league_stats['Goals For']) + '\t' + str(team.league_stats['Goals Against']) + '\t' + str(team.league_stats['Goals For'] - team.league_stats['Goals Against']) + '\t' + str(team.avg_skill))

    def order_table_by_position(self):
        self.teams.sort(key=lambda x: (x.league_points(), x.goal_difference(), x.league_stats['Wins'], x.league_stats['Goals For'], -x.league_stats['Losses']), reverse = True)

    def order_table_by_name(self):
        self.teams.sort(key=attrgetter('name'))

    def simulate_weekly_matches(self, week):
        if self.playable:
            for match in self.matches[week]:
                if not match.finished:
                    match.simulate()

    def __init__(self, name, level, teams = None, matches = None, playable = True):
        self.name = name

        self.level = level

        if teams is None:
            teams = []
        self.teams = teams

        if matches is None:
            matches = []
        self.matches = matches

        self.playable = playable
