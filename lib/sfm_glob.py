# coding: latin1
GAME = {
    'STARTING YEAR' : 2018,
}

MONEY = {
    'DIVISION_INFLUENCE_ON_MATCH_RESULT_PRIZE_MONEY' : 2.6,
    'DIVISION_INFLUENCE_ON_SPONSORSHIP' : 2.6,
    'DIVISION_INFLUENCE_ON_END_OF_SEASON_PRIZE_MONEY' : 2.375,
    'POS_INFLUENCE_ON_SPONSORSHIP' : 0.0925,
    'POS_INFLUENCE_ON_END_OF_SEASON_PRIZE_MONEY' : 0.0925,
    'MIN PER WIN' : 39000,
    'MIN PER DRAW' : int(39000 / 3.0),
    'MIN_SPONSORS' : 75000,
    'MIN END OF SEASON' : 600000,
    'TOP_3_MULTI': [1.1, 1.075, 1.05],
    'BOT_3_MULTI': [0.9, 0.85, 0.8],
}

COMPETITION = {
    'TOTAL_NUMBER_OF_DIVISIONS' : 4,
    'TEAMS PER DIVISION' : 16,
    'PROMOTED AND DEMOTED' : 3,
    'TOTAL GAMES' : 30,
    'EXTRA_TEAMS' : 12
}

MANAGER = {
    'POINTS_PER_TOP_3_POS' : 20,
    'POINTS_PER_CHAMPIONSHIP': 20
}

TRANSFERS = {
    'LAST_WEEK' : int(COMPETITION['TOTAL GAMES'] * 0.8),
    'AVERAGE PLAYERS PER TURN' : 10,
    'SKILL VARIATION ON TRANSFER LIST' : 3,
    'VARIATION OF AMOUNT OF PLAYERS PER TURN' : 2
}

TEAM = {
    'MIN_SKILL' : 1,
    'MIN_DIV_SKILL' : 4,
    'MAX_SKILL' : 20,
    'ATK TACTICS': [[3, 3, 4], [3, 4, 3], [4, 2, 4]],
    'DEF TACTICS': [[5, 3, 2], [5, 4, 1]],
    'BASE TACTICS' : [[3, 5, 2], [4, 3, 3], [4, 4, 2], [4, 5, 1]],
    'TACTICAL_PENALTIES':{
        'DF <= 2': 0.2,
        'DF == 3': 0.6,
        'DF == 5': 1.1,
        'MD <= 2': 0.6,
        'AT == 4': 1.1,
        'AT == 1': 0.905,
        'AT == 2': 0.95,
        'AT == 0': 0,
        'MD DF <= 2': 0.75,
        'DF AT MD <= 1': 0.25,
        'MD AT == 0': 0.5,
        'NO GK': 0.2,
    },
    'GOALKEEPER BONUS' : 1.2,
    'MAX NUMBER OF PLAYERS' : 23,
    'AVG_YOUTH_PLAYERS_PROMOTED_PER_YEAR' : 2.5,
    'BENCH_PLAYERS' : 7,
    "STARTING_AMOUNT_OF_PLAYERS_PER_POS": [2, 6, 6, 4]
}

TEAM_GOALS = {
    'MIN_POINTS_PER_WEEK' : 0.85,
    'MAX_POINTS_PER_WEEK' : 1.85,
    'POINT_PER_WEEK_DIFF_HAPPINESS_MULTI': 2,
    'MAX_FAN_HAPPINESS' : 100,
    'MIN_FAN_HAPPINESS' : 0,
    'MIN_FAN_HAPPINESS_FOR_FIRING' : 10,
}

PLAYER = {
    'MIN_SKILL' : 1,
    'MAX_SKILL' : 20,
    'AVG AGE' : 26.5,
    'MIN AGE' : 18,
    'MAX AGE' : 38,
    'RETIREMENT AGE' : 32,
    'AGE STD DEV': 3.8,
    'SALARY_SKILL_EXPONENT': 7,
    'MIN_SALARY' : 3000,
    'MIN_SALARY_INCREASE' : 1.175,
    'MAX_SALARY_INCREASE' : 1.25,
    'MIN_SALARY_INCREASE_NOT_ASKING' : 1,
    'MAX_SALARY_INCREASE_NOT_ASKING' : 1.05,
    'WEEKLY_PROBABILITY_OF_ASKING_FOR_NEW_CONTRACT': 0.5,
    'INJURY_TIME_EFFECT_ON_TRAINING' : 0.1,
    'SKILL_DROP_FROM_BEING_YOUTH_PLAYER' : 3,
    'MAX_YOUTH_PLAYER_SKILL': 16,
    'SKILL_DROP_PER_AGE_PER_MINUTE': 0.0008,
    'SKILL_DROP_PER_MINUTE_AI': 0.0295,
    'INJURY_PROB_GK': 0.05,
    'INJURY_PROB_NOT_GK': 0.2
}

PLAYER_TRAINING = {
    'MAX' : (PLAYER['MAX_SKILL'] * 0.55) / float(COMPETITION['TOTAL GAMES'] * (PLAYER['AVG AGE'] - PLAYER['MIN AGE'])),
    'TRAINING_0_MINUTES_PLAYING' : 0.4,
    'MIN_PLAYING_TIME_FOR_FULL_TRAINING' : 45,
    'STOP AGE' : 25,
    'DECREASE AGE' : 29,
    'MAXIMUM_SKILL_INCREASE' : 0.45
}

PLAYER_VALUE = {
    'CURRENT_SKILL_INFLUENCE' : 1.4,
    'POTENTIAL_SKILL_INFLUENCE' : 0.6,
    'DIFFERENCE_BETWEEN_SKILLS' : 5,
    'MIN_POTENTIAL_SKILL' : 0.01
}

MATCH = {
    'GOAL PROB PER POSITION' : (0, 0.03, 0.09, 0.88),
    'MAX_GOAL_PROB_PER_POSS' : 0.108,
    'INJURY_PROBABILITY_PER_MINUTE' : 0.005,
    'MINIMUM_PLAYERS' : 7,
    'MAX_POSS' : 0.65,
    'MIN_SKILL_BALANCE': 0.0425
}