import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, BarChart3, Clock, Sparkles, Trash2, LogOut, Menu, X } from 'lucide-react';
import './App.css'; 

// For production deployment, using the live Render URL
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? '' 
  : 'https://ai-resume-analyzer-65sa.onrender.com';

const AIResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('analyzer');
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [isLoginView, setIsLoginView] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (!authForm.email || !authForm.password) return;
    if (!isLoginView && !authForm.name) return;

    const endpoint = `${API_BASE_URL}/api/auth/${isLoginView ? 'login' : 'register'}`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || 'Authentication failed');
      } else {
        if (!isLoginView) {
          setAuthSuccess('Registration successful! Please log in.');
          setIsLoginView(true);
          setAuthForm({ ...authForm, password: '' });
        } else {
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
        }
      }
    } catch (err) {
      setAuthError('Failed to connect to backend server');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setHistory([]);
  };

  const fetchHistory = async () => {
    try {
      const emailQuery = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';
      const response = await fetch(`${API_BASE_URL}/api/history${emailQuery}`);

      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }

    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const handleAnalysis = async () => {
    if (!file || !jd) {
      setErrorMsg("Please upload a resume and paste a job description.");
      return;
    }

    setIsAnalyzing(true);
    setResults(null); // Clear previous results during a new run
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jd', jd);
    if (user && user.email) {
      formData.append('userEmail', user.email);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errMessage = "Server responded with an error status.";
        try {
          const errData = await response.json();
          if (errData && errData.error) errMessage = errData.error;
        } catch (e) {
          // ignore
        }
        throw new Error(errMessage);
      }

      const data = await response.json();
      setResults(data);
      fetchHistory(); // Refresh the history panel below
    } catch (error) {
      console.error("Analysis error:", error);
      setErrorMsg(error.message || "Something went wrong connecting to the backend.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteHistory = async (e, id) => {
    e.stopPropagation(); // prevent clicking the card underneath
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchHistory(); // Refresh the list without the deleted item
      } else {
        console.error("Failed to delete history item");
      }
    } catch (error) {
      console.error("Error deleting history:", error);
    }
  };

  if (!user) {
    return (
      <div className="app-shell flex-center">
        <div className="glass-card auth-portal">
          <div className="brand" style={{ justifyContent: 'center', marginBottom: '32px' }}>
            <div className="logo-icon"><Sparkles size={28} /></div>
            <span className="brand-name" style={{ fontSize: '1.8rem' }}>ResumeAI</span>
          </div>
          <h3 className="auth-title">{isLoginView ? 'Welcome Back' : 'Create Account'}</h3>
          <p className="auth-subtitle">{isLoginView ? 'Log in securely to access your analyses.' : 'Register to track your AI analyses safely.'}</p>
          
          {authError && (
             <div className="error-alert" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} />
                <span style={{ marginLeft: '8px', fontSize: '0.9rem' }}>{authError}</span>
             </div>
          )}
          {authSuccess && (
             <div className="error-alert" style={{ marginBottom: '16px', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <CheckCircle size={16} color="#10b981" />
                <span style={{ marginLeft: '8px', fontSize: '0.9rem', color: '#10b981' }}>{authSuccess}</span>
             </div>
          )}

          <form onSubmit={handleAuth} className="auth-form">
            {!isLoginView && (
              <input 
                type="text" 
                className="modern-input" 
                placeholder="Full Name" 
                value={authForm.name}
                onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                required 
              />
            )}
            <input 
              type="email" 
              className="modern-input" 
              placeholder="Email Address" 
              value={authForm.email}
              onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
              required 
            />
            <input 
              type="password" 
              className="modern-input" 
              placeholder="Password" 
              value={authForm.password}
              onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
              required 
            />
            <button type="submit" className="primary-action-btn">
              {isLoginView ? 'Log In' : 'Register'}
            </button>
          </form>

          <p className="auth-switch" style={{ marginTop: '24px', color: '#94a3b8', fontSize: '0.9rem' }}>
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <span 
               onClick={() => { setIsLoginView(!isLoginView); setAuthError(''); setAuthSuccess(''); setAuthForm({ name: '', email: '', password: '' }); }}
               style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: '600' }}
            >
              {isLoginView ? 'Sign Up' : 'Log In'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
  <div className={`app-shell ${isSidebarOpen ? 'sidebar-open' : ''}`}>
    {/* Mobile Header */}
    <header className="mobile-header">
      <div className="brand">
        <div className="logo-icon"><BarChart3 size={20} /></div>
        <span className="brand-name">ResumeAI</span>
      </div>
      <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </header>

    {/* Mobile Overlay */}
    <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>

    {/* Sidebar Navigation */}
    <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
      <div className="brand desktop-only">
        <div className="logo-icon"><BarChart3 size={24} /></div>
        <span className="brand-name">ResumeAI</span>
      </div>
      <nav className="nav-menu">
        <button 
          className={`nav-item ${activeTab === 'analyzer' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('analyzer'); setIsSidebarOpen(false); }}>
          <BarChart3 size={18} /> Analyzer
        </button>
        <button 
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('history'); fetchHistory(); setIsSidebarOpen(false); }}>
          <Clock size={18} /> History
        </button>
      </nav>
      <div className="user-profile">
        <div className="avatar"></div>
        <div className="user-info">
          <p className="user-name">{user.name}</p>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Log Out"><LogOut size={16} /></button>
      </div>
    </aside>

    {/* Main Content Area */}
    <main className="content-area">
      <header className="top-bar">
        <h2>{activeTab === 'analyzer' ? 'Resume Analysis' : 'Analysis History'}</h2>
        <div className="date-display">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
      </header>

      {activeTab === 'analyzer' ? (
        <div className="dashboard-grid">
        {/* Left: Input Actions */}
        <section className="input-column">
          <div className="glass-card">
            <div className="card-header">
              <Upload size={18} className="text-primary" />
              <h3>Upload Document</h3>
            </div>
            <div className={`upload-zone ${file ? 'has-file' : ''}`}>
              <input type="file" accept=".pdf" id="resumeUpload" className="hidden" onChange={(e) => { if (e.target.files && e.target.files[0]) setFile(e.target.files[0]); }} />
              <label htmlFor="resumeUpload">
                <div className="icon-circle">
                  <FileText size={24} />
                </div>
                <p className="upload-text">{file ? file.name : "Drop PDF here or click"}</p>
                <span className="upload-subtext">Max size: 5MB</span>
              </label>
            </div>
          </div>

          <div className="glass-card">
            <div className="card-header">
              <FileText size={18} className="text-primary" />
              <h3>Job Context</h3>
            </div>
            <textarea 
              className="modern-textarea"
              placeholder="Paste job description requirements..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
            {errorMsg && <div className="error-alert" style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.875rem' }}><AlertCircle size={14} style={{display:'inline', marginRight:'4px'}}/>{errorMsg}</div>}
            <button 
              onClick={handleAnalysis}
              disabled={!file || !jd || isAnalyzing}
              className={`primary-action-btn ${isAnalyzing ? 'loading' : ''}`}
            >
              {isAnalyzing ? "Processing..." : "Start AI Audit"}
            </button>
          </div>
        </section>

        {/* Right: Insights & Results */}
        <section className="results-column">
          {!results && !isAnalyzing ? (
            <div className="placeholder-state">
              <div className="pulse-icon"><BarChart3 size={40} /></div>
              <h3>Ready for Analysis</h3>
              <p>Upload a resume to see AI insights</p>
            </div>
          ) : isAnalyzing ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <h3>AI Engine Computing</h3>
              <p>Matching keywords and scoring experience...</p>
            </div>
          ) : (
            <div className="results-animate">
              {/* Circular Score Widget */}
              <div className="glass-card score-widget">
                <div className="score-circle">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="circle" strokeDasharray={`${results.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <text x="18" y="20.35" className="percentage">{results.score}%</text>
                  </svg>
                </div>
                <div className="score-info">
                  <h4>Overall Match</h4>
                  <p>{results.summary}</p>
                </div>
              </div>

              {/* Skills Grid */}
              <div className="bento-grid">
                <div className="bento-item strength">
                  <h5><CheckCircle size={16} /> Top Strengths</h5>
                  <div className="pill-container">
                    {results.strengths?.map((s, i) => <span key={i} className="pill">{s}</span>)}
                  </div>
                </div>
                <div className="bento-item missing">
                  <h5><AlertCircle size={16} /> Gaps Found</h5>
                  <div className="pill-container">
                    {results.missingSkills?.map((m, i) => <span key={i} className="pill">{m}</span>)}
                  </div>
                </div>
              </div>

              {results.improvements && (
                <div className="glass-card feedback-card">
                  <h5><Sparkles size={16} className="text-primary"/> Action Plan & Insights</h5>
                  <p>{results.improvements}</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
      ) : (
        <div className="history-view">
          {history.length === 0 ? (
            <div className="placeholder-state">
              <div className="pulse-icon"><Clock size={40} /></div>
              <h3>No History Found</h3>
              <p>Analyze your first resume to see it here.</p>
            </div>
          ) : (
            <div className="history-grid">
              {history.map((item) => (
                <div key={item._id} className="glass-card history-card" onClick={() => {
                  setResults(item);
                  setActiveTab('analyzer');
                }}>
                  <div className="history-header">
                    <div className="history-title-group">
                      <h4>{item.resumeName}</h4>
                      <span className="history-date">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    <button 
                      className="delete-history-btn" 
                      onClick={(e) => handleDeleteHistory(e, item._id)}
                      title="Delete this analysis"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="history-score">
                    <span className="score-badge">{item.score}% Match</span>
                  </div>
                  <p className="history-summary">{item.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  </div>
);
};

export default AIResumeAnalyzer;