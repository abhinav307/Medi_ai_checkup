import os
import cv2
import numpy as np
import tensorflow as tf
from .base import MedicalModel

class TensorFlowLoader(MedicalModel):
    """
    Handles Hugging Face TensorFlow SavedModel formats (.pb)
    Used for: Eye Disease Classification Model
    """
    def load_model(self):
        try:
            print(f"Loading TensorFlow model from {self.model_dir}...")
            # Loads the SavedModel directory (which contains saved_model.pb and variables/)
            self.model = tf.saved_model.load(self.model_dir)
            self.infer = self.model.signatures["serving_default"]
            print("TensorFlow model loaded successfully.")
        except Exception as e:
            print(f"Failed to load TensorFlow model: {e}")
            self.model = None

    def predict(self, image_path: str):
        if not self.model:
            return {"error": "Model not loaded"}

        # 1. Preprocess Image
        img = cv2.imread(image_path)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Most TF models from HF expect 224x224
        img = cv2.resize(img, (224, 224))
        
        # Normalize to [0, 1]
        img = img.astype(np.float32) / 255.0
        
        # Add batch dimension (1, 224, 224, 3)
        img = np.expand_dims(img, axis=0)

        # 2. Convert to TF Tensor
        input_tensor = tf.constant(img)

        # 3. Predict
        try:
            result = self.infer(input_tensor)
            # TF SavedModels return dictionaries. Extract the first output tensor.
            output_key = list(result.keys())[0]
            preds = result[output_key].numpy()[0]
            
            # Simple assumption: binary classification or multiclass probabilities
            return {
                "status": "success",
                "framework": "tensorflow",
                "raw_predictions": preds.tolist()
            }
        except Exception as e:
            return {"error": f"Inference failed: {str(e)}"}
