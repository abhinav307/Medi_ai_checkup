---
title: Medi Ai Backend
emoji: 🏥
colorFrom: blue
colorTo: indigo
sdk: gradio
app_file: app.py
pinned: false
---

# MedDiag-AI 2.0

Welcome to MedDiag-AI 2.0. This project is a complete rebuild of the medical diagnostic platform, engineered from scratch to be **Framework-Agnostic**. 

Unlike Version 1 (which was hardcoded for ONNX), Version 2.0 is designed to support PyTorch, TensorFlow, and ONNX simultaneously, allowing you to plug and play open-source models downloaded from Hugging Face or other platforms.

## Folder Structure
* `/backend` - The FastAPI Python server (Handles routing, auth, and AI inference).
* `/frontend` - The React/Vite web application (The UI for doctors and patients).
* `/models` - The directory where we will store the downloaded Hugging Face weights (`.ckpt`, `.pb`, `.onnx`).

## Core Upgrades in v2.0
1. **Multi-Framework Inference Engine:** Support for PyTorch Lightning and TensorFlow.
2. **True Asynchronous Architecture:** No event-loop blocking during heavy model inference.
3. **Database Integration:** SQLite / PostgreSQL out of the box instead of flat JSON files.
4. **Dynamic Model Registry:** Models are registered via configuration, so you don't have to rewrite code every time you download a new model.
