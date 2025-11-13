import os
import re
from google.api_core.client_options import ClientOptions
from google.cloud import documentai
from typing import Optional, Tuple
from dotenv import load_dotenv

load_dotenv()


PROJECT_ID = os.environ.get("GCP_PROJECT_ID")
LOCATION = os.environ.get("DOC_AI_LOCATION", "us")
PROCESSOR_ID = os.environ.get("DOC_AI_OCR_PROCESSOR_ID")

# --- Helper Function to Extract Address from Raw Text ---


def extract_address_from_text(full_text: str) -> str:
    """
    Extracts the most likely user/service address from a block of text
    by prioritizing lines near service-related keywords or personal details.

    This version includes logic to find addresses near the customer's name
    or the dedicated 'Address:' label, which is common on bills.
    """
    if not full_text:
        return "Extraction failed: No text provided."

    # Standardize the text: replace multiple newlines with a single newline for block processing.
    normalized_text = re.sub(r"\n{2,}", "\n", full_text).strip()

    # Keywords that strongly indicate the customer's address context
    # Prioritizing: Service Address, Bill To, Customer Name/Address labels
    PRIORITY_KEYWORDS = r"(?:SERVICE ADDRESS|BILLING ADDRESS|ACCOUNT ADDRESS|SERVICE LOCATION|CUSTOMER|MRS|MR|MS|NAME|ADDRESS:)"

    # Keywords that confirm a line is a street address
    ADDRESS_SUFFIXES = r"\b(?:street|road|avenue|close|estate|lane|way|crescent|lg|area|plot|phase|blvd|drive|flat|suite|apt)\b"

    # --- Strategy 1: Find lines immediately following high-priority keywords ---

    # Look for a priority keyword, followed by up to 5 lines of address text,
    # ending before a major blank line or the end of the string.
    address_block_match = re.search(
        rf"({PRIORITY_KEYWORDS}.*?\n)(.*?)(?:\n\s*\n|\Z)",  # Capture keyword block and next text block
        normalized_text,
        re.I | re.DOTALL,
    )

    if address_block_match:
        # The content immediately following the keyword is the best bet.
        candidate_block = address_block_match.group(2).strip()
        candidate_lines = candidate_block.splitlines()

        # Filter this block to select lines that contain clear address suffixes
        final_candidates = []
        for line in candidate_lines:
            # We check for a suffix OR if the line contains a high amount of non-numeric/non-symbolic text (likely name/locality)
            if (
                re.search(ADDRESS_SUFFIXES, line, re.I)
                or len(re.sub(r"[^a-zA-Z\s]", "", line.strip())) > 10
            ):
                final_candidates.append(line.strip())

        if final_candidates:
            # Join the first few relevant lines to form the complete address
            return " ".join(
                final_candidates[:3]
            ).strip()  # Limit to 3 lines for a typical address

    # --- Strategy 2: Fallback to the original "Longest Line with Suffix" heuristic ---

    lines = normalized_text.splitlines()
    # Filter for lines containing street/location suffixes
    address_candidates = [
        l.strip() for l in lines if re.search(ADDRESS_SUFFIXES, l, re.I)
    ]

    if address_candidates:
        # Choose the longest candidate, assuming longer means more complete address.
        # This is the original logic and acts as a good, general fallback.
        address = max(address_candidates, key=len)
        return re.sub(r"\s+", " ", address).strip()

    # --- Final Fallback ---
    return "Extraction failed: No service address or clear address line found."


# --- Core Document AI Function ---


def get_mime_type_from_path(file_path: str) -> str:
    """Dynamically determines a basic MIME type based on the file extension."""
    if file_path.lower().endswith(".pdf"):
        return "application/pdf"
    elif file_path.lower().endswith((".jpg", ".jpeg")):
        return "image/jpeg"
    elif file_path.lower().endswith((".png")):
        return "image/png"
    # Default to PDF as it's the most common document type for bills
    return "application/pdf"


def extract_address_from_pdf(file_path: str) -> str:
    """
    Processes a document using the Document AI OCR Processor to get the full text,
    and then extracts a likely address using regex.
    """
    if not all([PROJECT_ID, PROCESSOR_ID]):
        print("Configuration Error: GCP_PROJECT_ID or DOC_AI_OCR_PROCESSOR_ID not set.")
        return "Extraction failed: Missing GCP configuration."

    mime_type = get_mime_type_from_path(file_path)

    try:
        # 1. Document AI: OCR Processing
        opts = ClientOptions(api_endpoint=f"{LOCATION}-documentai.googleapis.com")
        documentai_client = documentai.DocumentProcessorServiceClient()
        resource_name = documentai_client.processor_path(
            PROJECT_ID, LOCATION, PROCESSOR_ID
        )

        with open(file_path, "rb") as image:
            image_content = image.read()

        raw_document = documentai.RawDocument(
            content=image_content, mime_type=mime_type
        )
        request = documentai.ProcessRequest(
            name=resource_name, raw_document=raw_document
        )

        result = documentai_client.process_document(request=request)
        full_text = result.document.text

        # 2. Address Extraction: Apply heuristic regex on the extracted text
        return extract_address_from_text(full_text)

    except Exception as e:
        print(f"An error occurred during document processing: {e}")
        # Return a fallback string that indicates failure
        return "Extraction failed: Document AI API error."
