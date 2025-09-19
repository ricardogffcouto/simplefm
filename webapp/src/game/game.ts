import { COMPETITION, GAME, TEAM, TEAM_GOALS } from './constants';
import { TEAMS as DB_TEAMS } from './db';
import { minMax, normalize, randomInt, value01 } from './helpers';
import { Division } from './division';
import { Manager } from './manager';
import { Player } from './player';
import { Team as TeamEntity } from './team';

interface HumanTeamConfig {
  name: string;
  color: string;
  country: string;
  prev_pos?: number | null;
  prev_div?: number | null;
}

interface ManagerConfig {
  name: string;
}

export class Game {
  divisions: Division[];
  humanTeams: TeamEntity[];
  managers: Manager[];
  lastScreen: string;
  ended: boolean;

  constructor(
    public name: string,
    public week = 0,
    public season = 0,
    divisions: Division[] = [],
    humanTeams: TeamEntity[] = [],
    managers: Manager[] = [],
    lastScreen = 'MainScreen',
    ended = false
  ) {
    this.divisions = divisions;
    this.humanTeams = humanTeams;
    this.managers = managers;
    this.lastScreen = lastScreen;
    this.ended = ended;
  }

  teamSkillPerDivision(divisionId: number, teamId: number): number {
    const totalTeams = COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] * COMPETITION['TEAMS PER DIVISION'];
    const step = (TEAM['MAX_SKILL'] - TEAM['MIN_DIV_SKILL']) / totalTeams;
    const teamIndex = (divisionId - 1) * COMPETITION['TEAMS PER DIVISION'] + (teamId - 1);
    return TEAM['MAX_SKILL'] - teamIndex * step;
  }

  start(humanTeam?: HumanTeamConfig, managerConfig?: ManagerConfig): void {
    const allTeams = [...DB_TEAMS];
    let humanTeamEntry: HumanTeamConfig | null = humanTeam ?? null;

    if (humanTeamEntry && humanTeamEntry.prev_div && humanTeamEntry.prev_pos) {
      const index =
        (humanTeamEntry.prev_div - 1) * COMPETITION['TEAMS PER DIVISION'] + (humanTeamEntry.prev_pos - 1);
      allTeams.splice(index, 0, {
        name: humanTeamEntry.name,
        country: humanTeamEntry.country,
        color: humanTeamEntry.color
      });
    }

    this.divisions = [];
    for (let divisionId = 0; divisionId <= COMPETITION['TOTAL_NUMBER_OF_DIVISIONS']; divisionId += 1) {
      const isExtra = divisionId === COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'];
      const levelName = isExtra ? 'Extra Teams' : `League ${divisionId + 1}`;
      const division = new Division(levelName, divisionId, [], [], !isExtra);
      const teamsInDivision = isExtra ? COMPETITION['EXTRA_TEAMS'] : COMPETITION['TEAMS PER DIVISION'];
      const teams: TeamEntity[] = [];

      for (let teamId = 0; teamId < teamsInDivision; teamId += 1) {
        const teamInfo = allTeams[divisionId * COMPETITION['TEAMS PER DIVISION'] + teamId];
        if (!teamInfo) {
          continue;
        }
        const avgSkill = this.teamSkillPerDivision(divisionId + 1, teamId + 1);
        const team = new TeamEntity(teamInfo.name, teamInfo.country, teamInfo.color, {
          avgSkill,
          division
        });
        teams.push(team);
        if (humanTeamEntry && teamInfo.name === humanTeamEntry.name) {
          humanTeamEntry = { ...humanTeamEntry, prev_div: divisionId, prev_pos: teamId };
        }
      }

      division.teams = teams;
      this.divisions.push(division);
    }

    if (humanTeamEntry && managerConfig) {
      const divisionIndex = humanTeamEntry.prev_div ?? 0;
      const teamIndex = humanTeamEntry.prev_pos ?? 0;
      const team = this.divisions[divisionIndex].teams[teamIndex];
      this.createHumanTeam(team, divisionIndex, teamIndex, managerConfig);
    }
  }

  private createHumanTeam(
    humanTeam: TeamEntity,
    prevDiv: number,
    prevPos: number,
    managerConfig: ManagerConfig
  ): void {
    humanTeam.human = true;
    const positions = [...TEAM['STARTING_AMOUNT_OF_PLAYERS_PER_POS']];
    positions[randomInt(1, 2)] -= 1;

    for (let position = 0; position < positions.length; position += 1) {
      for (let i = 0; i < positions[position]; i += 1) {
        let minSkill: number;
        let maxSkill: number;
        if (i <= positions[position] / 2) {
          minSkill = minMax(humanTeam.avgSkill, 1, 20);
          maxSkill = minMax(humanTeam.avgSkill + 1, 1, 20);
        } else {
          minSkill = minMax(humanTeam.avgSkill - 3, 1, 20);
          maxSkill = minMax(humanTeam.avgSkill - 1, 1, 20);
        }
        const skill = randomInt(Math.floor(minSkill), Math.floor(maxSkill));
        const sameCountry = 0.55 + 0.125 * prevDiv;
        const country = Math.random() <= sameCountry ? humanTeam.country : null;
        const player = new Player({ skill, position, country, team: humanTeam });
        humanTeam.players.push(player);
      }
    }

    const sponsorshipPos = Math.min(Math.max(prevPos, 4), 13);
    humanTeam.weeklySponsorship = humanTeam.division?.sponsorshipPerEndOfSeasonPosition(sponsorshipPos) ?? 0;
    humanTeam.changeFinances('Sponsors', humanTeam.weeklySponsorship);
    humanTeam.changeFinances(
      'Prize Money',
      humanTeam.division?.moneyPerEndOfSeasonPosition(sponsorshipPos) ?? 0
    );
    humanTeam.setPlayingTactic();
    humanTeam.setTransferList();
    humanTeam.orderPlayersByPlayingStatus();

    const manager = new Manager(managerConfig.name, humanTeam, true);
    manager.updateStats();
    humanTeam.manager = manager;
    this.humanTeams = [humanTeam];
    this.managers.push(manager);
  }

  startOfSeason(): void {
    this.season += 1;
    this.week = 0;
    this.divisions.forEach((division) => division.startOfSeason());
    this.managers.forEach((manager) => manager.newSeason());
  }

  isSeasonOver(): boolean {
    return this.week >= COMPETITION['TOTAL GAMES'];
  }

  promotedAndDemotedTeams(): { promoted: TeamEntity[][]; demoted: TeamEntity[][] } {
    const promoted: TeamEntity[][] = Array.from({ length: this.divisions.length }, () => []);
    const demoted: TeamEntity[][] = Array.from({ length: this.divisions.length }, () => []);

    this.divisions.forEach((division) => {
      if (division.playable) {
        division.orderTableByPosition();
        promoted[division.level] = division.teams.slice(0, COMPETITION['PROMOTED AND DEMOTED']);
        demoted[division.level] = division.teams.slice(-COMPETITION['PROMOTED AND DEMOTED']);
      } else {
        promoted[division.level] = this.divisions[this.divisions.length - 1].teams.slice(
          0,
          COMPETITION['PROMOTED AND DEMOTED']
        );
      }
    });

    return { promoted, demoted };
  }

  endOfSeason(): void {
    this.divisions.forEach((division) => division.endOfSeason());
    this.orderDivisionsByLevel();

    const { promoted, demoted } = this.promotedAndDemotedTeams();

    this.divisions.forEach((division) => {
      division.orderTableByPosition();
      if (division.level !== this.divisions[this.divisions.length - 1].level) {
        division.teams = division.teams.slice(
          COMPETITION['PROMOTED AND DEMOTED'],
          division.teams.length - COMPETITION['PROMOTED AND DEMOTED']
        );
      } else {
        division.teams = division.teams.slice(COMPETITION['PROMOTED AND DEMOTED']);
      }
    });

    this.divisions.forEach((division, index) => {
      if (division.level === 0) {
        division.teams = [...division.teams, ...promoted[index]];
      }
      if (division.level !== this.divisions[this.divisions.length - 1].level) {
        const promotedNext = promoted[index + 1] ?? [];
        const demotedPrev = demoted[(index - 1 + this.divisions.length) % this.divisions.length] ?? [];
        division.teams = [...division.teams, ...promotedNext, ...demotedPrev];
      } else {
        const demotedPrev = demoted[(index - 1 + this.divisions.length) % this.divisions.length] ?? [];
        division.teams = [...division.teams, ...demotedPrev];
      }
    });

    this.divisions.forEach((division) => {
      division.teams.forEach((team, pos) => {
        team.avgSkill = this.teamSkillPerDivision(division.level + 1, pos + 1);
        if (!division.playable) {
          team.avgSkill += 1;
        }
      });
    });

    if (this.humanTeams.length > 0) {
      const humanTeam = this.humanTeams[0];
      const extraDivision = this.divisions[this.divisions.length - 1];
      if (extraDivision.teams.includes(humanTeam)) {
        this.ended = true;
      }
    }
  }

  nextWeek(): void {
    this.divisions.forEach((division) => division.nextWeek(this.week));
    this.week += 1;

    if (this.humanTeams.length > 0) {
      const humanTeam = this.humanTeams[0];
      if (humanTeam.fanHappiness < TEAM_GOALS['MIN_FAN_HAPPINESS_FOR_FIRING']) {
        const prob = 1 - value01(
          TEAM_GOALS['MIN_FAN_HAPPINESS_FOR_FIRING'],
          TEAM_GOALS['MIN_FAN_HAPPINESS'],
          TEAM_GOALS['MAX_FAN_HAPPINESS']
        );
        if (Math.random() <= prob) {
          this.ended = true;
        }
      }
    }

    this.managers.forEach((manager) => manager.updateStats());
  }

  simulateWeeklyMatches(): void {
    this.divisions.forEach((division) => division.simulateWeeklyMatches(this.week));
  }

  orderDivisionsByLevel(): void {
    this.divisions.sort((a, b) => a.level - b.level);
  }

  year(): number {
    return GAME['STARTING YEAR'] + this.season - 1;
  }

  serialize(): object {
    return {
      name: this.name,
      week: this.week,
      season: this.season,
      ended: this.ended,
      lastScreen: this.lastScreen
    };
  }
}
