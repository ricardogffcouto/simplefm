# Matches and training

Matches and weekly training form the backbone of SimpleFM's simulation loop. The web UI recreates the Kivy match screen while using the same TypeScript engine that drives outcomes and player development.

## Match lifecycle

1. **Scheduling** – `Game.startOfSeason()` builds fixtures for every division. `Team.nextMatch(week)` returns the `Match` object for the current week.
2. **Launching a match** – Opening the match screen calls `useGameEngine.startLiveMatch()`. The hook stores the `Match` in `liveMatchRef`, clears previous timelines and flags the simulation as live.
3. **Minute-by-minute simulation** –
   - `onPlayMinute` calls `Match.playMinute()`, advances the internal clock and records `MatchEvent`s (goals, injuries, substitutions) for the timeline list.
   - `onToggleAutoPlay` starts/stops an interval that repeatedly invokes `onPlayMinute`, mirroring the auto-play button in Kivy.
   - `onMakeSubstitution` delegates to `Match.makeSubstitution` after verifying the change is legal.
4. **Finishing the match** – `onFinishLiveMatch` stops auto-play, finalises the `Match`, stores it as `currentMatch` and hands it to `finalizeWeek`.
5. **Instant simulation** – When the user skips the match and only presses **Continue week**, the engine invokes `advanceWeekWithoutMatch`, simulating every division in bulk—matching the desktop behaviour when you fast-forward from the weekly information screen.

## Training updates

Training is recalculated as part of `Team.weeklyUpdate()`:

- Every player collects or loses training points based on match minutes (`player.weeklyTraining`).
- `trainingToStr` converts the numeric change into the familiar labels (`++`, `+`, `-`, `--`).
- Experienced starters grant tactical bonuses via `Team.titsTotalSkill()` and `Team.tacticalSkill()`.

The Training screen simply renders these metrics, grouped by position, exactly as the Kivy `WeeklyTraining` list did.

## Weekly summary

After each week the engine produces a `PostMatchSummary` object via `createPostMatchSummary` (`webapp/src/hooks/postMatchSummary.ts`):

- `match` – final score, venue, result and scorer list if a fixture happened.
- `training` – extracted from each player’s weekly training delta.
- `finances` – combination of the week's ledger entries (salaries, transfers, prize money, sponsors).
- `news` – items from `Team.weeklyNews` such as injuries or forced sales.
- `table` – a highlight row for each team in the human division.

The modal enforces the same pause before continuing that the Kivy `WeeklyInformationScreen` provided, preserving the rhythm of match → news → continue.
