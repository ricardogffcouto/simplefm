# Game structure and screen flow

SimpleFM uses a deterministic weekly loop that mirrors the original Kivy application. Understanding how the objects collaborate clarifies why the web UI reproduces the same set of screens and transitions.

## Core entities

- **Game** (`webapp/src/game/game.ts`) orchestrates seasons, divisions and managers. It holds:
  - `divisions`: ordered list of competitive divisions plus an extra pool for overflow teams.
  - `humanTeams`: array of human-controlled clubs (the web port keeps one, mirroring the prototype).
  - `managers`: includes the human manager and AI managers for bookkeeping.
  - `week` and `season` counters.
- **Division** pairs fixtures week by week and calculates standings. Each division exposes `matches[week]` to fetch the round currently being played.
- **Team** encapsulates the club state: tactic, roster, finances, morale and weekly news. Methods such as `nextMatch`, `nextOpponent`, `setTransferList`, `weeklyNews` and `minPosPerSeasonPointsPerWeek` power the UI.
- **Manager** records yearly statistics (`yearlyStats`) and aggregates career milestones. The *Manager stats* overlay pulls data from `careerStats()` and `careerStatsOrder()`.

## Starting a new game

1. The new game screen collects the same inputs as the Kivy form (game name, manager, team/custom club configuration).
2. `Game.start` seeds all divisions with the base database, optionally inserting the custom club at the requested division/position.
3. `Game.createHumanTeam` flags the chosen team as human, builds a full roster based on average division skill, assigns sponsorship and instantiates the `Manager`.
4. `Game.startOfSeason` schedules fixtures for every division and creates the first season entry for the manager. The UI then renders the **Main screen** with the Team tab active.

## Weekly loop

Each in-game week follows the same order as the Kivy desktop flow:

1. **Squad management** – Adjust tactics and matchday squads on the Team screen. The footer’s *Play* equivalent opens the match centre.
2. **Match centre** – Kick-off, advance minute by minute or toggle auto-play. When the match ends the engine stores the `Match` instance as `currentMatch`.
3. **Weekly summary** – `useGameEngine.finalizeWeek` advances the game clock (`Game.nextWeek()`), recalculates finances, updates training, records news items and creates a `PostMatchSummary`. The modal surfaces immediately, recreating the Kivy continue dialog.
4. **Information screen** – After closing the modal the Information tab is selected, showing finances, news and board expectations. The **Continue week** button calls `advanceWeekWithoutMatch`, keeping the same single-entry flow the Kivy `WeeklyInformationScreen` uses.
5. **Repeat** – Navigate through Training, Transfers or League at will, then return to Team for the next fixture.

## Screen manager parity

The web application swaps views using React state (`selectedTab`) instead of the original `ScreenManager`, but the order and behaviour remain the same:

1. Start screen → New game screen → Main screen
2. Main screen tabs:
   - Team (with Match centre modal)
   - Training
   - Transfers (includes TransferTeam and TransferList interactions)
   - Information (combining Finances and Weekly Information)
   - League (Division tables)
3. Manager stats overlay replicates the secondary screen reached by the manager icon in Kivy.

The combination of these screens recreates the user experience of the Kivy build while benefiting from the underlying TypeScript engine.
