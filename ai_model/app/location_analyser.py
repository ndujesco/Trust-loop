import json
import re
from datetime import datetime, timedelta, time
from math import radians, cos, sin, asin, sqrt
from collections import defaultdict
from typing import Any, List, Optional, Dict
from .models import TopLocation, AnalysisResult
from .google_maps_client import GoogleMapsClient
from .config import GOOGLE_MAPS_API_KEY


def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # meters
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    )
    return 2 * R * asin(sqrt(a))


POINT_RE = re.compile(r"([-+]?\d+\.\d+)[°º]?\s*,\s*([-+]?\d+\.\d+)")


def parse_point_str(point: str):
    m = POINT_RE.search(point)
    if m:
        return float(m.group(1)), float(m.group(2))
    raise ValueError(f"Invalid point string: {point}")


def parse_iso(dt: str):
    return datetime.fromisoformat(dt.replace("Z", "+00:00"))


def in_night_window(dt: datetime):
    t = dt.time()
    return t >= time(19, 0) or t < time(5, 0)


class LocationAnalyzer:
    def __init__(self, google_maps_api_key: Optional[str] = GOOGLE_MAPS_API_KEY):
        self.gmaps = GoogleMapsClient(google_maps_api_key)

    def analyze(self, timeline_path: str, months: int = 6) -> Dict[str, Any]:
        with open(timeline_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        segments = data.get("semanticSegments") if isinstance(data, dict) else data
        records = []

        for seg in segments:
            start = seg.get("startTime")
            prob = seg.get("visit", {}).get("probability") or seg.get(
                "activity", {}
            ).get("probability")
            prob = float(prob) if prob else 0.0
            latlngs = []

            if seg.get("visit", {}).get("topCandidate", {}).get("placeLocation"):
                loc = seg["visit"]["topCandidate"]["placeLocation"]
                if isinstance(loc, str):
                    latlngs.append(parse_point_str(loc))
                elif isinstance(loc, dict) and loc.get("latLng"):
                    latlngs.append(parse_point_str(loc["latLng"]))

            if "timelinePath" in seg:
                for p in seg["timelinePath"]:
                    if "point" in p:
                        try:
                            latlngs.append(parse_point_str(p["point"]))
                        except Exception:
                            pass

            if start:
                dt = parse_iso(start)
                if in_night_window(dt):
                    for lat, lng in latlngs:
                        records.append((lat, lng, prob, dt))

        if not records:
            raise ValueError("No valid nighttime records found")

        # Check timeline range
        newest = max(r[3] for r in records)
        oldest = min(r[3] for r in records)
        if int((newest - oldest).days) < 60:  # 2 months
            raise ValueError("Insufficient timeline info (less than 2 months old)")

        # Group by month-year
        monthly_groups = defaultdict(list)
        for lat, lng, prob, dt in records:
            key = (dt.year, dt.month)
            monthly_groups[key].append((lat, lng, prob, dt))

        now = datetime.utcnow()
        results_by_month = {}
        top_addresses = []

        # Evaluate last N months
        for i in range(months):
            month_date = now - timedelta(days=30 * i)
            key = (month_date.year, month_date.month)
            if key not in monthly_groups:
                continue

            month_records = monthly_groups[key]
            buckets = defaultdict(list)
            for lat, lng, prob, dt in month_records:
                bucket_key = (round(lat, 4), round(lng, 4))
                buckets[bucket_key].append((prob, dt))

            if not buckets:
                continue

            # Sort by visit count
            top_key, vals = sorted(
                buckets.items(), key=lambda kv: len(kv[1]), reverse=True
            )[0]
            lat, lng = top_key
            probs = [v[0] for v in vals]
            dts = [v[1] for v in vals]

            top_loc = TopLocation(
                lat=lat,
                lng=lng,
                count=len(vals),
                avg_probability=sum(probs) / len(probs),
                first_seen=min(dts),
                last_seen=max(dts),
            )

            rev = self.gmaps.reverse_geocode(lat, lng)
            if rev:
                top_loc.address = rev.get("formatted_address")

            results_by_month[f"{month_date.strftime('%B %Y')}"] = top_loc
            top_addresses.append((top_loc.address, len(vals)))

        # Compute confidence score: frequency of the most recurring address
        address_counts = defaultdict(int)
        for addr, _ in top_addresses:
            if addr:
                address_counts[addr] += 1

        if address_counts:
            top_confidence_address, freq = max(
                address_counts.items(), key=lambda kv: kv[1]
            )
            confidence_score = round(freq / months, 2)
        else:
            top_confidence_address, confidence_score = None, 0.0

        return AnalysisResult(
            timeline_months=list(results_by_month.keys()),
            monthly_top_locations={m: results_by_month[m] for m in results_by_month},
            most_likely_home=(
                TopLocation(
                    lat=rev["lat"] if rev else None,
                    lng=rev["lng"] if rev else None,
                    address=top_confidence_address,
                    count=address_counts[top_confidence_address],
                    avg_probability=0.0,  # not applicable
                    first_seen=None,
                    last_seen=None,
                )
                if top_confidence_address
                else None
            ),
            confidence_score=confidence_score,
        )
