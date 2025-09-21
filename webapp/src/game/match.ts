import { MATCH, PLAYER } from './constants';
import { balance, minMax, weightedChoice } from './helpers';
import { Player } from './player';
import type { Team } from './team';

export interface GoalRecord {
  player: Player;
  team: Team;
  minute: number;
}

export class Match {
  minutes: number;
  score: [number, number];
  possession: [number, number];
  possessionLast5Minutes: number[];
  tacticalChanges: [number, number];
  finished: boolean;
  substitutions: [number, number];
  goalscorers: GoalRecord[];
  injuredPlayerOut: Player | null;

  constructor(
    public teams: [Team, Team],
    minutes = 0,
    score: [number, number] = [0, 0],
    possession: [number, number] = [0, 0],
    possessionLast5Minutes: number[] = [],
    tacticalChanges: [number, number] = [0, 0],
    finished = false,
    substitutions: [number, number] = [0, 0],
    goalscorers: GoalRecord[] = [],
    injuredPlayerOut: Player | null = null,
    public isNeutralField = false
  ) {
    this.minutes = minutes;
    this.score = score;
    this.possession = possession;
    this.possessionLast5Minutes = possessionLast5Minutes;
    this.tacticalChanges = tacticalChanges;
    this.finished = finished;
    this.substitutions = substitutions;
    this.goalscorers = goalscorers;
    this.injuredPlayerOut = injuredPlayerOut;
  }

  allowSubstitution(team: Team): boolean {
    if (team === this.teams[0]) {
      return this.substitutions[0] < 3 && this.minutes > 0;
    }
    return this.substitutions[1] < 3 && this.minutes > 0;
  }

  substitutionMadeByTeam(team: Team): void {
    if (team === this.teams[0]) {
      this.substitutions[0] += 1;
    } else {
      this.substitutions[1] += 1;
    }
  }

  simulate(limitMinutes?: number): boolean {
    if (!this.teams[0] || !this.teams[1]) {
      this.end();
      return true;
    }
    if (this.finished) {
      this.end();
      return true;
    }
    if (limitMinutes === undefined || limitMinutes >= 90) {
      while (this.minute()) {
        // simulate full match
      }
    } else {
      while (this.minutes < limitMinutes) {
        if (!this.minute()) {
          break;
        }
      }
    }
    this.end();
    return true;
  }

  goal(teamId: 0 | 1): void {
    this.score[teamId] += 1;
    const goalscorer = this.chooseGoalScorer(teamId);
    this.goalscorers.push({ player: goalscorer, team: this.teams[teamId], minute: this.minutes });
  }

  chooseGoalScorer(teamId: 0 | 1): Player {
    const choices: Array<[Player, number]> = [];
    const team = this.teams[teamId];
    if (team.human) {
      const starters = team.players.filter((player) => player.playingStatus === 0);
      starters.forEach((player) => {
        const probability = MATCH['GOAL PROB PER POSITION'][player.position];
        choices.push([player, probability]);
      });
      return weightedChoice(choices);
    }

    const existing = this.goalscorers.filter((goal) => goal.team === team).map((goal) => goal.player);
    existing.forEach((player) => {
      choices.push([player, 0.25]);
    });
    const needed = Math.max(1, 1 + existing.length);
    for (let i = 0; i < needed; i += 1) {
      const newPlayer = new Player({ country: team.country, skill: 0 });
      choices.push([newPlayer, 0.25]);
    }
    return weightedChoice(choices);
  }

  minute(): boolean {
    this.injuredPlayerOut = null;
    if (this.finished || this.minutes >= 90) {
      this.end();
      return false;
    }

    this.minutes += 1;
    this.teams.forEach((team) => {
      team.players.forEach((player) => {
        if (player.playingStatus === 0) {
          player.matchMinutes += 1;
        }
      });
    });

    let team0Skills = this.teams[0].tacticalSkill(true, this.minutes);
    let team1Skills = this.teams[1].tacticalSkill(true, this.minutes);

    if (!this.isNeutralField && this.teams[0].human) {
      team0Skills = team0Skills.map((skill) => skill * MATCH['HOME_ADVANTAGE']);
    }

    const attackProb = minMax(
      balance(team0Skills[1], team1Skills[1]),
      1 - MATCH['MAX_POSS'],
      MATCH['MAX_POSS']
    );

    let possessionSide: 0 | 1;
    let skillBalance: number;
    if (Math.random() <= attackProb) {
      possessionSide = 0;
      skillBalance = balance(team0Skills[2], team1Skills[0]);
    } else {
      possessionSide = 1;
      skillBalance = balance(team1Skills[2], team0Skills[0]);
    }

    const goalProb = minMax(skillBalance, MATCH['MIN_SKILL_BALANCE'], 1) * MATCH['MAX_GOAL_PROB_PER_POSS'];
    if (Math.random() <= goalProb) {
      this.goal(possessionSide);
    } else {
      this.teams.forEach((team) => {
        if (team.human) {
          const injuryProb = MATCH['INJURY_PROBABILITY_PER_MINUTE'] * (this.minutes / 90);
          if (Math.random() <= injuryProb) {
            const injured = this.playerInjured(team);
            if (injured) {
              injured.setInjury();
              this.injuredPlayerOut = injured;
            }
          }
        }
      });
    }

    for (let index = 0; index < this.teams.length; index += 1) {
      const team = this.teams[index];
      if (team.human) {
        const starters = team.players.filter((player) => player.playingStatus === 0);
        if (starters.length < MATCH['MINIMUM_PLAYERS']) {
          this.score[index as 0 | 1] = 0;
          const other = (index === 0 ? 1 : 0) as 0 | 1;
          this.score[other] = Math.max(3, this.score[other]);
          this.end();
          return false;
        }
      }
    }

    this.possession[possessionSide] += 1;
    this.possessionLast5Minutes.push(possessionSide);
    if (this.possessionLast5Minutes.length > 5) {
      this.possessionLast5Minutes.shift();
    }
    return true;
  }

  ballPossession(): [number, number] {
    if (this.minutes === 0) {
      return [50, 50];
    }
    let poss0 = Math.round((this.possession[0] / this.minutes) * 100);
    let poss1 = 100 - poss0;
    if (poss0 >= 80) {
      poss0 = 80;
      poss1 = 20;
    }
    if (poss1 >= 80) {
      poss0 = 20;
      poss1 = 80;
    }
    return [poss0, poss1];
  }

  ballPossessionLast5Minutes(): [number, number] {
    if (!this.possessionLast5Minutes.length) {
      return [50, 50];
    }
    let poss1 = Math.round(
      (this.possessionLast5Minutes.reduce((acc, val) => acc + val, 0) / this.possessionLast5Minutes.length) * 100
    );
    let poss0 = 100 - poss1;
    if (poss0 >= 80) {
      poss0 = 80;
      poss1 = 20;
    }
    if (poss1 >= 80) {
      poss0 = 20;
      poss1 = 80;
    }
    return [poss0, poss1];
  }

  end(): void {
    if (!this.finished) {
      this.teams[0].updateStatsPostMatch(this.score[0], this.score[1]);
      this.teams[1].updateStatsPostMatch(this.score[1], this.score[0]);
      this.minutes = 90;
      this.finished = true;
    }
  }

  playerInjured(team: Team): Player | null {
    if (!team.human) {
      return null;
    }
    const choices: Array<[Player, number]> = [];
    const starters = team.players.filter((player) => player.playingStatus === 0);
    starters.forEach((player) => {
      const probability = player.position === 0 ? PLAYER['INJURY_PROB_GK'] : PLAYER['INJURY_PROB_NOT_GK'];
      choices.push([player, probability]);
    });
    if (!choices.length) {
      return null;
    }
    return weightedChoice(choices);
  }

  goalLastMinute(): boolean {
    return this.goalscorers.some((goal) => goal.minute === this.minutes);
  }

  winner(): Team | null {
    if (this.score[0] > this.score[1]) {
      return this.teams[0];
    }
    if (this.score[1] > this.score[0]) {
      return this.teams[1];
    }
    return null;
  }

  loser(): Team | null {
    if (this.score[0] < this.score[1]) {
      return this.teams[0];
    }
    if (this.score[1] < this.score[0]) {
      return this.teams[1];
    }
    return null;
  }
}
