import requests
from .config import GOOGLE_MAPS_API_KEY

class GoogleMapsClient:
    def __init__(self, api_key: str = GOOGLE_MAPS_API_KEY):
        self.api_key = api_key
        self.reverse_geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"

    def geocode(self, address: str):
        params = {"address": address, "key": self.api_key}
        res = requests.get(self.reverse_geocode_url, params=params, timeout=10)
        res.raise_for_status()
        data = res.json()
        if not data["results"]:
            return None
        result = data["results"][0]
        location = result["geometry"]["location"]
        return {
            "lat": location["lat"],
            "lng": location["lng"],
            "formatted_address": result["formatted_address"],
            "place_id": result.get("place_id"),
        }

    def reverse_geocode(self, lat: float, lng: float):
        params = {"latlng": f"{lat},{lng}", "key": self.api_key}
        res = requests.get(self.reverse_geocode_url, params=params, timeout=10)
        res.raise_for_status()
        data = res.json()
        if not data["results"]:
            return None
        result = data["results"][0]
        return {
            "formatted_address": result["formatted_address"],
            "place_id": result.get("place_id"),
            "lng": lng,
            "lat": lat
        }
