# SimpleFM Web Tutorial

SimpleFM Web is a faithful browser recreation of the original Kivy prototype for Simple Football Manager. This guide walks you through launching the web client and following the same flow as the desktop version: start a new career, manage your squad, play matches week by week and review the information screens in order.

## Getting started

The web client lives in the [`webapp/`](webapp) folder and uses Next.js 14.

1. Install dependencies:

   ```bash
   cd webapp
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser. The landing page mirrors the Kivy start screen with *New Game* and *Load Game* options over the classic stadium background.

## Core game flow

The UI intentionally reproduces the original Kivy journey. Move through the screens in this order to experience a full in-game week.

### 1. Start screen

Choose **New Game** to begin a career. (Load Game is reserved for future browser save support, just as the desktop edition loads from the filesystem.)

### 2. New Game screen

You are taken to the familiar form with stacked sections:

- **Game name** and **Manager name** inputs accept up to 16 alphanumeric characters.
- The **Team** spinner lets you pick an existing club or choose *Create new team* to reveal the custom club section.
- Custom clubs include fields for name, country, primary colour, starting division and position—matching the layout of the Kivy screen.
- Use the **Back** button to return to the start menu or **Create Game** to launch the save.

### 3. Main screen layout

After creating a game you land on the main management screen, which keeps the Kivy hierarchy:

1. **Top header** – shows the game name, club, season/week, balance and fan happiness. The *Manager stats* button opens the full career overview overlay, just like pressing the manager icon on desktop.
2. **Central content area** – holds the active sub-screen. The navigation footer mirrors the original buttons: **Team**, **Training**, **Transfers**, **Information**, **League**.
3. **Footer** – the white bar with the five navigation buttons. A *Quit to menu* link behaves like returning to the start screen.

### 4. Team screen

- Use the tactic dropdown (Kivy's tactics spinner) to pick a formation. Players are split into the same three groups—Starting XI, Bench and Reserves. Tap a player and then another to swap their match status.
- The information banner shows the upcoming opponent. Press **Go to match screen** to open the match centre.

### 5. Match screen

The match centre is a modal that recreates the Kivy match controls:

1. **Timeline** on the left displays live events or the final list of scorers.
2. **Controls** on the right give you *Kick-off*, *Play minute*, *Auto-play* and *Finish match*. Disabled buttons mirror the Kivy gating when a match is not in progress.
3. **On the pitch** and **Bench** sections let you tap to set up substitutions. Selecting one starter and one substitute triggers the change.
4. Close the screen to return to the main menu once the match is finished.

### 6. Training screen

Shows the weekly training report with positions, skills and trend arrows. This replaces the *Weekly Training* Kivy view.

### 7. Transfers screen

Lists scouted players on the left and your squad on the right. The flow matches the *Transfer List* screen:

- Tap a target to queue a signing and confirm or cancel.
- Choose a squad player to sell or renew, observing contract status and wage impact.

### 8. Information screen

Combines the *Finances* and *Weekly Information* screens:

- Weekly and season finances, board expectations and supporter goals.
- Weekly news items mirror the press messages from the desktop UI.
- Use **Continue week** to simulate the next week. After a match, the weekly summary modal appears before returning here.

### 9. League screen

Displays the divisional table with the human club highlighted, replicating the Kivy division tables.

Repeat steps 4–8 every week. Each completed week surfaces the summary overlay with match result, training changes, finances and news before you continue.

## Learn more

Detailed documentation about the simulation internals—teams, players, transfers, finances and the match engine—resides in the [`docs/`](docs) directory:

- [`docs/game-structure.md`](docs/game-structure.md) – how the engine organises seasons, divisions and screen flow.
- [`docs/teams-and-players.md`](docs/teams-and-players.md) – roster management, player attributes and morale.
- [`docs/matches-and-training.md`](docs/matches-and-training.md) – match simulation, substitutions, training updates and weekly routines.
- [`docs/transfers-and-finances.md`](docs/transfers-and-finances.md) – transfer market, contracts, finances and board expectations.

Use these references alongside the tutorial to master SimpleFM.
