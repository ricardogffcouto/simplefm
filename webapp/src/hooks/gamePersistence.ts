'use client';

import {
  Division,
  Game,
  Manager,
  Match,
  Player,
  Team,
  type GoalRecord,
  type PlayerLeagueStats
} from '@/game';
import { News, NewsList, type NewsCategory } from '@/game/news';
import type { Finances, LeagueStats } from '@/game/team';
import type { MatchEvent, TabKey } from './useGameEngine';
import type { PostMatchSummary } from './postMatchSummary';

const STORAGE_KEY = 'simplefm:career-state';

interface SerializedNews {
  category: NewsCategory;
  data: string | number;
}

interface SerializedPlayer {
  id: string;
  skill: number;
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
}

interface SerializedTeam {
  id: string;
  name: string;
  country: string;
  color: string | [number, number, number, number];
  tactic: number[];
  avgSkill: number;
  players: SerializedPlayer[];
  playersToBuy: SerializedPlayer[];
  human: boolean;
  leagueStats: LeagueStats;
  weeklyFinances: Finances;
  yearlyFinances: Finances;
  money: number;
  weeklySponsorship: number;
  fanHappiness: number;
  seasonPointsPerWeek: number;
  weeklyNews: SerializedNews[];
}

interface SerializedMatchPlayer extends SerializedPlayer {
  playerId: string | null;
  teamId: string | null;
}

interface SerializedMatch {
  matchId: string | null;
  teamIds: [string, string];
  minutes: number;
  score: [number, number];
  possession: [number, number];
  possessionLast5Minutes: number[];
  tacticalChanges: [number, number];
  finished: boolean;
  substitutions: [number, number];
  goalscorers: Array<{
    minute: number;
    teamId: string;
    player: SerializedMatchPlayer;
  }>;
  injuredPlayerOut: { teamId: string | null; player: SerializedMatchPlayer } | null;
  isNeutralField: boolean;
}

interface SerializedDivision {
  index: number;
  name: string;
  level: number;
  teamIds: string[];
  playable: boolean;
  matches: SerializedMatch[][];
}

interface SerializedManager {
  name: string;
  teamId: string | null;
  human: boolean;
  yearlyStats: Manager['yearlyStats'];
}

interface SerializedGame {
  name: string;
  week: number;
  season: number;
  ended: boolean;
  lastScreen: string;
  divisions: SerializedDivision[];
  teams: SerializedTeam[];
  managers: SerializedManager[];
  humanTeamIds: string[];
}

interface SerializedMatchRef {
  id: string | null;
  snapshot: SerializedMatch | null;
}

interface PersistedPayload {
  game: SerializedGame | null;
  currentMatch: SerializedMatchRef;
  liveMatch: SerializedMatchRef;
  selectedTab: TabKey;
  weekNews: string[];
  matchTimeline: MatchEvent[];
  isMatchLive: boolean;
  autoPlaying: boolean;
  postMatchSummary: PostMatchSummary | null;
}

interface PersistInput {
  game: Game | null;
  currentMatch: Match | null;
  liveMatch: Match | null;
  selectedTab: TabKey;
  weekNews: string[];
  matchTimeline: MatchEvent[];
  isMatchLive: boolean;
  autoPlaying: boolean;
  postMatchSummary: PostMatchSummary | null;
}

interface RehydratedState {
  game: Game;
  matchMap: Map<string, Match>;
  teamMap: Map<string, Team>;
  playerMap: Map<string, Player>;
}

interface LoadedState {
  game: Game | null;
  matchMap: Map<string, Match>;
  teamMap: Map<string, Team>;
  playerMap: Map<string, Player>;
  currentMatch: Match | null;
  liveMatch: Match | null;
  selectedTab: TabKey;
  weekNews: string[];
  matchTimeline: MatchEvent[];
  isMatchLive: boolean;
  autoPlaying: boolean;
  postMatchSummary: PostMatchSummary | null;
}

function cloneLeagueStats(stats: LeagueStats): LeagueStats {
  return {
    Wins: stats.Wins,
    Draws: stats.Draws,
    Losses: stats.Losses,
    'Goals For': stats['Goals For'],
    'Goals Against': stats['Goals Against']
  };
}

function cloneFinances(finances: Finances): Finances {
  return {
    Salaries: finances.Salaries,
    'Bought Players': finances['Bought Players'],
    'Sold Players': finances['Sold Players'],
    'Prize Money': finances['Prize Money'],
    Sponsors: finances.Sponsors
  };
}

function serializePlayer(player: Player, id: string, playerIdMap: Map<Player, string>): SerializedPlayer {
  playerIdMap.set(player, id);
  return {
    id,
    skill: player.skill,
    country: player.country,
    training: player.training,
    weeklyTraining: player.weeklyTraining,
    name: player.name,
    age: player.age,
    salary: player.salary,
    position: player.position,
    playingStatus: player.playingStatus,
    leagueStats: player.leagueStats ? { ...player.leagueStats } : null,
    retired: player.retired,
    contract: player.contract,
    wantsNewContract: player.wantsNewContract,
    weeklyStats: player.weeklyStats ? { ...player.weeklyStats } : null,
    wantedSalary: player.wantedSalary ?? null,
    injury: player.injury,
    matchMinutes: player.matchMinutes,
    subMinutes: player.subMinutes,
    isHomegrown: player.isHomegrown,
    skillChangeLastWeek: player.skillChangeLastWeek
  };
}

function serializeTeam(team: Team, id: string, playerIdMap: Map<Player, string>): SerializedTeam {
  const players = team.players.map((player, index) => serializePlayer(player, `${id}-p${index}`, playerIdMap));
  const playersToBuy = team.playersToBuy.map((player, index) =>
    serializePlayer(player, `${id}-b${index}`, playerIdMap)
  );
  const weeklyNews: SerializedNews[] = team.weeklyNews.news.map((item) => ({
    category: item.category,
    data: item.data
  }));

  return {
    id,
    name: team.name,
    country: team.country,
    color: team.color,
    tactic: [...team.tactic],
    avgSkill: team.avgSkill,
    players,
    playersToBuy,
    human: team.human,
    leagueStats: cloneLeagueStats(team.leagueStats),
    weeklyFinances: cloneFinances(team.weeklyFinances),
    yearlyFinances: cloneFinances(team.yearlyFinances),
    money: team.money,
    weeklySponsorship: team.weeklySponsorship,
    fanHappiness: team.fanHappiness,
    seasonPointsPerWeek: team.seasonPointsPerWeek,
    weeklyNews
  };
}

function serializeMatchPlayer(
  player: Player,
  fallbackTeam: Team | null,
  teamIdMap: Map<Team, string>,
  playerIdMap: Map<Player, string>
): SerializedMatchPlayer {
  const playerId = playerIdMap.get(player) ?? null;
  const team = player.team ?? fallbackTeam;
  const teamId = team ? teamIdMap.get(team) ?? null : null;
  const assignedId = playerId ?? `${teamId ?? 'match'}-${player.name}-${player.age}`;
  const base = serializePlayer(player, assignedId, playerIdMap);
  return {
    ...base,
    playerId: assignedId,
    teamId
  };
}

function serializeGoalRecord(
  goal: GoalRecord,
  teamIdMap: Map<Team, string>,
  playerIdMap: Map<Player, string>
): { minute: number; teamId: string; player: SerializedMatchPlayer } {
  const teamId = teamIdMap.get(goal.team);
  if (!teamId) {
    throw new Error('Unable to resolve team when serializing goal record.');
  }
  return {
    minute: goal.minute,
    teamId,
    player: serializeMatchPlayer(goal.player, goal.team, teamIdMap, playerIdMap)
  };
}

function serializeMatch(
  match: Match,
  ensureTeam: (team: Team) => string,
  teamIdMap: Map<Team, string>,
  playerIdMap: Map<Player, string>,
  matchId: string | null
): SerializedMatch {
  const teamIds: [string, string] = [ensureTeam(match.teams[0]), ensureTeam(match.teams[1])];
  return {
    matchId,
    teamIds,
    minutes: match.minutes,
    score: [match.score[0], match.score[1]],
    possession: [match.possession[0], match.possession[1]],
    possessionLast5Minutes: [...match.possessionLast5Minutes],
    tacticalChanges: [match.tacticalChanges[0], match.tacticalChanges[1]],
    finished: match.finished,
    substitutions: [match.substitutions[0], match.substitutions[1]],
    goalscorers: match.goalscorers.map((goal) => serializeGoalRecord(goal, teamIdMap, playerIdMap)),
    injuredPlayerOut: match.injuredPlayerOut
      ? {
          teamId: match.injuredPlayerOut.team ? ensureTeam(match.injuredPlayerOut.team) : null,
          player: serializeMatchPlayer(
            match.injuredPlayerOut,
            match.injuredPlayerOut.team,
            teamIdMap,
            playerIdMap
          )
        }
      : null,
    isNeutralField: match.isNeutralField
  };
}

function serializeGame(game: Game): { serialized: SerializedGame; teamIdMap: Map<Team, string>; playerIdMap: Map<Player, string> } {
  const teamIdMap = new Map<Team, string>();
  const playerIdMap = new Map<Player, string>();
  const serializedTeams: SerializedTeam[] = [];

  const ensureTeam = (team: Team): string => {
    let id = teamIdMap.get(team);
    if (id) {
      return id;
    }
    id = `team-${teamIdMap.size}`;
    teamIdMap.set(team, id);
    serializedTeams.push(serializeTeam(team, id, playerIdMap));
    return id;
  };

  game.divisions.forEach((division) => {
    division.teams.forEach((team) => {
      ensureTeam(team);
    });
  });
  game.humanTeams.forEach((team) => ensureTeam(team));

  const serializedDivisions: SerializedDivision[] = game.divisions.map((division, divisionIndex) => ({
    index: divisionIndex,
    name: division.name,
    level: division.level,
    teamIds: division.teams.map((team) => ensureTeam(team)),
    playable: division.playable,
    matches: division.matches.map((week, weekIndex) =>
      week.map((match, matchIndex) =>
        serializeMatch(
          match,
          ensureTeam,
          teamIdMap,
          playerIdMap,
          `${divisionIndex}-${weekIndex}-${matchIndex}`
        )
      )
    )
  }));

  const serializedManagers: SerializedManager[] = game.managers.map((manager) => ({
    name: manager.name,
    teamId: manager.team ? ensureTeam(manager.team) : null,
    human: manager.human,
    yearlyStats: manager.yearlyStats.map((stats) => ({ ...stats }))
  }));

  return {
    serialized: {
      name: game.name,
      week: game.week,
      season: game.season,
      ended: game.ended,
      lastScreen: game.lastScreen,
      divisions: serializedDivisions,
      teams: serializedTeams,
      managers: serializedManagers,
      humanTeamIds: game.humanTeams.map((team) => ensureTeam(team))
    },
    teamIdMap,
    playerIdMap
  };
}

function revivePlayer(data: SerializedPlayer, team: Team | null): Player {
  return Object.assign(Object.create(Player.prototype), {
    skill: data.skill,
    country: data.country,
    training: data.training,
    weeklyTraining: data.weeklyTraining,
    name: data.name,
    age: data.age,
    salary: data.salary,
    position: data.position,
    playingStatus: data.playingStatus,
    leagueStats: data.leagueStats ? { ...data.leagueStats } : null,
    retired: data.retired,
    contract: data.contract,
    wantsNewContract: data.wantsNewContract,
    weeklyStats: data.weeklyStats ? { ...data.weeklyStats } : null,
    wantedSalary: data.wantedSalary,
    injury: data.injury,
    matchMinutes: data.matchMinutes,
    subMinutes: data.subMinutes,
    isHomegrown: data.isHomegrown,
    skillChangeLastWeek: data.skillChangeLastWeek,
    team
  }) as Player;
}

function reviveMatchPlayer(
  data: SerializedMatchPlayer,
  teamMap: Map<string, Team>,
  playerMap: Map<string, Player>
): Player {
  if (data.playerId) {
    const existing = playerMap.get(data.playerId);
    if (existing) {
      return existing;
    }
  }
  const team = data.teamId ? teamMap.get(data.teamId) ?? null : null;
  const player = revivePlayer(data, team);
  if (data.playerId) {
    playerMap.set(data.playerId, player);
  }
  return player;
}

function reviveMatch(
  data: SerializedMatch,
  teamMap: Map<string, Team>,
  playerMap: Map<string, Player>,
  matchIdMap: Map<string, Match>
): Match {
  const teamA = teamMap.get(data.teamIds[0]);
  const teamB = teamMap.get(data.teamIds[1]);
  if (!teamA || !teamB) {
    throw new Error('Unable to revive match because a team is missing.');
  }

  const match = Object.assign(Object.create(Match.prototype), {
    teams: [teamA, teamB] as [Team, Team],
    minutes: data.minutes,
    score: [data.score[0], data.score[1]] as [number, number],
    possession: [data.possession[0], data.possession[1]] as [number, number],
    possessionLast5Minutes: [...data.possessionLast5Minutes],
    tacticalChanges: [data.tacticalChanges[0], data.tacticalChanges[1]] as [number, number],
    finished: data.finished,
    substitutions: [data.substitutions[0], data.substitutions[1]] as [number, number],
    goalscorers: [] as GoalRecord[],
    injuredPlayerOut: null as Player | null,
    isNeutralField: data.isNeutralField
  }) as Match;

  match.goalscorers = data.goalscorers.map((entry) => ({
    minute: entry.minute,
    team: teamMap.get(entry.teamId) ?? teamA,
    player: reviveMatchPlayer(entry.player, teamMap, playerMap)
  }));

  match.injuredPlayerOut = data.injuredPlayerOut
    ? reviveMatchPlayer(data.injuredPlayerOut.player, teamMap, playerMap)
    : null;

  if (data.matchId) {
    matchIdMap.set(data.matchId, match);
  }

  return match;
}

function reviveTeam(data: SerializedTeam, playerMap: Map<string, Player>): Team {
  const weeklyNews = new NewsList(data.weeklyNews.map((item) => new News(item.category, item.data)));
  const team = Object.assign(Object.create(Team.prototype), {
    name: data.name,
    country: data.country,
    color: data.color,
    manager: null,
    division: null,
    tactic: [...data.tactic],
    avgSkill: data.avgSkill,
    players: [] as Player[],
    human: data.human,
    leagueStats: cloneLeagueStats(data.leagueStats),
    playersToBuy: [] as Player[],
    weeklyFinances: cloneFinances(data.weeklyFinances),
    yearlyFinances: cloneFinances(data.yearlyFinances),
    money: data.money,
    weeklySponsorship: data.weeklySponsorship,
    fanHappiness: data.fanHappiness,
    seasonPointsPerWeek: data.seasonPointsPerWeek,
    weeklyNews
  }) as Team;

  team.players = data.players.map((player) => {
    const revived = revivePlayer(player, team);
    playerMap.set(player.id, revived);
    return revived;
  });

  team.playersToBuy = data.playersToBuy.map((player) => {
    const revived = revivePlayer(player, null);
    playerMap.set(player.id, revived);
    return revived;
  });

  return team;
}

function reviveDivision(
  data: SerializedDivision,
  teamMap: Map<string, Team>,
  playerMap: Map<string, Player>,
  matchIdMap: Map<string, Match>
): Division {
  const teams = data.teamIds.map((teamId) => {
    const team = teamMap.get(teamId);
    if (!team) {
      throw new Error('Unable to revive division because a team is missing.');
    }
    return team;
  });

  const division = Object.assign(Object.create(Division.prototype), {
    name: data.name,
    level: data.level,
    teams,
    matches: [] as Match[][],
    playable: data.playable
  }) as Division;

  division.matches = data.matches.map((week) =>
    week.map((match) => reviveMatch(match, teamMap, playerMap, matchIdMap))
  );

  division.teams.forEach((team) => {
    team.division = division;
  });

  return division;
}

function reviveManager(data: SerializedManager, teamMap: Map<string, Team>): Manager {
  const manager = Object.assign(Object.create(Manager.prototype), {
    name: data.name,
    team: data.teamId ? teamMap.get(data.teamId) ?? null : null,
    human: data.human,
    yearlyStats: data.yearlyStats.map((stats) => ({ ...stats }))
  }) as Manager;
  if (manager.team) {
    manager.team.manager = manager;
  }
  return manager;
}

function reviveGame(serialized: SerializedGame): RehydratedState {
  const teamMap = new Map<string, Team>();
  const playerMap = new Map<string, Player>();

  serialized.teams.forEach((team) => {
    teamMap.set(team.id, reviveTeam(team, playerMap));
  });

  const matchIdMap = new Map<string, Match>();
  const divisions = serialized.divisions.map((division) =>
    reviveDivision(division, teamMap, playerMap, matchIdMap)
  );

  const game = Object.assign(Object.create(Game.prototype), {
    name: serialized.name,
    week: serialized.week,
    season: serialized.season,
    divisions,
    humanTeams: serialized.humanTeamIds
      .map((id) => teamMap.get(id))
      .filter((team): team is Team => Boolean(team)),
    managers: [] as Manager[],
    lastScreen: serialized.lastScreen,
    ended: serialized.ended
  }) as Game;

  const managers = serialized.managers.map((manager) => reviveManager(manager, teamMap));
  game.managers = managers;

  return { game, matchMap: matchIdMap, teamMap, playerMap };
}

function serializeMatchRef(
  match: Match | null,
  game: Game | null,
  teamIdMap: Map<Team, string>,
  playerIdMap: Map<Player, string>
): SerializedMatchRef {
  if (!match || !game) {
    return { id: null, snapshot: null };
  }

  let matchId: string | null = null;
  outer: for (let divisionIndex = 0; divisionIndex < game.divisions.length; divisionIndex += 1) {
    const division = game.divisions[divisionIndex];
    for (let weekIndex = 0; weekIndex < division.matches.length; weekIndex += 1) {
      const week = division.matches[weekIndex];
      for (let matchIndex = 0; matchIndex < week.length; matchIndex += 1) {
        if (week[matchIndex] === match) {
          matchId = `${divisionIndex}-${weekIndex}-${matchIndex}`;
          break outer;
        }
      }
    }
  }

  const ensureTeam = (team: Team): string => {
    const id = teamIdMap.get(team);
    if (!id) {
      throw new Error('Team missing in serialization map.');
    }
    return id;
  };

  return {
    id: matchId,
    snapshot: serializeMatch(match, ensureTeam, teamIdMap, playerIdMap, matchId)
  };
}

export function persistGameState({
  game,
  currentMatch,
  liveMatch,
  selectedTab,
  weekNews,
  matchTimeline,
  isMatchLive,
  autoPlaying,
  postMatchSummary
}: PersistInput): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!game) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  const { serialized, teamIdMap, playerIdMap } = serializeGame(game);

  const currentMatchRef = serializeMatchRef(currentMatch, game, teamIdMap, playerIdMap);
  const liveMatchRef = serializeMatchRef(liveMatch, game, teamIdMap, playerIdMap);

  const payload: PersistedPayload = {
    game: serialized,
    currentMatch: currentMatchRef,
    liveMatch: liveMatchRef,
    selectedTab,
    weekNews,
    matchTimeline,
    isMatchLive,
    autoPlaying,
    postMatchSummary
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function resolveMatchFromRef(
  ref: SerializedMatchRef,
  state: RehydratedState
): Match | null {
  const { matchMap, teamMap, playerMap } = state;
  if (ref.id) {
    const existing = matchMap.get(ref.id);
    if (existing) {
      if (ref.snapshot) {
        existing.minutes = ref.snapshot.minutes;
        existing.score = [ref.snapshot.score[0], ref.snapshot.score[1]];
        existing.possession = [ref.snapshot.possession[0], ref.snapshot.possession[1]];
        existing.possessionLast5Minutes = [...ref.snapshot.possessionLast5Minutes];
        existing.tacticalChanges = [ref.snapshot.tacticalChanges[0], ref.snapshot.tacticalChanges[1]];
        existing.finished = ref.snapshot.finished;
        existing.substitutions = [ref.snapshot.substitutions[0], ref.snapshot.substitutions[1]];
        existing.goalscorers = ref.snapshot.goalscorers.map((goal) => ({
          minute: goal.minute,
          team: teamMap.get(goal.teamId) ?? existing.teams[0],
          player: reviveMatchPlayer(goal.player, teamMap, playerMap)
        }));
        existing.injuredPlayerOut = ref.snapshot.injuredPlayerOut
          ? reviveMatchPlayer(ref.snapshot.injuredPlayerOut.player, teamMap, playerMap)
          : null;
        existing.isNeutralField = ref.snapshot.isNeutralField;
      }
      return existing;
    }
  }

  if (!ref.snapshot) {
    return null;
  }

  return reviveMatch(ref.snapshot, teamMap, playerMap, state.matchMap);
}

export function loadGameState(): LoadedState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const payload = JSON.parse(raw) as PersistedPayload;
    if (!payload.game) {
      return null;
    }

    const state = reviveGame(payload.game);
    const currentMatch = resolveMatchFromRef(payload.currentMatch, state);
    const liveMatch = resolveMatchFromRef(payload.liveMatch, state);

    return {
      game: state.game,
      matchMap: state.matchMap,
      teamMap: state.teamMap,
      playerMap: state.playerMap,
      currentMatch,
      liveMatch,
      selectedTab: payload.selectedTab,
      weekNews: payload.weekNews ?? [],
      matchTimeline: payload.matchTimeline ?? [],
      isMatchLive: payload.isMatchLive && Boolean(liveMatch),
      autoPlaying: false,
      postMatchSummary: payload.postMatchSummary ?? null
    };
  } catch (error) {
    console.error('Failed to load saved game state', error);
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearGameState(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}

