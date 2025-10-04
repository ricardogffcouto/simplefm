"""Terminal user interface for Simple Football Manager.

This package exposes a rich Textual-based interface that mirrors the
functionality of the original Kivy GUI while embracing a retro inspired
terminal presentation.  The public entry point is :mod:`tui.app`.
"""

from __future__ import annotations

__all__ = ["SimpleFMTUI"]

from .app import SimpleFMTUI

