"""Base helpers shared across screens."""

from __future__ import annotations

from typing import TYPE_CHECKING

from textual.screen import Screen

if TYPE_CHECKING:  # pragma: no cover - typing helper
    from ..app import SimpleFMTUI


class StateScreen(Screen):
    """Screen with a strongly typed reference to the application."""

    @property
    def app(self) -> "SimpleFMTUI":  # type: ignore[override]
        return super().app  # type: ignore[return-value]

