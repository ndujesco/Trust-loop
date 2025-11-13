from fastapi import (
    FastAPI,
    HTTPException,
    WebSocket,
    WebSocketDisconnect
)
from tempfile import NamedTemporaryFile
from fastapi.middleware.cors import CORSMiddleware
from app.bill_extractor import extract_address_from_pdf
from app.google_maps_client import GoogleMapsClient
from app.location_analyser import LocationAnalyzer, haversine
from app.config import MAX_HOME_DISTANCE_METERS
import os
import base64
import cv2
import numpy as np
from app.liveness_checker import SequentialLiveness, LivenessStage
from app.models import (
    ProofOfAddressResponse,
    ProofOfAddressRequest,
    UtilityAddress,
    AnalysisResult
)
from app.s3_client import download_s3_file

app = FastAPI(title="Proof of Address API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def hello():
    return {"message": "Hello From Team Trust Loop"}


@app.post("/api/proof-of-address")
async def proof_of_address(request_data: ProofOfAddressRequest):
    # Download Files from S3 to /tmp ---
    # Serverless functions have a writable /tmp directory.
    # We use NamedTemporaryFile to get unique names and proper cleanup.

    bill_extension = os.path.splitext(request_data.bill_url)[1] or ".pdf"

    with NamedTemporaryFile(
        delete=False, suffix=bill_extension, dir="/tmp"
    ) as bill_tmp, NamedTemporaryFile(
        delete=False, suffix=".json", dir="/tmp"
    ) as timeline_tmp:

        bill_path = bill_tmp.name
        timeline_path = timeline_tmp.name

        # Download files from S3
        download_s3_file(request_data.bill_url, bill_path)
        download_s3_file(request_data.timeline_url, timeline_path)

    
    address_text = extract_address_from_pdf(bill_path)
    print(f"Extracted address: {address_text}")

    gmaps = GoogleMapsClient()
    geo_info = gmaps.geocode(address_text)
    if not geo_info:
        raise HTTPException(
            status_code=400, detail="Unable to geocode address from utility bill"
        )

    utility = UtilityAddress(
        address_text=address_text,
        lat=geo_info["lat"],
        lng=geo_info["lng"],
        formatted_address=geo_info["formatted_address"],
        place_id=geo_info["place_id"],
    )
    
    

    
    analyzer = LocationAnalyzer()
    try:
        analysis_result: AnalysisResult = analyzer.analyze(timeline_path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

    
    for month, loc in analysis_result.monthly_top_locations.items():
        if loc.lat and loc.lng:
            loc.distance_to_bill_meters = round(
                haversine(loc.lat, loc.lng, utility.lat, utility.lng), 2
            )

    if (
        analysis_result.most_likely_home
        and analysis_result.most_likely_home.lat
        and analysis_result.most_likely_home.lng
    ):
        analysis_result.most_likely_home.distance_to_bill_meters = round(
            haversine(
                analysis_result.most_likely_home.lat,
                analysis_result.most_likely_home.lng,
                utility.lat,
                utility.lng,
            ),
            2,
        )

    
    confidence = 0.0
    if analysis_result.most_likely_home:
        dist = analysis_result.most_likely_home.distance_to_bill_meters
        if dist is not None:
            if dist <= MAX_HOME_DISTANCE_METERS:
                confidence = 1 - (dist / MAX_HOME_DISTANCE_METERS)
            else:
                confidence = 0.0
        analysis_result.confidence_score = round(confidence, 2)

    
    final = ProofOfAddressResponse(
        utility_address=utility,
        timeline_months=analysis_result.timeline_months,
        monthly_top_locations=analysis_result.monthly_top_locations,
        most_likely_home=analysis_result.most_likely_home,
        top_locations=list(analysis_result.monthly_top_locations.values()),
        confidence_score=analysis_result.confidence_score,
    )
    return final.model_dump()


# -------------------------------
# WEBSOCKET STREAM ENDPOINT
# -------------------------------
@app.websocket("/ws/liveness")
async def liveness_ws(websocket: WebSocket):
    await websocket.accept()
    liveness = SequentialLiveness()

    try:
        while True:
            data = await websocket.receive_json()
            frame_b64 = data.get("frame")
            if not frame_b64:
                continue

            # Decode base64 frame
            frame_bytes = base64.b64decode(frame_b64.split(",")[1])
            np_arr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            # Process frame
            action_completed = liveness.process_frame(frame)

            # Send stage update
            if liveness.stage == LivenessStage.DONE:
                await websocket.send_json(
                    {
                        "stage": liveness.stage,
                        "success": True,
                        "message": "Liveness check passed!",
                    }
                )
                break  # Exit the loop

            # If not done, send the normal stage update
            await websocket.send_json(
                {"stage": liveness.stage, "action_completed": action_completed}
            )

    except WebSocketDisconnect:
        print("Client disconnected")
