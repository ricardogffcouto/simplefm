import lib.Team as Team
import lib.Division as Division
import lib.Match as Match
import lib.sfm_glob as sfm_glob
import lib.Game as Game
import lib.helpers as helpers
import operator
import scipy.optimize as optimize


def test_tactics():
    division = Division.Division("A", 1)
    tactics = sfm_glob.TEAM["ATK TACTICS"] + sfm_glob.TEAM["DEF TACTICS"] + sfm_glob.TEAM["BASE TACTICS"]

    statistics = {}

    seasons = 200

    matches = seasons * 30

    tactical_penalties = sfm_glob.TEAM['TACTICAL_PENALTIES']

    # tactical_penalties = (
    #     (
    #         ('le', 2, penalties[0]),
    #         ('eq', 3, penalties[1]),
    #         ('eq', 4, penalties[2]),
    #         ('eq', 5, penalties[3]),
    #         ('ge', 6, penalties[4]),
    #     ),
    #     (
    #         ('le', 1, penalties[5]),
    #         ('eq', 2, penalties[6]),
    #         ('eq', 3, penalties[7]),
    #         ('eq', 4, penalties[8]),
    #         ('eq', 5, penalties[9]),
    #         ('ge', 6, penalties[10]),
    #     ),
    #     (
    #         ('le', 1, penalties[11]),
    #         ('eq', 2, penalties[12]),
    #         ('eq', 3, penalties[13]),
    #         ('ge', 4, penalties[14]),
    #     ),
    # )


    for tactic in tactics:
        new_team = Team.Team(name=str(tactic), tactic=tactic, avg_skill=10, country='Eng', color='Black')
        division.teams.append(new_team)
        statistics[new_team.name] = {
            'xG': 0,
            'xGA': 0,
            'xP': 0,
            'skill': new_team._no_penalties_tactical_skill()
        }
        for pos, position in enumerate(tactical_penalties):
            for penalty in position:
                if getattr(operator, penalty[0])(tactic[pos], penalty[1]):
                    statistics[new_team.name]['skill'][pos] *= penalty[2]
                    break

    for season in range(seasons):
        division._create_matches()
        for week in range((len(division.teams) - 1) * 2):
            for match in division.matches[week]:
                skill_0 = match.teams[0].tactical_skill(match = True, minutes = 0)
                skill_1 = match.teams[1].tactical_skill(match = True, minutes = 0)

                team_0_poss_prob = helpers.min_max(helpers.balance(skill_0[1], skill_1[1]), 1 - sfm_glob.MATCH['MAX_POSS'], sfm_glob.MATCH['MAX_POSS'])
                team_0_goal_prob = helpers.min_max(helpers.balance(skill_0[2], skill_1[0]), sfm_glob.MATCH['MIN_SKILL_BALANCE'], 1) * sfm_glob.MATCH['MAX_GOAL_PROB_PER_POSS']

                team_1_poss_prob = 1 - team_0_poss_prob
                team_1_goal_prob = helpers.min_max(helpers.balance(skill_1[2], skill_0[0]), sfm_glob.MATCH['MIN_SKILL_BALANCE'], 1) * sfm_glob.MATCH['MAX_GOAL_PROB_PER_POSS']

                xPTable = (
                    ('ge', 1.5, 2.7),
                    ('ge', 1, 2.3),
                    ('ge', 0.5, 2),
                    ('ge', 0, 1.5),
                    ('ge', -0.5, 0.7),
                    ('ge', -1, 0.5),
                    ('ge', -1.5, 0.3),
                    ('lt', -1.5, 0.1),
                )

                xG = [90 * team_0_poss_prob * team_0_goal_prob, 90 * team_1_poss_prob * team_1_goal_prob]
                xGA = [xG[1], xG[0]]

                for i in range(2):
                    statistics[match.teams[i].name]['xG'] += xG[i] / matches
                    statistics[match.teams[i].name]['xGA'] += xGA[i] / matches

                    for xPT in xPTable:
                        if getattr(operator, xPT[0])(xG[i] - xGA[i], xPT[1]):
                            statistics[match.teams[i].name]['xP'] += xPT[2] / matches
                            break
                                            

            # division.simulate_weekly_matches(week)
    # division.print_table()
    print('Tactic\t\txG\t\txAG\t\txP\t\t')
    for tactic in statistics.items():
        print(
            '{}\t{}\t{}\t{}\t{}\t{}\t{}'.format(
                tactic[0], 
                round(tactic[1]['xG'] , 2),
                round(tactic[1]['xG'] - max(t[1]['xG'] for t in statistics.items()), 2),
                round(tactic[1]['xGA'], 2),
                round(min(t[1]['xGA'] for t in statistics.items()) - tactic[1]['xGA'], 2),
                round(tactic[1]['xP'], 2),
                round(tactic[1]['xP'] - max(t[1]['xP'] for t in statistics.items()), 2),
            )
        )

    xP_diff = 0
    for tactic in statistics.items():
        xP_diff += tactic[1]['xP'] - max(t[1]['xP'] for t in statistics.items())
    average_xP_diff = -xP_diff / len(statistics.items())

    print('Average xP Diff: {}'.format(round(average_xP_diff, 2)))

    return average_xP_diff

def minimize_xP():
    initial_guess = [0.2, 0.985, 1, 0.975, 0.5, 0.2, 0.9, 1.075, 1.03, 1, 0.5, 0.95, 0.95, 1, 0.975]

    result = optimize.minimize(test_tactics, initial_guess, method='trust-krylov')
    if result.success:
        fitted_params = result.x
        print(fitted_params)
    else:
        raise ValueError(result.message)

def test_vs_tactics():
    division = Division.Division("A", 1)
    tactics = sfm_glob.TEAM["ATK TACTICS"] + sfm_glob.TEAM["DEF TACTICS"] + sfm_glob.TEAM["BASE TACTICS"]
    seasons = 50
    print('Games: ', seasons * 2)
    for tactic in tactics:
        for tactic2 in tactics:
            team1 = Team.Team(name=str(tactic), tactic=tactic, avg_skill=10, country='Eng', color='Black')
            team2 = Team.Team(name=str(tactic2), tactic=tactic, avg_skill=10, country='Eng', color='Black')
            division.teams = [team1, team2]
            for season in range(seasons):
                print(season)
                division._create_matches()
                for week in range((len(division.teams) - 1) * 2):
                    division.simulate_weekly_matches(week)
            print(str(team1.tactic) + ' x ' + str(team2.tactic) + ' : ' + str(team1.league_stats.league_points() - team2.league_stats.league_points()))


# TACTIC EFFECTIVENESS
test_tactics()


# TO BALANCE TACTICS
# print str(team_0.tactic)
# print str(team_0.league_stats['Wins'] - team_0.league_stats['Losses']), str(team_0.league_stats['Draws'] / runs), str(round(team_0.league_stats['Goals For'] / float(matches), 2)), str(round(team_0.league_stats['Goals Against'] / float(matches), 2))
# team_0.league_stats = {'Wins' : 0, 'Draws' : 0, 'Losses' : 0, 'Goals For' : 0, 'Goals Against' : 0}
# team_1.league_stats = {'Wins' : 0, 'Draws' : 0, 'Losses' : 0, 'Goals For' : 0, 'Goals Against' : 0}
# print '\n'

# minimize_xP()