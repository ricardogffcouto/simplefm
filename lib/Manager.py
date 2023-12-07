# coding: latin1
import copy
import lib.constants as sfm_glob

class Manager(object):
    def achievements(self):
        achievements = []
        career_stats = self.career_stats()
        if career_stats['Games'] >= 1:
            achievements.append("1_GAME")
        if career_stats['Games'] >= 10:
            achievements.append("10_GAMES")
        if career_stats['Games'] >= 50:
            achievements.append("50_GAMES")
        if career_stats['Games'] >= 100:
            achievements.append("100_GAMES")
        if career_stats['Games'] >= 200:
            achievements.append("200_GAMES")
        if career_stats['Games'] >= 500:
            achievements.append("500_GAMES")
        if career_stats['Games'] >= 1000:
            achievements.append("1000_GAMES")

    def career_stats_order(self):
        return ['Games',
            'Wins',
            'Draws',
            'Losses',
            'Goals For',
            'Goals Against',
            'Points',
            'Promotions',
            'Relegations',
            'Championships',
            '1st Div Winner']

    def points(self):
        points = 0
        for year, year_stats in enumerate(self.yearly_stats):
            div_multi = sfm_glob.COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] - year_stats['div_level']
            points += year_stats['pts'] * div_multi
            if year_stats['pos'] <= 3:
                points += sfm_glob.MANAGER['POINTS_PER_TOP_3_POS'] * (4 - year_stats['pos']) * div_multi
            if year_stats['pos'] == 1:
                points += sfm_glob.MANAGER['POINTS_PER_CHAMPIONSHIP'] * div_multi

        return points


    def championships(self):
        championships = [0] * sfm_glob.COMPETITION['TOTAL_NUMBER_OF_DIVISIONS']
        for year in self.yearly_stats:
            if year['pos'] == 1:
                championships[year['div_level']] += 1
        return championships

    def career_stats(self):
        career_stats = {
            'Games' : 0,
            'Wins' : 0,
            'Draws' : 0,
            'Losses' : 0,
            'Goals For' : 0,
            'Goals Against': 0,
            'Points' : 0,
            'Promotions' : 0,
            'Relegations' : 0,
            'Championships' : 0,
            '1st Div Winner' : 0
        }

        for year, year_stats in enumerate(self.yearly_stats):
            career_stats['Games'] += year_stats['Wins'] + year_stats['Draws'] + year_stats['Losses']
            career_stats['Points'] += year_stats['pts']
            for key, value in year_stats.items():
                if key in list(career_stats.keys()):
                    career_stats[key] += year_stats[key]
            if year + 1 < len(self.yearly_stats):
                if year_stats['div_level'] > self.yearly_stats[year + 1]['div_level']:
                    career_stats['Promotions'] += 1
                if year_stats['div_level'] < self.yearly_stats[year + 1]['div_level']:
                    career_stats['Relegations'] += 1

        career_stats['Championships'] = sum(self.championships())
        career_stats['1st Div Winner'] = self.championships()[0]
        return career_stats

    def update_stats(self):
        if len(self.yearly_stats) > 0:
            stats = copy.copy(self.team.league_stats)
            stats['div'] = self.team.division.name
            stats['div_level'] = self.team.division.level
            stats['pos'] = self.team.division.team_position(self.team)
            stats['pts'] = self.team.league_points()
            self.yearly_stats[-1] = stats

    def new_season(self):
        stats = copy.copy(self.team.league_stats)
        stats['div'] = self.team.division.name
        stats['div_level'] = self.team.division.level
        stats['pos'] = self.team.division.team_position(self.team)
        stats['pts'] = self.team.league_points()
        self.yearly_stats.append(stats)

    def __init__(self, name = None, team = None, human = False, yearly_stats = None):
        self.name = name

        self.team = team

        self.human = human

        if not yearly_stats:
            yearly_stats = []
        self.yearly_stats = yearly_stats