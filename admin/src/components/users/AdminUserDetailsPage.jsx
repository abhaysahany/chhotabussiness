import React, { useState, useEffect } from 'react';

function AdminUserDetailsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUserBpWallet, setSelectedUserBpWallet] = useState(null);

  // Dynamic 1 BP Value from Admin Settings
  const [bpRate, setBpRate] = useState(10);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vyapar_admin_mlm_settings') || localStorage.getItem('chhota_admin_mlm_settings');
      if (stored) {
        const s = JSON.parse(stored);
        if (s.bpValueInRupees) setBpRate(s.bpValueInRupees);
      }
    } catch (e) {}
  }, []);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'User',
    status: 'Active',
    address: '',
    notes: '',
    bpBalance: 0,
    commissionWallet: 0,
  });

  // Success Notification State
  const [toastMsg, setToastMsg] = useState('');

  // Sample User Accounts List with Dedicated Business Points (BP) Wallet
  const [users, setUsers] = useState([
    { id: 'USR-1001', name: 'Rajesh Sharma', username: 'rajesh_sharma', email: 'rajesh@vyaparadnet.com', phone: '+91 98765 43210', role: 'Business Owner', status: 'Active', kycStatus: 'Verified', joinedDate: '2026-01-15', bpBalance: 245, commissionWallet: 18500, address: 'B-402, Skyline Towers, Mumbai, MH' },
    { id: 'USR-1002', name: 'Priya Patel', username: 'priya_patel', email: 'priya@vyaparadnet.com', phone: '+91 98123 45678', role: 'Freelancer', status: 'Active', kycStatus: 'Verified', joinedDate: '2026-02-02', bpBalance: 180, commissionWallet: 12400, address: '12-A, Silicon Hub, Bengaluru, KA' },
    { id: 'USR-1003', name: 'Vikram Malhotra', username: 'vikram_m', email: 'vikram@vyaparadnet.com', phone: '+91 97111 22334', role: 'Affiliate Associate', status: 'Pending', kycStatus: 'Pending', joinedDate: '2026-03-10', bpBalance: 95, commissionWallet: 4200, address: '78, Civil Lines, Jaipur, RJ' },
    { id: 'USR-1004', name: 'Ananya Roy', username: 'ananya_design', email: 'ananya@vyaparadnet.com', phone: '+91 96543 21098', role: 'Freelancer', status: 'Active', kycStatus: 'Verified', joinedDate: '2026-04-12', bpBalance: 320, commissionWallet: 24800, address: 'Sector 62, Noida, UP' },
    { id: 'USR-1005', name: 'Sanjay Verma', username: 'sanjay_v', email: 'sanjay@vyaparadnet.com', phone: '+91 95432 10987', role: 'Business Owner', status: 'Suspended', kycStatus: 'Rejected', joinedDate: '2026-05-18', bpBalance: 40, commissionWallet: 1500, address: '45, MG Road, Indore, MP' },
    { id: 'USR-1006', name: 'Neha Gupta', username: 'neha_g', email: 'neha@vyaparadnet.com', phone: '+91 94321 09876', role: 'User', status: 'Active', kycStatus: 'Pending', joinedDate: '2026-06-20', bpBalance: 110, commissionWallet: 6800, address: 'Suite 301, Cyber City, Gurugram, HR' },
  ]);

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      address: user.address || '',
      notes: '',
      bpBalance: user.bpBalance || 0,
      commissionWallet: user.commissionWallet || 0,
    });
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    setUsers((prev) =>
      prev.map((u) => (u.id === editingUser.id ? { ...u, ...formData } : u))
    );
    setToastMsg(`User profile & wallets for [${editingUser.name}] updated!`);
    setEditingUser(null);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleToggleStatus = (userId) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
          setToastMsg(`User ${u.name} status changed to ${nextStatus}!`);
          setTimeout(() => setToastMsg(''), 3500);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchTerm ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || u.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalBpCollected = users.reduce((acc, curr) => acc + (curr.bpBalance || 0), 0);

  return (
    <div style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', backgroundColor: '#059669', color: '#fff', padding: '0.85rem 1.35rem', borderRadius: '10px', fontWeight: '700', boxShadow: '0 10px 25px -5px rgba(5,150,105,0.4)', zIndex: 2000, fontSize: '0.875rem' }}>
          ✓ {toastMsg}
        </div>
      )}

      {/* Hero Banner Header */}
      <div className="pro-entity-hero" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 30px -5px rgba(49, 46, 129, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', marginBottom: '0.75rem' }}>
              <span>👤 User Profiles & Business Points (BP) Wallets</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>User Details & Accounts Administration</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.925rem', maxWidth: '650px', margin: '0 0 0.75rem 0' }}>
              Inspect user profiles, manage accounts, audit Commission Wallets and track 20-level collected Business Points (BP) balances.
            </p>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#c7d2fe', fontWeight: 600 }}>1 BP VALUATION RATE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>₹{bpRate.toFixed(2)}</div>
            <span style={{ fontSize: '0.7rem', color: '#a5f3fc' }}>Dynamic Admin Setting</span>
          </div>
        </div>
      </div>

      {/* KPI Counters Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Users</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.3rem 0' }}>{users.length} Registered</div>
          <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '700' }}>Active in System</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #a855f7' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total BP Collected in Wallets</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#7e22ce', margin: '0.3rem 0' }}>{totalBpCollected} BP</div>
          <div style={{ fontSize: '0.78rem', color: '#7e22ce', fontWeight: '700' }}>≈ ₹{(totalBpCollected * bpRate).toLocaleString()} Total Value</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Commission Wallets Total</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#15803d', margin: '0.3rem 0' }}>
            ₹{users.reduce((acc, curr) => acc + (curr.commissionWallet || 0), 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: '700' }}>Referral & Team Incomes</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search users by name, username, email, phone, ID..."
            value={searchTerm}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: '0.55rem 0.85rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600', color: '#334155' }}>
            <option value="all">All Roles</option>
            <option value="Business Owner">Business Owner</option>
            <option value="Freelancer">Freelancer</option>
            <option value="Affiliate Associate">Affiliate Associate</option>
            <option value="User">Standard User</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.55rem 0.85rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600', color: '#334155' }}>
            <option value="all">All Account Statuses</option>
            <option value="active">Active Only</option>
            <option value="pending">Pending Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* User Details Table with Business Points (BP) Wallet */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.835rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#475569', letterSpacing: '0.05em' }}>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>User ID</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>User Profile</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Email & Phone</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>💎 BP Wallet (20 Levels)</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>💰 Cash Wallet</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <code style={{ background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700', color: '#6366f1' }}>
                    {u.id}
                  </code>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem' }}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', color: '#0f172a' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>@{u.username} • <span style={{ color: '#475569', fontWeight: 600 }}>{u.role}</span></div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: '600', color: '#334155' }}>{u.email}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.phone}</div>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: '800', color: '#7e22ce', fontSize: '0.95rem' }}>
                    💎 {u.bpBalance || 0} BP
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    ≈ ₹{((u.bpBalance || 0) * bpRate).toLocaleString()} (@ ₹{bpRate}/BP)
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: '800', color: '#15803d', fontSize: '0.95rem' }}>
                    ₹{(u.commissionWallet || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Commission Balance</div>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span style={{ background: u.status === 'Active' ? '#dcfce7' : u.status === 'Pending' ? '#fef3c7' : '#fee2e2', color: u.status === 'Active' ? '#15803d' : u.status === 'Pending' ? '#b45309' : '#dc2626', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.75rem' }}>
                    {u.status === 'Active' ? '✓ Active' : u.status === 'Pending' ? '⌛ Pending' : '🚫 Suspended'}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => setSelectedUserBpWallet(u)}
                      style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      💎 BP Ledger
                    </button>
                    <button
                      onClick={() => handleOpenEdit(u)}
                      style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(u.id)}
                      style={{ background: u.status === 'Active' ? '#fef3c7' : '#dcfce7', color: u.status === 'Active' ? '#b45309' : '#15803d', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {u.status === 'Active' ? '🔒 Suspend' : '🔓 Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BP WALLET INSPECTION MODAL */}
      {selectedUserBpWallet && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '85vh', overflowY: 'auto', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  💎 Business Points (BP) Wallet & 20-Level Collection
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  User: <strong>{selectedUserBpWallet.name}</strong> ({selectedUserBpWallet.id})
                </span>
              </div>
              <button onClick={() => setSelectedUserBpWallet(null)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#64748b', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #581c87 0%, #7e22ce 100%)', color: '#ffffff', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#e9d5ff', fontWeight: 700, textTransform: 'uppercase' }}>Total BP Balance</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{selectedUserBpWallet.bpBalance} BP</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#e9d5ff', fontWeight: 700, textTransform: 'uppercase' }}>Cash Equivalent (@ ₹{bpRate}/BP)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{((selectedUserBpWallet.bpBalance || 0) * bpRate).toLocaleString()}</div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0' }}>
              Recent 20-Level Network BP Credits
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', maxHeight: '220px', overflowY: 'auto' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].slice(0, 6).map((lvl) => (
                <div key={lvl} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                  <span>↳ Level {lvl} Downline Order Transaction (ORD-90{lvl}2)</span>
                  <strong style={{ color: '#7e22ce' }}>+5.00 BP</strong>
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedUserBpWallet(null)} style={{ width: '100%', marginTop: '1.25rem', padding: '0.65rem', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              Close Ledger
            </button>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '540px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)', padding: '1.25rem 1.5rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>Edit User & Wallets: {editingUser.name}</h3>
                <span style={{ fontSize: '0.78rem', color: '#c7d2fe' }}>ID: {editingUser.id}</span>
              </div>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handleSaveUser} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>Full Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>Email Address</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>💎 BP Wallet Balance (BP)</label>
                  <input type="number" value={formData.bpBalance} onChange={(e) => setFormData({ ...formData, bpBalance: Number(e.target.value) })} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '700', color: '#7e22ce' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>💰 Commission Wallet (₹)</label>
                  <input type="number" value={formData.commissionWallet} onChange={(e) => setFormData({ ...formData, commissionWallet: Number(e.target.value) })} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '700', color: '#15803d' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '0.65rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '0.65rem', background: '#4338ca', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUserDetailsPage;
