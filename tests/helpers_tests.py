# import lib.helpers as helpers
# import lib.sfm_glob as glob

def value(age, skill):
    age01 = helpers.normalize(age, sfm_glob.PLAYER['MIN AGE'], sfm_glob.PLAYER['MAX AGE'])
    skill01 = helpers.normalize(skill, 0, sfm_glob.PLAYER['MAX_SKILL'])

    stop_potential_age01 = helpers.normalize(sfm_glob.PLAYER['RETIREMENT AGE'], sfm_glob.PLAYER['MIN AGE'], sfm_glob.PLAYER['MAX AGE'])
    max_skill_increase01 = sfm_glob.PLAYER_TRAINING['MAXIMUM_SKILL_INCREASE']
    potential_skill01 = (max_skill_increase01 * ((stop_potential_age01) - age01) / stop_potential_age01) * 2

    base = max(skill01 * sfm_glob.PLAYER_VALUE['CURRENT_SKILL_INFLUENCE'] + potential_skill01 * sfm_glob.PLAYER_VALUE['POTENTIAL_SKILL_INFLUENCE'], 0)

    power = sfm_glob.PLAYER_VALUE['DIFFERENCE_BETWEEN_SKILLS']
    value_small = pow(base, power)
    value = helpers.int_to_money(value_small * 1000000)
    return value_small


def print_value():
    for a in range(2):
        skill_range = list(range(1 + 10 * a, 11 + 10 * a))
        print('*' * 160)
        header = '   |\t'
        for i in skill_range:
            header += str(i) + '\t|\t'
        print(header)
        print('-' * 160)

        for age in range(18, 39):
            value_str = str(age) + ' |\t'
            for skill in skill_range:
                value_small = value(age, skill)
                value_str = value_str + str(round(value_small, 3)) + '\t|\t'
            print(value_str)



def int_to_val(val):
    for p in range(7, 2, -1):
        if val >= pow(10, p):
            return val - val % pow(10, p - 1)
    return pow(10, 3)

def color(col):
    default = {'name': 'White', 'hex': '#7E7E7E'}
    COLORS = [
        {'name': 'Blue', 'hex': '#485C96'}, 
        {'name': 'White', 'hex': '#7E7E7E'}, 
        {'name': 'Red', 'hex': '#B22222'}, 
        {'name': 'Black', 'hex': '#111111'}, 
        {'name': 'Orange', 'hex': '#FF8C00'}, 
        {'name': 'Yellow', 'hex': '#FFD700'}, 
        {'name': 'Purple', 'hex': '#4B0082'}, 
        {'name': 'Green', 'hex': '#228B22'}
    ]

    return next((item for item in COLORS if item["name"] == col), default)['hex']

print(color('None'))