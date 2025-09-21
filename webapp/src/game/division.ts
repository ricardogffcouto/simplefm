import { COMPETITION, MONEY, TEAM_GOALS } from './constants';
import { shuffleInPlace } from './helpers';
import { Match } from './match';
import type { Team } from './team';

export class Division {
  matches: Match[][];

  constructor(
    public name: string,
    public level: number,
    public teams: Team[] = [],
    matches: Match[][] = [],
    public playable = true
  ) {
    this.matches = matches;
  }

  moneyPerResult(): { Win: number; Draw: number; Loss: number } {
    const divisionLevel = COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] - this.level;
    const multiplier = Math.pow(MONEY['DIVISION_INFLUENCE_ON_MATCH_RESULT_PRIZE_MONEY'], divisionLevel);
    const win = Math.floor(MONEY['MIN PER WIN'] * multiplier);
    const draw = Math.floor(MONEY['MIN PER DRAW'] * multiplier);
    return { Win: win, Draw: draw, Loss: 0 };
  }

  moneyPerEndOfSeasonPosition(pos: number): number {
    const index = pos - 1;
    const divisionLevel = COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] - this.level;
    const multiplier = Math.pow(MONEY['DIVISION_INFLUENCE_ON_END_OF_SEASON_PRIZE_MONEY'], divisionLevel);
    const base = MONEY['MIN END OF SEASON'] * multiplier;
    const position = COMPETITION['TEAMS PER DIVISION'] - index;
    const increase = base * Math.pow(position * MONEY['POS_INFLUENCE_ON_END_OF_SEASON_PRIZE_MONEY'], 2);
    return Math.floor(base + increase);
  }

  sponsorshipPerEndOfSeasonPosition(pos: number): number {
    const index = pos - 1;
    const divisionLevel = COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] - this.level - 1;
    const multiplier = Math.pow(MONEY['DIVISION_INFLUENCE_ON_SPONSORSHIP'], divisionLevel);
    const base = MONEY['MIN_SPONSORS'] * multiplier;
    const position = COMPETITION['TEAMS PER DIVISION'] - index;
    let sponsorship = base + base * Math.pow(position * MONEY['POS_INFLUENCE_ON_SPONSORSHIP'], 2);
    if (index <= 2) {
      sponsorship *= MONEY['TOP_3_MULTI'][index];
    }
    if (index >= 13) {
      sponsorship *= MONEY['BOT_3_MULTI'][index - 13];
    }
    return Math.floor(sponsorship);
  }

  private createMatches(): void {
    let teams = [...this.teams];
    if (teams.length % 2 === 1) {
      teams = [...teams, null as unknown as Team];
    }
    shuffleInPlace(teams);
    const n = teams.length;
    const mid = Math.floor(n / 2);
    let indexMap = Array.from({ length: n }, (_, i) => i);
    const firstRound: Match[][] = [];

    for (let round = 0; round < n - 1; round += 1) {
      const firstHalf = indexMap.slice(0, mid);
      const secondHalf = indexMap.slice(mid).reverse();
      const week: Match[] = [];
      for (let j = 0; j < mid; j += 1) {
        const t1 = teams[firstHalf[j]];
        const t2 = teams[secondHalf[j]];
        if (!t1 || !t2) {
          continue;
        }
        if (j === 0 && round % 2 === 1) {
          week.push(new Match([t2, t1]));
        } else {
          week.push(new Match([t1, t2]));
        }
      }
      firstRound.push(week);
      indexMap = [...indexMap.slice(mid, -1), ...indexMap.slice(0, mid), indexMap[indexMap.length - 1]];
    }

    const secondRound = firstRound.map((week) =>
      week.map((match) => new Match([match.teams[1], match.teams[0]]))
    );
    this.matches = [...firstRound, ...secondRound];
  }

  startOfSeason(): void {
    this.createMatches();
    this.teams.forEach((team) => {
      if (team) {
        team.startOfSeason();
        team.division = this;
      }
    });

    const sorted = [...this.teams].sort((a, b) => b.averageSkill() - a.averageSkill());
    const step =
      (TEAM_GOALS['MAX_POINTS_PER_WEEK'] - TEAM_GOALS['MIN_POINTS_PER_WEEK']) /
      (COMPETITION['TEAMS PER DIVISION'] - 1);
    sorted.forEach((team, index) => {
      team.seasonPointsPerWeek = TEAM_GOALS['MAX_POINTS_PER_WEEK'] - index * step;
    });
  }

  endOfSeason(): void {
    this.teams.forEach((team) => team.endOfSeason());
  }

  teamPosition(team: Team): number {
    this.orderTableByPosition();
    const index = this.teams.indexOf(team);
    return index >= 0 ? index + 1 : 0;
  }

  teamMatches(team: Team): Match[] {
    const matches: Match[] = [];
    this.matches.forEach((week) => {
      week.forEach((match) => {
        if (match.teams.includes(team)) {
          matches.push(match);
        }
      });
    });
    return matches;
  }

  averageSkill(): number {
    const total = this.teams.reduce((acc, team) => acc + team.averageSkill(), 0);
    return total / Math.max(this.teams.length, 1);
  }

  nextWeek(week: number): void {
    if (!this.playable) {
      return;
    }
    this.teams.forEach((team) => team.nextWeek());
    const money = this.moneyPerResult();
    this.matches[week]?.forEach((match) => {
      const winner = match.winner();
      if (winner) {
        winner.changeFinances('Prize Money', money.Win);
        const loser = match.loser();
        loser?.changeFinances('Prize Money', money.Loss);
        winner.fanHappinessChangeWithResult(3);
        loser?.fanHappinessChangeWithResult(0);
      } else {
        match.teams.forEach((team) => {
          team.changeFinances('Prize Money', money.Draw);
          team.fanHappinessChangeWithResult(1);
        });
      }
    });
  }

  orderTableByPosition(): void {
    this.teams.sort(
      (a, b) =>
        b.leaguePoints() - a.leaguePoints() ||
        b.goalDifference() - a.goalDifference() ||
        b.leagueStats.Wins - a.leagueStats.Wins ||
        b.leagueStats['Goals For'] - a.leagueStats['Goals For'] ||
        a.leagueStats.Losses - b.leagueStats.Losses
    );
  }

  orderedTableByPosition(): Team[] {
    return [...this.teams].sort(
      (a, b) =>
        b.leaguePoints() - a.leaguePoints() ||
        b.goalDifference() - a.goalDifference() ||
        b.leagueStats.Wins - a.leagueStats.Wins ||
        b.leagueStats['Goals For'] - a.leagueStats['Goals For'] ||
        a.leagueStats.Losses - b.leagueStats.Losses
    );
  }

  orderTableByName(): void {
    this.teams.sort((a, b) => a.name.localeCompare(b.name));
  }

  simulateWeeklyMatches(week: number): void {
    if (!this.playable) {
      return;
    }
    this.matches[week]?.forEach((match) => {
      if (!match.finished) {
        match.simulate();
      }
    });
  }
}
