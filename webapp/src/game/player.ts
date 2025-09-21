import { COMPETITION, PLAYER, PLAYER_TRAINING, PLAYER_VALUE } from './constants';
import { COUNTRIES, LAST_NAMES } from './db';
import {
  intToMoney,
  minMax,
  normalize,
  randomChoice,
  randomGaussian,
  randomInt,
  trainingToStr,
  weightedChoice
} from './helpers';
import { News } from './news';
import type { Team } from './team';

export interface PlayerLeagueStats {
  Games: number;
  Goals: number;
}

const TRAINING_NEWS_MAP: Record<Exclude<ReturnType<typeof trainingToStr>, ''>, News['category']> = {
  '++': 'Training ++',
  '+': 'Training +',
  '-': 'Training -',
  '--': 'Training --'
};

export class Player {
  skill: number;
  team: Team | null;
  country: string | null;
  training: number;
  weeklyTraining: number;
  name: string;
  age: number;
  salary: number;
  position: number;
  playingStatus: number;
  leagueStats: PlayerLeagueStats | null;
  retired: boolean;
  contract: number;
  wantsNewContract: boolean;
  weeklyStats: Record<string, unknown> | null;
  wantedSalary: number | null;
  injury: number;
  matchMinutes: number;
  subMinutes: number;
  isHomegrown: boolean;
  skillChangeLastWeek: number;

  constructor({
    skill,
    country = null,
    team = null,
    training = 0.5,
    weeklyTraining = 0,
    name,
    age,
    salary,
    position,
    playingStatus = 2,
    leagueStats = null,
    retired = false,
    contract = 0,
    wantsNewContract = false,
    weeklyStats = null,
    wantedSalary = null,
    injury = 0,
    matchMinutes = 0,
    subMinutes = 0,
    isHomegrown = false,
    skillChangeLastWeek = 0
  }: {
    skill: number;
    country?: string | null;
    team?: Team | null;
    training?: number;
    weeklyTraining?: number;
    name?: string;
    age?: number;
    salary?: number;
    position?: number;
    playingStatus?: number;
    leagueStats?: PlayerLeagueStats | null;
    retired?: boolean;
    contract?: number;
    wantsNewContract?: boolean;
    weeklyStats?: Record<string, unknown> | null;
    wantedSalary?: number | null;
    injury?: number;
    matchMinutes?: number;
    subMinutes?: number;
    isHomegrown?: boolean;
    skillChangeLastWeek?: number;
  }) {
    this.team = team ?? null;
    this.country = country ?? null;
    this.isHomegrown = isHomegrown;

    const adjustedSkill = skill + skill * PLAYER['HOMEGROWN_BONUS'] * (isHomegrown ? 1 : 0);
    this.skill = adjustedSkill;

    this.training = training ?? 0.5;
    this.weeklyTraining = weeklyTraining ?? 0;

    if (!name) {
      name = Player.randomName(this.country);
    }
    this.name = name;

    if (age === undefined) {
      age = Player.randomAge();
    }
    this.age = age;

    if (position === undefined) {
      position = Player.randomPosition();
    }
    this.position = position;

    this.playingStatus = playingStatus;
    this.leagueStats = leagueStats;
    this.retired = retired;

    if (salary === undefined) {
      salary = this.calculateSalary();
    }
    this.salary = salary;

    this.contract = contract;
    this.wantsNewContract = wantsNewContract;
    this.weeklyStats = weeklyStats;
    this.wantedSalary = wantedSalary;
    this.injury = injury;
    this.matchMinutes = matchMinutes;
    this.subMinutes = subMinutes;
    this.skillChangeLastWeek = skillChangeLastWeek;
  }

  static randomName(country: string | null = null): string {
    let countryId = country;
    if (!countryId) {
      const choices = COUNTRIES.map((c, index) => [c.id, Math.pow(COUNTRIES.length - index, 1.3)] as [string, number]);
      countryId = weightedChoice(choices);
    }
    const lastNames = LAST_NAMES[countryId as keyof typeof LAST_NAMES] ?? LAST_NAMES['Eng'];
    const last = randomChoice(lastNames);
    const initial = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${initial}.${last}`;
  }

  static randomPosition(): number {
    return Math.random() <= 0.09 ? 0 : randomInt(1, 3);
  }

  static randomAge(): number {
    const age = randomGaussian(PLAYER['AVG AGE'], PLAYER['AGE STD DEV']);
    return Math.round(minMax(age, PLAYER['MIN AGE'], PLAYER['MAX AGE']));
  }

  playingStatusToStr(): string {
    return this.playingStatus === 0 ? '*' : '';
  }

  setInjury(): void {
    const injuryTime = (age: number): number => {
      const ageFactor = normalize(age, PLAYER['MIN AGE'], PLAYER['MAX AGE']);
      const average = 1 - ageFactor * 0.7;
      return Math.round(Math.max(1, -Math.log(Math.random()) / average));
    };

    const injuryEffectOnTraining = (injury: number): number =>
      -injury * PLAYER['INJURY_TIME_EFFECT_ON_TRAINING'];

    this.playingStatus = 2;
    this.injury = injuryTime(this.age);
    this.changeTraining(injuryEffectOnTraining(this.injury));
  }

  reduceInjury(): void {
    this.injury = Math.max(this.injury - 1, 0);
  }

  injured(): boolean {
    return this.injury > 0;
  }

  matchAvailable(): boolean {
    return !this.injured() && !this.wantsNewContract;
  }

  changeTraining(training: number): [number, number] {
    this.training += training;
    this.weeklyTraining = training;
    this.skillChangeLastWeek = 0;

    let increase = 0;
    let decrease = 0;

    while (this.training > 1) {
      if (this.increaseSkill()) {
        increase += 1;
        this.skillChangeLastWeek = 1;
      }
      return [increase, training];
    }

    while (this.training < 0) {
      if (this.decreaseSkill()) {
        decrease -= 1;
        this.skillChangeLastWeek = -1;
      }
      return [decrease, training];
    }

    const trainingLabel = trainingToStr(training);
    if (trainingLabel !== '' && this.team) {
      const category = TRAINING_NEWS_MAP[trainingLabel];
      this.team.weeklyNews.news.push(new News(category, this.name));
    }

    return [0, training];
  }

  increaseSkill(): boolean {
    this.skill += 1;
    if (this.skill > PLAYER['MAX_SKILL']) {
      this.skill = PLAYER['MAX_SKILL'];
      this.training = 1;
      return false;
    }
    this.training -= 1;
    if (this.team) {
      this.team.weeklyNews.news.push(new News('Skill +', this.name));
    }
    return true;
  }

  decreaseSkill(): boolean {
    this.skill -= 1;
    if (this.skill < PLAYER['MIN_SKILL']) {
      this.skill = PLAYER['MIN_SKILL'];
      this.training = 0;
      return false;
    }
    this.training += 1;
    if (this.team) {
      this.team.weeklyNews.news.push(new News('Skill -', this.name));
    }
    return true;
  }

  salaryForSkill(): number {
    const skill01 = normalize(this.skill, PLAYER['MIN_SKILL'], PLAYER['MAX_SKILL']);
    return Math.floor(Math.pow(2, skill01 * PLAYER['SALARY_SKILL_EXPONENT']) * PLAYER['MIN_SALARY']);
  }

  setRenewContractWantedSalary(asking = false): void {
    if (!this.wantedSalary) {
      const base = Math.max(this.salary, this.salaryForSkill());
      let minIncrease: number = PLAYER['MIN_SALARY_INCREASE_NOT_ASKING'];
      let maxIncrease: number = PLAYER['MAX_SALARY_INCREASE_NOT_ASKING'];
      if (asking) {
        minIncrease = PLAYER['MIN_SALARY_INCREASE'];
        maxIncrease = PLAYER['MAX_SALARY_INCREASE'];
      }
      const desired = base * (Math.random() * (maxIncrease - minIncrease) + minIncrease);
      this.wantedSalary = intToMoney(desired);
    }
  }

  renewContract(): void {
    if (this.wantedSalary) {
      this.salary = this.wantedSalary;
    }
    this.contract = COMPETITION['TOTAL GAMES'];
    this.wantsNewContract = false;
  }

  calculateSalary(): number {
    const increase = [0.85, 1.15] as const;
    const salary = this.salaryForSkill() * (Math.random() * (increase[1] - increase[0]) + increase[0]);
    return intToMoney(salary);
  }

  setWeeklyTraining(): [number, number] {
    const randomness = Math.random() * (1.5 - 0.6) + 0.6;
    const playingStatusInfluence = Math.min(
      PLAYER_TRAINING['TRAINING_0_MINUTES_PLAYING'] +
        (1 - PLAYER_TRAINING['TRAINING_0_MINUTES_PLAYING']) *
          normalize(
            Math.min(this.matchMinutes, PLAYER_TRAINING['MIN_PLAYING_TIME_FOR_FULL_TRAINING']),
            0,
            PLAYER_TRAINING['MIN_PLAYING_TIME_FOR_FULL_TRAINING']
          ),
      1
    );

    let training = 0;
    if (this.injury <= 0) {
      if (this.age < PLAYER_TRAINING['STOP AGE']) {
        const trainingForAge = 1 - normalize(this.age, PLAYER['MIN AGE'], PLAYER_TRAINING['STOP AGE']);
        training = PLAYER_TRAINING.MAX * trainingForAge * playingStatusInfluence * randomness;
      } else if (this.age > PLAYER_TRAINING['DECREASE AGE']) {
        const trainingForAge = normalize(this.age, PLAYER_TRAINING['DECREASE AGE'], PLAYER['MAX AGE']);
        training = -PLAYER_TRAINING.MAX * trainingForAge * randomness;
      } else {
        training = 0;
      }
    } else {
      training = 0;
    }

    return this.changeTraining(training);
  }

  canBeSold(): boolean {
    return !this.injured() && this.contract <= 0;
  }

  yearlyAgeIncrease(): void {
    this.age += 1;
  }

  yearlyCheckIfWillRetire(): boolean {
    if (this.age >= PLAYER['MAX AGE']) {
      this.retired = true;
      return true;
    }
    if (this.age >= PLAYER['RETIREMENT AGE'] && Math.random() <= 0.5) {
      this.retired = true;
      return true;
    }
    return false;
  }

  yearlySalaryUpdate(): void {
    if (this.salaryForSkill() > this.salary) {
      this.salary = this.salaryForSkill();
    }
  }

  endOfSeason(): void {
    this.yearlyAgeIncrease();
    this.yearlyCheckIfWillRetire();
  }

  startOfSeason(): void {
    this.leagueStats = { Games: 0, Goals: 0 };
  }

  posToStr(): string {
    if (this.position === 0) {
      return 'GK';
    }
    if (this.position === 1) {
      return 'DF';
    }
    if (this.position === 2) {
      return 'MD';
    }
    return 'AT';
  }

  skillToStr(): string {
    return String(Math.floor(this.skill));
  }

  currentValue(): number {
    if (this.injury > 0) {
      return 0;
    }
    const age01 = normalize(this.age, PLAYER['MIN AGE'], PLAYER['MAX AGE']);
    const skill01 = normalize(this.skill, 0, PLAYER['MAX_SKILL']);
    const stopPotential = normalize(PLAYER['RETIREMENT AGE'], PLAYER['MIN AGE'], PLAYER['MAX AGE']);
    const maxSkillIncrease = PLAYER_TRAINING['MAXIMUM_SKILL_INCREASE'];
    const potential = (maxSkillIncrease * (stopPotential - age01) * 2) / stopPotential;
    const base = Math.max(
      skill01 * PLAYER_VALUE['CURRENT_SKILL_INFLUENCE'] + potential * PLAYER_VALUE['POTENTIAL_SKILL_INFLUENCE'],
      0
    );
    const valueSmall = Math.pow(base, PLAYER_VALUE['DIFFERENCE_BETWEEN_SKILLS']);
    return intToMoney(valueSmall * 1_000_000);
  }

  matchSkill(): number {
    if (this.injury !== 0) {
      return 0;
    }
    const staminaDrop =
      this.matchMinutes *
      Math.max(PLAYER['AVG AGE'], this.age) *
      PLAYER['SKILL_DROP_PER_AGE_PER_MINUTE'] *
      (1 + 0.025 * (this.team && !this.team.human ? 1 : 0));
    return Math.max(this.skill - staminaDrop, 0);
  }
}
