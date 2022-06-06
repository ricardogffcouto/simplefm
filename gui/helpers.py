from kivy.metrics import dp
from kivy.utils import rgba
from kivy.core.window import Window

COLORS = {
    'Blue': '#485C96',
    'White' : '#7E7E7E',
    'Red' : '#B22222',
    'Black' : '#111111',
    'Orange' : '#FF8C00',
    'Yellow' : '#FFD700',
    'Purple' : '#4B0082',
    'Green' : '#228B22'
}

PLAYING_STATUS_BCOLORS = (1, 0.8, 0.7)

SKILL_COLORS = (
    (1.0, 0.39, 0.09, 1.0),
    (0.99, 0.47, 0.12, 1.0),
    (0.99, 0.55, 0.15, 1.0),
    (0.98, 0.64, 0.17, 1.0),
    (0.98, 0.72, 0.2, 1.0),
    (0.92, 0.71, 0.2, 1.0),
    (0.86, 0.71, 0.2, 1.0),
    (0.8, 0.71, 0.2, 1.0),
    (0.74, 0.71, 0.2, 1.0),
    (0.67, 0.7, 0.2, 1.0),
    (0.62, 0.7, 0.22, 1.0),
    (0.57, 0.7, 0.24, 1.0),
    (0.52, 0.7, 0.26, 1.0),
    (0.46, 0.7, 0.28, 1.0),
    (0.41, 0.7, 0.3, 1.0),
    (0.4, 0.67, 0.29, 1.0),
    (0.38, 0.65, 0.27, 1.0),
    (0.36, 0.62, 0.26, 1.0),
    (0.35, 0.59, 0.25, 1.0),
    (0.33, 0.56, 0.24, 1.0),
)

POSITION_COLORS = (
    (1.0, 0.39, 0.09, 1.0),
    (0.4, 0.67, 0.29, 1.0),
    (0.16, 0.65, 0.74, 1.0),
    (0.67, 0.7, 0.2, 1.0),
)

def recycle_view_adjust_size_hint_y_to_window(rv, size_hint_y_available = 1):
    rv.size_hint_y = (rv.content_height * len(rv.data)) / (float(Window.height) * size_hint_y_available) + (0.0015 * len(rv.data))
    return rv.size_hint_y

def training_to_str(training):
    if training >= 0.03:
        return "++"
    elif training >= 0.015:
            return "+"
    elif training <= -0.015:
            return "-"
    elif training <= -0.03:
            return "--"
    return ""

def table_position_to_str(number):
    if str(number)[-1] == '1':
        return str(number) + 'st'
    elif str(number)[-1] == '2':
        return str(number) + 'nd'
    elif str(number)[-1] == '3':
            return str(number) + 'rd'
    else:
        return str(number) + 'th'

def money_to_str(number):
    if number == 0:
        sign = 1
    else:
        sign = int(number / abs(number))
    number = int(round(abs(number), 1))
    ktest = number / 1000
    if ktest >= 1:
        if ktest >= 10:
            if ktest >= 1000:
                if ktest >= 10000:
                    return str(int(round(sign * ktest / 1000.0, 1))) + 'M'
                else:
                    return str(round(sign * ktest / 1000.0, 1)) + 'M'
            else:
                return str(int(round(sign * ktest, 0))) + 'k'
        else:
            return str(int(round(sign * number / 1000, 0))) + 'k'
    else:
        return str(int(round(sign * number, 0)))


def tactic_to_str(tactic):
    return str(tactic[0]) + '-' + str(tactic[1]) + '-' + str(tactic[2])

def player_data(p, match_minutes):
    def _extra_info_src(p):
        name = "injury" if p.injured() else "contract" if p.wants_new_contract else 'plus' if p.skill_change_last_week > 0 else 'minus' if p.skill_change_last_week < 0 else ""
        if name != "":
            return f"gui/icons/{name}.png"
        return name

    def _extra_info(p):
        if match_minutes:
            return "" if p.playing_status == 1 else str(p.sub_minutes) + "'" if p.sub_minutes != 0 else ""
        return p.injury if p.injured() else ""

    return {
        'bcolor': [PLAYING_STATUS_BCOLORS[p.playing_status]] * 3 + [1],
        'skill_color': SKILL_COLORS[int(p.skill - 1)],
        'position_color': POSITION_COLORS[p.position],
        'object': p,
        'position': p.pos_to_str(),
        'name': p.name,
        'age': str(p.age),
        'skill': str(int(p.skill)),
        'value': money_to_str(p.current_value()),
        'salary': money_to_str(p.salary),
        'contract': str(p.contract) if p.contract > 0 else 'X' if p.wants_new_contract else '',
        'extra_info':  _extra_info(p),
        'extra_info_src': _extra_info_src(p),
    }

def generate_player_list_data(widget, players, playing_status = [0, 1, 2], match_minutes = None):
    widget.data = []

    if not playing_status:
        widget.data.extend([player_data(p, match_minutes) for p in players])
    else:
        for ps in playing_status:
            widget.data.extend([player_data(p, match_minutes) for p in players if p.playing_status == ps])

            if ps == 0:
                widget.color_label_background()

def season_points_per_week_to_text(pos):
    if pos == 13:
        return "Avoid relegation."
    elif pos == 11:
        return "Finish mid table."
    elif pos == 9:
        return "Finish on the top half."
    elif pos == 6:
        return "Finish above 6th place."
    elif pos == 3:
        return "Finish on the top 3."
    else:
        return "Be the champion!"

def value01(value, min_v, max_v):
    return value / float(max_v - min_v)

def get_color_red_to_green(value, min_v, max_v):
    green = min(1, 2 * value01(value, min_v, max_v))
    red = min(1, 2 - 2 * value01(value, min_v, max_v))
    blue = 0
    return (red, green, blue, 1)

def color(col = None, a = 1, tint = 0):
    if not col:
        col = 'White'

    col_rgba = rgba(COLORS[col])

    for i, c in enumerate(col_rgba):
        if i == 3:
            col_rgba[3] = a
        else:
            col_rgba[i] = c + (1 - c) * min(max(tint, 0), 1) + c * max(min(tint, 0), -1)

    return col_rgba

def match_team_color(teams, home):
    if home:
        return color(teams[0].color)
    else:
        return color(teams[1].color) if teams[0].color != teams[1].color else color() if teams[0].color != color() else color('Black')

def training_to_int(training):
    if training >= 0.03:
        return "2"
    elif training >= 0.015:
            return "1"
    elif training <= -0.015:
            return "-1"
    elif training <= -0.03:
            return "-2"
    return ""
