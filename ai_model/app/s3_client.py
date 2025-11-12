import boto3
from urllib.parse import urlparse, unquote_plus

from fastapi import HTTPException
from app.config import (
    S3_BUCKET_NAME,
    S3_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
)

s3_client = boto3.client(
    "s3",
    region_name=S3_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

def download_s3_file(s3_url: str, local_path: str):
    """
    Downloads a file from S3 using its full URL by robustly extracting 
    the bucket name and object key and correctly handling URL encoding.
    
    Args:
        s3_url (str): The full S3 URL (e.g., https://bucket.s3.region.amazonaws.com/key).
        local_path (str): The path to save the file locally.
    """
    
    extracted_bucket_name = None
    extracted_object_key = None

    try:
        parsed_url = urlparse(s3_url)
       
        path = unquote_plus(parsed_url.path).lstrip("/") 

        # --- Extraction Logic ---
        if '.s3.' in parsed_url.netloc:
            extracted_bucket_name = parsed_url.netloc.split('.s3.')[0]
            extracted_object_key = path

        elif path and '/' in path:
            path_parts = path.split('/', 1)
            extracted_bucket_name = path_parts[0]
            extracted_object_key = path_parts[1]
        
        # If the URL is non-standard, use the configured bucket name as a last resort
        if not extracted_bucket_name and S3_BUCKET_NAME:
            extracted_bucket_name = S3_BUCKET_NAME
            extracted_object_key = path


        if not extracted_bucket_name or not extracted_object_key:
             raise ValueError(f"Could not parse valid S3 bucket and key from URL: {s3_url}")

        # --- Download ---

        print(f"Downloading s3://{extracted_bucket_name}/{extracted_object_key} to {local_path}")

        s3_client.download_file(extracted_bucket_name, extracted_object_key, local_path)
        
        print("Download successful.")

    except Exception as e:
        print(f"S3 Download Error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to download file from S3: {str(e)}"
        )



