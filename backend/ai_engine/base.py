from abc import ABC, abstractmethod
from typing import Dict, Any

class MedicalModel(ABC):
    """
    Abstract base class for all medical AI models in MedDiag 2.0.
    Ensures that whether a model is PyTorch, TensorFlow, or ONNX,
    it always exposes a consistent `predict()` interface to the FastAPI routes.
    """
    def __init__(self, model_dir: str):
        self.model_dir = model_dir
        self.model = None
        self.load_model()

    @abstractmethod
    def load_model(self):
        """Loads the model weights into memory (GPU or CPU)"""
        pass

    @abstractmethod
    def predict(self, image_path: str) -> Dict[str, Any]:
        """Runs the image through the model and returns confidence scores"""
        pass
