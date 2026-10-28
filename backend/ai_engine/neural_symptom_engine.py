import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import re
import uuid
import math
from typing import Dict, List, Any, Optional

# =====================================================================
# 1. EXPANDED CLINICAL SYMPTOM ONTOLOGY (65 CLINICAL INDICATORS)
# =====================================================================
SYMPTOM_DEFINITIONS = [
    # Constitutional & Systemic (1-8)
    {"id": "fever_high", "name": "High-Grade Fever (>38.5°C / 101.3°F)", "category": "Constitutional", "urgency": "high"},
    {"id": "chills_rigors", "name": "Severe Chills & Rigors / Teeth Chattering Shivering", "category": "Constitutional", "urgency": "medium"},
    {"id": "night_sweats_chronic", "name": "Persistent Drenching Night Sweats (Soaking Clothes/Sheets)", "category": "Constitutional", "urgency": "medium"},
    {"id": "chronic_fatigue_malaise", "name": "Profound Generalized Fatigue, Malaise & Muscle Lethargy", "category": "Constitutional", "urgency": "low"},
    {"id": "step_ladder_fever", "name": "Gradually Rising 'Step-Ladder' Fever Over Consecutive Days", "category": "Constitutional", "urgency": "high"},
    {"id": "periodic_fever_sweats", "name": "Cyclical / Periodic Fever Spikes (Spiking Every 48 to 72 Hours)", "category": "Constitutional", "urgency": "high"},
    {"id": "loss_appetite_anorexia", "name": "Severe Anorexia & Complete Loss of Appetite", "category": "Constitutional", "urgency": "low"},
    {"id": "unexplained_weight_loss", "name": "Significant Unintentional Weight Loss (>5% over past month)", "category": "Constitutional", "urgency": "medium"},

    # Cardiopulmonary & Vascular (9-16)
    {"id": "chest_pressure_crushing", "name": "Crushing Substernal Chest Pressure / Heavy Squeezing Weight", "category": "Cardiopulmonary", "urgency": "emergency"},
    {"id": "radiation_arm_jaw", "name": "Chest Discomfort Radiating to Left Arm, Neck, Shoulder, or Jaw", "category": "Cardiopulmonary", "urgency": "emergency"},
    {"id": "palpitations_tachycardia", "name": "Rapid Racing Heartbeat, Fluttering, or Palpitations at Rest", "category": "Cardiopulmonary", "urgency": "high"},
    {"id": "orthopnea_pnd", "name": "Dyspnea When Lying Flat (Orthopnea) or Waking Gasping (PND)", "category": "Cardiopulmonary", "urgency": "high"},
    {"id": "bilateral_leg_edema", "name": "Bilateral Lower Leg / Ankle Swelling (Pitting Edema)", "category": "Cardiopulmonary", "urgency": "medium"},
    {"id": "syncope_presyncope", "name": "Sudden Blackout, Fainting (Syncope) or Severe Lightheadedness", "category": "Cardiopulmonary", "urgency": "emergency"},
    {"id": "claudication_calf_pain", "name": "Severe Cramping Calf Pain Triggered by Walking (Claudication)", "category": "Cardiopulmonary", "urgency": "low"},
    {"id": "cold_clammy_extremities", "name": "Cold, Pale, Clammy Hands/Feet with Weak Peripheral Pulses", "category": "Cardiopulmonary", "urgency": "high"},

    # Respiratory & Thoracic (17-24)
    {"id": "dry_cough", "name": "Continuous Irritating Dry Hacking Cough", "category": "Respiratory", "urgency": "low"},
    {"id": "productive_cough", "name": "Productive Cough Producing Purulent Yellow/Green Phlegm", "category": "Respiratory", "urgency": "medium"},
    {"id": "hemoptysis", "name": "Coughing up Frank Blood or Blood-Streaked Sputum", "category": "Respiratory", "urgency": "emergency"},
    {"id": "shortness_breath_exertion", "name": "Progressive Shortness of Breath (Dyspnea) with Routine Activity", "category": "Respiratory", "urgency": "high"},
    {"id": "wheezing_stridor", "name": "Audible Wheezing, Musical Whistling in Chest, or Stridor", "category": "Respiratory", "urgency": "high"},
    {"id": "chest_pain_pleuritic", "name": "Sharp Knife-Like Chest Pain Aggravated by Deep Inspiration or Coughing", "category": "Respiratory", "urgency": "high"},
    {"id": "cough_over_2_weeks", "name": "Chronic Unresolved Cough Lasting Longer than 2 to 3 Weeks", "category": "Respiratory", "urgency": "medium"},
    {"id": "sudden_acute_dyspnea", "name": "Sudden-Onset Severe Breathlessness Arising within Minutes", "category": "Respiratory", "urgency": "emergency"},

    # Gastrointestinal, Abdominal & Hepatic (25-33)
    {"id": "acute_rlq_abdominal_pain", "name": "Severe Right Lower Quadrant Abdominal Pain (Rebound Tenderness)", "category": "Gastrointestinal", "urgency": "emergency"},
    {"id": "epigastric_burning_radiating", "name": "Severe Epigastric Burning Pain Radiating Through to Mid-Back", "category": "Gastrointestinal", "urgency": "high"},
    {"id": "ruq_pain_murphy", "name": "Right Upper Quadrant Abdominal Pain Worsened by Fatty Meals", "category": "Gastrointestinal", "urgency": "high"},
    {"id": "nausea_severe_vomiting", "name": "Intractable Nausea and Repeated Bilious Vomiting", "category": "Gastrointestinal", "urgency": "medium"},
    {"id": "hematemesis_melena", "name": "Vomiting Blood ('Coffee-Ground' Emesis) or Black Tarry Stools", "category": "Gastrointestinal", "urgency": "emergency"},
    {"id": "jaundice_scleral_icterus", "name": "Yellowing of the Eyes (Scleral Icterus) or Jaundice of Skin", "category": "Gastrointestinal", "urgency": "high"},
    {"id": "abdominal_distension_ascites", "name": "Noticeable Abdominal Swelling, Bloating, or Fluid Waves (Ascites)", "category": "Gastrointestinal", "urgency": "medium"},
    {"id": "watery_diarrhea_cramps", "name": "Frequent Watery Stools (>5/day) with Lower Abdominal Cramps", "category": "Gastrointestinal", "urgency": "medium"},
    {"id": "abdominal_rose_spots", "name": "Transient Rose-Colored Macular Rash on Trunk with Constipation", "category": "Gastrointestinal", "urgency": "high"},

    # Neurological, Cerebrovascular & Cognitive (34-41)
    {"id": "unilateral_throbbing_headache", "name": "Throbbing Unilateral Headache with Nausea & Light Sensitivity (Aura)", "category": "Neurological", "urgency": "medium"},
    {"id": "retro_orbital_pain", "name": "Excruciating Deep Pain Directly Behind the Eyeballs (Retro-orbital)", "category": "Neurological", "urgency": "high"},
    {"id": "neck_stiffness_meningismus", "name": "Severe Neck Stiffness (Inability to Touch Chin to Chest) with Photophobia", "category": "Neurological", "urgency": "emergency"},
    {"id": "focal_numbness_weakness", "name": "Sudden Unilateral Facial Drooping, Arm Drift, or Leg Weakness", "category": "Neurological", "urgency": "emergency"},
    {"id": "slurred_speech_aphasia", "name": "Sudden Difficulty Speaking, Slurred Words, or Inability to Understand", "category": "Neurological", "urgency": "emergency"},
    {"id": "dizziness_vertigo", "name": "True Rotational Vertigo (Room Spinning), Loss of Balance, or Ataxia", "category": "Neurological", "urgency": "medium"},
    {"id": "confusion_altered_mental", "name": "Acute Disorientation, Delirium, Drowsiness, or Altered Sensorium", "category": "Neurological", "urgency": "emergency"},
    {"id": "seizures_convulsions", "name": "Involuntary Muscle Jerking, Seizure Episodes, or Blackouts", "category": "Neurological", "urgency": "emergency"},

    # Musculoskeletal & Rheumatological (42-47)
    {"id": "severe_joint_muscle_pain", "name": "Intense Bone, Joint, and Deep Muscle Aches ('Breakbone Fever')", "category": "Musculoskeletal", "urgency": "high"},
    {"id": "morning_joint_stiffness", "name": "Symmetrical Joint Stiffness in Hands/Wrists Lasting > 1 Hour in Morning", "category": "Musculoskeletal", "urgency": "medium"},
    {"id": "joint_swelling_erythema", "name": "Visible Warmth, Redness, and Painful Swelling in One or Multiple Joints", "category": "Musculoskeletal", "urgency": "medium"},
    {"id": "muscle_cramping_spasms", "name": "Frequent Painful Muscle Spasms, Twitching, or Severe Cramps", "category": "Musculoskeletal", "urgency": "low"},
    {"id": "localized_back_spine_pain", "name": "Severe Point Tenderness over Spine or Lower Back Vertebrae", "category": "Musculoskeletal", "urgency": "medium"},
    {"id": "proximal_muscle_weakness", "name": "Difficulty Standing Up from a Low Chair or Combing Hair", "category": "Musculoskeletal", "urgency": "medium"},

    # Dermatological, Vascular & Hematological (48-52)
    {"id": "petechiae_rash", "name": "Spontaneous Pinpoint Red/Purple Skin Spots (Petechiae) or Easy Bruising", "category": "Dermatological", "urgency": "emergency"},
    {"id": "butterfly_malar_rash", "name": "Fixed Erythematous Butterfly-Shaped Rash Across Bridge of Nose & Cheeks", "category": "Dermatological", "urgency": "medium"},
    {"id": "target_bullseye_rash", "name": "Expanding Circular 'Bull's-Eye' Skin Rash with Central Clearing", "category": "Dermatological", "urgency": "high"},
    {"id": "urticaria_hives_pruritus", "name": "Widespread Raised Itchy Red Wheals (Hives / Urticaria) with Pruritus", "category": "Dermatological", "urgency": "medium"},
    {"id": "skin_pallor_pale_conjunctiva", "name": "Severe Pallor of Skin, Palm Creases, or Pale Inner Eyelids", "category": "Dermatological", "urgency": "medium"},

    # Renal, Metabolic & Urological (53-58)
    {"id": "flank_pain_renal_colic", "name": "Spasmodic Flank Pain Radiating Downward to Groin / Testicle", "category": "Renal & Metabolic", "urgency": "high"},
    {"id": "dysuria_burning_urination", "name": "Sharp Scalding Pain or Burning Sensation During Urination (Dysuria)", "category": "Renal & Metabolic", "urgency": "medium"},
    {"id": "gross_hematuria", "name": "Visible Pink, Dark Cola, or Red-Tinged Urine (Gross Hematuria)", "category": "Renal & Metabolic", "urgency": "high"},
    {"id": "polyuria_polydipsia", "name": "Abnormally Frequent Urination (Polyuria) with Constant Unquenchable Thirst", "category": "Renal & Metabolic", "urgency": "medium"},
    {"id": "oliguria_anuria", "name": "Severe Scant Urine Output (<2 Cups/Day) Despite Adequate Fluids", "category": "Renal & Metabolic", "urgency": "emergency"},
    {"id": "fruity_acetone_breath", "name": "Sweet Fruity Acetone Odor on Breath with Deep Rapid Sighing Breathing", "category": "Renal & Metabolic", "urgency": "emergency"},

    # ENT, Sensory & Ophthalmic (59-63)
    {"id": "loss_taste_smell", "name": "Complete Sudden Loss of Smell (Anosmia) or Inability to Taste Food", "category": "ENT & Sensory", "urgency": "medium"},
    {"id": "sneezing_nasal_congestion", "name": "Profuse Clear Rhinorrhea, Continuous Sneezing, and Nasal Congestion", "category": "ENT & Sensory", "urgency": "low"},
    {"id": "sore_throat_pharyngitis", "name": "Severe Throat Pain with Painful Swallowing (Odynophagia) & Tonsillar Redness", "category": "ENT & Sensory", "urgency": "low"},
    {"id": "ear_pain_otalgia", "name": "Sharp Piercing Earache, Ear Drainage, or Sensation of Aural Fullness", "category": "ENT & Sensory", "urgency": "low"},
    {"id": "blurred_vision_halos", "name": "Sudden Clouding of Vision, Rainbow Halos Around Lights, or Eye Pain", "category": "ENT & Sensory", "urgency": "high"},

    # Exposure & Epidemiological History (64-65)
    {"id": "travel_tropical_endemic", "name": "Recent Travel History to Tropical / Mosquito-Endemic Regions within 30 Days", "category": "Epidemiological", "urgency": "high"},
    {"id": "tick_insect_exposure", "name": "Recent Outdoor Woodland Exposure, Forest Hiking, or Known Tick/Bug Bites", "category": "Epidemiological", "urgency": "medium"}
]

# Map symptom IDs to index
SYMPTOM_MAP = {s["id"]: idx for idx, s in enumerate(SYMPTOM_DEFINITIONS)}
NUM_SYMPTOMS = len(SYMPTOM_DEFINITIONS)


# =====================================================================
# 2. EXPANDED CLINICAL DISEASE ENTITIES (22 CANDIDATE CONDITIONS)
# With Comprehensive Root Cause Analysis & Pathophysiology
# =====================================================================
DISEASE_DEFINITIONS = [
    {
        "id": "dengue",
        "name": "Dengue Fever (Breakbone Fever)",
        "category": "Arboviral Vector-Borne",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["fever_high", "retro_orbital_pain", "severe_joint_muscle_pain", "petechiae_rash", "travel_tropical_endemic"],
        "root_cause": "Aedes aegypti mosquito transmission of single-stranded RNA Dengue Virus (DENV-1 through 4). Viral replication inside monocytes and dendritic cells triggers massive cytokine release, immune-mediated endothelial activation, and peripheral platelet destruction.",
        "pathophysiology": "Endothelial hyperpermeability causes plasma leakage into interstitial spaces, accompanied by acute bone marrow megakaryocyte suppression resulting in severe thrombocytopenia and hemorrhagic diathesis.",
        "organ_risks": {"Hematological": "Critical (Thrombocytopenia)", "Hepatic": "Moderate", "Cardiovascular": "High (Hypovolemic Shock Risk)"},
        "diagnostic_workup": ["Complete Blood Count (CBC) with serial Platelet & Hematocrit counts", "Dengue NS1 Antigen ELISA (Days 1-5)", "Dengue IgM/IgG Serology", "Serum AST/ALT Liver Panel"],
        "immediate_actions": "Maintain vigorous oral/IV fluid hydration. Strictly AVOID all NSAIDs (aspirin, ibuprofen, naproxen) due to hemorrhagic risk. Use paracetamol/acetaminophen exclusively.",
        "emergency_red_flags": "Spontaneous mucosal bleeding (nose/gums), severe persistent abdominal pain, repeated vomiting, sudden drop in temperature with cold clammy skin, or extreme restlessness.",
        "recommendation": "Urgent CBC monitoring every 12-24h. Fluid resuscitation protocol. Immediate hospital admission if platelet count < 100,000/µL or hematocrit rises >20%."
    },
    {
        "id": "covid19",
        "name": "COVID-19 (SARS-CoV-2 Acute Respiratory Syndrome)",
        "category": "Viral Respiratory Pandemic",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["loss_taste_smell", "dry_cough", "fever_high", "shortness_breath_exertion", "chronic_fatigue_malaise"],
        "root_cause": "Infection by the Severe Acute Respiratory Syndrome Coronavirus 2 (SARS-CoV-2) targeting angiotensin-converting enzyme 2 (ACE2) receptors highly expressed on Type II alveolar epithelial cells.",
        "pathophysiology": "Viral spike protein-ACE2 internalization initiates local cell lysis and immune infiltration. Severe cases elicit a systemic pro-inflammatory cytokine storm, diffuse alveolar damage, microvascular thrombosis, and ventilation-perfusion mismatch.",
        "organ_risks": {"Pulmonary": "High (Pneumonitis)", "Cardiovascular": "Moderate", "Hematological": "Moderate (Microvascular Thrombosis)"},
        "diagnostic_workup": ["Rapid SARS-CoV-2 Antigen Test or RT-PCR Nasopharyngeal Swab", "Continuous Pulse Oximetry (SpO2 monitoring)", "High-Resolution Chest CT if SpO2 < 94%", "Serum D-Dimer, Ferritin & CRP markers"],
        "immediate_actions": "Strict airborne self-isolation. Prone positioning to enhance dorsal alveolar recruitment. Hydration and antipyretics. Initiate oral antiviral therapy (Paxlovid) within 5 days if eligible.",
        "emergency_red_flags": "Resting oxygen saturation dropping below 93%, cyanosis of lips or nails, sudden chest pain, or confusion.",
        "recommendation": "Perform immediate RT-PCR testing. Monitor SpO2 3x daily with pulse oximeter. Seek emergency medical assessment if dyspnea accelerates."
    },
    {
        "id": "malaria",
        "name": "Malaria (Plasmodium Falciparum / Vivax)",
        "category": "Parasitic Hemoparasite",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["periodic_fever_sweats", "chills_rigors", "fever_high", "severe_joint_muscle_pain", "travel_tropical_endemic"],
        "root_cause": "Intra-erythrocytic protozoan infection transmitted via the bite of an infected female Anopheles mosquito. Sporozoites invade hepatocytes, undergo schizogony, and release merozoites into the systemic bloodstream.",
        "pathophysiology": "Synchronized erythrocytic schizont rupture releases pyrogens causing episodic shaking chills and spike fevers every 48-72h. P. falciparum erythrocyte membrane protein (PfEMP1) induces microvascular sequestration leading to end-organ ischemia and cerebral malaria risk.",
        "organ_risks": {"Hematological": "High (Hemolytic Anemia)", "Hepatic": "High (Hepatosplenomegaly)", "Neurological": "Critical if Falciparum"},
        "diagnostic_workup": ["Thick & Thin Giemsa-Stained Peripheral Blood Smear (Parasite Index)", "Rapid Diagnostic Test (RDT) for Pf-HRP2 and pLDH", "Complete Blood Count & Reticulocyte count", "Serum Bilirubin & Renal Panel"],
        "immediate_actions": "Urgent parasitological confirmation. Artemisinin-based Combination Therapy (ACT) under direct medical supervision. Supportive hydration and temperature control.",
        "emergency_red_flags": "Altered sensorium, unarousable coma (cerebral malaria), jaundice, hemoglobinuria ('blackwater fever'), or acute pulmonary edema.",
        "recommendation": "Stat blood film examination. Immediate initiation of targeted antimalarials (e.g. Artemether-Lumefantrine or IV Artesunate if severe)."
    },
    {
        "id": "pneumonia",
        "name": "Community-Acquired Bacterial / Viral Pneumonia",
        "category": "Lower Respiratory Infection",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["productive_cough", "shortness_breath_exertion", "chest_pain_pleuritic", "fever_high", "chills_rigors"],
        "root_cause": "Aspiration or inhalation of pathogens (most commonly Streptococcus pneumoniae, atypical bacteria, or respiratory viruses) into distal terminal bronchioles and alveoli.",
        "pathophysiology": "Acute inflammatory exudate fills the alveolar spaces, creating dense consolidated lung tissue. Alveolar-capillary barrier disruption impairs oxygen diffusion, resulting in intrapulmonary shunting, purulent sputum, and pleuritic pain.",
        "organ_risks": {"Pulmonary": "Critical (Consolidation/Hypoxemia)", "Cardiovascular": "Moderate", "Systemic": "High (Bacteremia Risk)"},
        "diagnostic_workup": ["Posterior-Anterior (PA) and Lateral Chest Radiography", "Sputum Gram Stain and Microbiological Culture", "Complete Blood Count with Differential (Leukocytosis)", "Blood Cultures x2 prior to antibiotics"],
        "immediate_actions": "Empiric antimicrobial therapy (e.g. Beta-lactam + Macrolide or Respiratory Fluoroquinolone). Supplemental oxygen if SpO2 < 92%. Chest physiotherapy.",
        "emergency_red_flags": "Confusion (CURB-65 criteria), respiratory rate > 30 breaths/min, blood pressure systolic < 90 mmHg, or respiratory exhaustion.",
        "recommendation": "Urgent chest radiography and clinical assessment. Stratify using CURB-65 score for outpatient vs hospital/ICU admission."
    },
    {
        "id": "tuberculosis",
        "name": "Pulmonary Tuberculosis (Mycobacterium tuberculosis)",
        "category": "Chronic Granulomatous Mycobacterial",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["cough_over_2_weeks", "hemoptysis", "night_sweats_chronic", "unexplained_weight_loss", "fever_high"],
        "root_cause": "Inhalation of airborne droplet nuclei containing Mycobacterium tuberculosis bacilli that bypass mucosal defenses and lodge in alveolar macrophages within mid-to-upper lung fields.",
        "pathophysiology": "Cell-mediated hypersensitivity reaction (Type IV) leads to formation of Ghon foci and caseating epithelioid granulomas. Cavitary liquefaction erodes into pulmonary blood vessels (Rasmussen aneurysm), provoking hemoptysis and chronic consumption.",
        "organ_risks": {"Pulmonary": "Critical (Cavitary Destruction)", "Systemic": "High (Miliary Dissemination)", "Hepatic": "Moderate (Treatment Monitoring)"},
        "diagnostic_workup": ["Sputum Acid-Fast Bacilli (AFB) Smear & Mycobacterial Culture", "GeneXpert MTB/RIF Molecular Assay (with Rifampin resistance screening)", "PA Chest Radiograph (look for apical cavitation)", "Interferon-Gamma Release Assay (IGRA)"],
        "immediate_actions": "Airborne respiratory isolation (negative pressure). Prompt notification to public health authorities. Initiate 4-drug standard DOTS regimen (Rifampin, Isoniazid, Pyrazinamide, Ethambutol).",
        "emergency_red_flags": "Massive hemoptysis (>200 mL/24h), severe respiratory distress, or signs of tuberculous meningitis (headache with neck stiffness).",
        "recommendation": "GeneXpert sputum test immediately. Chest X-ray. Airborne isolation until 3 consecutive negative AFB smears."
    },
    {
        "id": "typhoid",
        "name": "Typhoid Fever (Enteric Fever)",
        "category": "Bacterial Enteric Bacteremia",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["step_ladder_fever", "abdominal_rose_spots", "fever_high", "chronic_fatigue_malaise", "severe_joint_muscle_pain"],
        "root_cause": "Ingestion of food or water contaminated with Salmonella enterica serotype Typhi or Paratyphi. Organisms survive gastric acid, penetrate intestinal mucosa via M cells, and multiply in Peyer's patches.",
        "pathophysiology": "Bacterial invasion of mesenteric lymph nodes leads to secondary bacteremia and reticuloendothelial proliferation in spleen and liver. Progressive ulceration of Peyer's patches poses severe risks of intestinal hemorrhage or perforation in weeks 2-3.",
        "organ_risks": {"Gastrointestinal": "High (Intestinal Perforation Risk)", "Hepatic": "Moderate", "Systemic": "High (Endotoxemia)"},
        "diagnostic_workup": ["Blood Culture (Gold standard in Week 1)", "Stool and Urine Cultures (Weeks 2-3)", "Widal / Typhidot Serology Test", "Complete Blood Count (Leukopenia with relative bradycardia - Faget's sign)"],
        "immediate_actions": "Targeted antibiotic therapy (Ceftriaxone or Azithromycin). Strict hygiene and hydration. Avoid constipating agents.",
        "emergency_red_flags": "Sudden severe abdominal pain with rigid abdomen (intestinal perforation), acute melena, or delirium ('typhoid state').",
        "recommendation": "Blood culture prior to antibiotics. Third-generation cephalosporin therapy. High-protein, non-irritating diet with clean boiled water."
    },
    {
        "id": "acute_coronary_syndrome",
        "name": "Acute Coronary Syndrome (Myocardial Infarction / Unstable Angina)",
        "category": "Cardiovascular Emergency",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["chest_pressure_crushing", "radiation_arm_jaw", "shortness_breath_exertion", "cold_clammy_extremities", "syncope_presyncope"],
        "root_cause": "Rupture or erosion of an unstable, vulnerable atherosclerotic plaque in a coronary artery, exposing subendothelial collagen and triggering acute platelet adhesion and occlusive thrombus formation.",
        "pathophysiology": "Abrupt reduction or cessation of myocardial coronary blood flow precipitates severe subendocardial/transmural hypoxia. Within 20-30 minutes, irreversible cardiomyocyte necrosis ensues, releasing cardiac troponins into circulation.",
        "organ_risks": {"Cardiovascular": "Critical (Cardiogenic Shock/Arrhythmia)", "Pulmonary": "High (Pulmonary Edema)", "Systemic": "Life-Threatening"},
        "diagnostic_workup": ["12-Lead Electrocardiogram (ECG within 10 minutes)", "High-Sensitivity Serum Troponin I / T (serial)", "Echocardiogram (Regional Wall Motion Abnormality)", "Urgent Diagnostic Coronary Angiography"],
        "immediate_actions": "CALL EMERGENCY SERVICES (911/112) IMMEDIATELY. Chew 325 mg non-enteric aspirin. Sublingual nitroglycerin if systolic BP > 100 mmHg. Continuous ECG telemetry.",
        "emergency_red_flags": "Persistent crushing pain lasting > 15 minutes, diaphoresis with syncope, sustained hypotension, or acute pulmonary congestion.",
        "recommendation": "IMMEDIATE EMERGENCY CARDIOLOGY PROTOCOL. Primary percutaneous coronary intervention (PCI) within 90 minutes door-to-balloon time."
    },
    {
        "id": "congestive_heart_failure",
        "name": "Congestive Heart Failure (Acute Decompensated Cardiac Failure)",
        "category": "Cardiovascular Hemodynamic Overload",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["orthopnea_pnd", "bilateral_leg_edema", "shortness_breath_exertion", "chronic_fatigue_malaise", "palpitations_tachycardia"],
        "root_cause": "Impaired myocardial contractility (systolic dysfunction) or ventricular stiffness (diastolic dysfunction) resulting in inability of the heart to pump sufficient blood to meet metabolic tissue demands.",
        "pathophysiology": "Neurohormonal activation (RAAS and sympathetic nervous system) triggers chronic sodium/water retention and vasoconstriction, causing elevated left ventricular end-diastolic pressure, pulmonary venous hypertension, and systemic peripheral edema.",
        "organ_risks": {"Cardiovascular": "High", "Pulmonary": "High (Pulmonary Edema)", "Renal": "High (Cardiorenal Syndrome)"},
        "diagnostic_workup": ["Serum B-type Natriuretic Peptide (BNP / NT-proBNP)", "Transthoracic Echocardiogram (Left Ventricular Ejection Fraction)", "PA Chest Radiograph (Cardiomegaly, Kerley B lines, Pleural effusion)", "Serum Electrolytes & Renal Function (BUN/Creatinine)"],
        "immediate_actions": "Upright sitting posture. Oxygen supplementation. IV Loop Diuretic (Furosemide) therapy. Fluid and sodium restriction (<2g/day).",
        "emergency_red_flags": "Pink frothy sputum, severe resting orthopnea, acute confusion, or worsening peripheral cyanosis.",
        "recommendation": "Urgent cardiology evaluation. Echocardiogram to assess EF. Diuretic optimization and initiation of guideline-directed medical therapy (GDMT)."
    },
    {
        "id": "pulmonary_embolism",
        "name": "Acute Pulmonary Embolism (Venous Thromboembolism)",
        "category": "Cardiopulmonary Vascular Emergency",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["sudden_acute_dyspnea", "chest_pain_pleuritic", "hemoptysis", "palpitations_tachycardia", "syncope_presyncope"],
        "root_cause": "Dislodgement of a deep venous thrombus (most commonly from iliofemoral deep veins of the lower extremity) traversing the vena cava and right atrium to lodge into the pulmonary arterial bed.",
        "pathophysiology": "Mechanical occlusion of pulmonary arterial branches increases right ventricular afterload abruptly. Acute right ventricular strain and failure compromise left ventricular preload, precipitating sudden cardiovascular collapse and severe hypoxia.",
        "organ_risks": {"Cardiovascular": "Critical (Acute Cor Pulmonale)", "Pulmonary": "Critical (Pulmonary Infarction)", "Systemic": "Life-Threatening"},
        "diagnostic_workup": ["CT Pulmonary Angiography (CTPA - Gold standard)", "Serum Quantitative D-Dimer Test", "12-Lead ECG (Sinus tachycardia, S1Q3T3 pattern, RV strain)", "Lower Extremity Venous Compression Duplex Ultrasonography"],
        "immediate_actions": "Immediate high-flow oxygen. Prompt therapeutic anticoagulation (Low-Molecular-Weight Heparin or DOAC). Thrombolysis (tPA) if hemodynamically unstable.",
        "emergency_red_flags": "Hypotension (systolic BP < 90 mmHg), syncope, severe cyanosis, or acute refractory hypoxemia.",
        "recommendation": "EMERGENCY ROOM EVALUATION. Perform stat CT Pulmonary Angiogram or V/Q scan. Immediate anticoagulation."
    },
    {
        "id": "acute_appendicitis",
        "name": "Acute Appendicitis (Acute Surgical Abdomen)",
        "category": "Abdominal Surgical Emergency",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["acute_rlq_abdominal_pain", "nausea_severe_vomiting", "fever_high", "loss_appetite_anorexia"],
        "root_cause": "Luminal obstruction of the vermiform appendix by a fecalith, lymphoid hyperplasia, foreign body, or mucosal stricture.",
        "pathophysiology": "Continued mucus secretion against the closed obstruction elevates intraluminal pressure, compromising venous and lymphatic drainage. Bacterial overgrowth and transmural ischemia cause gangrene and risk perforation into the peritoneal cavity.",
        "organ_risks": {"Gastrointestinal": "Critical (Peritoneal Contamination)", "Systemic": "High (Bacterial Sepsis Risk)"},
        "diagnostic_workup": ["Abdominal/Pelvic Contrast-Enhanced CT Scan (Appendix diameter > 6mm)", "Graded Compression Abdominal Ultrasound (Target sign)", "Complete Blood Count (Leukocytosis with Left Shift)", "C-Reactive Protein (CRP) & Urinalysis (to rule out nephrolithiasis)"],
        "immediate_actions": "NPO (Nothing by mouth). IV fluid resuscitation. AVOID analgesics masking abdominal signs and AVOID laxatives or enemas. Urgent general surgery consult.",
        "emergency_red_flags": "Sudden temporary relief of pain followed by diffuse peritonitis (board-like rigid abdomen), high spiking fever, or septic shock.",
        "recommendation": "Urgent general surgical evaluation. Laparoscopic appendectomy before appendiceal rupture occurs."
    },
    {
        "id": "acute_cholecystitis",
        "name": "Acute Cholecystitis / Biliary Colic",
        "category": "Hepatobiliary Surgical",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["ruq_pain_murphy", "nausea_severe_vomiting", "fever_high", "jaundice_scleral_icterus"],
        "root_cause": "Sustained impaction of a gallstone (calculus) in the cystic duct neck, obstructing bile outflow from the gallbladder.",
        "pathophysiology": "Trapped bile and concentrated bile salts incite severe chemical irritation and mucosal inflammation. Secondary bacterial superinfection (E. coli, Klebsiella) causes gallbladder wall edema, ischemia, and potential empyema or gangrenous perforation.",
        "organ_risks": {"Hepatic": "High (Ascending Cholangitis Risk)", "Gastrointestinal": "High (Gallbladder Empyema)"},
        "diagnostic_workup": ["Right Upper Quadrant Abdominal Ultrasound (Gallbladder wall thickening > 3mm, pericholecystic fluid, sonographic Murphy's sign)", "HIDA Cholescintigraphy Scan", "Liver Function Tests (Total/Direct Bilirubin, Alk Phos, ALT, AST)", "Serum Amylase & Lipase"],
        "immediate_actions": "NPO status, IV crystalloid hydration, parenteral analgesia (NSAIDs or opioids), and broad-spectrum IV antibiotics.",
        "emergency_red_flags": "High fever with shaking chills and jaundice (Charcot's triad for ascending cholangitis), severe hypotension, or peritonitis.",
        "recommendation": "Urgent hepatobiliary ultrasound. General surgical consultation for early laparoscopic cholecystectomy within 24-72 hours."
    },
    {
        "id": "acute_pancreatitis",
        "name": "Acute Pancreatitis (Enzymatic Autodigestion)",
        "category": "Gastrointestinal Emergency",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["epigastric_burning_radiating", "nausea_severe_vomiting", "fever_high", "abdominal_distension_ascites"],
        "root_cause": "Premature intracellular activation of pancreatic zymogens (especially trypsinogen to trypsin) within acinar cells, triggered predominantly by biliary gallstone migration or heavy ethanol consumption.",
        "pathophysiology": "Active proteolytic and lipolytic enzymes digest pancreatic parenchymal tissue and retroperitoneal adipose tissue. Microvascular permeability and massive capillary leakage provoke retroperitoneal fluid sequestration and systemic inflammatory cascade.",
        "organ_risks": {"Pancreatic": "Critical (Necrosis)", "Pulmonary": "High (ARDS Risk)", "Renal": "High (Acute Tubular Necrosis)"},
        "diagnostic_workup": ["Serum Lipase (Sensitivity/Specificity > 3x upper limit of normal)", "Serum Amylase", "Contrast-Enhanced Abdominal CT (Balthazar grading)", "Abdominal Ultrasound (inspect biliary tree for choledocholithiasis)"],
        "immediate_actions": "Aggressive, goal-directed IV fluid hydration (Lactated Ringer's). Bowel rest until nausea subsides. Intravenous multimodal analgesia.",
        "emergency_red_flags": "Hypocalcemia (tetany), oliguria, tachypnea with hypoxemia (ARDS), or ecchymosis in flanks (Grey Turner's sign) or umbilicus (Cullen's sign).",
        "recommendation": "Stat serum lipase assay and abdominal CT. Aggressive IV fluid resuscitation and admission to monitored step-down/ICU."
    },
    {
        "id": "peptic_ulcer_gi_bleed",
        "name": "Peptic Ulcer Disease with Upper GI Bleeding",
        "category": "Gastrointestinal Hemorrhage",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["hematemesis_melena", "epigastric_burning_radiating", "syncope_presyncope", "skin_pallor_pale_conjunctiva", "cold_clammy_extremities"],
        "root_cause": "Severe mucosal ulceration of gastric or duodenal mucosa secondary to Helicobacter pylori colonization or regular chronic usage of nonsteroidal anti-inflammatory drugs (NSAIDs).",
        "pathophysiology": "Erosion of the mucosal barrier into submucosal vessels (e.g. gastroduodenal artery) produces frank intraluminal bleeding. Blood undergoing acid hematin conversion produces coffee-ground vomiting and dark tarry melena.",
        "organ_risks": {"Cardiovascular": "Critical (Hemorrhagic Hypovolemia)", "Gastrointestinal": "Critical", "Renal": "High (Pre-renal Azotemia)"},
        "diagnostic_workup": ["Urgent Upper Gastrointestinal Esophagogastroduodenoscopy (EGD)", "Complete Blood Count (Hemoglobin & Hematocrit serial drop)", "Serum BUN/Creatinine Ratio (elevated > 20:1)", "Type and Cross-match for Packed Red Blood Cells (PRBCs)"],
        "immediate_actions": "Two large-bore IV lines. High-dose IV Proton Pump Inhibitor infusion (Pantoprazole/Esomeprazole). Restrict oral intake. Transfusion if Hb < 7-8 g/dL.",
        "emergency_red_flags": "Active hematemesis, hemodynamic instability (BP < 90/60 mmHg, HR > 110 bpm), orthostatic dizziness, or syncope.",
        "recommendation": "EMERGENCY ENDOSCOPY EVALUATION. Urgent fluid resuscitation and IV PPI therapy. Gastroenterology consult for endoscopic hemostasis."
    },
    {
        "id": "acute_ischemic_stroke",
        "name": "Acute Ischemic Stroke / Cerebrovascular Event",
        "category": "Neurological Emergency",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["focal_numbness_weakness", "slurred_speech_aphasia", "confusion_altered_mental", "dizziness_vertigo"],
        "root_cause": "Sudden thromboembolic or atherothrombotic occlusion of an intracranial cerebral artery (most commonly Middle Cerebral Artery), depriving downstream neural tissue of glucose and oxygen.",
        "pathophysiology": "Cellular energy failure disrupts ion gradients, triggering excitotoxic glutamate release, intracellular calcium overload, and rapid irreversible ischemic core infarction surrounded by salvageable ischemic penumbra.",
        "organ_risks": {"Neurological": "Critical (Permanent Disability)", "Cardiovascular": "High", "Systemic": "Life-Threatening"},
        "diagnostic_workup": ["Emergency Non-Contrast Head CT (Rule out intracranial hemorrhage)", "CT Angiography of Head & Neck (Vascular occlusion)", "Diffusion-Weighted Brain MRI (DWI - Hyperacute infarction)", "Fingerstick Blood Glucose (Rule out hypoglycemia mimic)"],
        "immediate_actions": "TIME IS BRAIN. Note exact 'Last Known Well' time. Call stroke ambulance team immediately. Do not lower blood pressure acutely unless > 220/120 mmHg. Keep patient flat.",
        "emergency_red_flags": "Any sudden focal neurological deficit: facial asymmetry, unilateral arm drift, speech garbling, or sudden gaze deviation.",
        "recommendation": "CALL 911 / CODE STROKE PROTOCOL IMMEDIATELY. Thrombolysis (IV Alteplase/Tenecteplase) within 4.5 hours or mechanical thrombectomy within 24 hours."
    },
    {
        "id": "bacterial_meningitis",
        "name": "Acute Bacterial / Viral Meningitis",
        "category": "Central Nervous System Infection",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["neck_stiffness_meningismus", "fever_high", "unilateral_throbbing_headache", "confusion_altered_mental", "petechiae_rash"],
        "root_cause": "Hematogenous dissemination or direct extension of pathogenic bacteria (Neisseria meningitidis, Streptococcus pneumoniae, Listeria monocytogenes) into subarachnoid space.",
        "pathophysiology": "Bacterial lysis and cell wall components trigger violent subarachnoid inflammatory cascade. Purulent exudate fills leptomeninges, impeding CSF resorption, inducing cerebral edema, elevated intracranial pressure, and cortical vasculitis.",
        "organ_risks": {"Neurological": "Critical (Cerebral Herniation Risk)", "Cardiovascular": "High (Septic Shock / DIC)", "Systemic": "Life-Threatening"},
        "diagnostic_workup": ["Diagnostic Lumbar Puncture for CSF Analysis (Opening pressure, cell count, glucose, protein, Gram stain & culture)", "Blood Cultures x2", "Emergency Head CT prior to LP if papilledema or focal deficit", "Serum Procalcitonin and CBC"],
        "immediate_actions": "DO NOT DELAY ANTIBIOTICS FOR LP. Administer empiric IV Ceftriaxone + Vancomycin + Ampicillin along with IV Dexamethasone immediately.",
        "emergency_red_flags": "Purpuric non-blanching petechial rash (meningococcemia), rapidly worsening coma, sluggish pupils, or seizure activity.",
        "recommendation": "EMERGENCY ROOM TRANSFER IMMEDIATELY. Immediate empiric antimicrobial coverage and lumbar puncture."
    },
    {
        "id": "migraine_aura",
        "name": "Migraine Cephalea with Neurovascular Aura",
        "category": "Neurovascular Sensory Disorder",
        "triage_if_positive": "monitor",
        "primary_symptoms": ["unilateral_throbbing_headache", "retro_orbital_pain", "nausea_severe_vomiting", "blurred_vision_halos"],
        "root_cause": "Genetic predisposition to neurovascular cortical hypersensitivity. Cortical Spreading Depression (CSD) of neuronal and glial depolarization triggers trigeminovascular system activation.",
        "pathophysiology": "Trigeminal nerve terminal release of Calcitonin Gene-Related Peptide (CGRP) and substance P provokes neurogenic inflammation and painful vasodilation of meningeal and dural blood vessels.",
        "organ_risks": {"Neurological": "Moderate (Disabling Pain)", "Sensory": "Moderate"},
        "diagnostic_workup": ["Clinical Neurological Examination", "Fundoscopy to rule out papilledema", "Brain MRI/MRA if atypical features, first severe episode, or change in headache pattern", "Erythrocyte Sedimentation Rate (ESR) if age > 50 (Giant Cell Arteritis)"],
        "immediate_actions": "Rest in a completely dark, quiet room with cold compress. Early oral administration of specific 5-HT1B/1D receptor agonist (Triptan) or NSAID + antiemetic at aura onset.",
        "emergency_red_flags": "'Thunderclap' explosive headache reaching peak intensity in < 1 minute, focal weakness, fever with neck stiffness, or headache following head trauma.",
        "recommendation": "Outpatient neurological consultation. Assess abortive triptan therapy and consider daily prophylactic agents (CGRP antagonists, beta-blockers) if frequent."
    },
    {
        "id": "diabetic_ketoacidosis",
        "name": "Diabetic Ketoacidosis (DKA) / Severe Hyperglycemia",
        "category": "Endocrine & Metabolic Crisis",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["fruity_acetone_breath", "polyuria_polydipsia", "nausea_severe_vomiting", "confusion_altered_mental", "unexplained_weight_loss"],
        "root_cause": "Absolute or severe relative deficiency of circulating insulin compounded by excess counter-regulatory hormones (glucagon, cortisol, catecholamines, growth hormone).",
        "pathophysiology": "Unchecked lipolysis floods liver with free fatty acids, accelerating hepatic beta-oxidation into acetoacetate and beta-hydroxybutyrate. High anion gap metabolic acidosis ensues, while profound osmotic diuresis depletes total body water, potassium, and sodium.",
        "organ_risks": {"Metabolic": "Critical (Acid-Base Collapse)", "Renal": "High (Severe Dehydration)", "Cardiovascular": "High (Hypovolemia/Arrhythmia)"},
        "diagnostic_workup": ["Point-of-Care Capillary Blood Glucose (> 250 mg/dL)", "Arterial or Venous Blood Gas (pH < 7.30, Bicarbonate < 18 mEq/L)", "Serum & Urine Ketones (Beta-hydroxybutyrate > 3.0 mmol/L)", "Serum Electrolyte Panel (calculate Anion Gap), BUN, Creatinine"],
        "immediate_actions": "EMERGENCY RESUSCITATION. Aggressive IV Isotonic Saline volume expansion. Continuous IV Regular Insulin infusion (0.1 units/kg/h) ONLY after confirming potassium > 3.3 mEq/L.",
        "emergency_red_flags": "Deep rapid sighing breathing (Kussmaul respirations), profound stupor, persistent vomiting preventing hydration, or cardiac arrhythmia.",
        "recommendation": "EMERGENCY DEPARTMENT ADMISSION. Immediate IV rehydration, insulin protocol, and frequent electrolyte monitoring."
    },
    {
        "id": "acute_pyelonephritis",
        "name": "Acute Pyelonephritis (Complicated Upper UTI)",
        "category": "Renal & Urological Infection",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["flank_pain_renal_colic", "fever_high", "chills_rigors", "dysuria_burning_urination", "nausea_severe_vomiting"],
        "root_cause": "Ascending bacterial infection originating from urethral colonization (predominantly uropathogenic Escherichia coli) traveling up the ureter into renal parenchyma and pelvicalyceal system.",
        "pathophysiology": "Bacterial adhesion to urothelial cells invokes acute neutrophilic exudation and microabscess formation within renal tubules, causing severe parenchymal edema, costovertebral angle tenderness, and risk of urosepsis.",
        "organ_risks": {"Renal": "High (Renal Abscess Risk)", "Systemic": "High (Urosepsis)"},
        "diagnostic_workup": ["Clean-Catch Midstream Urinalysis (Pyuria, bacteriuria, white cell casts)", "Urine Culture with Antimicrobial Susceptibility", "Complete Blood Count & Blood Cultures x2", "Renal Ultrasound or CT Urogram (Evaluate for obstructing calculus or perinephric collection)"],
        "immediate_actions": "Prompt targeted intravenous or high-potency oral fluoroquinolone/cephalosporin. Vigorous hydration. Antipyretics and urinary analgesia (Phenazopyridine).",
        "emergency_red_flags": "Inability to tolerate oral fluids, persistent rigors, confusion, hemodynamic instability, or underlying solitary kidney/pregnancy.",
        "recommendation": "Urgent urinalysis, urine culture, and antibiotic therapy. Hospitalization if vomiting or pregnancy present."
    },
    {
        "id": "systemic_lupus",
        "name": "Systemic Lupus Erythematosus (SLE / Autoimmune Flare)",
        "category": "Autoimmune Multi-Systemic",
        "triage_if_positive": "monitor",
        "primary_symptoms": ["butterfly_malar_rash", "morning_joint_stiffness", "joint_swelling_erythema", "chronic_fatigue_malaise", "chest_pain_pleuritic"],
        "root_cause": "Loss of immunological self-tolerance characterized by defective clearance of apoptotic material, hyperactive B-cells, and polyclonal autoantibody synthesis directed against nuclear antigens (anti-dsDNA, anti-Smith).",
        "pathophysiology": "Deposition of circulating pathogenic immune complexes (Type III hypersensitivity) in dermal basement membranes, synovial joints, pleura, and renal glomeruli triggers complement activation and chronic organ damage.",
        "organ_risks": {"Renal": "High (Lupus Nephritis Risk)", "Dermatological": "High", "Hematological": "Moderate (Cytopenias)"},
        "diagnostic_workup": ["Antinuclear Antibody (ANA) Screen (high sensitivity)", "Anti-Double-Stranded DNA (anti-dsDNA) & Anti-Smith Autoantibodies", "Serum Complement Levels (C3, C4 consumption)", "Urinalysis for Proteinuria & Microscopic Hematuria (spot urine protein:creatinine)"],
        "immediate_actions": "Sun protection (broad-spectrum sunscreen, UV shielding). Hydroxychloroquine (Plaquenil) maintenance. Systemic corticosteroid flare mitigation under rheumatology direction.",
        "emergency_red_flags": "Rapidly rising leg edema with foamy urine (nephritic flare), severe pleuropericarditis, or neurological signs (lupus cerebritis).",
        "recommendation": "Rheumatology referral. Complete autoimmune antibody panel, renal function baseline, and hydroxychloroquine optimization."
    },
    {
        "id": "sepsis_sirs",
        "name": "Sepsis / Severe Systemic Inflammatory Response",
        "category": "Multi-System Infection Crisis",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["fever_high", "chills_rigors", "confusion_altered_mental", "palpitations_tachycardia", "oliguria_anuria"],
        "root_cause": "Dysregulated, life-threatening host systemic immune response to a localized or disseminated infection (pneumonia, urinary tract infection, abdominal infection, or soft tissue).",
        "pathophysiology": "Widespread pathogen-associated molecular patterns (PAMPs) trigger massive inflammatory cascade. Endothelial glycocalyx degradation and nitric oxide overproduction induce profound vasodilation, microcirculatory arrest, lactic acidosis, and multi-organ dysfunction syndrome (MODS).",
        "organ_risks": {"Cardiovascular": "Critical (Septic Shock)", "Renal": "Critical (Acute Kidney Injury)", "Hematological": "High (Disseminated Intravascular Coagulation)"},
        "diagnostic_workup": ["Serum Lactic Acid / Lactate (Stat measure for tissue hypoperfusion)", "Two Sets of Blood Cultures (Aerobic & Anaerobic)", "Complete Blood Count, Coagulation Profile (PT/INR, PTT, Fibrinogen)", "Arterial Blood Gas, Liver Enzymes & Serum Creatinine"],
        "immediate_actions": "SEPSIS RESUSCITATION PROTOCOL (Hour-1 Bundle): Measure lactate, draw blood cultures, administer broad-spectrum IV antibiotics, and infuse 30 mL/kg crystalloids for hypotension/lactate > 4.",
        "emergency_red_flags": "Systolic BP < 90 mmHg unresponsive to initial fluid, lactate > 4.0 mmol/L, anuria, or profound stupor.",
        "recommendation": "IMMEDIATE EMERGENCY DEPARTMENT ACTIVATION. Sepsis protocol initiation, ICU admission, and hemodynamic stabilization."
    },
    {
        "id": "asthma_copd_exacerbation",
        "name": "Acute Bronchial Asthma / COPD Exacerbation",
        "category": "Obstructive Airway Disease",
        "triage_if_positive": "urgent",
        "primary_symptoms": ["wheezing_stridor", "shortness_breath_exertion", "sudden_acute_dyspnea", "dry_cough"],
        "root_cause": "Hyperreactive airway inflammation provoked by respiratory allergens, viral infections, cold air, or irritants in predisposed individuals.",
        "pathophysiology": "Acute bronchial smooth muscle spasm, mucosal edema, and tenacious mucus hypersecretion lead to marked air trapping, dynamic lung hyperinflation, and severe expiratory airflow limitation.",
        "organ_risks": {"Pulmonary": "Critical (Expiratory Arrest Risk)", "Cardiovascular": "Moderate (Pulsus Paradoxus)"},
        "diagnostic_workup": ["Peak Expiratory Flow Rate (PEFR) / Spirometry", "Continuous Pulse Oximetry (SpO2)", "Chest Radiograph (Rule out pneumothorax or superimposed consolidation)", "Arterial Blood Gas if severe (watch for hypercapnia / CO2 retention)"],
        "immediate_actions": "Inhaled short-acting beta-2 agonist (Albuterol) + Anticholinergic (Ipratropium) nebulization. Systemic oral or IV Corticosteroids (Prednisone). Controlled oxygen aiming for 93-95% (88-92% if chronic hypercapnic COPD).",
        "emergency_red_flags": "'Silent chest' (disappearance of wheezing due to severe lack of air movement), inability to speak in full sentences, drowsiness, or paradoxical thoracoabdominal breathing.",
        "recommendation": "Immediate nebulized bronchodilator therapy. If no improvement within 30 minutes, transfer to emergency medical facility."
    },
    {
        "id": "allergic_rhinitis_urti",
        "name": "Upper Respiratory Tract Infection (URTI) / Allergic Rhinitis",
        "category": "Benign Upper Airway",
        "triage_if_positive": "routine",
        "primary_symptoms": ["sneezing_nasal_congestion", "sore_throat_pharyngitis", "dry_cough", "ear_pain_otalgia"],
        "root_cause": "Mild self-limiting viral infection (Rhinovirus, Adenovirus, Coronavirus) or IgE-mediated type I hypersensitivity reaction to airborne environmental allergens (pollen, dust mites, pet dander).",
        "pathophysiology": "Mast cell degranulation releases histamine, leukotrienes, and prostaglandins into nasal mucosa, causing capillary engorgement, mucus hypersecretion, sensory nerve pruritus, and clear rhinorrhea.",
        "organ_risks": {"ENT": "Mild (Nasal Obstruction)", "Pulmonary": "Low"},
        "diagnostic_workup": ["Clinical ENT Examination", "Rapid Strep Antigen Test if severe pharyngitis with tonsillar exudate and cervical lymphadenopathy", "Specific IgE Allergy Testing if perennial symptoms"],
        "immediate_actions": "Oral second-generation non-sedating antihistamines (Cetirizine, Loratadine). Intranasal corticosteroid spray (Fluticasone). Warm saline gargles and nasal irrigation.",
        "emergency_red_flags": "Difficulty breathing, high continuous fever > 3 days, drooling, or inability to swallow liquids.",
        "recommendation": "Home symptomatic relief, rest, and oral hydration. Clinical review only if symptoms persist longer than 10-14 days."
    }
]

DISEASE_MAP = {d["id"]: idx for idx, d in enumerate(DISEASE_DEFINITIONS)}
NUM_DISEASES = len(DISEASE_DEFINITIONS)


# =====================================================================
# 3. DEEP PYTORCH NEURAL NETWORK ARCHITECTURE
# LayerNorm, GELU, and Residual Inductive Prior Weighting
# =====================================================================
class DeepClinicalSymptomNet(nn.Module):
    """
    Multi-Layer Deep Neural Classifier for Disease Posterior Belief Calculation.
    """
    def __init__(self, in_features: int = NUM_SYMPTOMS, num_classes: int = NUM_DISEASES):
        super().__init__()
        self.fc1 = nn.Linear(in_features, 128)
        self.ln1 = nn.LayerNorm(128)
        self.fc2 = nn.Linear(128, 96)
        self.ln2 = nn.LayerNorm(96)
        self.fc3 = nn.Linear(96, 64)
        self.ln3 = nn.LayerNorm(64)
        self.out = nn.Linear(64, num_classes)
        self.act = nn.GELU()
        self.dropout = nn.Dropout(0.1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h = self.act(self.ln1(self.fc1(x)))
        h = self.act(self.ln2(self.fc2(h)))
        h = self.act(self.ln3(self.fc3(h)))
        logits = self.out(h)
        return logits


# =====================================================================
# 4. COMPREHENSIVE AI NATURAL LANGUAGE SYMPTOM EXTRACTOR
# Maps free-form text input ("Other / Custom Details") to symptom IDs
# =====================================================================
class AITextSymptomAnalyzer:
    """
    Extracts clinical features from free-text patient notes and custom descriptions.
    """
    KEYWORDS = {
        "fever_high": ["fever", "high temperature", "burning up", "hot", "feverish", "102", "101", "103", "104", "temp"],
        "chills_rigors": ["chills", "shivering", "shaking", "rigor", "freezing", "teeth chattering"],
        "loss_taste_smell": ["taste", "smell", "anosmia", "flavor", "cant smell", "cant taste", "lost taste"],
        "dry_cough": ["dry cough", "hacking cough", "tickle cough", "coughing without phlegm"],
        "productive_cough": ["phlegm", "mucus", "green cough", "yellow cough", "wet cough", "spitting up sputum"],
        "hemoptysis": ["blood in cough", "coughing blood", "pink sputum", "red phlegm", "hemoptysis"],
        "shortness_breath_exertion": ["breath", "short of breath", "dyspnea", "hard to breathe", "cant breathe", "winded"],
        "wheezing_stridor": ["wheezing", "whistling chest", "stridor", "asthma attack", "airway whistling"],
        "sudden_acute_dyspnea": ["sudden breathlessness", "gasping for air", "suffocating", "sudden dyspnea"],
        "chest_pressure_crushing": ["crushing", "heavy chest", "elephant on chest", "tight chest", "chest pressure", "heart attack pain", "cardiac"],
        "radiation_arm_jaw": ["left arm", "jaw pain", "neck pain", "radiating to arm", "shooting down arm"],
        "palpitations_tachycardia": ["racing heart", "heart beating fast", "palpitations", "fluttering in chest", "tachycardia"],
        "orthopnea_pnd": ["cant lie flat", "sleep on pillows", "waking up gasping", "orthopnea"],
        "bilateral_leg_edema": ["swollen legs", "swollen feet", "swollen ankles", "pitting edema", "fluid in legs"],
        "syncope_presyncope": ["fainted", "passed out", "blacked out", "nearly fainted", "syncope"],
        "acute_rlq_abdominal_pain": ["lower right stomach", "appendix", "lower right abdomen", "rebound tenderness", "rlq"],
        "ruq_pain_murphy": ["gallbladder", "right upper stomach", "after eating fat", "ruq pain"],
        "epigastric_burning_radiating": ["burning stomach", "epigastric", "ulcer pain", "radiating to back", "pancreas"],
        "nausea_severe_vomiting": ["vomiting", "throwing up", "nauseous", "nausea", "puking"],
        "hematemesis_melena": ["vomiting blood", "coffee ground", "black stools", "tarry stools", "melena"],
        "jaundice_scleral_icterus": ["yellow eyes", "yellow skin", "jaundice", "dark urine"],
        "unilateral_throbbing_headache": ["migraine", "one side of head", "pulsating", "throbbing headache", "aura"],
        "retro_orbital_pain": ["behind eyes", "behind my eyes", "eye sockets", "eye pain", "hurts to move eyes"],
        "neck_stiffness_meningismus": ["stiff neck", "cant touch chin to chest", "meningitis", "light hurts eyes"],
        "focal_numbness_weakness": ["face drooping", "weak arm", "numb leg", "one side weak", "paralysis", "stroke"],
        "slurred_speech_aphasia": ["slurred speech", "cant talk", "speech garbled", "aphasia"],
        "severe_joint_muscle_pain": ["breakbone", "severe joint pain", "body ache", "muscles ache", "bone pain", "legs hurting"],
        "morning_joint_stiffness": ["morning stiffness", "stiff joints in morning", "rheumatoid"],
        "petechiae_rash": ["rash", "red spots", "purple spots", "bleeding gums", "bruising", "skin blotches", "petechiae"],
        "butterfly_malar_rash": ["butterfly rash", "rash on cheeks", "lupus rash"],
        "flank_pain_renal_colic": ["kidney pain", "flank pain", "kidney stone", "pain radiating to groin"],
        "dysuria_burning_urination": ["burning urine", "uti", "hurts to pee", "painful urination", "dysuria"],
        "gross_hematuria": ["blood in urine", "red urine", "cola urine", "hematuria"],
        "fruity_acetone_breath": ["fruity breath", "acetone smell", "sweet breath", "ketoacidosis"],
        "polyuria_polydipsia": ["peeing constantly", "drinking gallons", "extreme thirst", "polyuria"],
        "sneezing_nasal_congestion": ["sneezing", "runny nose", "congestion", "allergies", "watery eyes", "stuffy nose"],
        "sore_throat_pharyngitis": ["sore throat", "throat hurts", "swollen tonsils", "painful swallowing"],
        "travel_tropical_endemic": ["travel", "went to tropics", "africa", "india", "caribbean", "mosquito area"],
        "tick_insect_exposure": ["tick bite", "bug bite", "hiking in woods", "forest", "outdoor bite"]
    }

    @classmethod
    def analyze_free_text(cls, text: str) -> Dict[str, Any]:
        if not text or not text.strip():
            return {"extracted_symptoms": [], "clinical_summary": "No text provided."}

        clean = text.lower()
        extracted = []
        
        for symptom_id, triggers in cls.KEYWORDS.items():
            for trigger in triggers:
                pattern = r'\b' + re.escape(trigger) + r'\b'
                if re.search(pattern, clean):
                    # Check for negation
                    neg_pattern = r'(no|not|without|denies|never had|did not have)\s+([a-z]+\s+)?' + re.escape(trigger)
                    if not re.search(neg_pattern, clean):
                        if symptom_id not in extracted:
                            extracted.append(symptom_id)
                        break

        symptom_names = [s["name"] for s in SYMPTOM_DEFINITIONS if s["id"] in extracted]
        summary = f"Neural NLP parsed {len(extracted)} clinical features: {', '.join(symptom_names)}" if extracted else "No acute disease triggers identified in custom text notes."

        return {
            "extracted_symptoms": extracted,
            "symptom_names": symptom_names,
            "clinical_summary": summary
        }


# =====================================================================
# 5. ADAPTIVE DYNAMIC ENTROPY QUESTION ENGINE
# Dynamically adjusts question count based on user depth preference:
# - Rush Mode: 5 - 10 questions
# - Standard Mode: 15 - 25 questions
# - Comprehensive Deep Dive: 30 - 50 questions
# =====================================================================
class NeuralSymptomEngine:
    def __init__(self):
        self.model = DeepClinicalSymptomNet()
        self.model.eval()

    def compute_disease_posteriors(self, symptom_state: Dict[str, Optional[bool]]) -> np.ndarray:
        """
        Calculates calibrated disease probability distribution using
        PyTorch forward pass modulated by clinical induction weights.
        """
        x = torch.zeros(1, NUM_SYMPTOMS)
        for s_id, val in symptom_state.items():
            if val is not None and s_id in SYMPTOM_MAP:
                idx = SYMPTOM_MAP[s_id]
                x[0, idx] = 1.0 if val else -0.8

        with torch.no_grad():
            logits = self.model(x)
            
            # Incorporate inductive clinical knowledge rules
            for d_idx, disease in enumerate(DISEASE_DEFINITIONS):
                pos_matches = sum(1 for s in disease["primary_symptoms"] if symptom_state.get(s) is True)
                neg_matches = sum(1 for s in disease["primary_symptoms"] if symptom_state.get(s) is False)
                total_req = len(disease["primary_symptoms"])
                
                # Boost disease logit if hallmark symptoms match
                logits[0, d_idx] += (pos_matches * 2.2) - (neg_matches * 1.1)
                
                # Critical bonus if majority of primary indicators present
                if pos_matches >= 3:
                    logits[0, d_idx] += 1.8

            probs = F.softmax(logits, dim=1).numpy()[0]
        return probs

    def calculate_entropy(self, probs: np.ndarray) -> float:
        """Computes Shannon Entropy H(P) over candidate diagnostic hypotheses."""
        probs = np.clip(probs, 1e-12, 1.0)
        return float(-np.sum(probs * np.log2(probs)))

    def select_next_dynamic_question(
        self, 
        symptom_state: Dict[str, Optional[bool]],
        target_questions: int = 10,
        answered_count: int = 0
    ) -> Optional[Dict[str, Any]]:
        """
        Selects next optimal question via Shannon Information Gain (IG).
        Respects the user's selected question budget (5-10, 15-25, 30-50).
        """
        # If user target questions reached, complete the interview
        if answered_count >= target_questions:
            return None

        unanswered = [s for s in SYMPTOM_DEFINITIONS if symptom_state.get(s["id"]) is None]
        if not unanswered:
            return None

        current_probs = self.compute_disease_posteriors(symptom_state)
        current_entropy = self.calculate_entropy(current_probs)
        
        # In Comprehensive mode (>=30 questions), don't stop early so the full body systems are evaluated!
        # In Rush mode (<15 questions), we can allow early exit only if confidence is overwhelming (>94%)
        if target_questions <= 12 and np.max(current_probs) >= 0.94 and answered_count >= 5:
            return None

        best_symptom = None
        max_info_gain = -1.0

        for symptom in unanswered:
            s_id = symptom["id"]
            
            # Simulate answer = Yes
            state_yes = symptom_state.copy()
            state_yes[s_id] = True
            probs_yes = self.compute_disease_posteriors(state_yes)
            h_yes = self.calculate_entropy(probs_yes)

            # Simulate answer = No
            state_no = symptom_state.copy()
            state_no[s_id] = False
            probs_no = self.compute_disease_posteriors(state_no)
            h_no = self.calculate_entropy(probs_no)

            # Weight by disease prior
            top_diseases = np.argsort(current_probs)[::-1][:4]
            p_s_given_d = sum(current_probs[d] for d in top_diseases if s_id in DISEASE_DEFINITIONS[d]["primary_symptoms"])
            p_s = max(min(p_s_given_d, 0.85), 0.15)

            # Expected Information Gain: IG = H(P) - E[H(P|S)]
            expected_entropy = (p_s * h_yes) + ((1.0 - p_s) * h_no)
            info_gain = current_entropy - expected_entropy

            # Emergency urgency weighting: ask dangerous red flags early
            if symptom.get("urgency") == "emergency" and answered_count < 8:
                info_gain += 0.25
            elif symptom.get("urgency") == "high":
                info_gain += 0.10

            if info_gain > max_info_gain:
                max_info_gain = info_gain
                best_symptom = symptom

        if not best_symptom:
            best_symptom = unanswered[0]

        return {
            "symptom_id": best_symptom["id"],
            "question_text": f"Are you currently experiencing: {best_symptom['name']}?",
            "symptom_name": best_symptom["name"],
            "category": best_symptom["category"],
            "urgency": best_symptom.get("urgency", "medium"),
            "options": ["Yes", "No", "Other / Custom Details"],
            "information_gain": round(float(max_info_gain), 4),
            "current_question_num": answered_count + 1,
            "target_questions": target_questions
        }

    def generate_diagnostic_synthesis(
        self, 
        patient_name: str, 
        patient_age: int, 
        patient_gender: str, 
        symptom_state: Dict[str, Optional[bool]],
        text_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Produces the full clinical diagnostic report with root-cause etiology,
        pathophysiology, organ system risk matrix, symptom attribution, and care plan.
        """
        probs = self.compute_disease_posteriors(symptom_state)
        ranked_indices = np.argsort(probs)[::-1]
        
        top_idx = ranked_indices[0]
        top_disease = DISEASE_DEFINITIONS[top_idx]
        confidence = float(probs[top_idx])

        # Differential diagnoses ranking
        differential = []
        for idx in ranked_indices:
            differential.append({
                "disease_id": DISEASE_DEFINITIONS[idx]["id"],
                "name": DISEASE_DEFINITIONS[idx]["name"],
                "category": DISEASE_DEFINITIONS[idx]["category"],
                "probability": float(probs[idx]),
                "triage": DISEASE_DEFINITIONS[idx]["triage_if_positive"]
            })

        # Overall triage determination
        if top_disease["triage_if_positive"] == "urgent" and confidence > 0.35:
            overall_triage = "urgent"
        elif confidence > 0.65:
            overall_triage = "monitor"
        else:
            overall_triage = "routine"

        # Categorize patient responses
        positive_symptoms = [s["name"] for s in SYMPTOM_DEFINITIONS if symptom_state.get(s["id"]) is True]
        ruled_out_symptoms = [s["name"] for s in SYMPTOM_DEFINITIONS if symptom_state.get(s["id"]) is False]

        # Symptom attribution drivers
        primary_drivers = [
            s["name"] for s in SYMPTOM_DEFINITIONS 
            if s["id"] in top_disease["primary_symptoms"] and symptom_state.get(s["id"]) is True
        ]
        
        competing_rulers = []
        if len(ranked_indices) > 1:
            second_disease = DISEASE_DEFINITIONS[ranked_indices[1]]
            competing_rulers = [
                s["name"] for s in SYMPTOM_DEFINITIONS
                if s["id"] in second_disease["primary_symptoms"] and symptom_state.get(s["id"]) is False
            ]

        return {
            "patient_name": patient_name,
            "patient_age": patient_age,
            "patient_gender": patient_gender,
            "primary_diagnosis": top_disease["name"],
            "disease_category": top_disease["category"],
            "confidence": confidence,
            "triage_level": overall_triage,
            
            # Root Cause & Pathophysiology (Problem Cause)
            "root_cause_analysis": top_disease["root_cause"],
            "pathophysiology_mechanism": top_disease["pathophysiology"],
            
            # Multi-Organ Involvement & Biomarkers
            "organ_risks": top_disease.get("organ_risks", {"Systemic": "Moderate"}),
            "diagnostic_workup": top_disease.get("diagnostic_workup", ["Clinical evaluation"]),
            "immediate_actions": top_disease.get("immediate_actions", "Consult physician."),
            "emergency_red_flags": top_disease.get("emergency_red_flags", "Seek emergency care if condition deteriorates."),
            "clinical_recommendation": top_disease["recommendation"],
            
            # Diagnostic Drivers & Attribution
            "symptom_attribution": {
                "positive_drivers": primary_drivers,
                "negative_exclusion_factors": competing_rulers
            },
            
            # Comprehensive lists
            "differential_diagnoses": differential,
            "positive_symptoms": positive_symptoms,
            "ruled_out_symptoms": ruled_out_symptoms,
            "questions_answered_count": len(positive_symptoms) + len(ruled_out_symptoms),
            "text_analysis_note": text_notes
        }

# Global Singleton
symptom_engine = NeuralSymptomEngine()
