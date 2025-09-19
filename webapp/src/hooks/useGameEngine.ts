'use client';

import { useMemo, useRef, useState } from 'react';
import { COMPETITION, Game, Match, Team, TEAMS } from '@/game';

export type TabKey = 'team' | 'match' | 'league' | 'finance' | 'news';

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

export function useGameEngine() {
  const gameRef = useRef<Game | null>(null);
  const [version, setVersion] = useState(0);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [selectedTab, setSelectedTab] = useState<TabKey>('team');
  const [weekNews, setWeekNews] = useState<string[]>([]);

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
    setVersion((v) => v + 1);
    setCurrentMatch(null);
    setSelectedTab('team');
    setWeekNews([]);
  };

  const resetGame = () => {
    gameRef.current = null;
    setVersion((v) => v + 1);
    setCurrentMatch(null);
    setWeekNews([]);
    setSelectedTab('team');
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

    // simulate other matches in the same division first except the human match
    activeDivision.matches[week]
      .filter((m) => m !== match)
      .forEach((m) => {
        if (!m.finished) {
          m.simulate();
        }
      });

    // simulate matches in other divisions
    game.divisions
      .filter((division) => division !== activeDivision)
      .forEach((division) => division.simulateWeeklyMatches(week));

    // play the human match
    match.simulate();
    setCurrentMatch(match);

    game.nextWeek();
    setWeekNews(humanTeam.weeklyNews.strList());
    setVersion((v) => v + 1);
  };

  const advanceWeekWithoutMatch = () => {
    if (!game || !humanTeam) {
      return;
    }
    const week = game.week;
    game.divisions.forEach((division) => division.simulateWeeklyMatches(week));
    game.nextWeek();
    setCurrentMatch(null);
    setWeekNews(humanTeam.weeklyNews.strList());
    setVersion((v) => v + 1);
  };

  const rosterByPosition = !humanTeam
    ? []
    : ['Goalkeepers', 'Defenders', 'Midfielders', 'Forwards'].map((label, index) => ({
        label,
        players: humanTeam.players.filter((player) => player.position === index)
      }));

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

  return {
    game,
    humanTeam,
    availableTeams,
    startNewGame,
    resetGame,
    playCurrentMatch,
    advanceWeekWithoutMatch,
    currentMatch,
    rosterByPosition,
    leagueTable,
    selectedTab,
    setSelectedTab,
    weekNews
  };
}
