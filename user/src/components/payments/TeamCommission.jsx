import React, { useState, useEffect, useMemo } from 'react';
import { getTeamConnections } from '../../api/userNetworkService';
import { formatINR, formatNumberIN } from '../../utils/formatters';
import DataTable from '../common/DataTable';

function TeamCommission({ user }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('all');

  const userCode = user?.user_code || 'CB100001';

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await getTeamConnections({ user_code: userCode });
      if (res && res.status === 'success') {
        setTeamMembers(res.teamMembers || []);
      }
    } catch (err) {
      console.error('Error fetching database team commissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [user]);

  // Aggregate real 10-Level breakdown from database records
  const levelLogs = useMemo(() => {
    const rate = 2.0; // 2% equal rate across 10 levels
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => {
      const membersInLevel = teamMembers.filter((m) => Number(m.level) === lvl);
      const volume = membersInLevel.reduce(
        (sum, m) => sum + (Number(m.groupPv || m.groupBv || m.personalPv) || 0),
        0
      );
      const earned = Math.round((volume * rate) / 100);
      return {
        id: `LVL-${lvl}`,
        level: lvl,
        tierName: `Generation Level ${lvl}`,
        membersCount: membersInLevel.length,
        rate: `${rate.toFixed(1)}%`,
        volume: volume,
        earned: earned,
        status: membersInLevel.length > 0 ? 'Credited' : 'Active',
      };
    });
  }, [teamMembers]);

  const totalTeamEarned = useMemo(() => {
    return levelLogs.reduce((acc, curr) => acc + curr.earned, 0);
  }, [levelLogs]);

  const totalTeamMembers = useMemo(() => {
    return teamMembers.length;
  }, [teamMembers]);

  const filteredLogs = useMemo(() => {
    return selectedLevel === 'all'
      ? levelLogs
      : levelLogs.filter((l) => l.level === Number(selectedLevel));
  }, [levelLogs, selectedLevel]);

  // DataTable Column Definitions
  const columns = [
    {
      header: 'Level',
      accessor: 'level',
      render: (val) => <span style={{ fontWeight: 800, color: '#7c3aed' }}>L{val}</span>,
      width: '80px',
    },
    {
      header: 'Generation Tier',
      accessor: 'tierName',
      render: (val) => <span style={{ fontWeight: 700, color: '#0f172a' }}>{val}</span>,
    },
    {
      header: 'Active Partners',
      accessor: 'membersCount',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 600, color: '#334155' }}>{val} Members</span>,
    },
    {
      header: 'Override Rate',
      accessor: 'rate',
      align: 'center',
      render: (val) => <span style={{ fontWeight: 800, color: '#2563eb' }}>{val}</span>,
    },
    {
      header: 'Team Turnover (BV)',
      accessor: 'volume',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 700, color: '#059669' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Earned Team Income',
      accessor: 'earned',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'right',
      render: (val, row) => (
        <span
          style={{
            background: row.membersCount > 0 ? '#dcfce7' : '#f1f5f9',
            color: row.membersCount > 0 ? '#15803d' : '#64748b',
            padding: '0.2rem 0.55rem',
            borderRadius: '12px',
            fontSize: '0.72rem',
            fontWeight: 800,
          }}
        >
          ✓ {val}
        </span>
      ),
    },
  ];

  return (
    <div className="page-container" style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.3rem 0' }}>
          Team Commission (10 Levels Equal Distribution)
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
          Recurring team commissions calculated live from MySQL database across 10 generational downline levels at 2.0% per level.
        </p>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #3569a7' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>TOTAL TEAM COMMISSION</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#3569a7', margin: '0.3rem 0' }}>{formatINR(totalTeamEarned)}</div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>10 Levels Active in Database</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>TOTAL NETWORK MEMBERS</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0' }}>{totalTeamMembers} Partners</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Across 10 Downline Generations</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>EQUAL DISTRIBUTION RATE</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#7c3aed', margin: '0.3rem 0' }}>2.0% / Level</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>20% Total Pool (Equally Distributed)</div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        defaultPageSize={10}
        searchPlaceholder="Search level or tier..."
        loading={loading}
        actions={
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', cursor: 'pointer', background: '#fff' }}
          >
            <option value="all">All 10 Generation Levels</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => (
              <option key={l} value={String(l)}>
                Generation Level {l} (2.0%)
              </option>
            ))}
          </select>
        }
      />
    </div>
  );
}

export default TeamCommission;
