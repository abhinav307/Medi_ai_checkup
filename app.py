import os
import sys

# Prevent TensorFlow and ONNX device-probing segfaults in headless containers
os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["OMP_NUM_THREADS"] = "2"

# Ensure backend directory is in python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

try:
    import spaces
except ImportError:
    class _MockSpaces:
        def GPU(self, fn=None, *args, **kwargs):
            if fn is None:
                return lambda f: f
            return fn
    spaces = _MockSpaces()

@spaces.GPU
def _zero_gpu_init():
    """Satisfies Hugging Face ZeroGPU startup requirement"""
    return "ZeroGPU Online"

import gradio as gr
from backend.main import app

with gr.Blocks(title="MedDiag 2.0 Clinical API") as demo:
    gr.Markdown("# 🏥 MedDiag 2.0 Clinical Diagnostic API Server")
    gr.Markdown("The backend is **Active & Running** on Hugging Face Spaces.")
    gr.Markdown("This server provides AI inference for the MedDiag React frontend deployed on Vercel.")
    gr.Markdown("### Endpoints & Documentation")
    gr.Markdown("- **Interactive Swagger Docs:** [`/docs`](/docs)")
    gr.Markdown("- **Health Status:** [`/api/health`](/api/health)")
    gr.Markdown("- **Records API:** [`/api/records`](/api/records)")

# Mount Gradio UI at root '/' so the Space landing page shows server status
app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
