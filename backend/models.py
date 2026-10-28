from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime, timezone
import json
from database import Base

class PatientRecord(Base):
    __tablename__ = "patient_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String, index=True)
    patient_age = Column(Integer, nullable=True, default=45)
    patient_gender = Column(String, nullable=True, default="Other")
    scan_type = Column(String)
    diagnosis = Column(String)
    confidence = Column(Float)
    triage_level = Column(String, default="routine")  # urgent, monitor, routine
    clinical_recommendation = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Advanced Diagnostics Storage
    processed_image_url = Column(String, nullable=True)
    image_type = Column(String, nullable=True)
    findings_json = Column(Text, nullable=True)
    quality_metrics_json = Column(Text, nullable=True)
    multi_copies_json = Column(Text, nullable=True)

    def set_findings(self, findings_list):
        self.findings_json = json.dumps(findings_list)

    def get_findings(self):
        try:
            return json.loads(self.findings_json) if self.findings_json else []
        except:
            return []

    def set_quality_metrics(self, metrics_dict):
        self.quality_metrics_json = json.dumps(metrics_dict)

    def get_quality_metrics(self):
        try:
            return json.loads(self.quality_metrics_json) if self.quality_metrics_json else {}
        except:
            return {}

    def set_multi_copies(self, copies_list):
        self.multi_copies_json = json.dumps(copies_list)

    def get_multi_copies(self):
        try:
            return json.loads(self.multi_copies_json) if self.multi_copies_json else []
        except:
            return []
