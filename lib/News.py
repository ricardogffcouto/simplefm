# coding: latin1
from . import sfm_glob
from . import helpers

class NewsList(object):
    def str_list(self):
        strings = [
            {
                'category': "Training +",
                'string': "{} trained well."
            },
            {
                'category': "Training ++",
                'string': "{} trained very well!"
            },
            {
                'category': "Training -",
                'string': "{} trained badly."
            },
            {
                'category': "Training --",
                'string': "{} trained very badly."
            },
            {
                'category': "Skill +",
                'string': "{} improved skill!"
            },
            {
                'category': "Skill -",
                'string': "{} decreased skill."
            },
            {
                'category': "New contract",
                'string': "{} demands a new contract!"
            },
            {
                'category': "Fans",
                'string': "Your fans {} your team's performance."
            },
            {
                'category': "Juniors",
                'string': '{} were promoted from your youth academy.'
            },
            {
                'category': "Forced sold player",
                'string': '{} was sold by the board to balance your finances.'
            },
            {
                'category': "Retired",
                'string': '{} has retired from playing football.'
            },
            {
                'category': "Tired",
                'string': '{} is tired and needs 1 game to rest.'
            }
        ]

        fan_strings = [
            'disliked', 'liked'
        ]

        categories = [
            "New contract", "Fans", "Training ++", "Training +", "Training -", "Training --", "Skill +", "Skill -", "Retired", "Juniors", "Forced sold player", "Tired"
        ]

        news_strings = []

        for category in categories:
            s = ''
            news = [x for x in self.news if x.category == category]
            if news:
                if category != 'Fans':
                    for i, n in enumerate(news):
                        if s != '':
                            if i + 1 < len(news):
                                s += ', '
                            else:
                                s += ' and '
                        s += n.data
                else:
                    if news[0].data <= -0.5:
                        s = fan_strings[0]
                    elif news[0].data >= 0.5:
                        s = fan_strings[1]

            if s != '':
                string_list = [x for x in strings if x['category'] == category]
                news_strings.append(string_list[0]['string'].format(s))

        return news_strings

    def __init__(self, news = None):
        if news is None:
            news = []
        self.news = news

class News(object):
    def __init__(self, category, data):
        self.category = category
        self.data = data