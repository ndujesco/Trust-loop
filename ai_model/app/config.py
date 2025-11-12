import os
from dotenv import load_dotenv

load_dotenv()

LUXAND_API_KEY = os.getenv("LUXAND_API_KEY")
LUXAND_API_URL = os.getenv("LUXAND_API_URL")


S3_REGION = os.getenv("S3_REGION", "")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    
    