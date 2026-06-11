import React, { useState, useRef } from 'react';

export default function UploadScreen({
  apiKey,
  setApiKey,
  targetRole,
  setTargetRole,
  file,
  setFile,
  onAnalyze,
  error,
  notSure,
  setNotSure
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || droppedFile.name.toLowerCase().endsWith(".pdf")) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf")) {
        setFile(selectedFile);
      }
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current.click();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    return (bytes / 1024).toFixed(1) + " KB";
  };

  const isFormValid = apiKey.trim() !== "" && (notSure || targetRole.trim() !== "") && file !== null;

  return (
    <div className="upload-container">
      <div className="upload-header" style={{ textAlign: 'center' }}>
        <h1 className="text-xl font-medium" style={{ marginBottom: '8px' }}>Resume analyzer</h1>
        <p className="text-sm text-muted" style={{ marginBottom: '32px' }}>
          Upload your resume and target role — get a full analysis in seconds
        </p>
      </div>

      <div className="upload-form">
        {/* OpenRouter API Key Input */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="api-key">OpenRouter API key</label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste OpenRouter API key"
            style={{ marginBottom: '6px' }}
          />
          <div className="text-xs text-muted">
            Get a free key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ color: '#534AB7', textDecoration: 'none' }}>openrouter.ai/keys</a>
          </div>
        </div>

        {/* Drag-and-drop PDF Zone */}
        <div style={{ marginBottom: '20px' }}>
          <label>Resume PDF</label>
          <div
            className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerBrowse}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {file ? (
              <div className="file-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span className="file-name font-medium text-md" style={{ color: 'var(--color-text-primary)' }}>{file.name}</span>
                <span className="file-size text-xs text-muted">{formatFileSize(file.size)}</span>
              </div>
            ) : (
              <div className="dropzone-prompt text-sm text-muted" style={{ textAlign: 'center' }}>
                Drag and drop your PDF resume here, or <span style={{ color: '#534AB7', textDecoration: 'underline', cursor: 'pointer' }}>browse</span>
              </div>
            )}
          </div>
        </div>

        {/* Target Job Role Input */}
        <div style={{ marginBottom: '28px' }}>
          <label htmlFor="target-role">Target job role</label>
          <input
            id="target-role"
            type="text"
            value={notSure ? "AI will auto-detect best fit" : targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Senior Data Scientist, Frontend Engineer..."
            disabled={notSure}
            style={{ opacity: notSure ? 0.6 : 1, cursor: notSure ? 'not-allowed' : 'text', marginBottom: '10px' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="not-sure"
              checked={notSure}
              onChange={(e) => {
                setNotSure(e.target.checked);
                if (e.target.checked) {
                  setTargetRole("");
                }
              }}
              style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
            />
            <label htmlFor="not-sure" style={{ margin: 0, textTransform: 'none', fontSize: '13px', cursor: 'pointer', fontWeight: 400 }}>
              Not sure? Let AI detect your best-fit role
            </label>
          </div>
        </div>

        {/* Analyze Button */}
        <button
          className="btn btn-primary"
          onClick={onAnalyze}
          disabled={!isFormValid}
          style={{ width: '100%', padding: '12px' }}
        >
          Analyze resume
        </button>

        {/* Red Error Banner */}
        {error && (
          <div className="error-banner text-sm" style={{ marginTop: '20px' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
