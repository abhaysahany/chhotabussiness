import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRewards, getUserFreshProfile, getUserDiamondRewards } from '../../api/userRewardService';
import { formatDateTime } from '../../utils/timezone';

const formatDiamonds = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num) || num === 0) return '0';
  return Number(num.toFixed(4)).toString();
};

function RewardDetails({ user, onNavigate }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(user || null);
  const userCode = currentUser?.user_code || user?.user_code || user?.sponsor_id || '';

  const [rewards, setRewards] = useState([]);
  const [diamondWallet, setDiamondWallet] = useState({
    diamond_balance: 0,
    level_1_diamonds: 0,
    level_2_diamonds: 0,
    conversion_rate_inr: 100,
  });
  const [diamondTransactions, setDiamondTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const userDiamonds = Number(diamondWallet.diamond_balance) || 0;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const loadDatabaseData = useCallback(async (showToastNotice = false) => {
    try {
      if (showToastNotice) setRefreshing(true);
      else setLoading(true);

      const [rewardsData, freshUser, diamondData] = await Promise.all([
        getUserRewards(),
        getUserFreshProfile(),
        getUserDiamondRewards(),
      ]);

      setRewards(rewardsData || []);
      if (diamondData?.wallet) {
        setDiamondWallet(diamondData.wallet);
      }
      setDiamondTransactions(diamondData?.transactions || []);

      if (freshUser) {
        setCurrentUser(freshUser);
      }

      if (showToastNotice) {
        showToast('✓ Synced with MySQL database successfully!');
      }
    } catch (err) {
      console.error('Error fetching database rewards:', err);
      showToast('Could not load rewards catalog from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadDatabaseData();
  }, [loadDatabaseData]);

  const handleNavigate = (path) => {
    if (typeof onNavigate === 'function') {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const handleNavigateToReward = (rewardId) => {
    handleNavigate(`/payments/rewards/${rewardId}`);
  };

  const eligibleRewards = rewards.filter((r) => userDiamonds >= (Number(r.required_bp) || 0));
  const lockedRewards = rewards.filter((r) => userDiamonds < (Number(r.required_bp) || 0)).sort((a, b) => (Number(a.required_bp) || 0) - (Number(b.required_bp) || 0));
  const nextMilestone = lockedRewards[0] || null;

  return (
    <div className="page-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.35rem',
            borderRadius: '10px',
            zIndex: 99999,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            fontSize: '0.875rem',
            fontWeight: 700,
            border: '1px solid #334155',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', marginBottom: '0.75rem' }}>
              <span>💎 Reward Overview Hub</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>
              Diamond Wallet & Reward Overview
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.925rem', maxWidth: '720px', margin: 0 }}>
              Track your 2-Level Diamond accumulations, conversion rate, wallet transaction history, and milestone progress.
            </p>
          </div>

          {/* User Diamond Wallet Pill & Database Sync */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '16px', padding: '1.25rem 1.75rem', textAlign: 'center', minWidth: '220px' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c7d2fe', fontWeight: 700 }}>
                Your Diamond Balance
              </span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.25rem' }}>
                💎 {formatDiamonds(diamondWallet.diamond_balance)} <span style={{ fontSize: '1rem', color: '#ffffff' }}>Diamonds</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#e2e8f0', display: 'block', marginTop: '0.2rem' }}>
                Member: {currentUser?.user_code || userCode || 'Database User'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => loadDatabaseData(true)}
              disabled={refreshing}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              🔄 {refreshing ? 'Syncing...' : 'Sync Database Wallet'}
            </button>
          </div>
        </div>
      </div>

      {/* My Diamond Rewards Section (Two-Level Sponsor Reward System) */}
      <section
        aria-label="My Diamond Rewards"
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 15px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>💎</span> My Diamond Rewards
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
              Non-cash sponsor reward Diamonds earned from Level 1 (Direct Sponsor) and Level 2 (Sponsor's Sponsor) reward allocations. Separate from cash wallet and payouts.
            </p>
          </div>
          <span
            style={{
              background: '#ecfeff',
              border: '1px solid #a5f3fc',
              color: '#0e7490',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 700,
            }}
          >
            Conversion Rate: ₹{Number(diamondWallet.conversion_rate_inr || 100)} = 1 Diamond
          </span>
        </div>

        {/* Diamond Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.35rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', border: '1px solid #67e8f9', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0e7490', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Diamond Balance
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#155e75', marginTop: '0.25rem' }}>
              💎 {formatDiamonds(diamondWallet.diamond_balance)}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#0e7490', marginTop: '0.15rem' }}>
              Non-cash reward balance
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Reward Level 1 Diamonds
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.25rem' }}>
              {formatDiamonds(diamondWallet.level_1_diamonds)} 💎
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>
              Earned as Direct Sponsor
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Reward Level 2 Diamonds
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.25rem' }}>
              {formatDiamonds(diamondWallet.level_2_diamonds)} 💎
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>
              Earned as Sponsor's Sponsor
            </div>
          </div>
        </div>

        {/* Recent Diamond Transactions */}
        <div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0' }}>
            Recent Diamond Transactions
          </h3>
          {diamondTransactions.length === 0 ? (
            <div style={{ padding: '1.25rem', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', color: '#64748b', fontSize: '0.86rem' }}>
              No Diamond reward transactions credited to your account yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#334155' }}>Source</th>
                    <th style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#334155' }}>Reward Level</th>
                    <th style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#334155', textAlign: 'right' }}>Reward Amount</th>
                    <th style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#334155', textAlign: 'right' }}>Diamonds</th>
                    <th style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#334155' }}>Credit Date</th>
                  </tr>
                </thead>
                <tbody>
                  {diamondTransactions.map((tx) => {
                    const isReversal = tx.transaction_type === 'reversal' || tx.transaction_type === 'debit' || Number(tx.diamond_quantity) < 0;
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#0f172a' }}>
                          <div>{tx.source || tx.source_reference}</div>
                          {tx.source_member_code && (
                            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>
                              Member: {tx.source_member_code}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: Number(tx.reward_level) === 1 ? '#dbeafe' : '#f3e8ff',
                              color: Number(tx.reward_level) === 1 ? '#1d4ed8' : '#7c3aed',
                            }}
                          >
                            Level {tx.reward_level}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem', textAlign: 'right', fontWeight: 700, color: isReversal ? '#dc2626' : '#0f172a' }}>
                          ₹{Math.abs(Number(tx.allocated_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem', textAlign: 'right', fontWeight: 800, color: isReversal ? '#dc2626' : '#0891b2' }}>
                          {isReversal ? '-' : '+'}{formatDiamonds(Math.abs(Number(tx.diamond_quantity || 0)))} 💎
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem', color: '#64748b', fontSize: '0.8rem' }}>
                          {formatDateTime(tx.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Milestone Rewards Catalog Hub */}
      <section
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '2rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          marginBottom: '2.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.75rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#eff6ff', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '14px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <span>🎁 Official Catalog</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
              Milestone Rewards Catalog
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
              All milestone physical products, gadgets, luxury tour packages, and automobile awards are organized in our dedicated <strong>Available Rewards</strong> table view.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleNavigate('/payments/rewards/available')}
              style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.75rem 1.4rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              <span>📋</span> Browse Available Rewards (Table View) →
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('/payments/rewards-claimed')}
              style={{
                background: '#ffffff',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '0.75rem 1.25rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>📦</span> View Claimed Rewards
            </button>
          </div>
        </div>

        {/* Milestone Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.15rem 1.25rem', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Catalog Items</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
              {rewards.length} Products
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Active in milestone tiers</span>
          </div>

          <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1.15rem 1.25rem', border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ready to Claim Now</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>
              ✓ {eligibleRewards.length} Unlocked
            </div>
            <span style={{ fontSize: '0.75rem', color: '#166534' }}>
              {eligibleRewards.length > 0 ? 'Your Diamond balance qualifies!' : 'Accumulate more Diamonds to unlock'}
            </span>
          </div>

          <div style={{ background: '#fefce8', borderRadius: '12px', padding: '1.15rem 1.25rem', border: '1px solid #fef08a' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Next Target Milestone</span>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#a16207', marginTop: '0.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nextMilestone ? nextMilestone.title : 'All Milestones Achieved! 🎉'}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#854d0e' }}>
              {nextMilestone ? `Requires ${nextMilestone.required_bp} 💎 (Need ${formatDiamonds(nextMilestone.required_bp - userDiamonds)} more)` : 'Outstanding achievement!'}
            </span>
          </div>
        </div>

        {/* Catalog Preview Highlight Strip */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 800, color: '#1e293b' }}>
              Featured Milestone Rewards Preview
            </h4>
            <button
              type="button"
              onClick={() => handleNavigate('/payments/rewards/available')}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Open Full Table View ({rewards.length} Items) →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {rewards.slice(0, 3).map((r) => {
              const req = Number(r.required_bp) || 0;
              const ready = userDiamonds >= req;
              return (
                <div
                  key={r.id}
                  onClick={() => handleNavigateToReward(r.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.85rem 1rem',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: ready ? '1px solid #86efac' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#ffffff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = ready ? '#86efac' : '#e2e8f0'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                >
                  <img
                    src={r.image || '/logo.png'}
                    alt={r.title}
                    style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                      💎 {r.required_bp} Diamonds • {r.reward_value_inr ? `₹${Number(r.reward_value_inr).toLocaleString('en-IN')}` : r.category}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: ready ? '#16a34a' : '#64748b', flexShrink: 0 }}>
                    {ready ? 'Ready →' : 'View →'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default RewardDetails;
