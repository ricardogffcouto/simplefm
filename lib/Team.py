# coding: latin1
from . import sfm_glob
from . import helpers
import random
from .Player import Player
from operator import attrgetter
from .News import News, NewsList


class TeamFinances(object):
    def __init__(self, money = None, salaries = None, bought_players = None, sold_players = None, prize_money = None, sponsors = None):
        if money is None:
            money = 0
        self.money = money

        if salaries is None:
            salaries = 0
        self.salaries = salaries

        if bought_players is None:
            bought_players = 0
        self.bought_players = bought_players

        if sold_players is None:
            sold_players = 0
        self.sold_players = sold_players

        if prize_money is None:
            prize_money = 0
        self.prize_money = prize_money

        if sponsors is None:
            sponsors = 0
        self.sponsors = sponsors

class Team(object):
    def id_to_player(self, player_id):
        for player in self.players:
            if id(player) == int(player_id):
                return player

    # SQUAD INFORMATION
    def are_available_players_outside_of_bench(self):
        if len([p for p in self.players if p.playing_status == 2 and p.match_available()]) > 0 and len([p for p in self.players if p.playing_status == 1]) < sfm_glob.TEAM['BENCH_PLAYERS']:
            return True
        return False

    def allowed_tits(self):
        tits = [p for p in self.players if p.playing_status == 0]
        for player in tits:
            if not player.match_available():
                return False
        return True

    def amount_of_tits(self):
        return len([p for p in self.players if p.playing_status == 0])

    def average_skill(self):
        if self.human:
            return sum([p.skill for p in self.players])/float(len(self.players)) + 0.8
        else:
            return self.avg_skill

    def tits_avg_skill(self, match = False, minutes = 0):
        skill = self.tits_total_skill(match, minutes)
        for pos in range(4):
            skill[pos] = skill[pos] / 11.0

        return skill

    def tits_total_skill(self, match = False, minutes = 0):
        total_skill = [0, 0, 0, 0]

        for pos in range(4):
            if self.human:
                if match:
                    players_in_position = [p.match_skill() for p in self.players if p.playing_status == 0 and p.position == pos]
                else:
                    players_in_position = [p.skill for p in self.players if p.playing_status == 0 and p.position == pos]
                total_skill[pos] += sum(players_in_position)
            else:
                if pos == 0:
                    total_skill[pos] = self.avg_skill - minutes * sfm_glob.PLAYER["SKILL_DROP_PER_MINUTE_AI"]
                else:
                    total_skill[pos] = self.avg_skill * self.current_tactic()[pos - 1] - minutes * sfm_glob.PLAYER["SKILL_DROP_PER_MINUTE_AI"]

        return total_skill

    def tactical_skill(self, match, minutes = 0):
        def _tactical_skill_balance(skill):
            return pow(2, skill * 0.625)

        skill = self.tits_avg_skill(match, minutes)
        tactic = self.current_tactic()

        GK = _tactical_skill_balance(skill[0])
        DF = _tactical_skill_balance(skill[1])
        MD = _tactical_skill_balance(skill[2])
        AT = _tactical_skill_balance(skill[3])

        if tactic[0] <= 2:
            DF = DF * sfm_glob.TEAM['TACTICAL_PENALTIES']['DF <= 2']
            MD = MD * sfm_glob.TEAM['TACTICAL_PENALTIES']['MD DF <= 2']
        if tactic[0] == 3:
            DF = DF * sfm_glob.TEAM['TACTICAL_PENALTIES']['DF == 3']
        if tactic[0] == 5:
            DF = DF * sfm_glob.TEAM['TACTICAL_PENALTIES']['DF == 5']
        if tactic[1] <= 1:
            DF = DF * sfm_glob.TEAM['TACTICAL_PENALTIES']['DF AT MD <= 1']
            AT = AT * sfm_glob.TEAM['TACTICAL_PENALTIES']['DF AT MD <= 1']
        if tactic[1] <= 2:
            MD = MD * sfm_glob.TEAM['TACTICAL_PENALTIES']['MD <= 2']
        if tactic[2] == 1:
            AT = AT * sfm_glob.TEAM['TACTICAL_PENALTIES']['AT == 1']
        if tactic[2] == 2:
            AT = AT * sfm_glob.TEAM['TACTICAL_PENALTIES']['AT == 2']
        if tactic[2] == 0:
            MD = MD * sfm_glob.TEAM['TACTICAL_PENALTIES']['MD AT == 0']
            AT = AT * sfm_glob.TEAM['TACTICAL_PENALTIES']['AT == 0']
        if tactic[2] == 4:
            AT = AT * sfm_glob.TEAM['TACTICAL_PENALTIES']['AT == 4']

        has_goalkeeper = True
        if self.human:
            has_goalkeeper = True if len([p for p in self.players if p.position == 0 and p.playing_status == 0]) > 0 else False

        if has_goalkeeper:
            DF = DF + GK * sfm_glob.TEAM['GOALKEEPER BONUS']
        else:
            DF = DF * sfm_glob.TEAM['TACTICAL_PENALTIES']['NO GK']

        return (DF, MD, AT)

    # MATCH INFORMATION
    def next_match(self, week):
        if week < sfm_glob.COMPETITION['TOTAL GAMES']:
            for match in self.division.matches[week]:
                for team in match.teams:
                    if team == self:
                        return match
        else:
            return None

    def next_opponent(self, week):
        match = self.next_match(week)
        if match:
            if match.teams[0] == self:
                return match.teams[1]
            else:
                return match.teams[0]
        return None

    def fixture_list(self, week = None):
        pass

    # SQUAD
    def can_substitute_player(self, player_in, player_out):
        if player_in.position == 0:
            if player_out.position != 0:
                return False
        else:
            if player_out.position == 0:
                return False

        if player_in.playing_status == player_out.playing_status:
            return False

        return True

    def can_replace_player(self, player_in, player_out):
        if not self.can_substitute_player(player_in, player_out):
            return False

        if player_in.injured() or player_out.injured():
            return False

        return True

    def replace_player(self, player_in, player_out, in_match = False, match_minutes = None):
        if not in_match:
            if self.can_replace_player(player_in, player_out):
                player_out.playing_status, player_in.playing_status = player_in.playing_status, player_out.playing_status
                return True
        else:
            if self.can_substitute_player(player_in, player_out):
                player_in.playing_status = 0
                player_in.sub_minutes = match_minutes
                player_out.playing_status = 2
                return True
        return False

    def get_players_per_position(self):
        players = []
        for pos in range(4):
            players.append([p for p in self.players if p.position == pos and p.match_available()])
        return players

    # TRANSFERS
    def has_place_to_sell_player(self):
        if len(self.players) > 11:
            return True
        return False

    def has_at_least_one_gk(self):
        if len([p for p in self.players if p.position == 0]) > 1:
            return True
        return False

    def sell_player(self, player):
        if player.position == 0 and len([p for p in self.players if p.position == 0]) <= 1:
            return False

        if player.can_be_sold() and self.has_place_to_sell_player():
            self.change_finances('Sold Players', player.current_value())
            self.players.remove(player)
            self.set_playing_tactic()
            return True

        return False

    def buy_player(self, player):
        if self.has_money_to_buy_player(player):
            if self.has_place_to_buy_player:
                self.players.append(player)
                player.contract = True
                player.playing_status = 2
                player.team = self
                self.change_finances('Bought Players', -player.current_value())
                self.players_to_buy.remove(player)
                return True
        return False

    # CONTRACT
    def renew_contract(self, player):
        if not player.contract:
            player.renew_contract()
            return True
        return False

    def has_money_to_buy_player(self, player):
        if player.current_value() <= self.money:
            return True
        else:
            return False

    def has_place_to_buy_player(self):
        if len(self.players) < sfm_glob.TEAM['MAX NUMBER OF PLAYERS']:
            return True
        else:
            return False

    def players_value_sum(self):
        return sum([p.current_value() for p in self.players])

    def players_salary_sum(self):
        return sum([p.salary for p in self.players])

    # STRINGS
    def next_match_to_str(self, week):
        match = self.next_match(week)
        if match.teams[0] == self:
            return match.teams[1].name + ' (Home)'
        else:
            return match.teams[0].name + ' (Away)'

    # WEEKLY
    def finances_weekly_expense(self):
        return sum(value for key, value in self.weekly_finances.items() if (key == "Salaries" or key == "Bought Players"))

    def finances_weekly_income(self):
        return sum(value for key, value in self.weekly_finances.items() if (key == "Sold Players" or key == "Prize Money" or key == "Sponsors"))

    def finances_yearly_expense(self):
        return sum(value for key, value in self.yearly_finances.items() if (key == "Salaries" or key == "Bought Players"))

    def finances_yearly_income(self):
        return sum(value for key, value in self.yearly_finances.items() if (key == "Sold Players" or key == "Prize Money" or key == "Sponsors"))

    def set_transfer_list(self):
        def _player_skill(team_avg_skill, division_avg_skill):
            max_skill_choices = {16: 5, 17: 4, 18: 3, 19: 2, 20: 1}
            max_skill_limit = random.choice([x for x in max_skill_choices for y in range(max_skill_choices[x])])

            min_skill = min(max_skill_limit - sfm_glob.TRANSFERS["SKILL VARIATION ON TRANSFER LIST"], (team_avg_skill + division_avg_skill) * 0.5 - sfm_glob.TRANSFERS["SKILL VARIATION ON TRANSFER LIST"])
            max_skill = min(max_skill_limit, (team_avg_skill + division_avg_skill) * 0.5 + sfm_glob.TRANSFERS["SKILL VARIATION ON TRANSFER LIST"])

            skill_temp = random.uniform(min_skill, max_skill)
            skill = int(round(helpers.min_max(skill_temp, sfm_glob.PLAYER['MIN_SKILL'], sfm_glob.PLAYER['MAX_SKILL']), 0))
            return skill

        def _player_country():
            same_country = 0.35 + 0.2 * self.division.level
            country = None
            if random.random() <= same_country:
                country = self.country
            return country

        money_available = self.money + sum([p.current_value() for p in self.players if not p.contract])
        if money_available < 0:
            self.players_to_buy = []
            return True

        player_list = []

        amount_of_players_in_transfer_list = sfm_glob.TRANSFERS['AVERAGE PLAYERS PER TURN'] + random.randint(-sfm_glob.TRANSFERS['VARIATION OF AMOUNT OF PLAYERS PER TURN'], sfm_glob.TRANSFERS['VARIATION OF AMOUNT OF PLAYERS PER TURN'])

        for p in range(amount_of_players_in_transfer_list):
            player = Player(country = _player_country(), skill = _player_skill(self.average_skill(), self.division.average_skill()))
            while player.skill >= sfm_glob.PLAYER["MIN_SKILL"]:
                if player.current_value() <= money_available:
                    player_list.append(player)
                    break
                else:
                    player.skill -= 1

        self.players_to_buy = player_list
        return True

    def change_finances(self, key, value):
        if value > 0:
            self.weekly_finances[key] += value
            self.yearly_finances[key] += value
        else:
            self.weekly_finances[key] -= value
            self.yearly_finances[key] -= value

        self.money += value

    def next_week(self):
        def _reduce_injury():
            injured_players = [p for p in self.players if p.injured()]
            for player in injured_players:
                player.reduce_injury()

        def _player_asking_for_new_contract():
            if random.random() <= sfm_glob.PLAYER['WEEKLY_PROBABILITY_OF_ASKING_FOR_NEW_CONTRACT']:
                player_list = [p for p in self.players if not p.contract and not p.injured()]
                if len(player_list) > 0:
                    player = random.choice(player_list)
                    player.set_renew_contract_wanted_salary(asking = True)
                    player.wants_new_contract = True
                    player.playing_status = 2
                    self.weekly_news.news.append(News('New contract', player.name))

        def _set_training():
            for player in self.players:
                player.set_weekly_training()
                player.match_minutes = 0
                player.sub_minutes = 0

        def _set_finances():
            for key in self.weekly_finances:
                self.weekly_finances[key] = 0

            self.change_finances('Sponsors', self.weekly_sponsorship)
            self.change_finances('Salaries', -self.players_salary_sum())

        def _sell_player_if_money_below_0():
            if self.money < 0:
                sellable_players = [p for p in self.players if p.can_be_sold()]
                if len(sellable_players) <= 0 or self.players <= 11:
                    return False

                sellable_players.sort(key=lambda x: x.current_value())
                for p in sellable_players:
                    if p.current_value() >= abs(self.money):
                        if self.sell_player(p):
                            self.weekly_news.news.append(News('Forced sold player', p.name))
                            return True

                if self.sell_player(sellable_players[-1]):
                    self.weekly_news.news.append(News('Forced sold player', sellable_players[-1].name))
                    return True

                return False

        self.weekly_news.news = []
        _set_finances()
        _sell_player_if_money_below_0()
        _reduce_injury()
        _set_training()
        _player_asking_for_new_contract()
        self.set_transfer_list()
        self.set_playing_tactic()

    def min_pos_per_season_points_per_week(self):
        diff = sfm_glob.TEAM_GOALS['MAX_POINTS_PER_WEEK'] - sfm_glob.TEAM_GOALS['MIN_POINTS_PER_WEEK']
        pos = [
            13, 11, 9, 6, 3, 1
        ]
        step = diff / float(len(pos))
        points = self.season_points_per_week

        for i in range(len(pos)):
            if points <= sfm_glob.TEAM_GOALS['MIN_POINTS_PER_WEEK'] + (i + 1) * step:
                return pos[i]
        return 1


    # START OF SEASON
    def reset_league_stats(self):
        self.league_stats = {'Wins' : 0, 'Draws' : 0, 'Losses' : 0, 'Goals For' : 0, 'Goals Against' : 0}


    def start_of_season(self):
        def _promote_player_from_youth_team():
            min_skill = self.average_skill() - int(self.average_skill() / 5.0) - sfm_glob.PLAYER['SKILL_DROP_FROM_BEING_YOUTH_PLAYER']
            max_skill = self.average_skill() - int(self.average_skill() / 5.0)
            skill = helpers.min_max(random.uniform(min_skill, max_skill), sfm_glob.PLAYER['MIN_SKILL'], sfm_glob.PLAYER['MAX_YOUTH_PLAYER_SKILL'])
            skill = int(round(skill, 0))
            player = Player(country = self.country, skill = skill, age = random.choice([18, 19]), team = self)
            self.weekly_news.news.append(News('Juniors', player.name))
            self.players.append(player)

        def _remove_retired_players():
            retired = [player for player in self.players if player.retired]
            for player in retired:
                player.team = None
                self.players.remove(player)
                self.weekly_news.news.append(News('Retired', player.name))

        self.weekly_news.news = []
        self.reset_league_stats()
        _remove_retired_players()

        if not self.human:
            self.tactic = random.choice(2 * sfm_glob.TEAM['BASE TACTICS'] + sfm_glob.TEAM['DEF TACTICS'] + sfm_glob.TEAM['ATK TACTICS'])
        else:
            for player in self.players:
                player.start_of_season()

            amount = random.randint(
                sfm_glob.TEAM['AVG_YOUTH_PLAYERS_PROMOTED_PER_YEAR'] - 1, sfm_glob.TEAM['AVG_YOUTH_PLAYERS_PROMOTED_PER_YEAR'] + 1
            )

            places_left_in_team = sfm_glob.TEAM['MAX NUMBER OF PLAYERS'] - len(self.players)

            for juniors in range(min(places_left_in_team, amount)):
                _promote_player_from_youth_team()

            self.set_transfer_list()
            self.set_playing_tactic()

    # END OF SEASON
    def reset_finances(self):
        self.weekly_finances = {'Salaries' : 0, 'Bought Players' : 0, 'Sold Players' : 0, 'Prize Money' : 0, 'Sponsors' : 0}
        self.yearly_finances = {'Salaries' : 0, 'Bought Players' : 0, 'Sold Players' : 0, 'Prize Money' : 0, 'Sponsors' : 0}

    def end_of_season(self):
        self.reset_finances()
        for player in self.players:
            player.end_of_season()

        pos = self.division.team_position(self)
        self.weekly_sponsorship = self.division.sponsorship_per_end_of_season_position(pos)
        self.change_finances("Sponsors", self.weekly_sponsorship)
        self.change_finances("Prize Money", self.division.money_per_end_of_season_position(pos))


    # LEAGUE STATS INFORMATION
    def end_of_season_promoted_or_demoted(self):
        pos = self.division.team_position(self)
        if pos <= sfm_glob.COMPETITION['PROMOTED AND DEMOTED']:
            return 0
        elif pos > len(self.division.teams) - sfm_glob.COMPETITION['PROMOTED AND DEMOTED']:
            return 2
        else:
            return 1

    # MATCH
    def update_stats_post_match(self, goals_for, goals_against):
        if goals_for > goals_against:
            self.league_stats['Wins'] += 1
        elif goals_for == goals_against:
            self.league_stats['Draws'] += 1
        else:
            self.league_stats['Losses'] += 1

        self.league_stats['Goals For'] += goals_for
        self.league_stats['Goals Against'] += goals_against

        if self.manager:
            self.manager.update_stats()



    def goal_difference(self):
        return self.league_stats['Goals For'] - self.league_stats['Goals Against']

    def league_points(self):
        return self.league_stats['Wins'] * 3 + self.league_stats['Draws'] * 1

    # PLAYER ORDERING
    def order_players_by_skill(self, only_allowed = True):
        if only_allowed:
            self.players.sort(key=lambda x: (x.injury, -x.skill))
        else:
            self.players.sort(key=lambda x: (-x.skill))

    def order_players_by_position(self, only_allowed = True):
        if only_allowed:
            self.players.sort(key=lambda x: (x.injury, x.position, -x.skill, x.age))
        else:
            self.players.sort(key=lambda x: (x.position, -x.skill, x.age))

    def order_players_by_playing_status(self, only_allowed = True):
        if only_allowed:
            self.players.sort(key=lambda x: (x.injury, x.playing_status, x.position, -x.skill))
        else:
            self.players.sort(key=lambda x: (x.playing_status, x.position, -x.skill))


    # TACTICS
    def total_available_players_per_position(self):
        total = [0, 0, 0, 0]
        for pos in range(4):
            total[pos] = len([p for p in self.players if p.position == pos and p.match_available()])
        return total

    def list_of_allowed_tactics(self):
        all_tactics = sfm_glob.TEAM['ATK TACTICS'] + sfm_glob.TEAM['BASE TACTICS'] + sfm_glob.TEAM['DEF TACTICS']
        allowed_tactics = []
        for tac in all_tactics:
            if self.allowed_tactic(tac):
                allowed_tactics.append(tac)
        return allowed_tactics

    def allowed_tactic(self, tactic):
        tactic = [1] + tactic
        total_players_per_pos = self.total_available_players_per_position()
        for pos in range(4):
            if tactic[pos] > total_players_per_pos[pos]:
                return False
        return True

    def current_tactic(self):
        if self.human:
            tits = [p for p in self.players if p.playing_status == 0]
            tactic = [0, 0, 0]
            for player in tits:
                if player.position != 0:
                    tactic[player.position - 1] += 1
        else:
            tactic = self.tactic
        return tactic

    def set_playing_tactic(self, tactic = None):
        starting_players = []
        bench_players = []
        self.order_players_by_position()
        player_list = self.get_players_per_position()

        if len(player_list[0]) > 0:
            starting_gk = [player_list[0][0]]
        else:
            starting_gk = []

        if len(player_list[0]) > 1:
            bench_gk = [player_list[0][1]]
        else:
            bench_gk = []

        bench_players += bench_gk

        if tactic is not None:
            if self.allowed_tactic(tactic):
                tactic = [1] + tactic

                starting_players += starting_gk

                for pos in range(3):
                    starting = player_list[pos + 1][:tactic[pos + 1]]
                    for player in starting:
                        starting_players.append(player)
            else:
                raise Exception("Tactic not allowed: " + str(tactic))
        else:
            self.order_players_by_skill()
            outfield_player_list = [p for p in self.players if p.position != 0 and p.match_available()]
            starting_players = starting_gk + outfield_player_list[:10]

        for player in starting_players:
            player.playing_status = 0

        self.order_players_by_skill()
        for player in self.players:
            if player not in starting_players:
                player.playing_status = 2
                if player.match_available() and len(bench_players) < sfm_glob.TEAM["BENCH_PLAYERS"] and not player in bench_players:
                    bench_players.append(player)

        for player in bench_players:
            player.playing_status = 1

        return True

    def fan_happiness_change_with_result(self, points):
        multi = sfm_glob.TEAM_GOALS['POINT_PER_WEEK_DIFF_HAPPINESS_MULTI']
        change = multi * (points - self.season_points_per_week)
        self.fan_happiness = helpers.min_max(self.fan_happiness + change, sfm_glob.TEAM_GOALS["MIN_FAN_HAPPINESS"], sfm_glob.TEAM_GOALS["MAX_FAN_HAPPINESS"])
        self.weekly_news.news.append(News('Fans', change))

    def __init__(self, name, country, color, manager = None, division = None, tactic = None, avg_skill = None, players = None, human = False, league_stats = None, players_to_buy = None, weekly_finances = None, yearly_finances = None, money = None, weekly_sponsorship = 0, fan_happiness = None, season_points_per_week = None, weekly_news = None):

        self.name = name

        self.country = country

        self.color = color

        self.manager = manager

        if tactic is None:
            tactic = random.choice(2 * sfm_glob.TEAM['BASE TACTICS'] + sfm_glob.TEAM['DEF TACTICS'] + sfm_glob.TEAM['ATK TACTICS'])
        self.tactic = tactic

        self.avg_skill = avg_skill

        if players is None:
            players = []
        self.players = players

        self.human = human

        if league_stats is None:
            league_stats = {'Wins' : 0, 'Draws' : 0, 'Losses' : 0, 'Goals For' : 0, 'Goals Against' : 0}
        self.league_stats = league_stats

        self.division = division

        if players_to_buy is None:
            players_to_buy = []
        self.players_to_buy = players_to_buy

        if weekly_finances is None:
            weekly_finances = {'Salaries' : 0, 'Bought Players' : 0, 'Sold Players' : 0, 'Prize Money' : 0, 'Sponsors' : 0}
        self.weekly_finances = weekly_finances

        if yearly_finances is None:
            yearly_finances = {'Salaries' : 0, 'Bought Players' : 0, 'Sold Players' : 0, 'Prize Money' : 0, 'Sponsors' : 0}
        self.yearly_finances = yearly_finances

        if money is None:
            money = 0
        self.money = money

        if weekly_sponsorship is None:
            weekly_sponsorship = 0
        self.weekly_sponsorship = weekly_sponsorship

        if fan_happiness is None:
            fan_happiness = (sfm_glob.TEAM_GOALS["MAX_FAN_HAPPINESS"] - sfm_glob.TEAM_GOALS["MIN_FAN_HAPPINESS"]) / 2.0
        self.fan_happiness = fan_happiness

        self.season_points_per_week = season_points_per_week

        if weekly_news is None:
            weekly_news = NewsList()
        self.weekly_news = weekly_news

        if color is None:
            color = (72/255.0, 92/255.0, 150/255.0, 1)
        self.color = color
