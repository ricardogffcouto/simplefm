# coding: latin1
import random

def median(lst):
    sortedLst = sorted(lst)
    lstLen = len(lst)
    index = (lstLen - 1) // 2

    if (lstLen % 2):
        return sortedLst[index]
    else:
        return (sortedLst[index] + sortedLst[index + 1]) / 2.0

def level_range(minimum, maximum, total, level):
    step = (maximum - minimum) / float(total)
    min_range = minimum + step * (level - 1)
    max_range = minimum + step * level
    return (min_range, max_range)


def split_list(a_list):
    half = len(a_list) / 2
    return a_list[:half], a_list[half:]


def balance(a, b):
    return (((a - b) / float(a + b)) + 1) * 0.5

def min_max(value, min_v, max_v):
    return min(max(value, min_v), max_v)

def weighted_choice(choices):
    total = sum(w for c, w in choices)
    r = random.uniform(0, total)
    upto = 0
    for c, w in choices:
        if upto + w >= r:
            return c
        upto += w

def normalize(value, minimum, maximum):
    value = min(max(value, minimum), maximum)
    return (value - minimum) / float(maximum - minimum)


def normalize_list(li):
    norm = [float(i) / sum(li) for i in li]
    return norm

def int_to_money(number):
    for p in range(7, 2, -1):
        if number >= pow(10, p):
            return number - number % pow(10, p - 1)
    return pow(10, 3)

def str_to_tactic(tactic):
    if tactic != 'Top skill':
        tac = tactic.split("-")
        return [int(tac[0]), int(tac[1]), int(tac[2])]
    return 'Top skill'

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


def value01(value, min_v, max_v):
    return value / float(max_v - min_v)