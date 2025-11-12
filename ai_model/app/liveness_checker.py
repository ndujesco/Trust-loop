import cv2
import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1)

# --- Stages for sequential liveness ---
class LivenessStage:
    CALIBRATING = "calibrating" # <-- NEW STAGE
    SHAKE_HEAD = "shake_head"
    OPEN_MOUTH = "open_mouth"
    BLINK = "blink"
    DONE = "done"

class SequentialLiveness:
    def __init__(self, 
                 head_movement_threshold=20, head_frames_required=5,
                 # --- THRESHOLDS ARE NOW DYNAMIC ---
                 # Mouth: MAR must be > (baseline_mar * mouth_threshold)
                 mouth_threshold=2.5, 
                 mouth_frames_required=3,
                 # Blink: EAR must be < (baseline_ear * blink_threshold)
                 blink_threshold=0.6, 
                 blink_count_required=1,
                 # --- CALIBRATION CONFIG ---
                 calibration_frames=30):

        # --- Stage and counters ---
        self.stage = LivenessStage.CALIBRATING # <-- START IN CALIBRATING MODE
        self.prev_nose = None
        self.head_movements = 0
        self.mouth_movements = 0
        self.blinks = 0
        self.blink_detected_last_frame = False

        # --- Configurable thresholds ---
        self.head_movement_threshold = head_movement_threshold
        self.head_frames_required = head_frames_required
        self.mouth_threshold = mouth_threshold
        self.mouth_frames_required = mouth_frames_required
        self.blink_threshold = blink_threshold
        self.blink_count_required = blink_count_required

        # --- Calibration data ---
        self.calibration_frames = calibration_frames
        self.calibration_frames_counter = 0
        self.ear_readings = []
        self.mar_readings = []
        self.baseline_ear = 0
        self.baseline_mar = 0

    # ---------------- Main method ----------------
    def process_frame(self, frame):
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)
        action_completed = False

        if not results.multi_face_landmarks:
            return action_completed  # No face detected

        landmarks = self._get_landmarks(results.multi_face_landmarks[0].landmark, frame.shape)

        # --- State machine ---
        if self.stage == LivenessStage.CALIBRATING:
            # We are in calibration mode
            calibrated = self._calibrate(landmarks)
            if calibrated:
                self.stage = LivenessStage.SHAKE_HEAD
                # You would signal to the user to start the *first* test
                
        elif self.stage == LivenessStage.SHAKE_HEAD:
            action_completed = self._detect_head_movement(landmarks)
            if action_completed:
                self.stage = LivenessStage.OPEN_MOUTH

        elif self.stage == LivenessStage.OPEN_MOUTH:
            action_completed = self._detect_mouth(landmarks)
            if action_completed:
                self.stage = LivenessStage.BLINK

        elif self.stage == LivenessStage.BLINK:
            action_completed = self._detect_blink(landmarks)
            if action_completed:
                self.stage = LivenessStage.DONE

        return action_completed
    
    # ---------------- NEW CALIBRATION METHOD ----------------
    def _calibrate(self, landmarks):
        """
        Collects EAR and MAR readings for a set number of frames
        to establish a baseline.
        """
        if self.calibration_frames_counter < self.calibration_frames:
            # Calculate EAR
            LEFT_EYE_IDX = [33, 160, 158, 133, 153, 144]
            RIGHT_EYE_IDX = [263, 387, 385, 362, 380, 373]
            left_ear = self._eye_aspect_ratio(landmarks, LEFT_EYE_IDX)
            right_ear = self._eye_aspect_ratio(landmarks, RIGHT_EYE_IDX)
            ear = (left_ear + right_ear) / 2
            self.ear_readings.append(ear)
            
            # Calculate MAR
            MOUTH_IDX = [61, 291, 81, 178, 13, 14]
            mar = self._mouth_aspect_ratio(landmarks, MOUTH_IDX)
            self.mar_readings.append(mar)
            
            # --- THIS IS THE FIX ---
            # Also set the nose landmark, so we are ready to detect
            # movement immediately after calibration.
            self.prev_nose = landmarks[1]  # nose tip
            # --- END FIX ---

            self.calibration_frames_counter += 1
            return False # Still calibrating
        
        else:
            # --- Calibration is done, calculate averages ---
            self.baseline_ear = np.mean(self.ear_readings)
            self.baseline_mar = np.mean(self.mar_readings)
            
            print(f"CALIBRATION COMPLETE:")
            print(f"Baseline EAR: {self.baseline_ear:.2f}")
            print(f"Baseline MAR: {self.baseline_mar:.2f}")
            
            return True # Calibration finished

    # ---------------- Helper functions (updated) ----------------
    def _get_landmarks(self, landmarks, frame_shape):
        h, w = frame_shape[:2]
        return [(int(lm.x * w), int(lm.y * h)) for lm in landmarks]

    def _euclidean(self, a, b):
        return np.linalg.norm(np.array(a) - np.array(b))

    # --- Head movement detection (unchanged) ---
    def _detect_head_movement(self, landmarks):
        nose = landmarks[1]  # nose tip
        if self.prev_nose is not None:
            dist = self._euclidean(nose, self.prev_nose)
            if dist > self.head_movement_threshold:
                self.head_movements += 1
        self.prev_nose = nose
        return self.head_movements >= self.head_frames_required

    # --- Mouth movement detection (MODIFIED) ---
    def _mouth_aspect_ratio(self, landmarks, mouth_idx):
        # Helper to calculate MAR (factored out)
        p = [landmarks[i] for i in mouth_idx]
        vertical = self._euclidean(p[4], p[5])
        horizontal = self._euclidean(p[0], p[1])
        return vertical / horizontal

    def _detect_mouth(self, landmarks):
        MOUTH_IDX = [61, 291, 81, 178, 13, 14]
        mar = self._mouth_aspect_ratio(landmarks, MOUTH_IDX)
        
        # --- DYNAMIC CHECK ---
        # Check if MAR is significantly larger than the baseline
        dynamic_threshold = self.baseline_mar * self.mouth_threshold
        
        if mar > dynamic_threshold:
            self.mouth_movements += 1
            
        return self.mouth_movements >= self.mouth_frames_required

    # --- Blink detection (MODIFIED) ---
    def _eye_aspect_ratio(self, landmarks, eye_idx):
        p = [landmarks[i] for i in eye_idx]
        vertical = self._euclidean(p[1], p[5]) + self._euclidean(p[2], p[4])
        horizontal = 2 * self._euclidean(p[0], p[3])
        return vertical / horizontal

    def _detect_blink(self, landmarks):
        LEFT_EYE_IDX = [33, 160, 158, 133, 153, 144]
        RIGHT_EYE_IDX = [263, 387, 385, 362, 380, 373]
        left_ear = self._eye_aspect_ratio(landmarks, LEFT_EYE_IDX)
        right_ear = self._eye_aspect_ratio(landmarks, RIGHT_EYE_IDX)
        ear = (left_ear + right_ear) / 2

        # --- DYNAMIC CHECK ---
        # Check if EAR has dropped significantly from the baseline
        dynamic_threshold = self.baseline_ear * self.blink_threshold
        blink = ear < dynamic_threshold
        
        if blink and not self.blink_detected_last_frame:
            self.blinks += 1
        self.blink_detected_last_frame = blink

        return self.blinks >= self.blink_count_required