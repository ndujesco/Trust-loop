from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from tempfile import NamedTemporaryFile
from fastapi.middleware.cors import CORSMiddleware
import os
import base64
import cv2
import numpy as np
from app.liveness_checker import SequentialLiveness, LivenessStage
from app.models import LivenessCheckRequest
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


# -------------------------------
# 1️⃣ WEBSOCKET STREAM ENDPOINT
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
            await websocket.send_json({
                "stage": liveness.stage,
                "action_completed": action_completed
            })

            if liveness.stage == LivenessStage.DONE:
                await websocket.send_json({
                    "stage": liveness.stage,
                    "success": True,
                    "message": "Liveness check passed!"
                })
                break

    except WebSocketDisconnect:
        print("Client disconnected")


# -------------------------------
# 2️⃣ HTTP VIDEO TEST ENDPOINT
# -------------------------------
@app.post("/api/liveness-test")
async def liveness_test(video: UploadFile = File(...)):
    """
    Accepts an MP4 video and returns the number of detected:
    - Head shakes
    - Mouth openings
    - Blinks
    """
    if not video.filename.lower().endswith(".mp4"):
        raise HTTPException(status_code=400, detail="Only .mp4 videos are supported.")

    # Save uploaded video temporarily
    with NamedTemporaryFile(delete=False, suffix=".mp4", dir="/tmp") as tmp_file:
        tmp_path = tmp_file.name
        content = await video.read()
        tmp_file.write(content)

    try:
        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not open video file.")

        liveness = SequentialLiveness()
        frame_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            if frame_count % 2 == 0:  # process every other frame for speed
                liveness.process_frame(frame)

        cap.release()

        return {
            "success": True,
            "head_shakes": liveness.head_movements,
            "mouth_opens": liveness.mouth_movements,
            "blinks": liveness.blinks,
            "final_stage": liveness.stage
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video processing failed: {e}")

    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
