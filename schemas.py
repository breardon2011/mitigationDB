from pydantic import BaseModel, Field
from typing import Literal, List, Dict, Any
from typing import Optional
from datetime import datetime

class VegetationEntry(BaseModel):
    type: Literal["Tree", "Shrub", "Grass"] = Field(..., alias="Type")
    distance_to_window: float = Field(..., alias="Distance to Window")

    model_config = {
        "populate_by_name": True,
        "from_attributes": True
    }


class ObservationInput(BaseModel):
    attic_vent_has_screens: Literal["True", "False"] = Field(..., alias="Attic Vent has Screens")
    roof_type: Literal["Class A", "Class B", "Class C"] = Field(..., alias="Roof Type")
    window_type: Literal["Single", "Double", "Tempered Glass"] = Field(..., alias="Window Type")
    wildfire_risk_category: Literal["A", "B", "C", "D"] = Field(..., alias="Wildfire Risk Category")
    vegetation: List[VegetationEntry] = Field(..., alias="Vegetation")

    model_config = {
        "populate_by_name": True,
        "from_attributes": True
    }



class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    body_json: dict
    effective_date: datetime
    retired_date: Optional[datetime] = None


class RuleRead(RuleCreate):
    id: int
    created_at: datetime
    updated_at: datetime


class RuleUpdate(BaseModel):
    # all fields optional for PATCH-style update
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    body_json: Optional[Dict[str, Any]] = None
    effective_date: Optional[datetime] = None
    retired_date: Optional[datetime] = None