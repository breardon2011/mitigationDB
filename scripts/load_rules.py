import requests, json, pathlib, datetime

API = "http://localhost:8000/api/v1/rules/"
rules = json.load(open("starter_rules.json"))          # paste JSON above into this file

for rule in rules:
    resp = requests.post(API, json=rule, timeout=5)
    resp.raise_for_status()
    print(f"Loaded {rule['name']} → id={resp.json()['id']}")
