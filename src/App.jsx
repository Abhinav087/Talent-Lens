import React, { useState } from 'react';
import UploadScreen from './components/UploadScreen';
import LoadingScreen from './components/LoadingScreen';
import ResultsScreen from './components/ResultsScreen';
import { parsePdf } from './utils/pdfParser';
import { analyzeResume } from './utils/openRouter';

export default function App() {
  const [view, setView] = useState("upload"); // upload | loading | results
  const [apiKey, setApiKey] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [notSure, setNotSure] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  
  const [activeStage, setActiveStage] = useState(0);
  const [currentModelName, setCurrentModelName] = useState("");
  const [reportData, setReportData] = useState(null);

  const handleAnalyze = async () => {
    if (!file || !apiKey || (!notSure && !targetRole)) return;
    
    setError(null);
    setView("loading");
    setActiveStage(0);
    setCurrentModelName("");

    try {
      // Stage 0: Extracting resume text
      const reader = new FileReader();
      const arrayBufferPromise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read the uploaded resume file."));
      });
      reader.readAsArrayBuffer(file);
      
      const arrayBuffer = await arrayBufferPromise;
      const extractedText = await parsePdf(arrayBuffer);

      // Stage 1: Trying models...
      setActiveStage(1);
      const result = await analyzeResume({
        apiKey,
        resumeText: extractedText,
        targetRole: notSure ? "Not Sure" : targetRole,
        onModelAttempt: (modelName) => {
          setCurrentModelName(modelName);
        }
      });

      // Stage 2: Scoring sections & skills
      setActiveStage(2);
      await new Promise(resolve => setTimeout(resolve, 800)); // Smooth UX transition

      // Stage 3: Building your report
      setActiveStage(3);
      await new Promise(resolve => setTimeout(resolve, 800)); // Smooth UX transition

      // Success
      setReportData(result);
      setView("results");
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setView("upload");
    }
  };

  const handleReset = () => {
    setView("upload");
    setFile(null);
    setError(null);
    setReportData(null);
    setCurrentModelName("");
    setNotSure(false);
    setTargetRole("");
  };

  return (
    <div className="app-container">
      {view === "upload" && (
        <UploadScreen
          apiKey={apiKey}
          setApiKey={setApiKey}
          targetRole={targetRole}
          setTargetRole={setTargetRole}
          notSure={notSure}
          setNotSure={setNotSure}
          file={file}
          setFile={setFile}
          onAnalyze={handleAnalyze}
          error={error}
        />
      )}

      {view === "loading" && (
        <LoadingScreen
          activeStage={activeStage}
          currentModelName={currentModelName}
        />
      )}

      {view === "results" && reportData && (
        <ResultsScreen
          reportData={reportData}
          targetRole={reportData.detectedTargetRole || targetRole}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
