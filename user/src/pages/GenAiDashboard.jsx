import React, { useState } from 'react';

function GenAiDashboard() {
  const [activeTab, setActiveTab] = useState('accuracy');

  return (
    <div className="gen-ai-dashboard-container">
      {/* Page Top Header Row */}
      <div className="page-header-row gen-ai-header-row">
        <h1 className="page-title gen-ai-title">Gen AI Dashboard</h1>
        <div className="gen-ai-actions">
          <button className="btn-insights" onClick={() => alert('AI Insights generated!')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a10 10 0 0 1 10 10"></path>
            </svg>
            <span>Get Insights</span>
          </button>
          <button className="btn-ask-ai" onClick={() => alert('Ask AI assistant activated!')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
            </svg>
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Row: Welcome Banner + 3 Metric Cards */}
      <div className="top-metrics-grid">
        {/* Welcome Banner Card */}
        <div className="welcome-banner-card">
          <div className="welcome-text-content">
            <span className="welcome-subtitle">Welcome !</span>
            <h2 className="welcome-user-name">Noah Russell 👋</h2>
            <p className="welcome-desc">Step into the next era of productivity.</p>
            <button className="btn-studio" onClick={() => alert('Opening AI Studio...')}>
              Open AI Studio →
            </button>
          </div>
          <div className="welcome-robot-wrapper">
            <img src="/ai_robot.jpg" alt="3D AI Robot" className="robot-3d-img" />
          </div>
        </div>

        {/* AI Models Card */}
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon-box purple-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2"></rect>

                <circle cx="12" cy="5" r="2"></circle>
                <path d="M12 7v4"></path>
                <line x1="8" y1="16" x2="8" y2="16.01"></line>
                <line x1="16" y1="16" x2="16" y2="16.01"></line>
              </svg>
            </div>
          </div>
          <span className="metric-label">AI Models</span>
          <div className="metric-number-row">
            <span className="metric-value">134</span>
            <span className="trend-badge green">▲ 5.15%</span>
          </div>
          <span className="metric-subtext">Increases This month</span>
        </div>

        {/* API Requests Card */}
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon-box purple-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
          </div>
          <span className="metric-label">API Requests</span>
          <div className="metric-number-row">
            <span className="metric-value">564</span>
            <span className="trend-badge red">▼ 2.58%</span>
          </div>
          <span className="metric-subtext">Decreases This month</span>
        </div>

        {/* Avg Response Card */}
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon-box purple-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>

                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          <span className="metric-label">Avg Response</span>
          <div className="metric-number-row">
            <span className="metric-value">86%</span>
            <span className="trend-badge red">▼ 4.3%</span>
          </div>
          <span className="metric-subtext">Decreases This month</span>
        </div>
      </div>

      {/* Middle Section: AI Usage & Cost Analytics (Left) + Model Performance (Right) */}
      <div className="dashboard-middle-grid">
        {/* Left Column: AI Usage & Cost Analytics */}
        <div className="card-box analytics-card">
          <div className="card-box-header">
            <div className="card-title-with-bar">
              <span className="purple-indicator-bar"></span>
              <h3 className="card-title-text">AI Usage & Cost Analytics</h3>
            </div>
            <div className="card-header-actions">
              <button className="btn-filter-dropdown">
                Last Month ▾
              </button>
              <button className="btn-export">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="card-box-body">
            {/* Chart Legend */}
            <div className="chart-legend-row">
              <span className="legend-item"><span className="dot purple-dot">●</span> AI Usage</span>
              <span className="legend-item"><span className="dot pink-dot">●</span> Cost Analytics</span>
            </div>

            {/* SVG Double Line Chart */}
            <div className="svg-chart-container">
              <svg viewBox="0 0 900 240" className="analytics-svg-chart">
                <defs>
                  <linearGradient id="purpleAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines */}
                <line x1="40" y1="20" x2="880" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="40" y1="65" x2="880" y2="65" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="40" y1="110" x2="880" y2="110" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="40" y1="155" x2="880" y2="155" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="40" y1="200" x2="880" y2="200" stroke="#f1f5f9" />

                {/* Y-Axis Text Labels */}
                <text x="25" y="24" fill="#94a3b8" fontSize="11">100</text>
                <text x="25" y="69" fill="#94a3b8" fontSize="11">80</text>
                <text x="25" y="114" fill="#94a3b8" fontSize="11">60</text>
                <text x="25" y="159" fill="#94a3b8" fontSize="11">40</text>
                <text x="25" y="204" fill="#94a3b8" fontSize="11">20</text>
                <text x="25" y="235" fill="#94a3b8" fontSize="11">0</text>

                {/* Area Gradient Fill under Purple Line */}
                <path
                  d="M60,110 Q110,80 160,95 T260,130 T360,35 T460,130 T560,110 T660,110 T760,200 T860,160 L860,200 L60,200 Z"
                  fill="url(#purpleAreaGrad)"
                />

                {/* Purple Line - AI Usage */}
                <path
                  d="M60,110 Q110,80 160,95 T260,130 T360,35 T460,130 T560,110 T660,110 T760,200 T860,160"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Pink Dashed Line - Cost Analytics */}
                <path
                  d="M60,70 Q110,110 160,85 T260,85 T360,140 T460,95 T560,120 T660,150 T760,95 T860,110"
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                />

                {/* X-Axis Month Labels */}
                <text x="55" y="225" fill="#94a3b8" fontSize="11">Jan</text>
                <text x="125" y="225" fill="#94a3b8" fontSize="11">Feb</text>
                <text x="195" y="225" fill="#94a3b8" fontSize="11">Mar</text>
                <text x="265" y="225" fill="#94a3b8" fontSize="11">Apr</text>
                <text x="335" y="225" fill="#94a3b8" fontSize="11">May</text>
                <text x="405" y="225" fill="#94a3b8" fontSize="11">Jun</text>
                <text x="475" y="225" fill="#94a3b8" fontSize="11">Jul</text>
                <text x="545" y="225" fill="#94a3b8" fontSize="11">Aug</text>
                <text x="615" y="225" fill="#94a3b8" fontSize="11">Sep</text>
                <text x="685" y="225" fill="#94a3b8" fontSize="11">Oct</text>
                <text x="755" y="225" fill="#94a3b8" fontSize="11">Nov</text>
                <text x="825" y="225" fill="#94a3b8" fontSize="11">Dec</text>
              </svg>
            </div>

            {/* Bottom 3 KPI Metric Badges inside Analytics Card */}
            <div className="analytics-kpi-grid">
              <div className="kpi-box">
                <div className="kpi-icon-square">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <div className="kpi-info">
                  <span className="kpi-val">$123,644</span>
                  <span className="kpi-sub">Compute</span>
                </div>
                <span className="kpi-badge green">+12.17%</span>
              </div>

              <div className="kpi-box">
                <div className="kpi-icon-square">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <div className="kpi-info">
                  <span className="kpi-val">$6,925</span>
                  <span className="kpi-sub">Storage</span>
                </div>
                <span className="kpi-badge red">-3.74%</span>
              </div>

              <div className="kpi-box">
                <div className="kpi-icon-square">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>

                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </div>
                <div className="kpi-info">
                  <span className="kpi-val">$4,654</span>
                  <span className="kpi-sub">API Calls</span>
                </div>
                <span className="kpi-badge green">+4.76%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Model Performance */}
        <div className="card-box performance-card">
          <div className="card-box-header">
            <div className="card-title-with-bar">
              <span className="purple-indicator-bar"></span>
              <h3 className="card-title-text">Model Performance</h3>
            </div>
          </div>

          <div className="card-box-body">
            {/* Tabs for Accuracy / F1 Score */}
            <div className="perf-tabs-row">
              <button
                className={`perf-tab-btn ${activeTab === 'accuracy' ? 'active' : ''}`}
                onClick={() => setActiveTab('accuracy')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Accuracy</span>
              </button>

              <button
                className={`perf-tab-btn ${activeTab === 'f1' ? 'active' : ''}`}
                onClick={() => setActiveTab('f1')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v18M3 12h18"></path>
                </svg>
                <span>F1 Score</span>
              </button>
            </div>

            {/* Donut Chart with Center Visitors Stat */}
            <div className="donut-chart-container">
              <svg viewBox="0 0 200 200" className="donut-svg">
                <circle cx="100" cy="100" r="72" fill="none" stroke="#f1f5f9" strokeWidth="18" />
                <circle
                  cx="100"
                  cy="100"
                  r="72"
                  fill="none"
                  stroke="url(#donutGradient)"
                  strokeWidth="18"
                  strokeDasharray="340 110"
                  strokeDashoffset="90"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="60%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="donut-center-info">
                <span className="donut-center-label">Total Visitors</span>
                <span className="donut-center-value">10818</span>
              </div>
            </div>

            {/* Performance Data Table */}
            <div className="perf-table-wrapper">
              <table className="perf-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Accuracy (%)</th>
                    <th>F1 Score (%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="model-name">VisionPro AI</td>
                    <td>25</td>
                    <td>89</td>
                  </tr>
                  <tr>
                    <td className="model-name">SpeechGen 2.0</td>
                    <td>78</td>
                    <td>62</td>
                  </tr>
                  <tr>
                    <td className="model-name">EcoAI Analyzer</td>
                    <td>65</td>
                    <td>45</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Quick Actions */}
      <div className="quick-actions-section">
        <h4 className="quick-actions-title">Quick Actions :</h4>
        <div className="quick-actions-pills">
          <button className="action-pill-btn" onClick={() => alert('Text Generator activated')}>
            ⚡ Generate Text
          </button>
          <button className="action-pill-btn" onClick={() => alert('Image Generator activated')}>
            🖼️ Create AI Image
          </button>
          <button className="action-pill-btn" onClick={() => alert('Voice Synthesis activated')}>
            🎙️ Voice Generator
          </button>
          <button className="action-pill-btn" onClick={() => alert('Analytics Report downloaded')}>
            📊 Export Analytics
          </button>
        </div>
      </div>
    </div>
  );
}

export default GenAiDashboard;
