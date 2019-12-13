import lib.Team as Team
import lib.Division as Division
import lib.Match as Match
import lib.sfm_glob as sfm_glob
import lib.Game as Game

def test_tactics():
    division = Division.Division("A", 1)
    tactics = sfm_glob.TEAM["ATK TACTICS"] + sfm_glob.TEAM["DEF TACTICS"] + sfm_glob.TEAM["BASE TACTICS"]
    for tactic in tactics:
        new_team = Team.Team(name=str(tactic), tactic=tactic, avg_skill=10, country='Eng', color='Black')
        division.teams.append(new_team)

    for season in range(200):
        print('Season {}'.format(season))
        division._create_matches()
        for week in range((len(division.teams) - 1) * 2):
            division.simulate_weekly_matches(week)
    division.print_table()

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
