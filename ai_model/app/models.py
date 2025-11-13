from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, List, Optional


class UtilityAddress(BaseModel):
    address_text: str
    lat: float
    lng: float
    formatted_address: Optional[str] = None
    place_id: Optional[str] = None


class TopLocation(BaseModel):
    lat: float
    lng: float
    count: int
    avg_probability: float
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    place_name: Optional[str] = None
    address: Optional[str] = None
    distance_to_bill_meters: Optional[float] = None


class ProofOfAddressResponse(BaseModel):
    utility_address: UtilityAddress
    timeline_months: List[str]
    monthly_top_locations: Dict[str, TopLocation]
    most_likely_home: Optional[TopLocation]
    top_locations: List[TopLocation]
    confidence_score: float


class ProofOfAddressRequest(BaseModel):
    bill_url: str = Field(..., description="S3 URL for the utility bill file (PDF)")
    timeline_url: str = Field(..., description="S3 URL for the timeline file (JSON)")

class LivenessCheckRequest(BaseModel):
    photo_url: str = Field(..., description="S3 URL for the photo file.")

class MonthlyTopLocation(BaseModel):
    month: str
    location: Optional["TopLocation"]


class AnalysisResult(BaseModel):
    timeline_months: List[str]
    monthly_top_locations: Dict[str, TopLocation]
    most_likely_home: Optional[TopLocation]
    confidence_score: float
