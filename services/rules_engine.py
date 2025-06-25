from __future__ import annotations
from typing import Any, Iterable
from functools import reduce
import operator
import re

# ------------------------------------------------------------------
# public API
# ------------------------------------------------------------------


def evaluate(
    observation: dict[str, Any], rules: Iterable[dict[str, Any]]
) -> list[dict[str, Any]]:
    """
    Returns a list like:
    [
        {
            "vulnerability": "...",
            "category": "...",
            "matched_rule_id": 7,
            "mitigations": { "full": [...], "bridge": [...] }
        },
        ...
    ]
    """
    results: list[dict[str, Any]] = []

    for rule_row in rules:
        rule = rule_row["body_json"]
        if _conditions_pass(rule["conditions"], observation):
            results.append(
                {
                    "vulnerability": rule["vulnerability"],
                    "category": rule.get("category"),
                    "matched_rule_id": rule_row["id"],
                    "mitigations": rule.get("mitigations", {}),
                }
            )

    return results


# ------------------------------------------------------------------
# internals
# ------------------------------------------------------------------


_WILDCARD = re.compile(r"\[\*\]")

_OPS = {
    "==": operator.eq,
    "!=": operator.ne,
    "<": operator.lt,
    "<=": operator.le,
    ">": operator.gt,
    ">=": operator.ge,
    "in": lambda a, b: a in b,
    "not_in": lambda a, b: a not in b,
    "exists": lambda a, _: a is not None,
}


def _conditions_pass(conds: list[dict[str, Any]], obs: dict[str, Any]) -> bool:
    for cond in conds:
        fact_path = cond["fact"]
        op = cond["operator"]
        expected = cond.get("value")

        values = _extract_values(obs, fact_path)

        if not values:
            return False  # path missing

        if op == "exists":
            # exists is satisfied if ANY path resolved
            continue

        op_fn = _OPS[op]

        # For wildcard paths we check ANY value; for scalar path we still get a list.
        if not any(op_fn(v, expected) for v in values):
            return False

    return True


def _extract_values(obj: Any, dotted_path: str) -> list[Any]:
    """
    Supports dotted access and [*] wildcard for arrays.

    ex:
        vegetation[*].distance_to_window
    """
    parts = dotted_path.split(".")
    current_level = [obj]  # start with root wrapped in list

    for part in parts:
        next_level: list[Any] = []

        wildcard = _WILDCARD.search(part) is not None
        key = _WILDCARD.sub("", part)

        for item in current_level:
            if isinstance(item, list):
                iterable = item
            else:
                iterable = [item]

            for element in iterable:
                if isinstance(element, dict) and key in element:
                    val = element[key]
                    if wildcard and isinstance(val, list):
                        next_level.extend(val)
                    else:
                        next_level.append(val)

        current_level = next_level

    return current_level
