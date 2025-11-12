from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, List, Optional


class LivenessCheckRequest(BaseModel):
    photo_url: str = Field(..., description="S3 URL for the photo file.")