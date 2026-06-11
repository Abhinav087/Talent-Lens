import React from 'react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar, 
  BarChart, 
  XAxis, 
  YAxis, 
  Bar, 
  Cell, 
  Tooltip 
} from 'recharts';
import { ArrowRight, Plus, Trash, AlertTriangle } from 'lucide-react';

export default function ResultsScreen({ reportData, targetRole, onReset }) {
  const {
    candidateName,
    atsScore,
    relevanceScore,
    overallScore,
    scoreSummary,
    sectionScores = [],
    skillMatch = [],
    salaryStats = [],
    salaryTrend = [],
    salarySource,
    improvements = [],
    toAdd = [],
    toRemove = [],
    atsIssues = [],
    interviewTopics = [],
    marketTrends
  } = reportData;

  // Helper for ring color styling
  const getRingStyles = (score) => {
    if (score >= 75) {
      return { stroke: "#639922", ringBg: "#EAF3DE", text: "#27500A" };
    } else if (score >= 50) {
      return { stroke: "#BA7517", ringBg: "#FAEEDA", text: "#633806" };
    } else {
      return { stroke: "#E24B4A", ringBg: "#FCEBEB", text: "#791F1F" };
    }
  };

  // Helper to draw SVG Score Ring
  const ScoreRing = ({ score, label }) => {
    const r = 44;
    const circ = 2 * Math.PI * r;
    const strokeDashoffset = circ - (score / 100) * circ;
    const { stroke, ringBg, text } = getRingStyles(score);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '110px' }}>
        <svg width="110" height="110" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Track Circle */}
          <circle 
            cx="50" 
            cy="50" 
            r={r} 
            fill={ringBg} 
            stroke="#e5e7eb" 
            strokeWidth="6" 
          />
          {/* Filled Score Indicator Ring */}
          <circle 
            cx="50" 
            cy="50" 
            r={r} 
            fill="none" 
            stroke={stroke} 
            strokeWidth="6" 
            strokeDasharray={circ} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round"
          />
          {/* Render text on top, but need to rotate back to vertical to display correctly */}
          {/* Instead of rotating the text, we can rotate the SVG parent or rotate individual text blocks inside. */}
        </svg>
        {/* Absolute positioning relative to the SVG area to display vertical text cleanly */}
        <div style={{ position: 'relative', marginTop: '-110px', height: '110px', width: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 500, color: text, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: '10px', color: text, opacity: 0.7, marginTop: '2px' }}>/100</div>
        </div>
        <div className="text-sm text-muted font-medium" style={{ marginTop: '12px', textAlign: 'center' }}>
          {label}
        </div>
      </div>
    );
  };

  const skillChartHeight = Math.max(200, skillMatch.length * 36);

  return (
    <div className="results-container" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
      
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>{candidateName}</h2>
          <p className="text-sm text-muted">{targetRole}</p>
        </div>
        <button className="btn btn-secondary text-sm" onClick={onReset}>
          New analysis
        </button>
      </div>

      {/* ── SCORES ────────────────────────────────────────────────── */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', gap: '16px', flexWrap: 'wrap' }}>
          <ScoreRing score={atsScore} label="ATS compatibility" />
          <ScoreRing score={relevanceScore} label="Role relevance" />
          <ScoreRing score={overallScore} label="Overall strength" />
        </div>
        
        {scoreSummary && (
          <p className="text-sm text-muted" style={{ textAlign: 'center', maxWidth: '480px', margin: '0 auto', lineHeight: '1.6' }}>
            {scoreSummary}
          </p>
        )}
      </div>

      {/* ── SECTION BREAKDOWN ─────────────────────────────────────── */}
      <div className="card">
        <h3 className="card-title">Section breakdown</h3>
        {sectionScores.length > 0 ? (
          <div style={{ width: '100%', height: '260px', display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={sectionScores}>
                <PolarGrid stroke="var(--color-border-tertiary)" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "#888780" }} />
                <Radar 
                  name="Score" 
                  dataKey="score" 
                  stroke="#534AB7" 
                  fill="#534AB7" 
                  fillOpacity={0.18} 
                  strokeWidth={2} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted">No section breakdown available.</p>
        )}
      </div>

      {/* ── SKILL MATCH ───────────────────────────────────────────── */}
      <div className="card">
        <h3 className="card-title">Skill matching</h3>
        {skillMatch.length > 0 ? (
          <div style={{ width: '100%', height: `${skillChartHeight}px` }}>
            <ResponsiveContainer width="100%" height={skillChartHeight}>
              <BarChart
                layout="vertical"
                data={skillMatch}
                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
              >
                <XAxis 
                  type="number" 
                  domain={[0, 100]} 
                  tick={{ fontSize: 11, fill: "#888780" }} 
                />
                <YAxis 
                  type="category" 
                  dataKey="skill" 
                  width={130} 
                  tick={{ fontSize: 12, fill: "#888780" }} 
                />
                <Tooltip 
                  formatter={(v) => [`${v}%`, "match"]}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="match" radius={[0, 3, 3, 0]} barSize={14}>
                  {skillMatch.map((entry, index) => {
                    const score = entry.match;
                    let cellColor = "#E24B4A";
                    if (score >= 75) cellColor = "#639922";
                    else if (score >= 50) cellColor = "#BA7517";
                    return <Cell key={`cell-${index}`} fill={cellColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted">No skill matching details available.</p>
        )}
      </div>

      {/* ── SALARY INSIGHTS ───────────────────────────────────────── */}
      <div className="card">
        <h3 className="card-title">Salary insights</h3>
        {salaryStats.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {salaryStats.map((stat, index) => (
              <div 
                key={index} 
                style={{ 
                  backgroundColor: 'var(--color-background-secondary)', 
                  borderRadius: '8px', 
                  padding: '10px 12px',
                  border: '0.5px solid var(--color-border-tertiary)'
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 500 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {salaryTrend.length > 0 && (
          <div style={{ width: '100%', height: '180px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={salaryTrend} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis 
                  dataKey="level" 
                  tick={{ fontSize: 11, fill: "#888780" }} 
                />
                <YAxis 
                  tickFormatter={v => `$${(v/1000).toFixed(0)}k`} 
                  tick={{ fontSize: 11, fill: "#888780" }} 
                />
                <Tooltip 
                  formatter={v => [`$${Number(v).toLocaleString()}`, "salary"]}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="salary" fill="#185FA5" radius={[3, 3, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {salarySource && (
          <div style={{ fontSize: '11px', color: '#888780', textAlign: 'right', marginTop: '8px' }}>
            Source: {salarySource}
          </div>
        )}
      </div>

      {/* ── WHAT TO IMPROVE ───────────────────────────────────────── */}
      {improvements.length > 0 && (
        <div className="card">
          <h3 className="card-title">What to improve</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {improvements.map((imp, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <ArrowRight size={18} style={{ color: '#BA7517', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{imp.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{imp.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADD / REMOVE ──────────────────────────────────────────── */}
      {(toAdd.length > 0 || toRemove.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          
          {/* Add card */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Plus size={18} style={{ color: '#3B6D11' }} />
              <h3 className="text-md font-medium" style={{ color: 'var(--color-text-primary)' }}>Add these</h3>
            </div>
            {toAdd.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-3px' }}>
                {toAdd.map((item, idx) => (
                  <span 
                    key={idx} 
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '13px',
                      margin: '3px',
                      lineHeight: '1.4',
                      backgroundColor: '#EAF3DE',
                      color: '#27500A',
                      border: '0.5px solid #C0DD97'
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No additional keywords recommended.</p>
            )}
          </div>

          {/* Remove card */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Trash size={16} style={{ color: '#A32D2D' }} />
              <h3 className="text-md font-medium" style={{ color: 'var(--color-text-primary)' }}>Remove or trim</h3>
            </div>
            {toRemove.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-3px' }}>
                {toRemove.map((item, idx) => (
                  <span 
                    key={idx} 
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '13px',
                      margin: '3px',
                      lineHeight: '1.4',
                      backgroundColor: '#FCEBEB',
                      color: '#791F1F',
                      border: '0.5px solid #F7C1C1'
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No sections or words require removal.</p>
            )}
          </div>

        </div>
      )}

      {/* ── ATS ISSUES ────────────────────────────────────────────── */}
      {atsIssues.length > 0 && (
        <div className="card">
          <h3 className="card-title">ATS issues</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {atsIssues.map((issue, index) => (
              <div 
                key={index} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#FAEEDA',
                  color: '#633806',
                  border: '0.5px solid #FAC775',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '13px'
                }}
              >
                <AlertTriangle size={16} style={{ color: '#854F0B', flexShrink: 0 }} />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INTERVIEW PREP ────────────────────────────────────────── */}
      {interviewTopics.length > 0 && (
        <div className="card">
          <h3 className="card-title">Interview prep</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {interviewTopics.map((topic, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                <div 
                  style={{ 
                    fontSize: '14px', 
                    fontWeight: 500, 
                    borderLeft: '2px solid #AFA9EC', 
                    paddingLeft: '10px', 
                    marginBottom: '8px',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {topic.area}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-3px' }}>
                  {topic.questions.map((q, qIdx) => (
                    <span 
                      key={qIdx}
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '13px',
                        margin: '3px',
                        lineHeight: '1.4',
                        backgroundColor: '#EEEDFE',
                        color: '#3C3489',
                        border: '0.5px solid #CECBF6'
                      }}
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MARKET TRENDS ─────────────────────────────────────────── */}
      {marketTrends && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <h3 className="card-title">Market trends</h3>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--color-text-secondary)' }}>
            {marketTrends}
          </p>
        </div>
      )}

    </div>
  );
}
