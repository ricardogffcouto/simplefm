import { COMPETITION, PLAYER, TEAM, TEAM_GOALS, TRANSFERS } from './constants';
import { minMax, randomChoice, randomInt } from './helpers';
import type { Manager } from './manager';
import { News, NewsList } from './news';
import { Player } from './player';
import type { Division } from './division';
import type { Match } from './match';

export interface LeagueStats {
  Wins: number;
  Draws: number;
  Losses: number;
  'Goals For': number;
  'Goals Against': number;
}

export interface Finances {
  Salaries: number;
  'Bought Players': number;
  'Sold Players': number;
  'Prize Money': number;
  Sponsors: number;
}

export class Team {
  manager: Manager | null;
  division: Division | null;
  tactic: number[];
  players: Player[];
  human: boolean;
  leagueStats: LeagueStats;
  playersToBuy: Player[];
  weeklyFinances: Finances;
  yearlyFinances: Finances;
  money: number;
  weeklySponsorship: number;
  fanHappiness: number;
  seasonPointsPerWeek: number;
  weeklyNews: NewsList;
  color: string | [number, number, number, number];

  constructor(
    public name: string,
    public country: string,
    color: string | [number, number, number, number],
    options: {
      manager?: Manager | null;
      division?: Division | null;
      tactic?: number[];
      avgSkill?: number;
      players?: Player[];
      human?: boolean;
      leagueStats?: LeagueStats;
      playersToBuy?: Player[];
      weeklyFinances?: Finances;
      yearlyFinances?: Finances;
      money?: number;
      weeklySponsorship?: number;
      fanHappiness?: number;
      seasonPointsPerWeek?: number;
      weeklyNews?: NewsList;
    } = {}
  ) {
    this.manager = options.manager ?? null;
    this.division = options.division ?? null;
    this.tactic =
      options.tactic ?? randomChoice([...TEAM['BASE TACTICS'], ...TEAM['DEF TACTICS'], ...TEAM['ATK TACTICS']]);
    this.avgSkill = options.avgSkill ?? TEAM['MIN_SKILL'];
    this.players = options.players ?? [];
    this.human = options.human ?? false;
    this.leagueStats =
      options.leagueStats ?? ({ Wins: 0, Draws: 0, Losses: 0, 'Goals For': 0, 'Goals Against': 0 } as LeagueStats);
    this.playersToBuy = options.playersToBuy ?? [];
    this.weeklyFinances =
      options.weeklyFinances ?? ({ Salaries: 0, 'Bought Players': 0, 'Sold Players': 0, 'Prize Money': 0, Sponsors: 0 } as Finances);
    this.yearlyFinances =
      options.yearlyFinances ?? ({ Salaries: 0, 'Bought Players': 0, 'Sold Players': 0, 'Prize Money': 0, Sponsors: 0 } as Finances);
    this.money = options.money ?? 0;
    this.weeklySponsorship = options.weeklySponsorship ?? 0;
    this.fanHappiness =
      options.fanHappiness ?? (TEAM_GOALS['MAX_FAN_HAPPINESS'] - TEAM_GOALS['MIN_FAN_HAPPINESS']) / 2;
    this.seasonPointsPerWeek = options.seasonPointsPerWeek ?? TEAM_GOALS['MIN_POINTS_PER_WEEK'];
    this.weeklyNews = options.weeklyNews ?? new NewsList();
    this.color = color ?? '#485C96';
  }

  avgSkill: number;

  areAvailablePlayersOutsideOfBench(): boolean {
    const available = this.players.filter((player) => player.playingStatus === 2 && player.matchAvailable());
    const bench = this.players.filter((player) => player.playingStatus === 1);
    return available.length > 0 && bench.length < TEAM['BENCH_PLAYERS'];
  }

  allowedTits(): boolean {
    const starters = this.players.filter((player) => player.playingStatus === 0);
    return starters.every((player) => player.matchAvailable());
  }

  amountOfTits(): number {
    return this.players.filter((player) => player.playingStatus === 0).length;
  }

  averageSkill(): number {
    if (this.human) {
      const total = this.players.reduce((acc, player) => acc + player.skill, 0);
      return total / Math.max(this.players.length, 1) + 0.8;
    }
    return this.avgSkill;
  }

  titsTotalSkill(match = false, minutes = 0): number[] {
    const totals = [0, 0, 0, 0];
    for (let pos = 0; pos < 4; pos += 1) {
      if (this.human) {
        const players = this.players.filter((player) => player.playingStatus === 0 && player.position === pos);
        const skills = players.map((player) => (match ? player.matchSkill() : player.skill));
        totals[pos] += skills.reduce((acc, skill) => acc + skill, 0);
        const experienced = players.filter((player) => player.age >= PLAYER['RETIREMENT AGE'] - 2);
        if (experienced.length > 0) {
          totals[pos] *= TEAM['EXPERIENCED_PLAYER_BONUS'];
        }
      } else {
        if (pos === 0) {
          totals[pos] = this.avgSkill - minutes * PLAYER['SKILL_DROP_PER_MINUTE_AI'];
        } else {
          totals[pos] =
            this.avgSkill * this.currentTactic()[pos - 1] - minutes * PLAYER['SKILL_DROP_PER_MINUTE_AI'];
        }
      }
    }
    return totals;
  }

  titsAvgSkill(match = false, minutes = 0): number[] {
    const totals = this.titsTotalSkill(match, minutes);
    return totals.map((value) => value / 11);
  }

  tacticalSkill(match = false, minutes = 0): number[] {
    const baseSkills = this.titsAvgSkill(match, minutes);
    const tactic = this.currentTactic();
    const adjusted = [...baseSkills];

    for (let pos = 0; pos < TEAM['TACTICAL_PENALTIES'].length; pos += 1) {
      const penalties = TEAM['TACTICAL_PENALTIES'][pos];
      for (const [op, value, multiplier] of penalties) {
        const compareValue = tactic[pos];
        let condition = false;
        if (op === 'le') {
          condition = compareValue <= value;
        } else if (op === 'eq') {
          condition = compareValue === value;
        } else if (op === 'ge') {
          condition = compareValue >= value;
        }
        if (condition) {
          adjusted[pos + 1] *= multiplier;
          break;
        }
      }
    }

    const hasGoalkeeper = this.human
      ? this.players.filter((player) => player.position === 0 && player.playingStatus === 0).length > 0
      : true;

    if (hasGoalkeeper) {
      adjusted[1] += adjusted[0] * TEAM['GOALKEEPER BONUS'];
    } else {
      adjusted[1] *= 0.2;
    }

    return adjusted.slice(1).map((skill) => Math.pow(2, skill * 0.625));
  }

  currentTactic(): number[] {
    if (this.human) {
      const starters = this.players.filter((player) => player.playingStatus === 0);
      const tactic = [0, 0, 0];
      starters.forEach((player) => {
        if (player.position !== 0) {
          tactic[player.position - 1] += 1;
        }
      });
      return tactic;
    }
    return this.tactic;
  }

  nextMatch(week: number): Match | null {
    if (!this.division || week >= COMPETITION['TOTAL GAMES']) {
      return null;
    }
    const matches = this.division.matches[week] ?? [];
    return matches.find((match) => match.teams.includes(this)) ?? null;
  }

  nextOpponent(week: number): Team | null {
    const match = this.nextMatch(week);
    if (!match) {
      return null;
    }
    return match.teams[0] === this ? match.teams[1] : match.teams[0];
  }

  canSubstitutePlayer(playerIn: Player | null, playerOut: Player | null): boolean {
    if (!playerIn || !playerOut) {
      return false;
    }
    if (playerIn.position === 0 && playerOut.position !== 0) {
      return false;
    }
    if (playerOut.position === 0 && playerIn.position !== 0) {
      return false;
    }
    if (playerIn.playingStatus === playerOut.playingStatus) {
      return false;
    }
    return true;
  }

  canReplacePlayer(playerIn: Player | null, playerOut: Player | null): boolean {
    if (!this.canSubstitutePlayer(playerIn, playerOut)) {
      return false;
    }
    if (!playerIn || !playerOut) {
      return false;
    }
    if (playerIn.injured() || playerOut.injured()) {
      return false;
    }
    return true;
  }

  replacePlayer(
    playerIn: Player | null,
    playerOut: Player | null,
    inMatch = false,
    matchMinutes?: number
  ): boolean {
    if (!playerIn || !playerOut) {
      return false;
    }
    if (!inMatch) {
      if (this.canReplacePlayer(playerIn, playerOut)) {
        const statusIn = playerIn.playingStatus;
        playerIn.playingStatus = playerOut.playingStatus;
        playerOut.playingStatus = statusIn;
        return true;
      }
    } else if (this.canSubstitutePlayer(playerIn, playerOut)) {
      playerIn.playingStatus = 0;
      playerIn.subMinutes = matchMinutes ?? 0;
      playerOut.playingStatus = 2;
      return true;
    }
    return false;
  }

  getPlayersPerPosition(): Player[][] {
    return [0, 1, 2, 3].map((pos) => this.players.filter((player) => player.position === pos && player.matchAvailable()));
  }

  hasPlaceToSellPlayer(): boolean {
    return this.players.length > 11;
  }

  hasAtLeastOneGk(): boolean {
    return this.players.filter((player) => player.position === 0).length > 1;
  }

  sellPlayer(player: Player): boolean {
    if (player.position === 0 && this.players.filter((p) => p.position === 0).length <= 1) {
      return false;
    }
    if (player.canBeSold() && this.hasPlaceToSellPlayer()) {
      this.changeFinances('Sold Players', player.currentValue());
      this.players = this.players.filter((p) => p !== player);
      this.setPlayingTactic();
      return true;
    }
    return false;
  }

  hasMoneyToBuyPlayer(player: Player): boolean {
    return player.currentValue() <= this.money;
  }

  hasPlaceToBuyPlayer(): boolean {
    return this.players.length < TEAM['MAX NUMBER OF PLAYERS'];
  }

  playersValueSum(): number {
    return this.players.reduce((acc, player) => acc + player.currentValue(), 0);
  }

  playersSalarySum(): number {
    return this.players.reduce((acc, player) => acc + player.salary, 0);
  }

  nextMatchToStr(week: number): string {
    const match = this.nextMatch(week);
    if (!match) {
      return 'No match';
    }
    if (match.teams[0] === this) {
      return `${match.teams[1].name} (Home)`;
    }
    return `${match.teams[0].name} (Away)`;
  }

  financesWeeklyExpense(): number {
    return this.weeklyFinances.Salaries + this.weeklyFinances['Bought Players'];
  }

  financesWeeklyIncome(): number {
    return this.weeklyFinances['Sold Players'] + this.weeklyFinances['Prize Money'] + this.weeklyFinances.Sponsors;
  }

  financesYearlyExpense(): number {
    return this.yearlyFinances.Salaries + this.yearlyFinances['Bought Players'];
  }

  financesYearlyIncome(): number {
    return this.yearlyFinances['Sold Players'] + this.yearlyFinances['Prize Money'] + this.yearlyFinances.Sponsors;
  }

  setTransferList(): boolean {
    const playerSkill = (teamAvg: number, divisionAvg: number): number => {
      const maxSkillChoices: Record<number, number> = {
        [PLAYER['MAX_SKILL'] - 4]: 5,
        [PLAYER['MAX_SKILL'] - 3]: 4,
        [PLAYER['MAX_SKILL'] - 2]: 3,
        [PLAYER['MAX_SKILL'] - 1]: 2,
        [PLAYER['MAX_SKILL']]: 1
      };
      const skillOptions = Object.entries(maxSkillChoices).flatMap(([skill, weight]) =>
        Array(weight).fill(Number(skill))
      );
      const maxSkillLimit = randomChoice(skillOptions);
      const minSkill = Math.min(
        maxSkillLimit - TRANSFERS['SKILL VARIATION ON TRANSFER LIST'],
        (teamAvg + divisionAvg) * 0.5 - TRANSFERS['SKILL VARIATION ON TRANSFER LIST']
      );
      const maxSkill = Math.min(
        maxSkillLimit,
        (teamAvg + divisionAvg) * 0.5 + TRANSFERS['SKILL VARIATION ON TRANSFER LIST']
      );
      const value = minMax(Math.random() * (maxSkill - minSkill) + minSkill, PLAYER['MIN_SKILL'], PLAYER['MAX_SKILL']);
      return Math.round(value);
    };

    const playerCountry = (): string | null => {
      const sameCountry = 0.35 + 0.2 * (this.division?.level ?? 0);
      if (Math.random() <= sameCountry) {
        return this.country;
      }
      return null;
    };

    const potentialSales = this.players
      .filter((player) => player.contract <= 0)
      .reduce((acc, player) => acc + player.currentValue(), 0);
    const moneyAvailable = this.money + potentialSales;
    if (moneyAvailable < 0) {
      this.playersToBuy = [];
      return true;
    }

    const amount =
      TRANSFERS['AVERAGE PLAYERS PER TURN'] +
      randomInt(-TRANSFERS['VARIATION OF AMOUNT OF PLAYERS PER TURN'], TRANSFERS['VARIATION OF AMOUNT OF PLAYERS PER TURN']);

    const list: Player[] = [];
    for (let i = 0; i < amount; i += 1) {
      const skill = playerSkill(this.averageSkill(), this.division?.averageSkill() ?? this.averageSkill());
      const player = new Player({ country: playerCountry(), skill });
      player.salary *= PLAYER['TRANSFER_LIST_SALARY_INCREASE'];
      while (player.skill >= PLAYER['MIN_SKILL']) {
        if (player.currentValue() <= moneyAvailable) {
          list.push(player);
          break;
        }
        player.skill -= 1;
      }
    }
    this.playersToBuy = list;
    return true;
  }

  changeFinances(key: keyof Finances, value: number): void {
    if (value > 0) {
      this.weeklyFinances[key] += value;
      this.yearlyFinances[key] += value;
    } else {
      this.weeklyFinances[key] -= value;
      this.yearlyFinances[key] -= value;
    }
    this.money += value;
  }

  nextWeek(): void {
    const reduceInjury = () => {
      this.players.filter((player) => player.injured()).forEach((player) => player.reduceInjury());
    };

    const reduceContract = () => {
      this.players.filter((player) => player.contract > 0).forEach((player) => {
        player.contract -= 1;
      });
    };

    const playerAskingForNewContract = () => {
      if (Math.random() <= PLAYER['WEEKLY_PROBABILITY_OF_ASKING_FOR_NEW_CONTRACT']) {
        const candidates = this.players.filter((player) => player.contract <= 0 && !player.injured());
        if (candidates.length) {
          const player = randomChoice(candidates);
          player.setRenewContractWantedSalary(true);
          player.wantsNewContract = true;
          player.playingStatus = 2;
          this.weeklyNews.news.push(new News('New contract', player.name));
        }
      }
    };

    const playerTired = () => {
      if (Math.random() <= PLAYER['WEEKLY_PROBABILITY_OF_TIREDNESS']) {
        const candidates = this.players.filter(
          (player) => !player.injured() && !player.wantsNewContract && player.matchMinutes >= 75
        );
        if (candidates.length) {
          const player = randomChoice(candidates);
          player.injury = 1;
          player.playingStatus = 2;
          this.weeklyNews.news.push(new News('Tired', player.name));
        }
      }
    };

    const setTraining = () => {
      this.players.forEach((player) => {
        player.setWeeklyTraining();
        player.matchMinutes = 0;
        player.subMinutes = 0;
      });
    };

    const setFinances = () => {
      (Object.keys(this.weeklyFinances) as Array<keyof Finances>).forEach((key) => {
        this.weeklyFinances[key] = 0;
      });
      this.changeFinances('Sponsors', this.weeklySponsorship);
      this.changeFinances('Salaries', -this.playersSalarySum());
    };

    const sellPlayerIfMoneyBelow0 = () => {
      if (this.money < 0) {
        const sellable = this.players.filter((player) => player.canBeSold());
        if (sellable.length <= 0 || this.players.length <= 11) {
          return false;
        }
        sellable.sort((a, b) => a.currentValue() - b.currentValue());
        for (const player of sellable) {
          if (player.currentValue() >= Math.abs(this.money)) {
            if (this.sellPlayer(player)) {
              this.weeklyNews.news.push(new News('Forced sold player', player.name));
              return true;
            }
          }
        }
        const fallback = sellable[sellable.length - 1];
        if (this.sellPlayer(fallback)) {
          this.weeklyNews.news.push(new News('Forced sold player', fallback.name));
          return true;
        }
      }
      return false;
    };

    this.weeklyNews.news = [];
    setFinances();
    reduceInjury();
    reduceContract();
    sellPlayerIfMoneyBelow0();
    playerAskingForNewContract();
    playerTired();
    setTraining();
  }

  minPosPerSeasonPointsPerWeek(): number {
    const diff = TEAM_GOALS['MAX_POINTS_PER_WEEK'] - TEAM_GOALS['MIN_POINTS_PER_WEEK'];
    const positions = [13, 11, 9, 6, 3, 1];
    const step = diff / positions.length;
    const points = this.seasonPointsPerWeek;
    for (let i = 0; i < positions.length; i += 1) {
      if (points <= TEAM_GOALS['MIN_POINTS_PER_WEEK'] + (i + 1) * step) {
        return positions[i];
      }
    }
    return 1;
  }

  resetLeagueStats(): void {
    this.leagueStats = { Wins: 0, Draws: 0, Losses: 0, 'Goals For': 0, 'Goals Against': 0 };
  }

  startOfSeason(): void {
    const promotePlayerFromYouthTeam = () => {
      const minSkill =
        this.averageSkill() - Math.floor(this.averageSkill() / 5) - PLAYER['SKILL_DROP_FROM_BEING_YOUTH_PLAYER'];
      const maxSkill = this.averageSkill() - Math.floor(this.averageSkill() / 5);
      const skill = minMax(
        Math.random() * (maxSkill - minSkill) + minSkill,
        PLAYER['MIN_SKILL'],
        PLAYER['MAX_YOUTH_PLAYER_SKILL']
      );
      const player = new Player({
        country: this.country,
        skill: Math.round(skill),
        age: randomChoice([18, 19]),
        team: this,
        isHomegrown: true,
        contract: COMPETITION['TOTAL GAMES']
      });
      this.weeklyNews.news.push(new News('Juniors', player.name));
      this.players.push(player);
    };

    const removeRetiredPlayers = () => {
      const retired = this.players.filter((player) => player.retired);
      retired.forEach((player) => {
        player.team = null;
      });
      this.players = this.players.filter((player) => !player.retired);
      retired.forEach((player) => this.weeklyNews.news.push(new News('Retired', player.name)));
    };

    this.weeklyNews.news = [];
    this.resetLeagueStats();
    removeRetiredPlayers();

    if (!this.human) {
      this.tactic = randomChoice([
        ...TEAM['BASE TACTICS'],
        ...TEAM['BASE TACTICS'],
        ...TEAM['DEF TACTICS'],
        ...TEAM['ATK TACTICS']
      ]);
    } else {
      this.players.forEach((player) => player.startOfSeason());
      const amount = Math.round(
        Math.random() * 2 + (TEAM['AVG_YOUTH_PLAYERS_PROMOTED_PER_YEAR'] - 1)
      );
      const placesLeft = TEAM['MAX NUMBER OF PLAYERS'] - this.players.length;
      for (let i = 0; i < Math.min(placesLeft, amount); i += 1) {
        promotePlayerFromYouthTeam();
      }
      this.setTransferList();
      this.setPlayingTactic();
    }
  }

  resetFinances(): void {
    this.weeklyFinances = { Salaries: 0, 'Bought Players': 0, 'Sold Players': 0, 'Prize Money': 0, Sponsors: 0 };
    this.yearlyFinances = { Salaries: 0, 'Bought Players': 0, 'Sold Players': 0, 'Prize Money': 0, Sponsors: 0 };
  }

  endOfSeason(): void {
    this.resetFinances();
    this.players.forEach((player) => player.endOfSeason());
    const pos = this.division?.teamPosition(this) ?? 1;
    if (this.division) {
      this.weeklySponsorship = this.division.sponsorshipPerEndOfSeasonPosition(pos);
      this.changeFinances('Sponsors', this.weeklySponsorship);
      this.changeFinances('Prize Money', this.division.moneyPerEndOfSeasonPosition(pos));
    }
  }

  endOfSeasonPromotedOrDemoted(): number {
    const pos = this.division?.teamPosition(this) ?? 1;
    if (pos <= COMPETITION['PROMOTED AND DEMOTED']) {
      return 0;
    }
    if (this.division && pos > this.division.teams.length - COMPETITION['PROMOTED AND DEMOTED']) {
      return 2;
    }
    return 1;
  }

  updateStatsPostMatch(goalsFor: number, goalsAgainst: number): void {
    if (goalsFor > goalsAgainst) {
      this.leagueStats.Wins += 1;
    } else if (goalsFor === goalsAgainst) {
      this.leagueStats.Draws += 1;
    } else {
      this.leagueStats.Losses += 1;
    }
    this.leagueStats['Goals For'] += goalsFor;
    this.leagueStats['Goals Against'] += goalsAgainst;
    if (this.manager) {
      this.manager.updateStats();
    }
  }

  goalDifference(): number {
    return this.leagueStats['Goals For'] - this.leagueStats['Goals Against'];
  }

  leaguePoints(): number {
    return this.leagueStats.Wins * 3 + this.leagueStats.Draws;
  }

  leaguePosition(): number {
    if (!this.division) {
      return 1;
    }
    return this.division.orderedTableByPosition().indexOf(this) + 1;
  }

  orderPlayersBySkill(onlyAllowed = true): void {
    this.players.sort((a, b) => {
      if (onlyAllowed) {
        return a.injury - b.injury || b.skill - a.skill;
      }
      return b.skill - a.skill;
    });
  }

  orderPlayersByPosition(onlyAllowed = true): void {
    this.players.sort((a, b) => {
      if (onlyAllowed) {
        return (
          a.injury - b.injury || a.position - b.position || b.skill - a.skill || a.age - b.age
        );
      }
      return a.position - b.position || b.skill - a.skill || a.age - b.age;
    });
  }

  orderPlayersByPlayingStatus(onlyAllowed = true): void {
    this.players.sort((a, b) => {
      if (onlyAllowed) {
        return (
          a.injury - b.injury || a.playingStatus - b.playingStatus || a.position - b.position || b.skill - a.skill
        );
      }
      return (
        a.playingStatus - b.playingStatus || a.position - b.position || b.skill - a.skill
      );
    });
  }

  totalAvailablePlayersPerPosition(): number[] {
    return [0, 1, 2, 3].map(
      (pos) => this.players.filter((player) => player.position === pos && player.matchAvailable()).length
    );
  }

  listOfAllowedTactics(): number[][] {
    const allTactics = [...TEAM['ATK TACTICS'], ...TEAM['BASE TACTICS'], ...TEAM['DEF TACTICS']];
    return allTactics.filter((tactic) => this.allowedTactic(tactic));
  }

  allowedTactic(tactic: number[]): boolean {
    const full = [1, ...tactic];
    const totals = this.totalAvailablePlayersPerPosition();
    for (let pos = 0; pos < 4; pos += 1) {
      if (full[pos] > totals[pos]) {
        return false;
      }
    }
    return true;
  }

  setPlayingTactic(tactic?: number[]): boolean {
    let starting: Player[] = [];
    const bench: Player[] = [];
    this.orderPlayersByPosition();
    const playersByPosition = this.getPlayersPerPosition();

    const startingGk = playersByPosition[0].slice(0, 1);
    const benchGk = playersByPosition[0].slice(1, 2);
    bench.push(...benchGk);

    if (tactic) {
      if (!this.allowedTactic(tactic)) {
        throw new Error(`Tactic not allowed: ${tactic.join('-')}`);
      }
      const full = [1, ...tactic];
      starting = [...startingGk];
      for (let pos = 0; pos < 3; pos += 1) {
        const starters = playersByPosition[pos + 1].slice(0, full[pos + 1]);
        starting.push(...starters);
      }
    } else {
      this.orderPlayersBySkill();
      const outfield = this.players.filter((player) => player.position !== 0 && player.matchAvailable());
      starting = [...startingGk, ...outfield.slice(0, 10)];
    }

    starting.forEach((player) => {
      player.playingStatus = 0;
    });

    this.orderPlayersBySkill();
    this.players.forEach((player) => {
      if (!starting.includes(player)) {
        player.playingStatus = 2;
        if (player.matchAvailable() && bench.length < TEAM['BENCH_PLAYERS'] && !bench.includes(player)) {
          bench.push(player);
        }
      }
    });

    bench.forEach((player) => {
      player.playingStatus = 1;
    });

    return true;
  }

  fanHappinessChangeWithResult(points: number): void {
    const change = TEAM_GOALS['POINT_PER_WEEK_DIFF_HAPPINESS_MULTI'] * (points - this.seasonPointsPerWeek);
    this.fanHappiness = minMax(
      this.fanHappiness + change,
      TEAM_GOALS['MIN_FAN_HAPPINESS'],
      TEAM_GOALS['MAX_FAN_HAPPINESS']
    );
    this.weeklyNews.news.push(new News('Fans', change));
  }
}
