from enum import Enum

# Constants for string representations of text
NEW_GAME = "New Game"
GAME_NAME = "Game name"
MAX_CHAR_HINT = "Max 16 char, only letters and numbers"
MANAGER_NAME = "Manager name"
TEAM = "Team"
NAME = "Name"
COLOR = "Color"
COUNTRY = "Country"
DIVISION_AND_POSITION = "Division and position"
DIV = "Div"
POS = "Pos"
CREATE_GAME = "Create Game"
CREATE_NEW_TEAM = "Create new team"
INVALID_GAME_NAME = "Invalid game name"
GAME_NAME_EMPTY_OR_EXISTS = "Your game name is empty or already exists."
INVALID_MANAGER_NAME = "Invalid manager name"
MANAGER_NAME_EMPTY = "Your manager name is empty."
INVALID_TEAM = "Invalid team"
TEAM_NAME_EMPTY = "Your team name can't be empty."
CHOOSE_DIFFERENT_TEAM_NAME = 'You should choose a name different from the current teams.'
SELECT_TEAM = 'Please select a team.'

# Enums for ID names
class IdNames(Enum):
    GAME_NAME = "game_name"
    MANAGER_NAME = "manager_name"
    TEAMS = "teams"
    NEW_TEAM = "new_team"
    NEW_TEAM_NAME = "new_team_name"
    NEW_TEAM_COLOR = "new_team_color"
    NEW_TEAM_COUNTRY = "new_team_country"
    NEW_TEAM_PREV_DIV = "new_team_prev_div"
    NEW_TEAM_PREV_POS = "new_team_prev_pos"
    SPACING = "spacing"
