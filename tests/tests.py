from ..lib.sfm_glob import PLAYER
print([(pow(2, skill * PLAYER['SKILL_FACTOR'])) for skill in range(1, 21)])