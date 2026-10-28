@echo off
echo ===================================================
echo Starting MedDiag 2.0 Tri-Framework Clinical Server
echo FastAPI running on http://localhost:8000
echo ===================================================
python -m uvicorn main:app --port 8000
