import lib.Player as Player

for i in range(1, 21):
    p = Player.Player(skill = i, age=18)
    print('Skill: {}\tDiff: {}'.format(i, (p.current_value() - p.salary_for_skill()*30) / (p.current_value() + p.salary_for_skill()*30) ))