import { useState, useEffect } from 'react';
import UploadScreen from './components/UploadScreen';
import LoadingScreen from './components/LoadingScreen';
import ResultsScreen from './components/ResultsScreen';
import { parsePdf } from './utils/pdfParser';
import { analyzeResume } from './utils/openRouter';

export default function App() {
  const [view, setView] = useState("upload"); // upload | loading | results
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("openrouter_api_key") || import.meta.env.VITE_OPENROUTER_API_KEY || "");
  const [authMethod, setAuthMethod] = useState(() => localStorage.getItem("openrouter_auth_method") || "manual");
  const [isExchangingToken, setIsExchangingToken] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [notSure, setNotSure] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  
  const [activeStage, setActiveStage] = useState(0);
  const [currentModelName, setCurrentModelName] = useState("");
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const codeVerifier = sessionStorage.getItem("or_code_verifier");

      if (code && codeVerifier) {
        setIsExchangingToken(true);
        setError(null);
        
        try {
          const response = await fetch("https://openrouter.ai/api/v1/auth/keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              code_verifier: codeVerifier,
              code_challenge_method: "S256",
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || "Failed to exchange authorization code for API key");
          }

          const data = await response.json();
          if (data.key) {
            localStorage.setItem("openrouter_api_key", data.key);
            localStorage.setItem("openrouter_auth_method", "oauth");
            setApiKey(data.key);
            setAuthMethod("oauth");
          } else {
            throw new Error("No API key returned from OpenRouter authentication");
          }
        } catch (err) {
          console.error("OAuth token exchange error:", err);
          setError(`Authentication failed: ${err.message}`);
        } finally {
          setIsExchangingToken(false);
          sessionStorage.removeItem("or_code_verifier");
          // Strip the code parameter from the URL
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } else if (code) {
        setError("Authentication failed: Missing verification context. Please try connecting again.");
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    };

    handleOAuthCallback();
  }, []);

  const handleSetApiKey = (key) => {
    setApiKey(key);
    if (key.trim()) {
      localStorage.setItem("openrouter_api_key", key);
      localStorage.setItem("openrouter_auth_method", "manual");
      setAuthMethod("manual");
    } else {
      localStorage.removeItem("openrouter_api_key");
      localStorage.removeItem("openrouter_auth_method");
      setAuthMethod("manual");
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("openrouter_api_key");
    localStorage.removeItem("openrouter_auth_method");
    setApiKey("");
    setAuthMethod("manual");
  };

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

  if (isExchangingToken) {
    return (
      <div className="app-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div className="spinner" style={{ marginBottom: '24px' }}></div>
          <p className="text-md font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Connecting your OpenRouter account...
          </p>
          <p className="text-xs text-muted" style={{ marginTop: '8px' }}>
            Completing authentication handshake
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {view === "upload" && (
        <UploadScreen
          apiKey={apiKey}
          setApiKey={handleSetApiKey}
          authMethod={authMethod}
          onDisconnect={handleDisconnect}
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

