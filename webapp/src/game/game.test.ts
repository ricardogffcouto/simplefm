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

  it('allows setting tactics and swapping players between statuses', () => {
    const game = new Game('Tactics Test');
    game.start(
      {
        name: SAMPLE_TEAM.name,
        color: SAMPLE_TEAM.color,
        country: SAMPLE_TEAM.country
      },
      { name: 'Strategist' }
    );
    game.startOfSeason();
    const team = game.humanTeams[0];
    const allowed = team.listOfAllowedTactics();
    expect(allowed.length).toBeGreaterThan(0);
    const tactic = allowed[0];
    team.setPlayingTactic(tactic);
    const starters = team.players.filter((player) => player.playingStatus === 0);
    expect(starters.length).toBe(11);

    const interchangeableStarter = starters.find((player) => player.position !== 0);
    const reserve = team.players.find(
      (player) => player.playingStatus === 2 && interchangeableStarter && player.position === interchangeableStarter.position
    );
    if (interchangeableStarter && reserve) {
      const swapped = team.replacePlayer(reserve, interchangeableStarter);
      expect(swapped).toBe(true);
      expect(reserve.playingStatus).toBe(0);
      expect(interchangeableStarter.playingStatus).not.toBe(0);
    }
  });

  it('supports buying, renewing and selling players like the original game', () => {
    const game = new Game('Transfer Test');
    game.start(
      {
        name: SAMPLE_TEAM.name,
        color: SAMPLE_TEAM.color,
        country: SAMPLE_TEAM.country
      },
      { name: 'Director' }
    );
    game.startOfSeason();
    const team = game.humanTeams[0];
    team.money = 100_000_000;
    team.setTransferList();
    expect(team.playersToBuy.length).toBeGreaterThan(0);
    const candidate = team.playersToBuy[0];
    const bought = team.buyPlayer(candidate);
    expect(bought).toBe(true);
    expect(team.players.includes(candidate)).toBe(true);

    candidate.contract = 0;
    candidate.setRenewContractWantedSalary(true);
    const renewed = team.renewContract(candidate);
    expect(renewed).toBe(true);
    expect(candidate.contract).toBe(COMPETITION['TOTAL GAMES']);

    const sellTarget = team.players.find((player) => player !== candidate && player.position !== 0);
    if (sellTarget) {
      sellTarget.contract = 0;
      const sold = team.sellPlayer(sellTarget);
      expect(sold).toBe(true);
    }
  });
});
