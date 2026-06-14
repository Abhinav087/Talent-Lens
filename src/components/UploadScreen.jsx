import { useState, useRef } from 'react';
import { Link, ShieldCheck, LogOut, Info } from 'lucide-react';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';

export default function UploadScreen({
  apiKey,
  setApiKey,
  authMethod,
  onDisconnect,
  targetRole,
  setTargetRole,
  companyName,
  setCompanyName,
  file,
  setFile,
  onAnalyze,
  error,
  notSure,
  setNotSure
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState(authMethod === 'oauth' || !apiKey ? 'oauth' : 'manual');
  const fileInputRef = useRef(null);

  const handleConnectOAuth = async () => {
    try {
      const verifier = generateCodeVerifier();
      sessionStorage.setItem("or_code_verifier", verifier);

      const challenge = await generateCodeChallenge(verifier);
      const callbackUrl = encodeURIComponent(window.location.origin + window.location.pathname);

      const oauthUrl = `https://openrouter.ai/auth?callback_url=${callbackUrl}&code_challenge=${challenge}&code_challenge_method=S256`;

      window.location.href = oauthUrl;
    } catch (err) {
      console.error("Failed to initiate OAuth flow:", err);
    }
  };

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
        {/* OpenRouter Authentication Tabs */}
        <div className="auth-section" style={{ marginBottom: '20px' }}>
          <div className="auth-tabs" style={{ display: 'flex', borderBottom: '1.5px solid var(--color-border-tertiary)', marginBottom: '16px' }}>
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === 'oauth' ? 'active' : ''}`}
              onClick={() => setActiveTab('oauth')}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                padding: '10px 0',
                fontSize: '13px',
                fontWeight: 500,
                color: activeTab === 'oauth' ? '#534AB7' : 'var(--color-text-muted)',
                borderBottom: activeTab === 'oauth' ? '2.5px solid #534AB7' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderRadius: '0'
              }}
            >
              Connect Account
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                padding: '10px 0',
                fontSize: '13px',
                fontWeight: 500,
                color: activeTab === 'manual' ? '#534AB7' : 'var(--color-text-muted)',
                borderBottom: activeTab === 'manual' ? '2.5px solid #534AB7' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderRadius: '0'
              }}
            >
              API Key
            </button>
          </div>

          {activeTab === 'oauth' ? (
            <div className="oauth-panel">
              {authMethod === 'oauth' && apiKey ? (
                <div className="connected-card" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: 'var(--color-background-secondary)',
                  border: '1px solid #3B6D11',
                  borderRadius: '8px',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldCheck size={20} color="#3B6D11" style={{ flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Linked to OpenRouter</span>
                      <span className="text-xs text-muted">Using your account credits</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onDisconnect}
                    style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--color-border-tertiary)' }}
                  >
                    <LogOut size={12} />
                    Disconnect
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="info-box" style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '12px 14px',
                    backgroundColor: 'var(--color-background-secondary)',
                    borderRadius: '8px',
                    border: '0.5px solid var(--color-border-tertiary)'
                  }}>
                    <Info size={16} className="text-muted" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p className="text-xs text-muted" style={{ lineHeight: '1.4' }}>
                      Connecting your OpenRouter account allows this app to run analyses using your own OpenRouter credit balance. No manual API keys required.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleConnectOAuth}
                    style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Link size={16} />
                    Connect OpenRouter Account
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="manual-panel">
              <label htmlFor="api-key">OpenRouter API key</label>
              <input
                id="api-key"
                type="password"
                value={authMethod === 'oauth' ? '' : apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={authMethod === 'oauth' ? "Connected via OAuth (Disconnect to change)" : "Paste OpenRouter API key"}
                disabled={authMethod === 'oauth'}
                style={{ marginBottom: '6px', opacity: authMethod === 'oauth' ? 0.6 : 1 }}
              />
              <div className="text-xs text-muted">
                Get a free key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ color: '#534AB7', textDecoration: 'none' }}>openrouter.ai/keys</a>
              </div>
            </div>
          )}
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

        {/* Target Company Input (Optional) */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label htmlFor="company-name" style={{ margin: 0 }}>Target company</label>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Optional</span>
          </div>
          <input
            id="company-name"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Google, Stripe, a local startup..."
          />
          <div className="text-xs text-muted" style={{ marginTop: '6px' }}>
            AI will customize your analysis, keywords, and roadmap to fit this company's profile
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
