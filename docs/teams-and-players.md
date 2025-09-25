# Teams and players

The heart of SimpleFM is the `Team` class (`webapp/src/game/team.ts`). Each human club is a `Team` instance populated with `Player` objects (`webapp/src/game/player.ts`). The user interface mirrors the same structure used in the original Kivy widgets.

## Team anatomy

- **Roster (`players`)** – an array of `Player` objects sorted by position or status depending on the view.
- **Playing status** – each player stores `playingStatus` (`0` = starter, `1` = bench, `2` = reserves). The Team screen groups players into the same three lists as the Kivy `TeamPlayersList` widget.
- **Tactic (`currentTactic`)** – dynamically computed from starters if the club is human. Selecting a tactic in the UI calls `setPlayingTactic`, which validates formations and reorders the roster.
- **Finances** – teams track `weeklyFinances` and `yearlyFinances`, updated when `setTransferList`, `weeklyUpdate` or transfer operations occur. These maps drive the Information screen summary.
- **Morale and goals** – properties like `fanHappiness` and `seasonPointsPerWeek` capture board pressure. The helper `minPosPerSeasonPointsPerWeek()` converts the target points-per-week into a required league position.
- **Transfer list** – `playersToBuy` is refreshed weekly via `setTransferList()`, just like the desktop game generating a fresh shortlist.
- **Weekly news** – `weeklyNews` collects events (injuries, youth promotions, forced sales) written during `weeklyUpdate()`.

## Player attributes

Players have a rich set of properties that affect training, matches and transfers:

- **Position (`position`)** – 0 = goalkeeper, 1 = defender, 2 = midfielder, 3 = forward. Helper methods such as `posToStr()` convert to display labels.
- **Skill (`skill`)** – base ability used for formation calculations. During matches, `matchSkill()` adjusts this value by fatigue and bonuses.
- **Age & retirement** – the engine tracks `age`, `retired` status and contract length (`contract`). Older players are weighted in `Team.titsTotalSkill()` to simulate experience bonuses.
- **Availability** – `injured()`, `matchAvailable()` and contract state determine whether the UI shows warning styling and whether swaps are allowed.
- **Financial metrics** – `salary` and `currentValue()` feed into wage and transfer calculations. Selling a player applies through `Team.sellPlayer`, which updates finances and news.

## Interaction highlights

- Swapping players updates both the `playingStatus` values and the computed tactic. This is why the UI forces users to tap one player and then another, replicating the Kivy list behaviour.
- Adding a custom club sets colour, country and initial division/position; the roster is generated using `TEAM['STARTING_AMOUNT_OF_PLAYERS_PER_POS']` to ensure balanced squads.
- Weekly updates adjust morale, trigger automatic sales if money drops below zero (`sellPlayerIfMoneyBelow0`) and reduce injuries/contracts, ensuring the persistent simulation lines up with the desktop version.

These mechanics are surfaced through the React components (`SquadBoard`, `TrainingPanel`, `TransferHub`) so that every action mirrors the behaviour from the original GUI.
