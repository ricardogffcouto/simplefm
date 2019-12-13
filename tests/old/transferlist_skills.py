import lib.sfm_glob as glob
import random
import lib.helpers as helpers
from lib.Game import Game

GAME = Game()
GAME.start()

def _player_skill(team_avg_skill, division_avg_skill):
    min_skill = (team_avg_skill + division_avg_skill) * 0.5 - sfm_glob.TRANSFERS["SKILL VARIATION ON TRANSFER LIST"]
    max_skill = (team_avg_skill + division_avg_skill) * 0.5 + sfm_glob.TRANSFERS["SKILL VARIATION ON TRANSFER LIST"]

    skill_temp = random.uniform(min_skill, max_skill)
    skill = int(round(helpers.min_max(skill_temp, sfm_glob.PLAYER['SKILL']['MIN'], sfm_glob.PLAYER['SKILL']['MAX']), 0))
    return skill
