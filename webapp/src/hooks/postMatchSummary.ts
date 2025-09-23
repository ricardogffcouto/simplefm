import type { Match, Team } from '../game';
import { trainingToStr, type TrainingDelta } from '../game/helpers';
import type { Finances } from '../game/team';

export interface SummaryGoal {
  minute: number;
  scorer: string;
  team: string;
}

export interface SummaryMatch {
  home: string;
  away: string;
  score: [number, number];
  result: 'Win' | 'Draw' | 'Loss';
  venue: 'Home' | 'Away';
  scorers: SummaryGoal[];
}

export interface TrainingHighlight {
  player: string;
  position: string;
  label: TrainingDelta;
  amount: number;
}

export interface FinanceLine {
  label: keyof Finances;
  amount: number;
}

export interface TableRowSummary {
  position: number;
  name: string;
  points: number;
  goalDifference: number;
  highlight: boolean;
}

export interface PostMatchSummary {
  season: number;
  week: number;
  fanHappiness: number;
  balance: number;
  match: SummaryMatch | null;
  training: TrainingHighlight[];
  finances: FinanceLine[];
  news: string[];
  table: TableRowSummary[];
}

export function createPostMatchSummary({
  team,
  match,
  news,
  season,
  week
}: {
  team: Team;
  match: Match | null;
  news: string[];
  season: number;
  week: number;
}): PostMatchSummary {
  const table: TableRowSummary[] = team.division
    ? team.division.orderedTableByPosition().map((club, index) => ({
        position: index + 1,
        name: club.name,
        points: club.leaguePoints(),
        goalDifference: club.goalDifference(),
        highlight: club === team
      }))
    : [];

  const training: TrainingHighlight[] = team.players
    .reduce<TrainingHighlight[]>((acc, player) => {
      const label = trainingToStr(player.weeklyTraining);
      if (label === '') {
        return acc;
      }
      acc.push({
        player: player.name,
        position: player.posToStr(),
        label,
        amount: Number(player.weeklyTraining.toFixed(3))
      });
      return acc;
    }, [])
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 6);

  const finances: FinanceLine[] = (Object.keys(team.weeklyFinances) as Array<keyof Finances>)
    .map((key) => ({
      label: key,
      amount: team.weeklyFinances[key]
    }))
    .filter((line) => Math.abs(line.amount) > 0)
    .sort((a, b) => b.amount - a.amount);

  let summaryMatch: SummaryMatch | null = null;
  if (match) {
    const [homeScore, awayScore] = match.score;
    const isHome = match.teams[0] === team;
    const humanScore = isHome ? homeScore : awayScore;
    const rivalScore = isHome ? awayScore : homeScore;
    const result: SummaryMatch['result'] =
      humanScore > rivalScore ? 'Win' : humanScore === rivalScore ? 'Draw' : 'Loss';

    summaryMatch = {
      home: match.teams[0].name,
      away: match.teams[1].name,
      score: [homeScore, awayScore],
      result,
      venue: isHome ? 'Home' : 'Away',
      scorers: match.goalscorers.map((goal) => ({
        minute: goal.minute,
        scorer: goal.player.name,
        team: goal.team.name
      }))
    };
  }

  return {
    season,
    week,
    fanHappiness: team.fanHappiness,
    balance: team.money,
    match: summaryMatch,
    training,
    finances,
    news,
    table
  };
}
