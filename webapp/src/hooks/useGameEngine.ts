'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { COMPETITION, Game, Match, Player, TEAMS } from '@/game';
import { createPostMatchSummary, type PostMatchSummary } from './postMatchSummary';

export type TabKey = 'team' | 'training' | 'transfers' | 'info' | 'league';

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'injury' | 'substitution';
  team: string;
  description: string;
}

export interface OperationResult {
  success: boolean;
  message: string;
}

export interface NewGamePayload {
  gameName: string;
  managerName: string;
  teamName: string;
  customTeam?: {
    name: string;
    color: string;
    country: string;
    division: number;
    position: number;
  } | null;
}

function formatTactic(tactic: number[]): string {
  return tactic.join('-');
}

export function useGameEngine() {
  const gameRef = useRef<Game | null>(null);
  const liveMatchRef = useRef<Match | null>(null);
  const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [, setVersion] = useState(0);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [selectedTab, setSelectedTab] = useState<TabKey>('team');
  const [weekNews, setWeekNews] = useState<string[]>([]);
  const [matchTimeline, setMatchTimeline] = useState<MatchEvent[]>([]);
  const [isMatchLive, setIsMatchLive] = useState(false);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [postMatchSummary, setPostMatchSummary] = useState<PostMatchSummary | null>(null);

  useEffect(() => {
    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, []);

  const stopAutoPlay = () => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    setAutoPlaying(false);
  };

  const game = gameRef.current;
  const humanTeam = game?.humanTeams[0] ?? null;
  const activeDivision = humanTeam?.division ?? null;

  const availableTeams = useMemo(() => {
    const allowed = COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] * COMPETITION['TEAMS PER DIVISION'];
    return TEAMS.slice(0, allowed).map((team) => team.name);
  }, []);

  const startNewGame = (payload: NewGamePayload) => {
    const gameInstance = new Game(payload.gameName);
    let humanTeamConfig: {
      name: string;
      color: string;
      country: string;
      prev_div?: number | null;
      prev_pos?: number | null;
    } = {
      name: payload.teamName,
      color: '',
      country: ''
    };

    if (payload.customTeam) {
      humanTeamConfig = {
        name: payload.customTeam.name,
        color: payload.customTeam.color,
        country: payload.customTeam.country,
        prev_div: payload.customTeam.division,
        prev_pos: payload.customTeam.position
      };
    } else {
      const teamInfo = TEAMS.find((team) => team.name === payload.teamName);
      if (!teamInfo) {
        throw new Error('Team not found');
      }
      humanTeamConfig.color = teamInfo.color;
      humanTeamConfig.country = teamInfo.country;
      humanTeamConfig.prev_div = null;
      humanTeamConfig.prev_pos = null;
    }

    gameInstance.start(humanTeamConfig, { name: payload.managerName });
    gameInstance.startOfSeason();

    gameRef.current = gameInstance;
    liveMatchRef.current = null;
    stopAutoPlay();
    setMatchTimeline([]);
    setVersion((v) => v + 1);
    setCurrentMatch(null);
    setSelectedTab('team');
    setWeekNews([]);
    setPostMatchSummary(null);
  };

  const resetGame = () => {
    gameRef.current = null;
    liveMatchRef.current = null;
    stopAutoPlay();
    setMatchTimeline([]);
    setVersion((v) => v + 1);
    setCurrentMatch(null);
    setWeekNews([]);
    setSelectedTab('team');
    setPostMatchSummary(null);
  };

  const refreshWeeklyState = (): string[] => {
    if (!humanTeam) {
      return [];
    }
    humanTeam.setTransferList();
    const updates = humanTeam.weeklyNews.strList();
    setWeekNews(updates);
    return updates;
  };

  const finalizeWeek = (match: Match | null) => {
    const game = gameRef.current;
    const team = humanTeam;
    if (!game || !team) {
      return;
    }
    game.nextWeek();
    const updates = refreshWeeklyState();
    const summary = createPostMatchSummary({
      team,
      match,
      news: updates,
      season: game.season,
      week: game.week
    });
    setPostMatchSummary(summary);
    setVersion((v) => v + 1);
  };

  const playCurrentMatch = () => {
    if (!game || !humanTeam || !activeDivision) {
      return;
    }
    const week = game.week;
    const match = humanTeam.nextMatch(week);
    if (!match) {
      return;
    }

    liveMatchRef.current = null;
    stopAutoPlay();
    setMatchTimeline([]);
    setPostMatchSummary(null);

    activeDivision.matches[week]
      .filter((m) => m !== match)
      .forEach((m) => {
        if (!m.finished) {
          m.simulate();
        }
      });

    game.divisions
      .filter((division) => division !== activeDivision)
      .forEach((division) => division.simulateWeeklyMatches(week));

    match.simulate();
    setCurrentMatch(match);
    finalizeWeek(match);
  };

  const advanceWeekWithoutMatch = () => {
    if (!game || !humanTeam) {
      return;
    }
    const week = game.week;
    setPostMatchSummary(null);
    game.divisions.forEach((division) => division.simulateWeeklyMatches(week));
    setCurrentMatch(null);
    finalizeWeek(null);
  };

  const setHumanTactic = (tactic: number[]): OperationResult => {
    if (!humanTeam) {
      return { success: false, message: 'No active club available.' };
    }
    try {
      humanTeam.setPlayingTactic([...tactic]);
      humanTeam.orderPlayersByPlayingStatus();
      setVersion((v) => v + 1);
      return { success: true, message: `Formation set to ${formatTactic(tactic)}.` };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, message: error.message };
      }
      return { success: false, message: 'Unable to apply the selected tactic.' };
    }
  };

  const swapPlayerStatuses = (playerA: Player, playerB: Player): OperationResult => {
    if (!humanTeam) {
      return { success: false, message: 'No active club available.' };
    }
    if (playerA === playerB) {
      return { success: true, message: 'No changes made.' };
    }
    const swapped =
      humanTeam.replacePlayer(playerA, playerB) || humanTeam.replacePlayer(playerB, playerA);
    if (!swapped) {
      return { success: false, message: 'Swap not allowed for the selected players.' };
    }
    humanTeam.orderPlayersByPlayingStatus();
    setVersion((v) => v + 1);
    return { success: true, message: 'Players swapped successfully.' };
  };

  const startLiveMatch = (): OperationResult => {
    if (!game || !humanTeam) {
      return { success: false, message: 'No active match available.' };
    }
    const week = game.week;
    const match = humanTeam.nextMatch(week);
    if (!match) {
      return { success: false, message: 'There is no scheduled fixture this week.' };
    }
    if (match.finished) {
      return { success: false, message: 'This match has already been completed.' };
    }

    liveMatchRef.current = match;
    stopAutoPlay();
    setMatchTimeline([]);
    setCurrentMatch(null);
    setIsMatchLive(true);
    setPostMatchSummary(null);
    setVersion((v) => v + 1);
    return { success: true, message: 'Kick-off! Manage the match minute by minute.' };
  };

  const playLiveMinute = (): OperationResult => {
    const match = liveMatchRef.current;
    if (!match) {
      return { success: false, message: 'No live match in progress.' };
    }
    if (match.finished) {
      return { success: false, message: 'The match has already finished.' };
    }

    const previousGoalCount = match.goalscorers.length;
    const progressed = match.minute();
    if (!progressed) {
      return { success: false, message: 'Unable to advance the match.' };
    }

    const newEvents: MatchEvent[] = [];
    const latestGoals = match.goalscorers.slice(previousGoalCount);
    latestGoals.forEach((goal) => {
      newEvents.push({
        minute: goal.minute,
        type: 'goal',
        team: goal.team.name,
        description: `${goal.team.name} goal! ${goal.player.name} scores.`
      });
    });

    if (match.injuredPlayerOut) {
      const player = match.injuredPlayerOut;
      newEvents.push({
        minute: match.minutes,
        type: 'injury',
        team: player.team?.name ?? humanTeam?.name ?? 'Unknown',
        description: `${player.name} is injured and leaves the pitch.`
      });
    }

    if (newEvents.length > 0) {
      setMatchTimeline((events) => [...events, ...newEvents]);
    }

    if (match.finished) {
      stopAutoPlay();
      setIsMatchLive(false);
    }

    setVersion((v) => v + 1);
    return { success: true, message: `Advanced to minute ${match.minutes}.` };
  };

  const toggleAutoPlay = (): OperationResult => {
    const match = liveMatchRef.current;
    if (!match || !isMatchLive) {
      return { success: false, message: 'Start the live match before enabling auto-play.' };
    }
    if (autoPlaying) {
      stopAutoPlay();
      return { success: true, message: 'Auto-play paused.' };
    }
    autoPlayTimerRef.current = setInterval(() => {
      const result = playLiveMinute();
      if (!result.success) {
        stopAutoPlay();
      }
      if (liveMatchRef.current?.finished) {
        stopAutoPlay();
      }
    }, 600);
    setAutoPlaying(true);
    return { success: true, message: 'Auto-play engaged.' };
  };

  const finishLiveMatch = (): OperationResult => {
    const match = liveMatchRef.current;
    if (!match) {
      return { success: false, message: 'No match to conclude.' };
    }
    if (!match.finished) {
      return { success: false, message: 'Play the full 90 minutes before finishing the week.' };
    }
    if (!game || !humanTeam) {
      return { success: false, message: 'No active save to progress.' };
    }

    stopAutoPlay();
    game.divisions.forEach((division) => division.simulateWeeklyMatches(game.week));
    setCurrentMatch(match);
    liveMatchRef.current = null;
    setIsMatchLive(false);
    finalizeWeek(match);
    return { success: true, message: 'Week completed. Check the latest news and finances.' };
  };

  const makeMatchSubstitution = (playerOut: Player, playerIn: Player): OperationResult => {
    const match = liveMatchRef.current;
    if (!match || !humanTeam) {
      return { success: false, message: 'No live match in progress.' };
    }
    if (!match.allowSubstitution(humanTeam)) {
      return { success: false, message: 'You have used all available substitutions.' };
    }
    const substituted = humanTeam.replacePlayer(playerIn, playerOut, true, match.minutes);
    if (!substituted) {
      return { success: false, message: 'The selected substitution is not allowed.' };
    }
    match.substitutionMadeByTeam(humanTeam);
    setMatchTimeline((events) => [
      ...events,
      {
        minute: match.minutes,
        type: 'substitution',
        team: humanTeam.name,
        description: `${playerIn.name} replaces ${playerOut.name}.`
      }
    ]);
    humanTeam.orderPlayersByPlayingStatus();
    setVersion((v) => v + 1);
    return { success: true, message: 'Substitution confirmed.' };
  };

  const refreshTransferTargets = (): OperationResult => {
    if (!humanTeam) {
      return { success: false, message: 'No active club available.' };
    }
    humanTeam.setTransferList();
    setVersion((v) => v + 1);
    return { success: true, message: 'Transfer list refreshed.' };
  };

  const buyPlayer = (player: Player): OperationResult => {
    if (!humanTeam) {
      return { success: false, message: 'No active club available.' };
    }
    if (!humanTeam.hasPlaceToBuyPlayer()) {
      return { success: false, message: 'Squad already has the maximum number of players.' };
    }
    if (!humanTeam.hasMoneyToBuyPlayer(player)) {
      return { success: false, message: 'Not enough funds to complete this transfer.' };
    }
    if (!humanTeam.buyPlayer(player)) {
      return { success: false, message: 'Transfer failed unexpectedly.' };
    }
    setVersion((v) => v + 1);
    return {
      success: true,
      message: `${player.name} joins the club for €${player.currentValue().toLocaleString()}.`
    };
  };

  const sellPlayer = (player: Player): OperationResult => {
    if (!humanTeam) {
      return { success: false, message: 'No active club available.' };
    }
    if (!humanTeam.hasPlaceToSellPlayer()) {
      return { success: false, message: 'You must keep at least eleven players in the squad.' };
    }
    if (player.position === 0 && !humanTeam.hasAtLeastOneGk()) {
      return { success: false, message: 'You need to retain at least one goalkeeper.' };
    }
    if (!player.canBeSold()) {
      return { success: false, message: 'This player cannot be sold right now.' };
    }
    if (!humanTeam.sellPlayer(player)) {
      return { success: false, message: 'Sale failed unexpectedly.' };
    }
    setVersion((v) => v + 1);
    return {
      success: true,
      message: `${player.name} sold for €${player.currentValue().toLocaleString()}.`
    };
  };

  const renewContract = (player: Player): OperationResult => {
    if (!humanTeam) {
      return { success: false, message: 'No active club available.' };
    }
    if (player.contract > 0) {
      return { success: false, message: 'The player already has a valid contract.' };
    }
    player.setRenewContractWantedSalary(true);
    const desiredSalary = player.wantedSalary ?? player.salary;
    if (!humanTeam.renewContract(player)) {
      return { success: false, message: 'Contract renewal failed.' };
    }
    setVersion((v) => v + 1);
    return {
      success: true,
      message: `${player.name} renewed on €${desiredSalary.toLocaleString()} per week.`
    };
  };

  const leagueTable = !activeDivision
    ? []
    : activeDivision.orderedTableByPosition().map((team, index) => ({
        position: index + 1,
        name: team.name,
        points: team.leaguePoints(),
        wins: team.leagueStats.Wins,
        draws: team.leagueStats.Draws,
        losses: team.leagueStats.Losses,
        goalsFor: team.leagueStats['Goals For'],
        goalsAgainst: team.leagueStats['Goals Against']
      }));

  const allowedTactics = humanTeam?.listOfAllowedTactics() ?? [];
  const currentTactic = humanTeam?.currentTactic() ?? [];
  const liveMatch = liveMatchRef.current;

  return {
    game,
    humanTeam,
    availableTeams,
    startNewGame,
    resetGame,
    playCurrentMatch,
    advanceWeekWithoutMatch,
    currentMatch,
    leagueTable,
    selectedTab,
    setSelectedTab,
    weekNews,
    allowedTactics,
    currentTactic,
    setHumanTactic,
    swapPlayerStatuses,
    liveMatch,
    isMatchLive,
    matchTimeline,
    autoPlaying,
    startLiveMatch,
    playLiveMinute,
    toggleAutoPlay,
    finishLiveMatch,
    makeMatchSubstitution,
    refreshTransferTargets,
    buyPlayer,
    sellPlayer,
    renewContract,
    postMatchSummary,
    dismissPostMatchSummary: () => setPostMatchSummary(null)
  };
}
