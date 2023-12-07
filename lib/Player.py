#encoding: utf-8
from . import constants
from . import helpers
import random
import string
from . import db
from .db import names as db_names
from .News import News

class Player(object):
    def __str__(self):
        pos = self.pos_to_str()
        return pos + ' ' + self.name

    def playing_status_to_str(self):
        if self.playing_status == 0:
            return '*'
        return ''

    # INJURY
    def set_injury(self):
        ''' Sets how much time a player is injured, and its effect on training and playing status.
        '''
        def _injury_time(age):
            age_factor = helpers.normalize(age, sfm_glob.PLAYER['MIN AGE'], sfm_glob.PLAYER['MAX AGE'])
            average_injury_time_factor = 1 - (age_factor * 0.7)
            return int(round(random.expovariate(average_injury_time_factor), 0) + 1)

        def _injury_effect_on_training(injury):
            return -injury * sfm_glob.PLAYER['INJURY_TIME_EFFECT_ON_TRAINING']

        self.playing_status = 2
        self.injury = _injury_time(self.age)
        self.change_training(_injury_effect_on_training(self.injury))

    def reduce_injury(self):
        self.injury -= 1
        if self.injury <= 0:
            self.injury = 0

    def injured(self):
        if self.injury > 0:
            return True
        return False

    def match_available(self):
        if self.injured() or self.wants_new_contract:
            return False
        return True

    # TRAINING
    def change_training(self, training):
        self.training += training
        self.weekly_training = training
        self.skill_change_last_week = 0

        increase = 0
        decrease = 0

        while self.training > 1:
            if self.increase_skill():
                increase += 1
                self.skill_change_last_week = 1
            return (increase, training)

        while self.training < 0:
            if self.decrease_skill():
                decrease -= 1
                self.skill_change_last_week = -1
            return (decrease, training)

        if helpers.training_to_str(training) != '':
            self.team.weekly_news.news.append(News('Training {}'.format(helpers.training_to_str(training)), self.name))

        return (0, training)

    def increase_skill(self):
        self.skill += 1
        if self.skill > sfm_glob.PLAYER['MAX_SKILL']:
            self.skill = sfm_glob.PLAYER['MAX_SKILL']
            self.training = 1
            return False
        else:
            self.training -= 1
            self.team.weekly_news.news.append(News("Skill +", self.name))
            return True

    def decrease_skill(self):
        self.skill -= 1
        if self.skill < sfm_glob.PLAYER['MIN_SKILL']:
            self.skill = sfm_glob.PLAYER['MIN_SKILL']
            self.training = 0
            return False
        else:
            self.training += 1
            self.team.weekly_news.news.append(News("Skill -", self.name))
            return True

    def salary_for_skill(self):
        '''Returns the salary that corresponds with the skill the player has'''
        skill01 = helpers.normalize(self.skill, sfm_glob.PLAYER['MIN_SKILL'], sfm_glob.PLAYER['MAX_SKILL'])
        return int(pow(2, skill01 * sfm_glob.PLAYER['SALARY_SKILL_EXPONENT']) * sfm_glob.PLAYER['MIN_SALARY'])

    # CONTRACT

    def set_renew_contract_wanted_salary(self, asking = False):
        if not self.wanted_salary:
            wanted_salary = max(self.salary, self.salary_for_skill())
            min_increase = sfm_glob.PLAYER['MIN_SALARY_INCREASE_NOT_ASKING']
            max_increase = sfm_glob.PLAYER['MAX_SALARY_INCREASE_NOT_ASKING']
            if asking:
                min_increase = sfm_glob.PLAYER['MIN_SALARY_INCREASE']
                max_increase = sfm_glob.PLAYER['MAX_SALARY_INCREASE']
            self.wanted_salary = helpers.int_to_money(wanted_salary * random.uniform(min_increase, max_increase))

    def renew_contract(self):
        self.salary = self.wanted_salary
        self.contract = sfm_glob.COMPETITION['TOTAL GAMES'] 
        self.wants_new_contract = False

    def calculate_salary(self):
        increase = (0.85, 1.15)
        salary = self.salary_for_skill() * random.uniform(increase[0], increase[1])
        return helpers.int_to_money(salary)

    def set_weekly_training(self):
        randomness = random.uniform(0.6, 1.5)
        playing_status_influence = min(sfm_glob.PLAYER_TRAINING['TRAINING_0_MINUTES_PLAYING'] + (1 - sfm_glob.PLAYER_TRAINING['TRAINING_0_MINUTES_PLAYING']) * helpers.normalize(min(self.match_minutes, sfm_glob.PLAYER_TRAINING['MIN_PLAYING_TIME_FOR_FULL_TRAINING']), 0, sfm_glob.PLAYER_TRAINING['MIN_PLAYING_TIME_FOR_FULL_TRAINING']), 1)

        if self.injury <= 0:
            if self.age < sfm_glob.PLAYER_TRAINING['STOP AGE']:
                training_for_age = 1 - helpers.normalize(self.age, sfm_glob.PLAYER['MIN AGE'], sfm_glob.PLAYER_TRAINING['STOP AGE'])
                training = sfm_glob.PLAYER_TRAINING['MAX'] * training_for_age * playing_status_influence * randomness
            elif self.age > sfm_glob.PLAYER_TRAINING['DECREASE AGE']:
                training_for_age = helpers.normalize(self.age, sfm_glob.PLAYER_TRAINING['DECREASE AGE'], sfm_glob.PLAYER['MAX AGE'])
                training = -sfm_glob.PLAYER_TRAINING['MAX'] * training_for_age * randomness
            else:
                training = 0
        else:
            training = 0

        return self.change_training(training)

    def can_be_sold(self):
        if not self.injured() and self.contract <= 0:
            return True
        return False

    def yearly_age_increase(self):
        self.age = self.age + 1

    def yearly_check_if_will_retire(self):
        if self.age >= sfm_glob.PLAYER['MAX AGE']:
            self.retired = True
            return True
        elif self.age >= sfm_glob.PLAYER['RETIREMENT AGE']:
            if random.random() <= 0.5:
                self.retired = True
                return True
        return False

    def yearly_salary_update(self):
        if self.salary_for_skill() > self.salary:
            self.salary = self.salary_for_skill()

    def end_of_season(self):
        self.yearly_age_increase()
        self.yearly_check_if_will_retire()

    def start_of_season(self):
        self.league_stats = {'Games' : 0, 'Goals' : 0}

    def pos_to_str(self):
        if self.position == 0:
            return 'GK'
        elif self.position == 1:
            return 'DF'
        elif self.position == 2:
            return 'MD'
        else:
            return 'AT'

    def skill_to_str(self):
        return str(int(self.skill))

    def current_value(self):
        if self.injury <= 0:
            age01 = helpers.normalize(self.age, sfm_glob.PLAYER['MIN AGE'], sfm_glob.PLAYER['MAX AGE'])
            skill01 = helpers.normalize(self.skill, 0, sfm_glob.PLAYER['MAX_SKILL'])

            stop_potential_age01 = helpers.normalize(sfm_glob.PLAYER['RETIREMENT AGE'], sfm_glob.PLAYER['MIN AGE'], sfm_glob.PLAYER['MAX AGE'])
            max_skill_increase01 = sfm_glob.PLAYER_TRAINING['MAXIMUM_SKILL_INCREASE']
            potential_skill01 = (max_skill_increase01 * ((stop_potential_age01) - age01) / stop_potential_age01) * 2

            base = max(skill01 * sfm_glob.PLAYER_VALUE['CURRENT_SKILL_INFLUENCE'] + potential_skill01 * sfm_glob.PLAYER_VALUE['POTENTIAL_SKILL_INFLUENCE'], 0)

            power = sfm_glob.PLAYER_VALUE['DIFFERENCE_BETWEEN_SKILLS']
            value_small = pow(base, power)
            value = helpers.int_to_money(value_small * 1000000)
        else:
            value = 0
        return value

    def match_skill(self):
        if self.injury == 0:
            stamina_drop = self.match_minutes * max(sfm_glob.PLAYER['AVG AGE'], self.age) * sfm_glob.PLAYER["SKILL_DROP_PER_AGE_PER_MINUTE"] * (1 + 0.025 * (not self.team.human))
            return max(self.skill - stamina_drop, 0)
        return 0

    def __init__(self, skill, country = None, team = None, training = None, weekly_training = None, name = None, age = None, salary = None, position = None, playing_status = None, league_stats = None, retired = False, contract = 0, wants_new_contract = False, weekly_stats = None, wanted_salary = None, injury = None, match_minutes = None, sub_minutes = None, is_homegrown = False, skill_change_last_week = 0):
        def random_name(country = None):
            if not country:
                countries = [(country['id'], int(pow(len(db.COUNTRIES) - i, 1.3))) for i, country in enumerate(db.COUNTRIES)]
                country = helpers.weighted_choice(countries)
            return random.choice(string.ascii_uppercase) + "." + random.choice(db.names.LAST_NAMES[country])

        def random_position():
            if random.random() <= 0.09:
                return 0
            else:
                return random.randint(1, 3)

        def random_age():
            age = int(helpers.min_max(random.gauss(sfm_glob.PLAYER['AVG AGE'], sfm_glob.PLAYER['AGE STD DEV']), sfm_glob.PLAYER['MIN AGE'], sfm_glob.PLAYER['MAX AGE']))
            return age

        self.skill = skill + skill * sfm_glob.PLAYER['HOMEGROWN_BONUS'] * is_homegrown

        self.team = team

        self.country = country

        if training is None:
            training = 0.5
        self.training = training

        if weekly_training is None:
            weekly_training = 0
        self.weekly_training = weekly_training

        if name is None:
            name = random_name(country)
        self.name = name

        if age is None:
            age = random_age()
        self.age = age

        if position is None:
            position = random_position()
        self.position = position

        if playing_status is None:
            playing_status = 2
        self.playing_status = playing_status

        self.is_homegrown = is_homegrown

        self.league_stats = league_stats

        self.retired = retired

        if salary is None:
            salary = self.calculate_salary()
        self.salary = salary

        self.contract = contract

        self.wants_new_contract = wants_new_contract

        self.wanted_salary = wanted_salary

        if injury is None:
            injury = 0
        self.injury = injury

        if match_minutes is None:
            match_minutes = 0
        self.match_minutes = match_minutes

        if sub_minutes is None:
            sub_minutes = 0
        self.sub_minutes = sub_minutes

        self.skill_change_last_week = skill_change_last_week
