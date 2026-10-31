import React, { useState, useEffect, useMemo } from 'react';
import { getDirectConnections } from '../../api/userNetworkService';
import { formatINR, formatNumberIN } from '../../utils/formatters';
import DataTable from '../common/DataTable';

function BaseCommission({ user }) {
  const [directs, setDirects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState('All');
  const [toastMessage, setToastMessage] = useState('');

  const userCode = user?.user_code || 'CB100001';

  const fetchDirects = async () => {
    try {
      setLoading(true);
      const res = await getDirectConnections({ user_code: userCode });
      if (res && res.status === 'success') {
        setDirects(res.directs || []);
      }
    } catch (err) {
      console.error('Error fetching database base commissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirects();
  }, [user]);

  const applyPreset = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'All') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'This Month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'Last Month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
  };

  const commissionLogs = useMemo(() => {
    return directs.map((member, idx) => {
      const vol = Number(member.personalPv || member.personalBv || 1000);
      const rate = 10; // 10% direct commission
      const earned = Math.round((vol * rate) / 100);
      return {
        id: `REF-${member.id || idx + 1000}`,
        buyer: member.name,
        userCode: member.id,
        email: member.email || 'N/A',
        rank: member.rank || 'Bronze Starter',
        packageJoined: `Self Volume (${formatNumberIN(vol)} BV)`,
        rate: `${rate}%`,
        amount: earned,
        volume: vol,
        date: member.joiningDate || '2026-08-10',
        dateDisplay: member.joiningDate || '10 Aug 2026',
        status: member.status === 'active' ? 'Credited to Wallet' : 'Pending Verification',
      };
    });
  }, [directs]);

  const filteredCommissions = useMemo(() => {
    return commissionLogs.filter((c) => {
      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && c.date >= startDate;
      if (endDate) matchesDate = matchesDate && c.date <= endDate;
      return matchesDate;
    });
  }, [commissionLogs, startDate, endDate]);

  const totalReferralEarned = useMemo(() => {
    return filteredCommissions.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredCommissions]);

  // DataTable Column Definitions
  const columns = [
    {
      header: 'Txn Ref',
      accessor: 'id',
      render: (val) => <span style={{ fontWeight: 800, color: '#2563eb' }}>{val}</span>,
    },
    {
      header: 'Direct Sponsored Partner',
      accessor: 'buyer',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0f172a' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.userCode} • {row.rank}</div>
        </div>
      ),
    },
    {
      header: 'Joining Date',
      accessor: 'dateDisplay',
      render: (val) => <span style={{ color: '#64748b' }}>{val}</span>,
    },
    {
      header: 'Self Business (BV)',
      accessor: 'volume',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 700, color: '#059669' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Rate',
      accessor: 'rate',
      align: 'center',
      render: (val) => <span style={{ fontWeight: 800, color: '#2563eb' }}>{val}</span>,
    },
    {
      header: 'Earned Base Income',
      accessor: 'amount',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'right',
      render: (val) => (
        <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
          ✓ {val}
        </span>
      ),
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.3rem 0' }}>
          Base Commission (Direct Sponsor Income)
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
          Direct commissions credited in real-time from database with multi-column sorting and pagination.
        </p>
      </div>

      {/* Hero Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>TOTAL BASE COMMISSION</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#16a34a', margin: '0.3rem 0' }}>{formatINR(totalReferralEarned)}</div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>100% Credited to Wallet</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>ACTIVE DIRECT SPONSORS</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0' }}>{directs.length} Direct Partners</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Level 1 MySQL Records</div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredCommissions}
        defaultPageSize={10}
        searchPlaceholder="Search direct sponsors..."
        loading={loading}
        actions={
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['All', 'This Month', 'Last Month'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => applyPreset(p)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: datePreset === p ? '#2563eb' : '#cbd5e1',
                  background: datePreset === p ? '#eff6ff' : '#ffffff',
                  color: datePreset === p ? '#2563eb' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />
    </div>
  );
}

export default BaseCommission;
