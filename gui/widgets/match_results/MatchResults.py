import gui.utils
from gui.utils import COLORS
from gui.widgets.GlobalWidgets import ScrollableList


class MatchResults(ScrollableList):
    current_week = None
    current_division = None
    self.active_team = None

    def refresh(self):
        self.data = [{
            'week': "",
            'home_team': "[b]{}[/b]".format(match.teams[0].name) if match.teams[0] == self.active_team else match.teams[0].name,
            'home_goals': "[b]{}[/b]".format(match.score[0]) if match.finished and match.teams[0] == self.active_team else str(match.score[0]) if match.finished else "",
            'away_team': "[b]{}[/b]".format(match.teams[1].name) if match.teams[1] == self.active_team else match.teams[1].name,
            'away_goals': "[b]{}[/b]".format(match.score[1]) if match.finished and match.teams[1] == self.active_team else str(match.score[1]) if match.finished else "",
            'extra_info': "" if self.active_team not in match.teams else "[color={}][b]{}[/b][/color]".format(COLORS["Red"], "L") if match.loser() == self.active_team else "[color={}][b]{}[/b][/color]".format(COLORS["Green"], "W") if match.winner() == self.active_team else "[color={}][b]{}[/b][/color]".format(COLORS["Yellow"], "D") if match.finished else ""}
            for match in self.current_division.matches[self.current_week]]

        highlight_data = [data for data in self.data if data['home_team'].strip('[b]').strip('[/b]') == self.active_team.name or data['away_team'].strip('[b]').strip('[/b]') == self.active_team.name]

        if len(highlight_data):
            self.color_label_background(highlight_data=highlight_data[0], highlight_color=gui.helpers.adjust_color_shade_and_opacity(col=self.active_team.color, tint=0.6))
        else:
            self.color_label_background()