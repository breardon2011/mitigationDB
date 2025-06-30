import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_ember_vulnerable_vents_match_string_false():
    """Should match Ember-vulnerable vents when attic_vent_has_screens is 'False'."""
    resp = client.post("/api/v1/evaluate", json={
        "attic_vent_has_screens": "False",
        "roof_type": "Class A",
        "wildfire_risk_category": "A",
        "Window Type": "Double",
        "vegetation": [{"Type": "Tree", "distance_to_window": 100}]
    })
    data = resp.json()
    assert resp.status_code == 200
    assert any("Ember-vulnerable vents" in v["name"] for v in data["vulnerabilities"])

def test_ember_vulnerable_vents_match_boolean_false():
    """Should match Ember-vulnerable vents when attic_vent_has_screens is False."""
    resp = client.post("/api/v1/evaluate", json={
        "attic_vent_has_screens": "False",
        "roof_type": "Class A",
        "wildfire_risk_category": "A",
        "Window Type": "Double",
        "vegetation": [{"Type": "Tree", "distance_to_window": 100}]
    })
    data = resp.json()
    assert resp.status_code == 200
    assert any("Ember-vulnerable vents" in v["name"] for v in data["vulnerabilities"])

def test_ember_vulnerable_vents_no_match():
    """Should NOT match Ember-vulnerable vents when attic_vent_has_screens is 'True'."""
    resp = client.post("/api/v1/evaluate", json={
        "attic_vent_has_screens": "True",
        "roof_type": "Class A",
        "wildfire_risk_category": "A",
        "Window Type": "Double",
        "vegetation": [{"Type": "Tree", "distance_to_window": 100}]
    })
    data = resp.json()
    assert resp.status_code == 200
    assert all("Ember-vulnerable vents" not in v["name"] for v in data["vulnerabilities"])

def test_non_class_a_roof_match():
    """Should match Non-Class-A roof in risk zone for Class B roof and risk C."""
    resp = client.post("/api/v1/evaluate", json={
        "attic_vent_has_screens": "True",
        "roof_type": "Class B",
        "wildfire_risk_category": "C",
        "Window Type": "Double",
        "vegetation": [{"Type": "Tree", "distance_to_window": 100}]
    })
    data = resp.json()
    assert resp.status_code == 200
    assert any("Non-Class-A roof in risk zone" in v["name"] for v in data["vulnerabilities"])

def test_non_class_a_roof_no_match():
    """Should NOT match Non-Class-A roof in risk zone for Class A roof and risk A."""
    resp = client.post("/api/v1/evaluate", json={
        "attic_vent_has_screens": "True",
        "roof_type": "Class A",
        "wildfire_risk_category": "A",
        "Window Type": "Double",
        "vegetation": [{"Type": "Tree", "distance_to_window": 100}]
    })
    data = resp.json()
    assert resp.status_code == 200
    assert all("Non-Class-A roof in risk zone" not in v["name"] for v in data["vulnerabilities"])

def test_window_heat_exposure_match():
    """Should match Window heat exposure for distance_to_window = 90."""
    resp = client.post("/api/v1/evaluate", json={
        "attic_vent_has_screens": "True",
        "roof_type": "Class A",
        "wildfire_risk_category": "A",
        "Window Type": "Double",
        "vegetation": [
            {
                "Type": "Tree",
                "distance_to_window": 90
            }
        ]
    })
    data = resp.json()
    assert resp.status_code == 200
    assert any("Window heat exposure" in v["name"] for v in data["vulnerabilities"])

def test_window_heat_exposure_no_match():
    """Should NOT match Window heat exposure for distance_to_window = 10 (too close)."""
    resp = client.post("/api/v1/evaluate", json={
        "attic_vent_has_screens": "True",
        "roof_type": "Class A",
        "wildfire_risk_category": "A",
        "Window Type": "Double",
        "vegetation": [{"Type": "Tree", "distance_to_window": 10}]
    })
    data = resp.json()
    assert resp.status_code == 200
    assert all("Window heat exposure" not in v["name"] for v in data["vulnerabilities"])

def test_window_heat_exposure_no_match_far_vegetation():
    """Should NOT match Window heat exposure when vegetation is very far away (500+ feet)."""
    resp = client.post("/api/v1/evaluate", json={
        "attic_vent_has_screens": "True",
        "roof_type": "Class A",
        "wildfire_risk_category": "A",
        "Window Type": "Double",
        "vegetation": [
            {
                "Type": "Tree",
                "distance_to_window": 500  # Very far away - should be safe
            }
        ]
    })
    data = resp.json()
    assert resp.status_code == 200
    assert all("Window heat exposure" not in v["name"] for v in data["vulnerabilities"])

def test_multiple_matches():
    """Should match multiple rules when all conditions are met."""
    resp = client.post("/api/v1/evaluate", json={
        "attic_vent_has_screens": "False",
        "roof_type": "Class B",
        "wildfire_risk_category": "C",
        "Window Type": "Double",
        "vegetation": [{"Type": "Tree", "distance_to_window": 40}]
    })
    data = resp.json()
    assert resp.status_code == 200
    assert data["matched"] >= 2

def test_no_matches():
    """Should match no rules when all conditions are safe."""
    resp = client.post("/api/v1/evaluate", json={
        "attic_vent_has_screens": "True",
        "roof_type": "Class A",
        "wildfire_risk_category": "A",
        "Window Type": "Double",
        "vegetation": [
            {
                "Type": "Tree",
                "distance_to_window": 20
            }
        ]
    })
    data = resp.json()
    assert resp.status_code == 200
    assert data["matched"] == 0

def test_missing_required_field():
    """Should return 422 when required field is missing."""
    resp = client.post("/api/v1/evaluate", json={
        # Missing "Window Type"
        "attic_vent_has_screens": "True",
        "roof_type": "Class A",
        "wildfire_risk_category": "A",
        "vegetation": [{"Type": "Tree", "distance_to_window": 100}]
    })
    assert resp.status_code == 422