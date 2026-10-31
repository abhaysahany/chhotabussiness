import React, { useState, useEffect } from 'react';
import { getAdminUsers, updateAdminUser, toggleAdminUserStatus } from '../../api/adminService';

function AdminUserDetailsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUserBpWallet, setSelectedUserBpWallet] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic 1 BP Value from Admin Settings
  const [bpRate, setBpRate] = useState(10);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('chhota_admin_mlm_settings');
      if (stored) {
        const s = JSON.parse(stored);
        if (s.bpValueInRupees) setBpRate(s.bpValueInRupees);
      }
    } catch (e) {}
  }, []);

  // Fetch real users from MySQL database API
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers();
      if (res?.status === 'success') {
        setUsers(res.users || []);
      }
    } catch (err) {
      console.error('Failed to load admin users from MySQL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
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

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const targetId = editingUser.dbId || editingUser.id;
      await updateAdminUser(targetId, formData);
      setToastMsg(`User profile & wallets for [${editingUser.name}] updated in database!`);
      await loadUsers();
      setEditingUser(null);
    } catch (err) {
      console.error('Error saving user to database:', err);
      setToastMsg('Failed to update user in database.');
    }
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleToggleStatus = async (userId) => {
    try {
      const userObj = users.find((u) => u.id === userId);
      const targetId = userObj?.dbId || userId;
      const res = await toggleAdminUserStatus(targetId);
      setToastMsg(`User ${userObj?.name || userId} status changed to ${res?.current_status || 'updated'}!`);
      await loadUsers();
    } catch (err) {
      console.error('Error toggling user status in database:', err);
      setToastMsg('Failed to toggle status.');
    }
    setTimeout(() => setToastMsg(''), 3500);
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
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', borderRadius: '16px', padding: '2rem 2.5rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(67, 56, 202, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c7d2fe', display: 'inline-block', marginBottom: '0.75rem' }}>
              👥 User Management & BP Ledger
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: '#fff' }}>User Accounts & Wallets</h1>
            <p style={{ color: '#e0e7ff', fontSize: '0.95rem', margin: 0, maxWidth: '650px' }}>
              Full database directory of all platform members, active Business Points (BP) balances, commission wallets, and account controls.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#c7d2fe', fontWeight: '600' }}>Platform Total BP In Circulation</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff' }}>💎 {totalBpCollected.toLocaleString()} BP</div>
              <div style={{ fontSize: '0.7rem', color: '#a5b4fc' }}>≈ ₹{(totalBpCollected * bpRate).toLocaleString()} (@ ₹{bpRate}/BP)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, minWidth: '300px' }}>
          <input
            type="text"
            placeholder="Search by name, email, phone, or User ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', flex: 1, minWidth: '220px', outline: 'none' }}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', background: '#fff' }}
          >
            <option value="all">All Roles & Ranks</option>
            <option value="user">User</option>
            <option value="business">Business Owner</option>
            <option value="freelancer">Freelancer</option>
            <option value="affiliate">Affiliate Associate</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', background: '#fff' }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#64748b' }}>
          Showing {filteredUsers.length} of {users.length} accounts
        </div>
      </div>

      {/* Users Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '0.85rem 1rem' }}>User ID</th>
              <th style={{ padding: '0.85rem 1rem' }}>User Profile</th>
              <th style={{ padding: '0.85rem 1rem' }}>Contact Details</th>
              <th style={{ padding: '0.85rem 1rem' }}>💎 BP Balance</th>
              <th style={{ padding: '0.85rem 1rem' }}>💰 Commission Wallet</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.35rem' }}>
                    {loading ? 'Loading Users...' : 'No User Accounts Found'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {loading ? 'Fetching active member records directly from MySQL database...' : 'No users match your active search and filter criteria.'}
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
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
              ))
            )}
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
                  <span>↳ Level {lvl} Downline Order Transaction</span>
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
