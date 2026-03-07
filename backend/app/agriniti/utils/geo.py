import math

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees) in kilometers.
    """
    # Convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])

    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371 # Radius of earth in kilometers
    return c * r

# Simple Mock Geocoder for Indian Districts
# In a real app, this would use Google Maps API or a local DB of all pincodes/districts.
DISTRICT_COORDS = {
    "nashik": (20.0110, 73.7903),
    "pune": (18.5204, 73.8567),
    "mumbai": (19.0760, 72.8777),
    "delhi": (28.7041, 77.1025),
    "bikaner": (28.0229, 73.3119),
    "jaipur": (26.9124, 75.7873),
    "ludhiana": (30.9010, 75.8573),
    "ooty": (11.4102, 76.6950),
    "chennai": (13.0827, 80.2707),
    "bangalore": (12.9716, 77.5946),
    # Add more as needed for testing
}

def get_coords(district: str | None) -> tuple[float, float] | None:
    if not district:
        return None
    return DISTRICT_COORDS.get(district.lower().strip())
