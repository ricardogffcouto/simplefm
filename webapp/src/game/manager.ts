import { COMPETITION, MANAGER } from './constants';
import type { Team } from './team';

export interface ManagerSeasonStats {
  Wins: number;
  Draws: number;
  Losses: number;
  'Goals For': number;
  'Goals Against': number;
  div: string;
  div_level: number;
  pos: number;
  pts: number;
}

export class Manager {
  yearlyStats: ManagerSeasonStats[];

  constructor(
    public name: string,
    public team: Team | null = null,
    public human = false,
    yearlyStats: ManagerSeasonStats[] = []
  ) {
    this.yearlyStats = yearlyStats;
  }

  achievements(): string[] {
    const achievements: string[] = [];
    const stats = this.careerStats();
    const games = stats.Games;
    const milestones = [
      [1, '1_GAME'],
      [10, '10_GAMES'],
      [50, '50_GAMES'],
      [100, '100_GAMES'],
      [200, '200_GAMES'],
      [500, '500_GAMES'],
      [1000, '1000_GAMES']
    ] as const;
    milestones.forEach(([threshold, label]) => {
      if (games >= threshold) {
        achievements.push(label);
      }
    });
    return achievements;
  }

  careerStatsOrder(): Array<keyof ManagerSeasonStats | 'Games' | 'Points' | 'Promotions' | 'Relegations' | 'Championships' | '1st Div Winner'> {
    return [
      'Games',
      'Wins',
      'Draws',
      'Losses',
      'Goals For',
      'Goals Against',
      'Points',
      'Promotions',
      'Relegations',
      'Championships',
      '1st Div Winner'
    ];
  }

  points(): number {
    let points = 0;
    this.yearlyStats.forEach((season) => {
      const divMulti = COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] - season.div_level;
      points += season.pts * divMulti;
      if (season.pos <= 3) {
        points += MANAGER['POINTS_PER_TOP_3_POS'] * (4 - season.pos) * divMulti;
      }
      if (season.pos === 1) {
        points += MANAGER['POINTS_PER_CHAMPIONSHIP'] * divMulti;
      }
    });
    return points;
  }

  championships(): number[] {
    const totals = Array(COMPETITION['TOTAL_NUMBER_OF_DIVISIONS']).fill(0);
    this.yearlyStats.forEach((season) => {
      if (season.pos === 1) {
        totals[season.div_level] += 1;
      }
    });
    return totals;
  }

  careerStats(): {
    Games: number;
    Wins: number;
    Draws: number;
    Losses: number;
    'Goals For': number;
    'Goals Against': number;
    Points: number;
    Promotions: number;
    Relegations: number;
    Championships: number;
    '1st Div Winner': number;
  } {
    const stats = {
      Games: 0,
      Wins: 0,
      Draws: 0,
      Losses: 0,
      'Goals For': 0,
      'Goals Against': 0,
      Points: 0,
      Promotions: 0,
      Relegations: 0,
      Championships: 0,
      '1st Div Winner': 0
    };

    this.yearlyStats.forEach((season, index) => {
      stats.Games += season.Wins + season.Draws + season.Losses;
      stats.Points += season.pts;
      (['Wins', 'Draws', 'Losses', 'Goals For', 'Goals Against'] as const).forEach((key) => {
        stats[key] += season[key];
      });
      if (index + 1 < this.yearlyStats.length) {
        const next = this.yearlyStats[index + 1];
        if (season.div_level > next.div_level) {
          stats.Promotions += 1;
        }
        if (season.div_level < next.div_level) {
          stats.Relegations += 1;
        }
      }
    });

    const championships = this.championships();
    stats.Championships = championships.reduce((acc, value) => acc + value, 0);
    stats['1st Div Winner'] = championships[0] ?? 0;

    return stats;
  }

  updateStats(): void {
    if (!this.team || this.yearlyStats.length === 0) {
      return;
    }
    const last = this.yearlyStats[this.yearlyStats.length - 1];
    last.Wins = this.team.leagueStats.Wins;
    last.Draws = this.team.leagueStats.Draws;
    last.Losses = this.team.leagueStats.Losses;
    last['Goals For'] = this.team.leagueStats['Goals For'];
    last['Goals Against'] = this.team.leagueStats['Goals Against'];
    last.div = this.team.division?.name ?? '';
    last.div_level = this.team.division?.level ?? 0;
    last.pos = this.team.division ? this.team.division.teamPosition(this.team) : 0;
    last.pts = this.team.leaguePoints();
  }

  newSeason(): void {
    if (!this.team) {
      return;
    }
    const stats: ManagerSeasonStats = {
      Wins: this.team.leagueStats.Wins,
      Draws: this.team.leagueStats.Draws,
      Losses: this.team.leagueStats.Losses,
      'Goals For': this.team.leagueStats['Goals For'],
      'Goals Against': this.team.leagueStats['Goals Against'],
      div: this.team.division?.name ?? '',
      div_level: this.team.division?.level ?? 0,
      pos: this.team.division ? this.team.division.teamPosition(this.team) : 0,
      pts: this.team.leaguePoints()
    };
    this.yearlyStats.push(stats);
  }
}
