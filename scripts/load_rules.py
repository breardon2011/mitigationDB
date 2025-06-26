#!/usr/bin/env python
"""
Loads / upserts starter rules from starter_rules.json (or .yaml).
Run manually or from an init script.
"""
import json, yaml, pathlib, sys, os
from datetime import datetime
from sqlmodel import Session, SQLModel, select
from models import Rule
from db import engine

ROOT = pathlib.Path(__file__).resolve().parent.parent
RULES_FILE = next((ROOT / p for p in ("starter_rules.yaml", "starter_rules.json") if (ROOT / p).exists()), None)

def _parse_rules(path: pathlib.Path) -> list[dict]:
    if path.suffix == ".yaml":
        return yaml.safe_load(path.read_text())
    return json.loads(path.read_text())

def upsert_rule(sess: Session, data: dict) -> None:
    stmt = select(Rule).where(Rule.name == data["name"])
    rule = sess.exec(stmt).first()

    # helper: coerce date strings → datetime objects
    for k in ("effective_date", "retired_date"):
        if isinstance(data.get(k), str):
            data[k] = datetime.fromisoformat(data[k].replace("Z", "+00:00"))

    if rule:
        # cheap “did it change?” heuristic – compare JSON dumps
        changed = (
            json.dumps(rule.logic, sort_keys=True) != json.dumps(data["logic"], sort_keys=True)
            or rule.params != data["params"]
            or rule.explanation != data["explanation"]
        )
        if changed:
            for k, v in data.items():
                setattr(rule, k, v)
            rule.updated_at = datetime.utcnow()
    else:
        sess.add(Rule(**data))

def main() -> None:
    if not RULES_FILE:
        sys.exit("❌  starter_rules.(json|yaml) not found in project root")

    rules_data = _parse_rules(RULES_FILE)
    SQLModel.metadata.create_all(engine)

    with Session(engine) as sess:
        for rd in rules_data:
            upsert_rule(sess, rd)
        sess.commit()

    print(f"✅  {len(rules_data)} rule rows inserted / updated")

if __name__ == "__main__":
    main()
