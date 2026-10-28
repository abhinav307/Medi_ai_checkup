from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
import shutil
import uuid
from typing import Optional

from database import engine, get_db
import models
from ai_engine.image_processor import process_medical_image
from ai_engine.neural_symptom_engine import (
    symptom_engine, 
    AITextSymptomAnalyzer, 
    SYMPTOM_DEFINITIONS, 
    DISEASE_DEFINITIONS
)
from pydantic import BaseModel
from typing import Dict, Any, List

# Auto-migrate database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MedDiag 2.0 Clinical Diagnostic API", version="2.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMP_DIR = os.path.join(BASE_DIR, "temp")
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Robust absolute model paths
PROJECT_ROOT = os.path.dirname(BASE_DIR)
MODELS_DIR = os.getenv("MODELS_DIR", os.path.join(PROJECT_ROOT, "models"))

_tf_eye_model = None
_pt_dr_model = None
_onnx_cxr_model = None

def get_tf_eye_model():
    global _tf_eye_model
    if _tf_eye_model is None:
        from ai_engine.tensorflow_loader import TensorFlowLoader
        _tf_eye_model = TensorFlowLoader(model_dir=os.path.join(MODELS_DIR, "tf_eye_model"))
    return _tf_eye_model

def get_pt_dr_model():
    global _pt_dr_model
    if _pt_dr_model is None:
        from ai_engine.pytorch_loader import PyTorchLightningLoader
        _pt_dr_model = PyTorchLightningLoader(model_dir=os.path.join(MODELS_DIR, "pt_dr_model"))
    return _pt_dr_model

def get_onnx_cxr_model():
    global _onnx_cxr_model
    if _onnx_cxr_model is None:
        from ai_engine.onnx_loader import ONNXLoader
        _onnx_cxr_model = ONNXLoader(model_dir=os.path.join(MODELS_DIR, "chest_xray"))
    return _onnx_cxr_model

def save_temp_file(file: UploadFile):
    os.makedirs(TEMP_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}{ext}")
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return path

def log_to_db(
    db: Session,
    patient_name: str,
    patient_age: int,
    patient_gender: str,
    scan_type: str,
    diagnosis: str,
    confidence: float,
    triage_level: str,
    clinical_recommendation: str,
    findings=None,
    processed_img=None,
    img_type=None,
    quality_telemetry=None,
    multi_copies=None,
    primary_base64=None
):
    base_url = os.getenv("BASE_URL", "").rstrip("/")
    url = f"{base_url}/static/{processed_img}" if base_url else f"/static/{processed_img}" if processed_img else None
    
    record = models.PatientRecord(
        patient_name=patient_name or "Anonymous Patient",
        patient_age=patient_age or 45,
        patient_gender=patient_gender or "Other",
        scan_type=scan_type,
        diagnosis=diagnosis,
        confidence=confidence,
        triage_level=triage_level,
        clinical_recommendation=clinical_recommendation,
        processed_image_url=url,
        image_type=img_type or "Unknown"
    )
    
    if findings:
        record.set_findings(findings)
    if quality_telemetry:
        record.set_quality_metrics(quality_telemetry)
    if multi_copies:
        record.set_multi_copies(multi_copies)
        
    db.add(record)
    db.commit()
    db.refresh(record)
    
    return {
        "id": record.id,
        "patient_name": record.patient_name,
        "patient_age": record.patient_age,
        "patient_gender": record.patient_gender,
        "scan_type": record.scan_type,
        "diagnosis": record.diagnosis,
        "confidence": record.confidence,
        "triage_level": record.triage_level,
        "clinical_recommendation": record.clinical_recommendation,
        "timestamp": record.timestamp.isoformat() if hasattr(record.timestamp, "isoformat") else str(record.timestamp),
        "findings": record.get_findings(),
        "quality_metrics": record.get_quality_metrics(),
        "processed_image_url": record.processed_image_url,
        "processed_image_base64": primary_base64,
        "image_type": record.image_type,
        "multi_copies": record.get_multi_copies()
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "models": {
            "tensorflow_eye": "ready" if _tf_eye_model is None else (_tf_eye_model.model is not None),
            "pytorch_dr": "ready" if _pt_dr_model is None else (_pt_dr_model.model is not None),
            "onnx_cxr": "ready" if _onnx_cxr_model is None else (_onnx_cxr_model.session is not None)
        }
    }

@app.post("/api/diagnose/eye/tf")
async def diagnose_eye_tf(
    patient_name: str = Form(...),
    patient_age: Optional[int] = Form(45),
    patient_gender: Optional[str] = Form("Other"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    path = save_temp_file(file)
    try:
        results = get_tf_eye_model().predict(path)
        processed_filename, img_type, telemetry, multi_copies, primary_base64 = process_medical_image(path, STATIC_DIR, modality_hint="eye")
    finally:
        if os.path.exists(path):
            os.remove(path)
            
    if "error" in results:
        raise HTTPException(status_code=500, detail=results["error"])
        
    raw_preds = results.get("raw_predictions", [])
    
    # 4 verified classes: cataract, diabetic_retinopathy, glaucoma, normal
    classes = [
        "Cataract Detected",
        "Diabetic Retinopathy",
        "Glaucoma Suspect",
        "Normal / Clear Retinal Fundus"
    ]
    
    if len(raw_preds) >= 4:
        top_idx = int(max(range(len(raw_preds)), key=raw_preds.__getitem__))
        conf = float(raw_preds[top_idx])
        diag = classes[top_idx]
        
        findings = [
            {"name": classes[i], "confidence": float(raw_preds[i])}
            for i in range(min(len(classes), len(raw_preds)))
        ]
        
        if top_idx == 3:  # Normal
            triage = "routine"
            rec = "No acute ocular abnormalities observed. Routine annual ophthalmic screening recommended."
        elif top_idx == 0:  # Cataract
            triage = "urgent" if conf > 0.70 else "monitor"
            rec = "Cataractous lens opacification identified. Dilated slit-lamp biomicroscopy recommended to assess visual impairment."
        elif top_idx == 1:  # DR
            triage = "urgent" if conf > 0.70 else "monitor"
            rec = "Retinal microvascular changes observed consistent with diabetic retinopathy. Dilated fundus examination and OCT recommended."
        else:  # Glaucoma
            triage = "urgent"
            rec = "Elevated optic cup-to-disc ratio and neuroretinal rim thinning noted. Immediate tonometry and Humphrey visual field testing recommended."
    else:
        conf = 0.50
        diag = "Inconclusive Scan"
        triage = "monitor"
        rec = "Scan resolution or illumination insufficient for definitive multi-class screening. Repeat fundus photography recommended."
        findings = [{"name": c, "confidence": 0.25} for c in classes]

    return {
        "status": "success",
        "record": log_to_db(
            db, patient_name, patient_age, patient_gender,
            "Ophthalmic Screening (TensorFlow)",
            diag, conf, triage, rec, findings,
            processed_filename, img_type, telemetry, multi_copies,
            primary_base64
        )
    }

@app.post("/api/diagnose/eye/dr")
async def diagnose_eye_dr(
    patient_name: str = Form(...),
    patient_age: Optional[int] = Form(45),
    patient_gender: Optional[str] = Form("Other"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    path = save_temp_file(file)
    try:
        results = get_pt_dr_model().predict(path)
        processed_filename, img_type, telemetry, multi_copies, primary_base64 = process_medical_image(path, STATIC_DIR, modality_hint="eye")
    finally:
        if os.path.exists(path):
            os.remove(path)
            
    if "error" in results:
        raise HTTPException(status_code=500, detail=results["error"])
        
    conf = results.get("confidence", 0.0)
    diag = results.get("diagnosis", "Normal (No DR)")
    raw_preds = results.get("raw_predictions", [])
    
    dr_grades = [
        "Normal (No DR)",
        "Mild Non-Proliferative DR",
        "Moderate Non-Proliferative DR",
        "Severe Non-Proliferative DR",
        "Proliferative DR (PDR)"
    ]
    
    findings = []
    for i, p in enumerate(raw_preds):
        if i < len(dr_grades):
            findings.append({"name": dr_grades[i], "confidence": float(p), "grade": i})
            
    # Clinical Triage determination based on DR Grade
    top_grade = 0
    if raw_preds:
        top_grade = int(max(range(len(raw_preds)), key=raw_preds.__getitem__))
        
    if top_grade == 0:
        triage = "routine"
        rec = "No diabetic retinopathy microvascular lesions detected. Maintain annual diabetic retinal screening."
    elif top_grade == 1:
        triage = "monitor"
        rec = "Microaneurysms detected (Mild NPDR). Rescreen within 6-12 months with tight glycemic (HbA1c) and blood pressure control."
    elif top_grade == 2:
        triage = "monitor"
        rec = "Moderate NPDR with intraretinal hemorrhages / exudates. Referral to retina specialist within 3 months recommended."
    elif top_grade == 3:
        triage = "urgent"
        rec = "Severe NPDR (4-2-1 criteria suspicion). High risk of progression. Vitreoretinal evaluation recommended within 2-4 weeks."
    else:
        triage = "urgent"
        rec = "High-risk Proliferative Diabetic Retinopathy (neovascularization present). Immediate urgent ophthalmology referral for panretinal photocoagulation (PRP) or anti-VEGF therapy."

    return {
        "status": "success",
        "record": log_to_db(
            db, patient_name, patient_age, patient_gender,
            "Diabetic Retinopathy (PyTorch)",
            diag, conf, triage, rec, findings,
            processed_filename, img_type, telemetry, multi_copies,
            primary_base64
        )
    }

@app.post("/api/diagnose/cxr")
async def diagnose_cxr(
    patient_name: str = Form(...),
    patient_age: Optional[int] = Form(45),
    patient_gender: Optional[str] = Form("Other"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    path = save_temp_file(file)
    try:
        results = get_onnx_cxr_model().predict(path)
        processed_filename, img_type, telemetry, multi_copies, primary_base64 = process_medical_image(path, STATIC_DIR, modality_hint="cxr")
    finally:
        if os.path.exists(path):
            os.remove(path)
            
    if "error" in results:
        raise HTTPException(status_code=500, detail=results["error"])
        
    conf = results.get("confidence", 0.0)
    diag = results.get("diagnosis", "Normal / Clear Lung")
    raw_preds = results.get("raw_predictions", [])
    
    classes = [
        "Normal / Clear Lung", 
        "Pneumonia / Consolidation", 
        "Cardiomegaly", 
        "Pleural Effusion", 
        "Atelectasis / Infiltration"
    ]
    
    findings = []
    for i, p in enumerate(raw_preds):
        if i < len(classes):
            findings.append({"name": classes[i], "confidence": float(p)})
            
    top_idx = int(max(range(len(raw_preds)), key=raw_preds.__getitem__)) if raw_preds else 0
    
    if top_idx == 0:
        triage = "routine"
        rec = "No acute cardiopulmonary focal consolidation, pleural effusion, or pneumothorax identified. Clinically unremarkable."
    elif top_idx in [1, 3]:
        triage = "urgent"
        rec = "Focal opacity / consolidation or effusion identified. Correlate with temperature, WBC count, and consider urgent antibiotic / pulmonary evaluation."
    else:
        triage = "monitor"
        rec = "Cardiothoracic enlargement or parenchymal streaking noted. Clinical cardiology / spirometry follow-up suggested."

    return {
        "status": "success",
        "record": log_to_db(
            db, patient_name, patient_age, patient_gender,
            "Chest Radiograph (ONNX)",
            diag, conf, triage, rec, findings,
            processed_filename, img_type, telemetry, multi_copies,
            primary_base64
        )
    }

@app.get("/api/records")
async def get_records(db: Session = Depends(get_db)):
    records = db.query(models.PatientRecord).order_by(models.PatientRecord.timestamp.desc()).all()
    result = []
    for rec in records:
        result.append({
            "id": rec.id,
            "patient_name": rec.patient_name,
            "patient_age": rec.patient_age,
            "patient_gender": rec.patient_gender,
            "scan_type": rec.scan_type,
            "diagnosis": rec.diagnosis,
            "confidence": rec.confidence,
            "triage_level": rec.triage_level,
            "clinical_recommendation": rec.clinical_recommendation,
            "timestamp": rec.timestamp.isoformat() if hasattr(rec.timestamp, "isoformat") else str(rec.timestamp),
            "findings": rec.get_findings(),
            "quality_metrics": rec.get_quality_metrics(),
            "processed_image_url": rec.processed_image_url,
            "image_type": rec.image_type,
            "multi_copies": rec.get_multi_copies()
        })
    return result

@app.delete("/api/records/{record_id}")
async def delete_record(record_id: int, db: Session = Depends(get_db)):
    rec = db.query(models.PatientRecord).filter(models.PatientRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(rec)
    db.commit()
    return {"status": "success", "deleted_id": record_id}

# =====================================================================
# NEURAL SYMPTOM CHECKER & DYNAMIC QUESTIONING ENDPOINTS
# =====================================================================

class SymptomStartRequest(BaseModel):
    patient_name: str
    patient_age: Optional[int] = 45
    patient_gender: Optional[str] = "Female"
    initial_notes: Optional[str] = None
    target_questions: Optional[int] = 10
    assessment_mode: Optional[str] = "quick"  # 'quick' (5-10), 'standard' (15-25), 'comprehensive' (30-50), 'custom'

class SymptomAnswerRequest(BaseModel):
    patient_name: str
    patient_age: Optional[int] = 45
    patient_gender: Optional[str] = "Female"
    symptom_id: str
    answer: str  # 'yes', 'no', 'other'
    other_text: Optional[str] = None
    symptom_state: Dict[str, Optional[bool]] = {}
    accumulated_notes: Optional[str] = None
    target_questions: Optional[int] = 10
    assessment_mode: Optional[str] = "quick"

class SymptomFinalizeRequest(BaseModel):
    patient_name: str
    patient_age: Optional[int] = 45
    patient_gender: Optional[str] = "Female"
    symptom_state: Dict[str, Optional[bool]] = {}
    accumulated_notes: Optional[str] = None
    target_questions: Optional[int] = 10
    assessment_mode: Optional[str] = "quick"

@app.post("/api/symptoms/start")
async def start_symptom_session(req: SymptomStartRequest):
    state: Dict[str, Optional[bool]] = {}
    nlp_result = None

    if req.initial_notes and req.initial_notes.strip():
        nlp_result = AITextSymptomAnalyzer.analyze_free_text(req.initial_notes)
        for s_id in nlp_result["extracted_symptoms"]:
            state[s_id] = True

    target = req.target_questions or 10
    first_question = symptom_engine.select_next_dynamic_question(
        state, 
        target_questions=target, 
        answered_count=len(state)
    )
    probs = symptom_engine.compute_disease_posteriors(state)
    
    ranked_diseases = []
    top_indices = list(reversed(sorted(range(len(probs)), key=lambda i: probs[i])))[:6]
    for idx in top_indices:
        ranked_diseases.append({
            "name": DISEASE_DEFINITIONS[idx]["name"],
            "probability": float(probs[idx])
        })

    return {
        "status": "in_progress",
        "symptom_state": state,
        "next_question": first_question,
        "nlp_analysis": nlp_result,
        "preliminary_ranking": ranked_diseases,
        "target_questions": target,
        "assessment_mode": req.assessment_mode or "quick"
    }

@app.post("/api/symptoms/answer")
async def answer_symptom_question(req: SymptomAnswerRequest, db: Session = Depends(get_db)):
    state = req.symptom_state.copy()
    nlp_result = None
    target = req.target_questions or 10

    # 1. Process custom text if user clicked "Other" or entered text
    if req.other_text and req.other_text.strip():
        nlp_result = AITextSymptomAnalyzer.analyze_free_text(req.other_text)
        for s_id in nlp_result["extracted_symptoms"]:
            state[s_id] = True

    # 2. Process discrete answer
    if req.answer.lower() == "yes":
        state[req.symptom_id] = True
    elif req.answer.lower() == "no":
        state[req.symptom_id] = False

    # Count answered
    answered_count = sum(1 for v in state.values() if v is not None)
    
    # 3. Dynamically evaluate next best question
    next_question = symptom_engine.select_next_dynamic_question(
        state, 
        target_questions=target, 
        answered_count=answered_count
    )
    probs = symptom_engine.compute_disease_posteriors(state)

    # Stop condition: reached user's target question count or no questions left
    if next_question is None or answered_count >= target:
        # Generate full clinical report with root-cause etiology
        synthesis = symptom_engine.generate_diagnostic_synthesis(
            req.patient_name, req.patient_age, req.patient_gender,
            state, req.accumulated_notes or (nlp_result["clinical_summary"] if nlp_result else None)
        )
        
        findings = [
            {"name": d["name"], "confidence": float(d["probability"])}
            for d in synthesis["differential_diagnoses"][:8]
        ]
        
        db_record = log_to_db(
            db, req.patient_name, req.patient_age, req.patient_gender,
            "Symptom Differential (Neural Net)",
            synthesis["primary_diagnosis"],
            synthesis["confidence"],
            synthesis["triage_level"],
            synthesis["clinical_recommendation"],
            findings=findings,
            processed_img=None,
            img_type="Clinical Symptom Neural Vector",
            quality_telemetry={
                "answered_questions": answered_count,
                "target_questions": target,
                "assessment_mode": req.assessment_mode or "standard",
                "confirmed_symptoms": synthesis["positive_symptoms"],
                "ruled_out_symptoms": synthesis["ruled_out_symptoms"],
                "root_cause_analysis": synthesis["root_cause_analysis"],
                "pathophysiology_mechanism": synthesis["pathophysiology_mechanism"],
                "organ_risks": synthesis["organ_risks"],
                "diagnostic_workup": synthesis["diagnostic_workup"],
                "immediate_actions": synthesis["immediate_actions"],
                "emergency_red_flags": synthesis["emergency_red_flags"],
                "symptom_attribution": synthesis["symptom_attribution"],
                "nlp_features_parsed": len(nlp_result["extracted_symptoms"]) if nlp_result else 0
            }
        )
        
        return {
            "status": "completed",
            "record": db_record,
            "synthesis": synthesis,
            "nlp_analysis": nlp_result
        }

    # Still in progress -> return next dynamic question and updated rankings
    ranked_diseases = []
    top_indices = list(reversed(sorted(range(len(probs)), key=lambda i: probs[i])))[:6]
    for idx in top_indices:
        ranked_diseases.append({
            "name": DISEASE_DEFINITIONS[idx]["name"],
            "probability": float(probs[idx])
        })

    return {
        "status": "in_progress",
        "symptom_state": state,
        "next_question": next_question,
        "nlp_analysis": nlp_result,
        "preliminary_ranking": ranked_diseases,
        "answered_count": answered_count,
        "target_questions": target
    }

@app.post("/api/symptoms/finalize")
async def finalize_symptom_session(req: SymptomFinalizeRequest, db: Session = Depends(get_db)):
    answered_count = sum(1 for v in req.symptom_state.values() if v is not None)
    target = req.target_questions or max(answered_count, 10)
    
    synthesis = symptom_engine.generate_diagnostic_synthesis(
        req.patient_name, req.patient_age, req.patient_gender,
        req.symptom_state, req.accumulated_notes
    )
    
    findings = [
        {"name": d["name"], "confidence": float(d["probability"])}
        for d in synthesis["differential_diagnoses"][:8]
    ]
    
    db_record = log_to_db(
        db, req.patient_name, req.patient_age, req.patient_gender,
        "Symptom Differential (Neural Net)",
        synthesis["primary_diagnosis"],
        synthesis["confidence"],
        synthesis["triage_level"],
        synthesis["clinical_recommendation"],
        findings=findings,
        processed_img=None,
        img_type="Clinical Symptom Neural Vector",
        quality_telemetry={
            "answered_questions": answered_count,
            "target_questions": target,
            "assessment_mode": req.assessment_mode or "standard",
            "confirmed_symptoms": synthesis["positive_symptoms"],
            "ruled_out_symptoms": synthesis["ruled_out_symptoms"],
            "root_cause_analysis": synthesis["root_cause_analysis"],
            "pathophysiology_mechanism": synthesis["pathophysiology_mechanism"],
            "organ_risks": synthesis["organ_risks"],
            "diagnostic_workup": synthesis["diagnostic_workup"],
            "immediate_actions": synthesis["immediate_actions"],
            "emergency_red_flags": synthesis["emergency_red_flags"],
            "symptom_attribution": synthesis["symptom_attribution"]
        }
    )
    
    return {
        "status": "completed",
        "record": db_record,
        "synthesis": synthesis
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 7860))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

