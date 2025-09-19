import { describe, expect, it } from 'vitest';
import { COMPETITION, Game, TEAMS } from './index';

const SAMPLE_TEAM = TEAMS[0];

describe('Game engine parity', () => {
  it('creates a full competition with a human club', () => {
    const game = new Game('Parity Test');
    game.start(
      {
        name: SAMPLE_TEAM.name,
        color: SAMPLE_TEAM.color,
        country: SAMPLE_TEAM.country
      },
      { name: 'Test Manager' }
    );
    game.startOfSeason();

    expect(game.divisions.length).toBeGreaterThan(0);
    const humanTeam = game.humanTeams[0];
    expect(humanTeam).toBeTruthy();
    expect(humanTeam.players.length).toBeGreaterThan(10);
    expect(humanTeam.manager?.human).toBe(true);
    expect(humanTeam.weeklySponsorship).toBeGreaterThan(0);
  });

  it('simulates a week preserving league stats', () => {
    const game = new Game('Weekly Flow');
    game.start(
      {
        name: SAMPLE_TEAM.name,
        color: SAMPLE_TEAM.color,
        country: SAMPLE_TEAM.country
      },
      { name: 'Coach' }
    );
    game.startOfSeason();
    const humanTeam = game.humanTeams[0];
    const initialWeek = game.week;

    game.simulateWeeklyMatches();
    game.nextWeek();

    expect(game.week).toBe(initialWeek + 1);
    expect(humanTeam.leagueStats.Wins + humanTeam.leagueStats.Draws + humanTeam.leagueStats.Losses).toBeGreaterThanOrEqual(0);
    const division = humanTeam.division!;
    const table = division.orderedTableByPosition();
    expect(table.length).toBe(COMPETITION['TEAMS PER DIVISION']);
    expect(table[0].leaguePoints()).toBeGreaterThanOrEqual(table[1].leaguePoints());
  });

  it('plays a full match with deterministic outcomes', () => {
    const game = new Game('Match Simulation');
    game.start(
      {
        name: SAMPLE_TEAM.name,
        color: SAMPLE_TEAM.color,
        country: SAMPLE_TEAM.country
      },
      { name: 'Tactician' }
    );
    game.startOfSeason();
    const humanTeam = game.humanTeams[0];
    const match = humanTeam.nextMatch(game.week)!;
    match.simulate();
    expect(match.finished).toBe(true);
    expect(match.minutes).toBe(90);
    expect(humanTeam.leagueStats.Wins + humanTeam.leagueStats.Draws + humanTeam.leagueStats.Losses).toBe(1);
  });
});
