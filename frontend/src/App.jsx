import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DiagnosticPage from './pages/DiagnosticPage';
import SymptomCheckerPage from './pages/SymptomCheckerPage';

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-[#060b13] print:h-auto print:overflow-visible print:bg-white">
        <Sidebar />
        <div className="flex-1 overflow-auto print:overflow-visible print:h-auto print:p-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/symptoms" element={<SymptomCheckerPage />} />
            <Route 
              path="/eye-tf" 
              element={
                <DiagnosticPage 
                  title="Ophthalmic Retinal Screening" 
                  endpoint="/api/diagnose/eye/tf" 
                  framework="TensorFlow SavedModel" 
                />
              } 
            />
            <Route 
              path="/eye-dr" 
              element={
                <DiagnosticPage 
                  title="Diabetic Retinopathy Grading" 
                  endpoint="/api/diagnose/eye/dr" 
                  framework="PyTorch Lightning" 
                />
              } 
            />
            <Route 
              path="/cxr" 
              element={
                <DiagnosticPage 
                  title="Chest Radiograph Screening" 
                  endpoint="/api/diagnose/cxr" 
                  framework="ONNX Runtime" 
                />
              } 
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
