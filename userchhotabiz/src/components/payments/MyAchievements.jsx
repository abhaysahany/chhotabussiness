import React, { useState } from 'react';

function MyAchievements({ user }) {
  const [toastMessage, setToastMessage] = useState('');

  const achievements = [
    { id: 'ACH-01', title: 'Fast Track 100 Sales', category: 'Direct Sales Milestone', unlockedDate: '12 Aug 2026', icon: '🏆', level: 'Gold Honor', desc: 'Achieved 100 direct active referrals in record time.' },
    { id: 'ACH-02', title: 'Binary Volume Producer', category: 'Team Leadership', unlockedDate: '01 Aug 2026', icon: '⚡', level: 'Platinum Rank', desc: 'Crossed 200,000 BV matched volume cutoff.' },
    { id: 'ACH-03', title: '₹100K Earnings Club', category: 'Financial Milestone', unlockedDate: '20 Jul 2026', icon: '💎', level: 'Diamond Honor', desc: 'Accumulated over ₹1,00,000 in net commission payout.' },
    { id: 'ACH-04', title: '5-Star Team Builder', category: 'Network Growth', unlockedDate: '10 Jun 2026', icon: '⭐', level: 'Leadership Master', desc: 'Maintained 95%+ active binary legs activity for 30 consecutive days.' },
  ];

  const downloadCertificate = (ach) => {
    setToastMessage(`Downloading official PDF Leadership Certificate for "${ach.title}"...`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <div className="page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="profile-toast-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">My Leadership Achievements</h1>
          <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Hall of fame, rank badges, accomplishment certificates, and leadership milestones.
          </p>
        </div>
        <div className="page-breadcrumb">
          <span>Payments</span>
          <span className="separator">»</span>
          <span className="current">My Achievements</span>
        </div>
      </div>

      {/* Hero Rank Badge Card */}
      <div
        className="pro-card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
          color: '#ffffff',
          padding: '2rem 2.25rem',
          borderRadius: '1.25rem',
          boxShadow: '0 16px 36px -10px rgba(15, 23, 42, 0.4)',
        }}
      >
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '1rem', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}>
              👑
            </div>
            <div>
              <span className="status-badge-success" style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.4)' }}>
                Verified Executive Rank
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.35rem', color: '#ffffff' }}>
                Gold Executive Leader
              </h2>
              <p style={{ color: '#c7d2fe', fontSize: '0.875rem' }}>
                Member Since Aug 2026 • Top 2% National Performer
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block' }}>TOTAL BADGES UNLOCKED</span>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
              4 Honor Badges
            </h3>
          </div>
        </div>
      </div>

      {/* Achievements Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {achievements.map((ach) => (
          <div key={ach.id} className="pro-card flex-column-between">
            <div>
              <div className="pro-card-header flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '2rem' }}>{ach.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{ach.title}</h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{ach.category}</span>
                  </div>
                </div>
                <span className="status-badge-success">Unlocked ✓</span>
              </div>

              <div className="pro-card-body">
                <p style={{ fontSize: '0.875rem', color: '#475467', lineHeight: '1.5', marginBottom: '1rem' }}>
                  {ach.desc}
                </p>

                <div className="info-details-list">
                  <div className="info-item">
                    <span className="info-label">Achievement Honor</span>
                    <span className="info-value highlight-purple">{ach.level}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Unlocked Date</span>
                    <span className="info-value">{ach.unlockedDate}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pro-card-footer" style={{ background: '#f8fafc', padding: '1rem 1.5rem' }}>
              <button
                className="btn-profile-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => downloadCertificate(ach)}
              >
                📜 Download Official Certificate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyAchievements;
