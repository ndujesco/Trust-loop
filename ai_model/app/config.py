import os
from dotenv import load_dotenv

load_dotenv()

LUXAND_API_KEY = os.getenv("LUXAND_API_KEY")
LUXAND_API_URL = os.getenv("LUXAND_API_URL")


S3_REGION = os.getenv("S3_REGION", "")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
TOP_K = int(os.getenv("TOP_K", 5))
NIGHT_WINDOW = os.getenv("NIGHT_WINDOW", "19:00-05:00")
MAX_HOME_DISTANCE_METERS = float(os.getenv("MAX_HOME_DISTANCE_METERS", 1000))
    
    