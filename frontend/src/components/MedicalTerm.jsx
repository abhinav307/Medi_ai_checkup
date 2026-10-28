import React, { useState } from 'react';

const MEDICAL_GLOSSARY = {
  'Diabetic Retinopathy': 'Microvascular retinal damage caused by prolonged hyperglycemia in diabetes. Can cause blindness if untreated.',
  'DR Grade': 'International Clinical Diabetic Retinopathy severity scale: 0 (No DR) to 4 (Proliferative DR with neovascularization).',
  'Glaucoma': 'A group of eye diseases characterized by progressive optic neuropathy and visual field loss, frequently associated with elevated intraocular pressure.',
  'Cataract': 'Opacification or clouding of the crystalline lens of the eye leading to decreased visual acuity and light scattering.',
  'Fundus': 'The interior lining of the eyeball including the retina, optic disc, macula, and posterior pole.',
  'Retinal': 'Pertaining to the retina, the sensory light-detecting membrane lining the inner surface of the back of the eye.',
  'Pneumonia': 'An infection or inflammatory condition of the lung parenchyma, causing alveolar consolidation and impaired gas exchange.',
  'Cardiomegaly': 'Pathological enlargement of the cardiac silhouette (cardiothoracic ratio > 0.50 on PA chest radiograph).',
  'Pleural Effusion': 'Abnormal fluid accumulation within the pleural space surrounding the lungs.',
  'Atelectasis': 'Volume loss or partial collapse of lung tissue, reducing ventilation efficiency.',
  'CLAHE': 'Contrast Limited Adaptive Histogram Equalization — an advanced clinical image processing algorithm that enhances contrast without over-amplifying noise.',
  'ONNX': 'Open Neural Network Exchange — high-performance cross-platform machine learning runtime for low-latency diagnostic inference.',
  'PyTorch Lightning': 'Deep learning framework used here for DenseNet-121 Diabetic Retinopathy 5-stage feature extraction and classification.',
  'TensorFlow': 'Industrial deep learning platform running the 4-class multi-disease ophthalmic SavedModel.',
  'Triage': 'Clinical prioritization method categorizing urgency: Routine (standard checkup), Monitor (follow-up needed), Urgent (specialist referral required).'
};

const MedicalTerm = ({ term, children }) => {
  const [show, setShow] = useState(false);
  const explanation = MEDICAL_GLOSSARY[term] || MEDICAL_GLOSSARY[children] || 'Clinical medical terminology.';

  return (
    <span 
      className="relative inline-block cursor-help border-b border-dotted border-cyan-400 text-slate-200 hover:text-cyan-400 transition-colors"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(!show)}
    >
      {children || term}
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#0a1322] border border-cyan-500/60 text-xs text-slate-200 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.9)] pointer-events-none transition-all">
          <span className="block font-bold text-cyan-400 mb-1">{term}</span>
          {explanation}
        </span>
      )}
    </span>
  );
};

export default MedicalTerm;
