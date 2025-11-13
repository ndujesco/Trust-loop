from geopy.distance import geodesic

def distance_meters(coord1, coord2):
    """Returns the distance between two lat/lng pairs in meters"""
    return geodesic(coord1, coord2).meters
