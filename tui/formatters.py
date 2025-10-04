"""Utility formatting helpers for the SimpleFM terminal UI."""

from __future__ import annotations

from typing import Iterable, Sequence


def money_to_str(number: float) -> str:
    """Return a compact string for a monetary value.

    The original Kivy implementation shows numbers in thousands (``k``)
    and millions (``M``).  We port the same formatting rules here so the
    TUI matches the expectations from the classic interface.
    """

    if number == 0:
        sign = 1
    else:
        sign = int(number / abs(number))

    number = int(round(abs(number), 1))
    thousands = number / 1000

    if thousands >= 1:
        if thousands >= 10:
            if thousands >= 1000:
                if thousands >= 10000:
                    return f"{int(round(sign * thousands / 1000.0, 1))}M"
                return f"{round(sign * thousands / 1000.0, 1)}M"
            return f"{int(round(sign * thousands, 0))}k"
        return f"{int(round(sign * number / 1000, 0))}k"
    return f"{int(round(sign * number, 0))}"


def tactic_to_str(tactic: Sequence[int]) -> str:
    """Represent a tactic array (e.g. ``[4, 4, 2]``) as ``"4-4-2"``."""

    return "-".join(str(part) for part in tactic)


def table_position_to_str(number: int) -> str:
    """Return the ordinal representation used throughout the UI."""

    suffix = "th"
    if number % 100 not in {11, 12, 13}:
        if number % 10 == 1:
            suffix = "st"
        elif number % 10 == 2:
            suffix = "nd"
        elif number % 10 == 3:
            suffix = "rd"
    return f"{number}{suffix}"


def training_to_str(training: float) -> str:
    """Translate a raw training delta into the symbolic arrows."""

    if training >= 0.03:
        return "++"
    if training >= 0.015:
        return "+"
    if training <= -0.03:
        return "--"
    if training <= -0.015:
        return "-"
    return ""


def join_names(items: Iterable[str]) -> str:
    """Join a series of names using commas and ``and`` like the popups."""

    names = list(items)
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    return ", ".join(names[:-1]) + f" and {names[-1]}"

