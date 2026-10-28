import os
import cv2
import numpy as np
import onnxruntime as ort
from .base import MedicalModel

class ONNXLoader(MedicalModel):
    """
    Handles standard ONNX weights (.onnx)
    Used for: Chest X-Ray Multi-Abnormality Screening Model
    """
    def load_model(self):
        try:
            print(f"Loading ONNX model from {self.model_dir}...")
            path = self.model_dir if self.model_dir.endswith(".onnx") else os.path.join(self.model_dir, "model.onnx")
            if not os.path.exists(path):
                raise FileNotFoundError(f"No ONNX file found at {path}")
            
            self.session = ort.InferenceSession(path, providers=['CPUExecutionProvider'])
            self.input_name = self.session.get_inputs()[0].name
            print(f"ONNX model loaded successfully from {path}.")
        except Exception as e:
            print(f"Failed to load ONNX model: {e}")
            self.session = None

    def predict(self, image_path: str):
        if not self.session:
            return {"error": "ONNX Model session not initialized."}

        # 1. Preprocess Image
        img = cv2.imread(image_path)
        if img is None:
            return {"error": f"Failed to load image at {image_path}"}
            
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (224, 224))
        
        # Standard Medical ImageNet Normalization
        img = img.astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        img = (img - mean) / std
        
        # Transpose to (C, H, W) and add batch dimension -> (1, 3, 224, 224)
        img = np.transpose(img, (2, 0, 1))
        img = np.expand_dims(img, axis=0)

        # 2. Run ONNX Inference
        try:
            out = self.session.run(None, {self.input_name: img})[0][0]
            exp_scores = np.exp(out - np.max(out))
            probs = (exp_scores / np.sum(exp_scores)).tolist()
            
            classes = [
                "Normal / Clear Lung", 
                "Pneumonia / Consolidation", 
                "Cardiomegaly", 
                "Pleural Effusion", 
                "Atelectasis / Infiltration"
            ]
            
            # Determine top non-normal finding vs normal
            top_idx = int(np.argmax(probs))
            top_conf = float(probs[top_idx])
            diagnosis = classes[top_idx] if top_idx < len(classes) else "Evaluation Completed"
            
            return {
                "status": "success",
                "framework": "onnx",
                "diagnosis": diagnosis,
                "confidence": top_conf,
                "raw_predictions": probs
            }
        except Exception as e:
            return {"error": f"ONNX Inference failed: {str(e)}"}
