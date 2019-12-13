import lib.sfm_glob as sfm_glob

def money_per_result(level):
    '''Amount of money a team gets per result

    Returns:
        tuple: (float: value for win, float: value for draw, float: value for loss)
    '''
    division_level = sfm_glob.COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] - level
    division_level_multiplier = pow(sfm_glob.MONEY['DIVISION_INFLUENCE_ON_MATCH_RESULT_PRIZE_MONEY'], division_level)
    win = int(sfm_glob.MONEY['MIN PER WIN'] * division_level_multiplier)
    draw = int(sfm_glob.MONEY['MIN PER DRAW'] * division_level_multiplier)
    return {'Win' : win, 'Draw' : draw, 'Loss' : 0}

def money_per_end_of_season_position(level, pos):
    '''Amount of money a team gets per end of season position

    Returns:
        float: amount the team gets
    '''
    division_level = sfm_glob.COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] - level
    division_level_multiplier = pow(sfm_glob.MONEY['DIVISION_INFLUENCE_ON_END_OF_SEASON_PRIZE_MONEY'], division_level)
    division_min_prize_money = sfm_glob.MONEY['MIN END OF SEASON'] * division_level_multiplier
    position = sfm_glob.COMPETITION['TEAMS PER DIVISION'] - pos
    increase_per_pos = division_min_prize_money * pow(position * 0.08, 2)
    eos_money = division_min_prize_money + increase_per_pos
    return int(eos_money)

def sponsorship_per_end_of_season_position(level, pos):
    '''Amount of money a team gets per end of season position

    Returns:
        float: amount the team gets
    '''
    division_level = sfm_glob.COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] - level - 1
    division_level_multiplier = pow(sfm_glob.MONEY['DIVISION_INFLUENCE_ON_SPONSORSHIP'], division_level)
    division_min_sponsors_money = sfm_glob.MONEY['MIN_SPONSORS'] * division_level_multiplier
    position = sfm_glob.COMPETITION['TEAMS PER DIVISION'] - pos
    increase_per_pos = division_min_sponsors_money * pow(position * 0.08, 2)
    sponsorship = int(division_min_sponsors_money + increase_per_pos)
    if pos <= 2:
        sponsorship *= sfm_glob.MONEY['TOP_3_MULTI'][pos]
    if pos >= 13:
        sponsorship *= sfm_glob.MONEY['BOT_3_MULTI'][pos - 13]
    return int(sponsorship)

def salary_for_skill(skill):
    '''Returns the salary that corresponds with the skill the player has'''
    return int(pow(sfm_glob.PLAYER['SALARY_FOR_SKILL_BASE'], skill * sfm_glob.PLAYER['SALARY_FOR_SKILL_POW']) * sfm_glob.PLAYER['SALARY']['MIN'])

print("L.P.\tSk\tSpo\tRes\tEos\tSal\t\tBal\t\tYear")
for level in range(4):
    for pos in range(16):
        skill = round(20 - 15.5 * (level*16+(pos + 1))/64.0, 1)
        result = 0.65 - 0.35 * (pos + 1)/16.0
        money_result = int(money_per_result(level)["Win"] * result)
        money_eos = int(money_per_end_of_season_position(level, pos) / 30.0)
        spons = int(sponsorship_per_end_of_season_position(level, pos))
        salary = 14.5 * int(salary_for_skill(skill))
        balance = int(spons + money_result + money_eos - salary)
        print("{}.{}\t{}\t{}\t{}\t{}\t{} \t{}\t\t{}".format(level, pos, skill, spons, money_result, money_eos, -salary, balance, balance*30))