import os
import sys
import json
import cv2
import torch
import torchvision.models as models
import numpy as np

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

class AIFaceEngine:
    """
    Zero-training AI facial recognition engine.
    - Face Detection: OpenCV YuNet CNN ONNX model (lightweight, real-time).
    - Feature Extraction: Pretrained MobileNetV3 (features layer, L2-normalized 576-d embeddings).
    - Matching: Cosine similarity vector comparison.
    """
    def __init__(self, yunet_model_path="yunet.onnx", data_file="students_data.json", students_dir="students"):
        self.yunet_model_path = yunet_model_path
        self.data_file = data_file
        self.students_dir = students_dir
        
        # Load YuNet face detector
        if not os.path.exists(yunet_model_path):
            raise FileNotFoundError(f"YuNet model missing at {yunet_model_path}")
            
        self.detector = cv2.FaceDetectorYN_create(yunet_model_path, "", (320, 320), 0.6, 0.3, 5000)
        
        # Pretrained MobileNetV3 feature extractor
        weights = models.MobileNet_V3_Small_Weights.DEFAULT
        self.feature_extractor = models.mobilenet_v3_small(weights=weights).features
        self.feature_extractor.eval()
        
        # Registered embeddings: { student_id: { "name": ..., "email": ..., "embedding": np.ndarray } }
        self.registered_db = {}
        self.load_registered_students()

    def get_embedding(self, face_bgr):
        """Extract a 576-dimensional normalized L2 embedding from a face crop."""
        if face_bgr is None or face_bgr.size == 0:
            return np.zeros(576, dtype=np.float32)

        face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(face_rgb, (112, 112))
        
        # Convert to tensor [1, 3, 112, 112] normalized [-1, 1]
        tensor = torch.from_numpy(resized).permute(2, 0, 1).unsqueeze(0).float() / 255.0
        tensor = (tensor - 0.5) / 0.5
        
        with torch.no_grad():
            feat = self.feature_extractor(tensor).mean(dim=[-1, -2]).squeeze(0).numpy()
            
        # L2 normalize
        norm = np.linalg.norm(feat)
        if norm > 0:
            feat = feat / norm
        return feat

    def detect_faces(self, image_bgr):
        """Detect faces in image using YuNet. Returns list of (x, y, w, h, conf)"""
        h, w = image_bgr.shape[:2]
        self.detector.setInputSize((w, h))
        ret, faces = self.detector.detect(image_bgr)
        if faces is None or len(faces) == 0:
            return []
            
        results = []
        for f in faces:
            x, y, fw, fh = int(f[0]), int(f[1]), int(f[2]), int(f[3])
            conf = float(f[-1])
            # Strict boundary clipping
            x1 = max(0, x)
            y1 = max(0, y)
            x2 = min(w, x + fw)
            y2 = min(h, y + fh)
            bw = x2 - x1
            bh = y2 - y1
            if bw > 15 and bh > 15:
                results.append((x1, y1, bw, bh, conf))
        return results

    def get_face_crop(self, image_bgr):
        """Extract the primary face crop from an image, or return the whole image if no face found."""
        faces = self.detect_faces(image_bgr)
        if faces:
            x, y, w, h, _ = faces[0]
            # Add small 10% padding if within bounds
            img_h, img_w = image_bgr.shape[:2]
            pad_x = int(w * 0.08)
            pad_y = int(h * 0.08)
            x1 = max(0, x - pad_x)
            y1 = max(0, y - pad_y)
            x2 = min(img_w, x + w + pad_x)
            y2 = min(img_h, y + h + pad_y)
            return image_bgr[y1:y2, x1:x2]
        return image_bgr

    def load_registered_students(self):
        """Pre-compute embeddings for all registered students."""
        if not os.path.exists(self.data_file):
            print(f"Warning: {self.data_file} not found.")
            return
            
        with open(self.data_file, "r", encoding="utf-8") as f:
            students = json.load(f)
            
        print(f"[*] Pre-computing facial embeddings for {len(students)} students...")
        for sid, meta in students.items():
            photo_path = os.path.join(self.students_dir, f"{sid}.jpg")
            if not os.path.exists(photo_path):
                continue
                
            img = cv2.imread(photo_path)
            if img is None:
                continue
                
            face_crop = self.get_face_crop(img)
            embedding = self.get_embedding(face_crop)
            
            name = meta.get("name", sid) if isinstance(meta, dict) else str(meta)
            email = meta.get("email", "") if isinstance(meta, dict) else ""
            cls = meta.get("class", "") if isinstance(meta, dict) else ""
            sec = meta.get("section", "") if isinstance(meta, dict) else ""

            self.registered_db[sid] = {
                "name": name,
                "email": email,
                "class": cls,
                "section": sec,
                "embedding": embedding
            }
        print(f"[OK] Loaded {len(self.registered_db)} student embeddings into memory.")

    def match_face(self, face_crop, threshold=0.70):
        """
        Match detected face against registered student database.
        Returns: (student_id, student_name, similarity_score)
        """
        if not self.registered_db or face_crop is None or face_crop.size == 0:
            return None, "Unknown", 0.0
            
        query_emb = self.get_embedding(face_crop)
        best_sid = None
        best_name = "Unknown"
        best_score = 0.0
        
        for sid, data in self.registered_db.items():
            # Cosine similarity between L2-normalized vectors
            sim = float(np.dot(query_emb, data["embedding"]))
            if sim > best_score:
                best_score = sim
                best_sid = sid
                best_name = data["name"]
                
        if best_score >= threshold:
            return best_sid, best_name, best_score
        return None, "Unknown", best_score

def test_engine():
    engine = AIFaceEngine()
    print("\n" + "="*65)
    print("   AI Face Engine Test - 10 Student Verification (Zero-Training)")
    print("="*65)
    correct = 0
    total = len(engine.registered_db)
    
    for sid, data in engine.registered_db.items():
        photo_path = f"students/{sid}.jpg"
        img = cv2.imread(photo_path)
        crop = engine.get_face_crop(img)
        matched_id, matched_name, score = engine.match_face(crop)
        is_match = (matched_id == sid)
        if is_match:
            correct += 1
            print(f"[PASS] {sid:<8} | {matched_name:<20} | Confidence: {score*100:.1f}%")
        else:
            print(f"[FAIL] {sid:<8} | Expected {data['name']:<20} | Got: {matched_name} ({score*100:.1f}%)")
            
    print("="*65)
    print(f"Final Recognition Accuracy: {correct}/{total} ({correct/total*100:.1f}%)")
    print("="*65 + "\n")

if __name__ == "__main__":
    test_engine()
