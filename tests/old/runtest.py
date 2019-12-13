# import lib.Team as Team
# import lib.helpers as helpers
import lib.sfm_glob as glob
#
# def goal_prob_test():
#     MAX_GOAL_PROB_PER_POSS = sfm_glob.MATCH['MAX_GOAL_PROB_PER_POSS']
#     team1 = Team.Team(name='Team 20', avg_skill=4, tactic=[4,2,4])
#     team2 = Team.Team(name='Team 18', avg_skill=2, tactic=[4,2,4])
#     print team1.tactical_skill(True)
#     print team2.tactical_skill(True)
#     team_0_skills = team1.tactical_skill(True)
#     team_1_skills = team2.tactical_skill(True)
#     SKILL_BAL = helpers.balance(team_0_skills[2], team_1_skills[0])
#     goal_prob = helpers.min_max(SKILL_BAL, 0.1, 1) * MAX_GOAL_PROB_PER_POSS
#     print goal_prob
#
#
#
# goal_prob_test()

def sponsorship_per_end_of_season_position(division_level, pos):
    '''Amount of money a team gets per end of season position

    Returns:
        float: amount the team gets
    '''
    division_level_multiplier = pow(sfm_glob.MONEY['DIVISION_INFLUENCE_ON_SPONSORSHIP'], division_level)
    division_min_sponsors_money = sfm_glob.MONEY['MIN_SPONSORS'] * division_level_multiplier
    increase_per_pos = int(division_min_sponsors_money / 10.0)
    pos_multiplier = sfm_glob.COMPETITION['TEAMS PER DIVISION'] - pos
    return division_min_sponsors_money + (increase_per_pos * pos_multiplier)

def salary_for_skill(skill):
    '''Returns the salary that corresponds with the skill the player has'''
    return int(pow(2, skill * 0.35) * sfm_glob.PLAYER['SALARY']['MIN'])

for level in range(4):
    print("level: ", level)
    for pos in range(16):
        print(pos, sponsorship_per_end_of_season_position(3 - level, pos))
