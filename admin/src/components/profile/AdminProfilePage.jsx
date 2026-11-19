import React from 'react';
import { useNavigate } from 'react-router-dom';

function AdminProfilePage({ currentAdmin }) {
  const navigate = useNavigate();

  const adminName = currentAdmin?.name || 'Super Administrator';
  const adminEmail = currentAdmin?.email || 'admin@vyaparadnet.com';
  const adminRole = currentAdmin?.role || 'Super Administrator';
  const adminUsername = currentAdmin?.username || 'admin';
  const adminId = currentAdmin?.id ? `ADM-${String(currentAdmin.id).padStart(4, '0')}` : 'ADM-0001';
  const createdAt = currentAdmin?.created_at
    ? new Date(currentAdmin.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Platform Launch';

  return (
    <div className="admin-page-container pro-support-container" style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      {/* Page Subheader */}
      <div className="page-subheader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>Administrator Profile</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Root account credentials, platform authority permissions, and master system controls.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
          <span>System</span>
          <span>›</span>
          <span style={{ color: '#2563eb', fontWeight: 700 }}>Admin Profile</span>
        </div>
      </div>

      {/* Hero Profile Banner Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3569a7 100%)',
          borderRadius: '16px',
          padding: '2rem 2.25rem',
          color: '#ffffff',
          marginBottom: '1.75rem',
          boxShadow: '0 10px 30px -5px rgba(49, 46, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '3px solid #818cf8',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80"
              alt="Admin Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div
              style={{
                display: 'none',
                width: '100%',
                height: '100%',
                background: '#312e81',
                color: '#ffffff',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 800,
              }}
            >
              {adminName.charAt(0).toUpperCase()}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#ffffff' }}>{adminName}</h1>
              <span style={{ background: '#22c55e', color: '#ffffff', padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
                ● ACTIVE
              </span>
            </div>
            <p style={{ margin: 0, color: '#c7d2fe', fontSize: '0.9rem' }}>
              {adminEmail} • <span style={{ color: '#93c5fd' }}>{adminRole}</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>⚙️</span> Platform Settings
          </button>
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
            }}
          >
            <span>📢</span> Send Broadcast
          </button>
        </div>
      </div>

      {/* Main Grid: Account Information & Platform Access Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Card 1: Official Account Credentials */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
              👤
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Account Credentials</h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Master Administrator Identity</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Admin ID:</span>
              <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{adminId}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Full Name:</span>
              <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{adminName}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Username:</span>
              <strong style={{ fontSize: '0.875rem', color: '#2563eb' }}>@{adminUsername}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Email Address:</span>
              <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{adminEmail}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Member Since:</span>
              <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{createdAt}</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Permissions & Authority */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
              🛡️
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>System Authority</h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Platform Level Access Rights</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
              <span style={{ fontSize: '0.85rem', color: '#334155' }}>Full Unrestricted MySQL Database Read & Write</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
              <span style={{ fontSize: '0.85rem', color: '#334155' }}>Income & Commission Distribution Rules Authority</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
              <span style={{ fontSize: '0.85rem', color: '#334155' }}>User Payout Approval & Bank IMPS Disbursement</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
              <span style={{ fontSize: '0.85rem', color: '#334155' }}>KYC Document Verification & Account Moderation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
              <span style={{ fontSize: '0.85rem', color: '#334155' }}>Global Application Branding & Logo Synchronization</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Shortcuts Grid */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
        ⚡ Direct Management Hub
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          style={{
            padding: '1.25rem',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚙️</div>
          <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.2rem' }}>Platform Settings</strong>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Branding, Social Links, 40/20/20</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/notifications')}
          style={{
            padding: '1.25rem',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📢</div>
          <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.2rem' }}>Notifications Desk</strong>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Broadcast system announcements</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/support/tickets')}
          style={{
            padding: '1.25rem',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎧</div>
          <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.2rem' }}>Support Center</strong>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Review customer inquiries</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/payments/history')}
          style={{
            padding: '1.25rem',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💳</div>
          <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.2rem' }}>Financial Ledger</strong>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Platform revenue & payments</span>
        </button>
      </div>
    </div>
  );
}

export default AdminProfilePage;
