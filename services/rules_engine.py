"""
services/rules_engine.py  –  JSON-Logic-qubit edition
----------------------------------------------------

Evaluates every Rule row against one observation dict and
returns the list of rules that hit.
"""

from __future__ import annotations

from typing import Any, Dict, List

from json_logic import jsonLogic        # ← comes from json-logic-qubit
from models import Rule


def evaluate_rules(
    observation: Dict[str, Any],
    rules: List[Rule],
) -> List[Rule]:
    """
    Evaluate *rules* against a single *observation*.

    Parameters
    ----------
    observation
        The payload received from the client (already validated /
        converted to a plain dict by your Pydantic schema).

    rules
        The Rule rows you fetched from the database.

    Returns
    -------
    list[Rule]
        Only the rules whose logic evaluated to *truthy*.
    """
    ctx_base = observation               # shortcut / keep original reference
    hits: List[Rule] = []

    for rule in rules:
        context = {**ctx_base, "params": rule.params}  # merge params once

        try:
            if bool(jsonLogic(rule.logic, context)):
                hits.append(rule)
        except Exception as exc:
            # Bad rule?  Log and skip; never crash the request handler.
            # (replace `print` with your logger of choice)
            print(f"[rules_engine] '{rule.name}' raised {exc!r} – skipped")

    return hits
