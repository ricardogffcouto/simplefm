# coding: latin1
from . import sfm_glob
from . import helpers
import random
import operator
from .Player import Player


class Match(object):

    def __str__(self):
        minutes = str(self.minutes) + "'" + '\t' + self.teams[0].name + '\t ' + str(self.score[0]) + ' x ' + str(self.score[1]) + '\t' + self.teams[1].name

        poss = self.ball_possession()
        last5 = self.ball_possession_last_5_minutes()

        possession = '\t' + 'Possession:' + '\t' + str(poss[0]) + ' x ' + str(poss[1])

        last_5 = '\t' + 'Last 5min:' + '\t' + str(last5[0]) + ' x ' + str(last5[1])

        goalscorers = 'Goals:\n'
        for goalscorer in self.goalscorers:
            spacing = '\t'
            if goalscorer['team'] == self.teams[1]:
                spacing = '\t\t\t   '
            goalscorers += spacing + goalscorer['player'].name + '\t' + str(goalscorer['minute']) + "'\n"

        end = '----------'

        return minutes + '\n' + possession + '\n' + last_5 + '\n' + goalscorers + '\n' + end

    def allow_substitution(self, team):
        if team == self.teams[0]:
            if self.substitutions[0] < 3 and self.minutes > 0:
                return True
        else:
            if self.substitutions[1] < 3 and self.minutes > 0:
                return True
        return False

    def substitution_made_by_team(self, team):
        if team == self.teams[0]:
            self.substitutions[0] += 1
        else:
            self.substitutions[1] += 1

    def print_result(self):
        if self.finished:
            result = self.teams[0].name + '\t ' + str(self.score[0]) + ' x ' + str(self.score[1]) + '\t' + self.teams[1].name
        else:
            result = self.teams[0].name + '\t' + 'x' + '\t' + self.teams[1].name
        print(result)

    def simulate(self, minutes = None):
        if self.teams[0] is None:
            self.end()
            return True
        if self.teams[1] is None:
            self.end()
            return True
        if self.finished:
            self.end()
            return True

        if minutes is None or minutes >= 90:
            while self.minute():
                pass
        else:
            while self.minutes < minutes:
                self.minute()

        self.end()

    def goal_last_minute(self):
        goals_last_minute = [g for g in self.goalscorers if g['minute'] == self.minutes]
        if len(goals_last_minute) > 0:
            return True
        return False

    def choose_goal_scorer(self, team_id):
        choices = []

        if self.teams[team_id].human:
            tits = [p for p in self.teams[team_id].players if p.playing_status == 0]
            for player in tits:
                probability = sfm_glob.MATCH['GOAL PROB PER POSITION'][player.position]
                choices.append((player, probability))

            return helpers.weighted_choice(choices)
        else:
            players = [p['player'] for p in self.goalscorers if p['team'] == self.teams[team_id]]
            if players is None:
                players = []

            for player in players:
                probability = 0.25
                choices.append((player, probability))

            for i in range(len(players) + 1):
                new_player = Player(country = self.teams[team_id].country, skill = 0)
                choices.append((new_player, 0.25))

            return helpers.weighted_choice(choices)

    def goal(self, team_id):
        self.score[team_id] += 1
        goalscorer = self.choose_goal_scorer(team_id)
        self.goalscorers.append({'player' : goalscorer, 'team' : self.teams[team_id], 'minute' : self.minutes})

    def minute(self):
        self.injured_player_out = None

        if self.teams[0] is None:
            self.end()
            return False
        if self.teams[1] is None:
            self.end()
            return False
        if self.finished:
            return False
        if self.minutes >= 90:
            self.end()
            return False

        self.minutes += 1
        
        for team in self.teams:
            for player in team.players:
                if player.playing_status == 0:
                    player.match_minutes += 1
        team_0_skills = self.teams[0].tactical_skill(match = True, minutes = self.minutes)
        team_1_skills = self.teams[1].tactical_skill(match = True, minutes = self.minutes)

        if not self.is_neutral_field:
            team_0_skills = [x * sfm_glob.MATCH['HOME_ADVANTAGE'] for x in team_0_skills]

        # Probability of team 0 having possession
        team_0_attack_prob = helpers.min_max(helpers.balance(team_0_skills[1], team_1_skills[1]), 1 - sfm_glob.MATCH['MAX_POSS'], sfm_glob.MATCH['MAX_POSS'])

        if random.random() <= team_0_attack_prob:
            # attack team 0
            possession = 0
            SKILL_BAL = helpers.balance(team_0_skills[2], team_1_skills[0])
            goal_prob = helpers.min_max(SKILL_BAL, sfm_glob.MATCH['MIN_SKILL_BALANCE'], 1) * sfm_glob.MATCH['MAX_GOAL_PROB_PER_POSS']
        else:
            # attack team 1
            possession = 1
            SKILL_BAL = helpers.balance(team_1_skills[2], team_0_skills[0])
            goal_prob = helpers.min_max(SKILL_BAL, sfm_glob.MATCH['MIN_SKILL_BALANCE'], 1) * sfm_glob.MATCH['MAX_GOAL_PROB_PER_POSS']

        if random.random() <= goal_prob:
            self.goal(team_id = possession)
        else:
            for team in self.teams:
                if team.human:
                    if random.random() <= sfm_glob.MATCH['INJURY_PROBABILITY_PER_MINUTE']: #* (self.minutes / 90):
                        self.injured_player_out = self.player_injured(team)
                        if self.injured_player_out is not None:
                            self.injured_player_out.set_injury()                        

        if self.teams[0].human:
            tits = [p for p in self.teams[0].players if p.playing_status == 0]
            if len(tits) < sfm_glob.MATCH['MINIMUM_PLAYERS']:
                self.score[0] = 0
                self.score[1] = max(3, self.score[1])
                self.end()
                return False

        if self.teams[1].human:
            tits = [p for p in self.teams[1].players if p.playing_status == 0]
            if len(tits) < sfm_glob.MATCH['MINIMUM_PLAYERS']:
                self.score[1] = 0
                self.score[0] = max(3, self.score[1])
                self.end()
                return False

        self.possession[possession] += 1
        self.possession_last_5_minutes.append(possession)
        if len(self.possession_last_5_minutes) > 5:
            self.possession_last_5_minutes.pop(0)
        return True

    def ball_possession(self):
        if self.minutes != 0:
            poss0 = int(round((self.possession[0] / float(self.minutes)) * 100, 0))
            poss1 = 100 - poss0
            if poss0 >= 80:
                poss0 = 80
                poss1 = 20
            if poss1 >= 80:
                poss0 = 20
                poss1 = 80
            return [poss0, poss1]
        else:
            return [50, 50]

    def ball_possession_last_5_minutes(self):
        if len(self.possession_last_5_minutes) > 0:
            poss1 = int(sum(self.possession_last_5_minutes) * (100 / float(len(self.possession_last_5_minutes))))
            poss0 = 100 - poss1
            if poss0 >= 80:
                poss0 = 80
                poss1 = 20
            if poss1 >= 80:
                poss0 = 20
                poss1 = 80
            return [poss0, poss1]
        else:
            return [50, 50]

    def end(self):
        if not self.finished:
            self.teams[0].update_stats_post_match(self.score[0], self.score[1])
            self.teams[1].update_stats_post_match(self.score[1], self.score[0])
            self.minutes = 90
            self.finished = True

    def player_injured(self, team):
        choices = []

        if team.human:
            tits = [p for p in team.players if p.playing_status == 0]
            for player in tits:
                if player.position == 0:
                    probability = sfm_glob.PLAYER['INJURY_PROB_GK']
                else:
                    probability = sfm_glob.PLAYER['INJURY_PROB_NOT_GK']
                choices.append((player, probability))
            return helpers.weighted_choice(choices)
        else:
            return None

    def winner(self):
        if self.score[0] > self.score[1]:
            return self.teams[0]
        elif self.score[1] > self.score[0]:
            return self.teams[1]
        else:
            return None

    def loser(self):
        if self.score[0] < self.score[1]:
            return self.teams[0]
        elif self.score[1] < self.score[0]:
            return self.teams[1]
        else:
            return None

    def __init__(self, teams, minutes = None, score = None, possession = None, possession_last_5_minutes = None, tactical_changes = None, finished = False, substitutions = None, goalscorers = None, injured_player_out = None, is_neutral_field = False):
        self.teams = teams

        if minutes is None:
            minutes = 0
        self.minutes = minutes

        if score is None:
            score = [0, 0]
        self.score = score

        if possession is None:
            possession = [0, 0]
        self.possession = possession

        if possession_last_5_minutes is None:
            possession_last_5_minutes = []
        self.possession_last_5_minutes = possession_last_5_minutes

        if tactical_changes is None:
            tactical_changes = [0, 0]
        self.tactical_changes = tactical_changes

        self.finished = finished

        if substitutions is None:
            substitutions = [0, 0]
        self.substitutions = substitutions

        if goalscorers is None:
            goalscorers = []
        self.goalscorers = goalscorers

        self.injured_player_out = injured_player_out

        self.is_neutral_field = is_neutral_field
