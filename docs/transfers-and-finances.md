# Transfers, contracts and finances

Transfers, contracts and club finances all stem from the same data structures used in the original Python game. The web interface surfaces these concepts through the Transfers and Information screens.

## Transfer market

- **Weekly shortlist** – `Team.setTransferList()` populates `playersToBuy` every week using the constants from `lib/constants` (mirrored in `webapp/src/game/constants.ts`). The web UI refreshes this list when you tap **Refresh list**.
- **Buying players** – Selecting a target queues a confirmation card. `Team.buyPlayer()` (invoked via the hook) transfers the player, updates wages, and injects a "Bought Players" entry into weekly finances.
- **Selling players** – Only players passing `player.canBeSold()` can be sold. Selling updates `Team.money`, appends a `News('Sold Player', name)` item and adjusts finances. If your balance drops below zero, `sellPlayerIfMoneyBelow0()` automatically forces a sale and the news feed reflects it.
- **Contract renewals** – Renewals are handled by `Team.renewPlayerContract()`, extending the player's `contract` value and updating finances. The UI disables the button when a contract is not expiring, mirroring the desktop rule.

## Financial model

- **Accounts** – Teams maintain `weeklyFinances` and `yearlyFinances` dictionaries with keys `Salaries`, `Bought Players`, `Sold Players`, `Prize Money`, `Sponsors`. Weekly updates zero out certain values and roll them into the yearly ledger.
- **Sponsorship and prize money** – Determined when creating the human team (`Game.createHumanTeam`). The initial sponsor payout depends on the chosen division/position.
- **Weekly update** – `Team.weeklyUpdate()` applies salary payments, sponsor income, prize money, contract reductions and training adjustments. It also populates `weeklyNews` with events such as injuries, youth promotions and forced sales.
- **Board expectations** – `Team.seasonPointsPerWeek` (derived from constants in `TEAM_GOALS`) defines the points-per-week target. `Team.minPosPerSeasonPointsPerWeek()` converts that into a minimum acceptable league position. The Information screen displays both metrics to replicate the Kivy board panel.

## News and morale

- **News feed** – `Team.weeklyNews.news` collects textual updates. The Information screen renders them verbatim so you see the same events the Kivy popups showed.
- **Fan happiness** – Stored in `Team.fanHappiness`, influenced by results and finances. The Information screen shows the current value, and the weekly summary modal includes the same number.

Together these mechanics guarantee the financial and transfer behaviour in the browser matches the established desktop experience.
