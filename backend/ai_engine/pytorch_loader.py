import os
import sys
import torch
import cv2
import numpy as np
from .base import MedicalModel

class PyTorchLightningLoader(MedicalModel):
    """
    Handles Hugging Face PyTorch Lightning formats (.ckpt)
    Used for: Diabetic Retinopathy Detection Model
    """
    def load_model(self):
        try:
            print(f"Loading PyTorch Lightning model from {self.model_dir}...")
            ckpt_path = os.path.join(self.model_dir, "dr-model.ckpt")
            
            src_path = os.path.join(self.model_dir, "src")
            if src_path not in sys.path:
                sys.path.insert(0, self.model_dir) # Add parent of src so `from src.model import DRModel` works
                
            from src.model import DRModel
            
            # Load the actual Lightning module
            self.model = DRModel.load_from_checkpoint(ckpt_path, map_location=torch.device('cpu'))
            self.model.eval()
            print("PyTorch Lightning DRModel loaded successfully.")
            
        except Exception as e:
            print(f"Failed to load PyTorch model: {e}")
            self.model = None

    def predict(self, image_path: str):
        if not self.model:
            return {"error": "PyTorch Model failed to load (Check console logs for architecture import errors)"}
            
        try:
            # 1. Preprocess Image
            img = cv2.imread(image_path)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img = cv2.resize(img, (224, 224))
            
            # Normalize (ImageNet stats are typically used by torchvision models)
            img = img.astype(np.float32) / 255.0
            mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
            std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
            img = (img - mean) / std
            
            img = np.transpose(img, (2, 0, 1))
            img = np.expand_dims(img, axis=0) # Add batch dimension
            
            tensor = torch.tensor(img, dtype=torch.float32)
            
            # 2. Real Forward Pass
            with torch.no_grad():
                logits = self.model(tensor)
                probs = torch.softmax(logits, dim=1).numpy()[0]
                
            # Class mapping for DR (0: Normal, 1: Mild, 2: Moderate, 3: Severe, 4: Proliferative)
            pred_class = int(np.argmax(probs))
            confidence = float(probs[pred_class])
            
            classes = ["Normal (No DR)", "Mild DR", "Moderate DR", "Severe DR", "Proliferative DR"]
            diagnosis = classes[pred_class] if pred_class < len(classes) else f"Class {pred_class}"
            
            return {
                "status": "success",
                "framework": "pytorch_lightning",
                "diagnosis": diagnosis,
                "confidence": confidence,
                "raw_predictions": probs.tolist()
            }
        except Exception as e:
            return {"error": f"PyTorch inference failed: {str(e)}"}

