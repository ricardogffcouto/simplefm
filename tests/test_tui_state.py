import shutil
import tempfile
import unittest

from tui.state import SimpleFMState


class TestTUIState(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.mkdtemp()
        self.state = SimpleFMState(save_dir=self.temp_dir)
        team_name = self.state.list_selectable_teams()[0]["name"]
        self.state.start_new_game(
            game_name="TestCareer",
            manager_name="Alex",
            team_name=team_name,
        )

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_header_context(self) -> None:
        header = self.state.header_context()
        self.assertIn("team", header)
        self.assertEqual(header["manager"], "Alex")

    def test_tactic_and_swap(self) -> None:
        options = self.state.tactic_options()
        self.assertTrue(options)
        self.state.set_tactic(options[0])
        overview = self.state.team_overview()
        starting = overview["starting"][0]
        bench = overview["bench"][0]
        swapped = self.state.swap_players(starting.identifier, bench.identifier)
        self.assertTrue(swapped)

    def test_transfers_and_week_progress(self) -> None:
        initial_players = len(self.state.squad_for_transfers())
        targets = self.state.transfer_targets()
        self.assertTrue(targets)
        target_id = targets[0].identifier
        self.state.buy_player(target_id)
        self.assertGreater(len(self.state.squad_for_transfers()), initial_players)

        # sell a player without a contract to validate the flow
        for player in self.state.squad_for_transfers():
            if player.contract == 0 and not player.injured and player.position != "GK":
                self.state.sell_player(player.identifier)
                break

        summary = self.state.continue_week()
        self.assertIn("finances", summary)
        self.assertIn("news", summary)

    def test_manager_stats(self) -> None:
        stats = self.state.manager_stats()
        self.assertEqual(stats["name"], "Alex")
        self.assertIn("career", stats)


if __name__ == "__main__":
    unittest.main()

