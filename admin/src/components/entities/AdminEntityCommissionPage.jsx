import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getEntityCommissionSettings,
  saveEntityCommissionSettings,
} from '../../api/adminEntityService';

const COMMISSION_DEFAULTS = {
  direct_percent: 10,
  level_2_percent: 4,
  level_3_percent: 3,
  level_4_percent: 2,
  level_5_percent: 1,
  reward_percent: 5,
};

const resolveRate = (entity, field) => {
  if (entity?.is_configured && entity[field] !== undefined && entity[field] !== null) {
    return Number(entity[field]);
  }
  if (entity && entity[field] !== undefined && entity[field] !== null && Number(entity[field]) > 0) {
    return Number(entity[field]);
  }
  return COMMISSION_DEFAULTS[field] ?? 0;
};

function AdminEntityCommissionPage({ onNavigate }) {
  const [entities, setEntities] = useState([]);
  const [summary, setSummary] = useState({
    total_entities: 0,
    business_count: 0,
    freelancer_count: 0,
    configured_count: 0,
    default_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [savingRowKey, setSavingRowKey] = useState(null); // 'business_1' or 'freelancer_2'
  const [editingRowKey, setEditingRowKey] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'business' | 'freelancer'
  const [configFilter, setConfigFilter] = useState('all'); // 'all' | 'configured' | 'default'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal State for full-dialog editing
  const [modalEntity, setModalEntity] = useState(null);
  const [modalForm, setModalForm] = useState({
    direct_percent: '10',
    level_2_percent: '4',
    level_3_percent: '3',
    level_4_percent: '2',
    level_5_percent: '1',
    reward_percent: '5',
  });
  const [modalValidationErrors, setModalValidationErrors] = useState({});

  const showToast = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(''), 4500);
    }
  };

  const getRowKey = (entity) => `${entity.entity_type}_${entity.entity_id}`;

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getEntityCommissionSettings({
        entity_type: typeFilter,
        search: searchTerm || undefined,
        config_status: configFilter,
      });

      if (res && res.status === 'success') {
        setEntities(res.data || []);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching commission settings:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load commission settings from server.';
      showToast(msg, true);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, searchTerm, configFilter]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Client-side search and filtering logic
  const filteredEntities = useMemo(() => {
    return entities.filter((item) => {
      // Type filter
      if (typeFilter !== 'all' && item.entity_type !== typeFilter) {
        return false;
      }

      // Configuration filter
      if (configFilter === 'configured' && !item.is_configured) {
        return false;
      }
      if (configFilter === 'default' && item.is_configured) {
        return false;
      }

      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = item.entity_name?.toLowerCase().includes(query);
        const matchesEmail = item.email?.toLowerCase().includes(query);
        const matchesId = String(item.entity_id).includes(query);
        const matchesCategory = item.category_name?.toLowerCase().includes(query);
        return matchesName || matchesEmail || matchesId || matchesCategory;
      }

      return true;
    });
  }, [entities, typeFilter, configFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredEntities.length / pageSize) || 1;
  const paginatedEntities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntities.slice(start, start + pageSize);
  }, [filteredEntities, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, configFilter]);

  // Start inline row editing
  const handleStartEdit = (entity) => {
    const key = getRowKey(entity);
    setEditingRowKey(key);
    setEditValues({
      direct_percent: resolveRate(entity, 'direct_percent'),
      level_2_percent: resolveRate(entity, 'level_2_percent'),
      level_3_percent: resolveRate(entity, 'level_3_percent'),
      level_4_percent: resolveRate(entity, 'level_4_percent'),
      level_5_percent: resolveRate(entity, 'level_5_percent'),
      reward_percent: resolveRate(entity, 'reward_percent'),
    });
  };

  const handleCancelEdit = () => {
    setEditingRowKey(null);
    setEditValues({});
  };

  const validatePercentages = (values) => {
    const errors = {};
    const fields = [
      { key: 'direct_percent', label: 'Direct Commission' },
      { key: 'level_2_percent', label: 'Level 2 Commission' },
      { key: 'level_3_percent', label: 'Level 3 Commission' },
      { key: 'level_4_percent', label: 'Level 4 Commission' },
      { key: 'level_5_percent', label: 'Level 5 Commission' },
      { key: 'reward_percent', label: 'Reward' },
    ];

    for (const f of fields) {
      const val = parseFloat(values[f.key]);
      if (isNaN(val)) {
        errors[f.key] = `${f.label} must be a valid number.`;
      } else if (val < 0) {
        errors[f.key] = `${f.label} cannot be negative.`;
      } else if (val > 100) {
        errors[f.key] = `${f.label} cannot exceed 100%.`;
      }
    }

    return errors;
  };

  // Save inline row edits
  const handleSaveInline = async (entity) => {
    const errors = validatePercentages(editValues);
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      showToast(firstError, true);
      return;
    }

    const rowKey = getRowKey(entity);
    setSavingRowKey(rowKey);

    const payload = {
      entity_type: entity.entity_type,
      entity_id: entity.entity_id,
      direct_percent: parseFloat(editValues.direct_percent) || 0,
      level_2_percent: parseFloat(editValues.level_2_percent) || 0,
      level_3_percent: parseFloat(editValues.level_3_percent) || 0,
      level_4_percent: parseFloat(editValues.level_4_percent) || 0,
      level_5_percent: parseFloat(editValues.level_5_percent) || 0,
      reward_percent: parseFloat(editValues.reward_percent) || 0,
    };

    try {
      const res = await saveEntityCommissionSettings(payload);
      if (res && res.status === 'success') {
        showToast(res.message || `Saved settings for ${entity.entity_name}!`);

        // Update local entity state
        setEntities((prev) =>
          prev.map((item) => {
            if (item.entity_type === entity.entity_type && item.entity_id === entity.entity_id) {
              return {
                ...item,
                ...payload,
                is_configured: true,
                updated_at: new Date().toISOString(),
              };
            }
            return item;
          })
        );

        setEditingRowKey(null);
        setEditValues({});
      } else {
        showToast(res?.message || 'Failed to save settings.', true);
      }
    } catch (err) {
      console.error('Error saving entity commission settings:', err);
      const errMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : 'Error saving settings.');
      showToast(errMsg, true);
    } finally {
      setSavingRowKey(null);
    }
  };

  // Open full Modal for detailed editing
  const handleOpenModal = (entity) => {
    setModalEntity(entity);
    setModalForm({
      direct_percent: String(resolveRate(entity, 'direct_percent')),
      level_2_percent: String(resolveRate(entity, 'level_2_percent')),
      level_3_percent: String(resolveRate(entity, 'level_3_percent')),
      level_4_percent: String(resolveRate(entity, 'level_4_percent')),
      level_5_percent: String(resolveRate(entity, 'level_5_percent')),
      reward_percent: String(resolveRate(entity, 'reward_percent')),
    });
    setModalValidationErrors({});
  };

  const handleCloseModal = () => {
    setModalEntity(null);
    setModalValidationErrors({});
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!modalEntity) return;

    const errors = validatePercentages(modalForm);
    if (Object.keys(errors).length > 0) {
      setModalValidationErrors(errors);
      return;
    }

    const payload = {
      entity_type: modalEntity.entity_type,
      entity_id: modalEntity.entity_id,
      direct_percent: parseFloat(modalForm.direct_percent) || 0,
      level_2_percent: parseFloat(modalForm.level_2_percent) || 0,
      level_3_percent: parseFloat(modalForm.level_3_percent) || 0,
      level_4_percent: parseFloat(modalForm.level_4_percent) || 0,
      level_5_percent: parseFloat(modalForm.level_5_percent) || 0,
      reward_percent: parseFloat(modalForm.reward_percent) || 0,
    };

    const rowKey = getRowKey(modalEntity);
    setSavingRowKey(rowKey);

    try {
      const res = await saveEntityCommissionSettings(payload);
      if (res && res.status === 'success') {
        showToast(res.message || `Saved settings for ${modalEntity.entity_name}!`);

        setEntities((prev) =>
          prev.map((item) => {
            if (item.entity_type === modalEntity.entity_type && item.entity_id === modalEntity.entity_id) {
              return {
                ...item,
                ...payload,
                is_configured: true,
                updated_at: new Date().toISOString(),
              };
            }
            return item;
          })
        );

        handleCloseModal();
      } else {
        showToast(res?.message || 'Failed to save settings.', true);
      }
    } catch (err) {
      console.error('Error saving modal settings:', err);
      const errMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : 'Error saving settings.');
      showToast(errMsg, true);
    } finally {
      setSavingRowKey(null);
    }
  };

  return (
    <div className="pro-page-container">
      {/* Page Header */}
      <div className="pro-page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
              <span>Products & Services</span>
              <span>›</span>
              <span style={{ color: '#4f46e5', fontWeight: 600 }}>Set Commission</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: '#fff',
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h1 className="pro-page-title" style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800 }}>
                Set Commission
              </h1>
            </div>
            <p className="pro-page-subtitle" style={{ margin: '0.35rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Configure independent Direct Commission, Level 2–5 Network distribution, and Reward percentages applied across Products & Services.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <button
              onClick={fetchSettings}
              className="pro-btn-secondary"
              title="Refresh records from database"
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={loading ? 'spin' : ''}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Toast Feedback Messages */}
      {successMessage && (
        <div
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          className="pro-stat-card"
          style={{
            background: '#ffffff',
            padding: '1.1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: '#f1f5f9',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}
          >
            👥
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Registered Entities
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
              {summary.total_entities}
            </div>
          </div>
        </div>

        <div
          className="pro-stat-card"
          style={{
            background: '#ffffff',
            padding: '1.1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}
          >
            🏢
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600, textTransform: 'uppercase' }}>
              Business Entities
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0369a1' }}>
              {summary.business_count}
            </div>
          </div>
        </div>

        <div
          className="pro-stat-card"
          style={{
            background: '#ffffff',
            padding: '1.1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: '#f3e8ff',
              color: '#9333ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}
          >
            💼
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#9333ea', fontWeight: 600, textTransform: 'uppercase' }}>
              Freelancer Entities
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#7e22ce' }}>
              {summary.freelancer_count}
            </div>
          </div>
        </div>

        <div
          className="pro-stat-card"
          style={{
            background: '#ffffff',
            padding: '1.1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}
          >
            ⚙️
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase' }}>
              Custom Configured
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#15803d' }}>
              {summary.configured_count} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>/ {summary.total_entities}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="pro-filter-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
          background: '#ffffff',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px', maxWidth: '450px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
              🔍
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Search by entity name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.4rem', borderRadius: '10px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Type:</label>
            <select
              className="form-input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ borderRadius: '10px', fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
            >
              <option value="all">All Entity Types</option>
              <option value="business">Business Entities Only</option>
              <option value="freelancer">Freelancer Entities Only</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Settings:</label>
            <select
              className="form-input"
              value={configFilter}
              onChange={(e) => setConfigFilter(e.target.value)}
              style={{ borderRadius: '10px', fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
            >
              <option value="all">All Statuses</option>
              <option value="configured">Custom Rates Configured</option>
              <option value="default">Default Rates Only</option>
            </select>
          </div>

          {(searchTerm || typeFilter !== 'all' || configFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setConfigFilter('all');
              }}
              className="pro-btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Enterprise Data Table */}
      <div className="pro-table-wrapper" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4.5rem 1rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
            <p style={{ color: '#64748b', fontWeight: '600' }}>Loading entity commission and reward settings...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="pro-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: '#475569' }}>
                    Entity Type
                  </th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: '#475569' }}>
                    Entity Name
                  </th>
                  <th style={{ padding: '0.85rem 0.65rem', textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', color: '#475569', minWidth: '95px' }}>
                    Direct (%)
                  </th>
                  <th style={{ padding: '0.85rem 0.65rem', textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', color: '#475569', minWidth: '95px' }}>
                    Level 2 (%)
                  </th>
                  <th style={{ padding: '0.85rem 0.65rem', textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', color: '#475569', minWidth: '95px' }}>
                    Level 3 (%)
                  </th>
                  <th style={{ padding: '0.85rem 0.65rem', textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', color: '#475569', minWidth: '95px' }}>
                    Level 4 (%)
                  </th>
                  <th style={{ padding: '0.85rem 0.65rem', textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', color: '#475569', minWidth: '95px' }}>
                    Level 5 (%)
                  </th>
                  <th style={{ padding: '0.85rem 0.65rem', textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', color: '#475569', minWidth: '95px' }}>
                    Reward (%)
                  </th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.78rem', textTransform: 'uppercase', color: '#475569', minWidth: '130px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntities.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: '#475569' }}>No entities found matching your search.</div>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                        Try clearing search terms or changing type filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedEntities.map((entity) => {
                    const rowKey = getRowKey(entity);
                    const isEditing = editingRowKey === rowKey;
                    const isSaving = savingRowKey === rowKey;
                    const isBusiness = entity.entity_type === 'business';
                    const directVal = resolveRate(entity, 'direct_percent');
                    const level2Val = resolveRate(entity, 'level_2_percent');
                    const level3Val = resolveRate(entity, 'level_3_percent');
                    const level4Val = resolveRate(entity, 'level_4_percent');
                    const level5Val = resolveRate(entity, 'level_5_percent');
                    const rewardVal = resolveRate(entity, 'reward_percent');

                    return (
                      <tr
                        key={rowKey}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: isEditing ? '#f8fafc' : undefined,
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        {/* 1. Entity Type */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.3rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              background: isBusiness ? '#e0f2fe' : '#f3e8ff',
                              color: isBusiness ? '#0369a1' : '#7e22ce',
                              border: isBusiness ? '1px solid #bae6fd' : '1px solid #e9d5ff',
                            }}
                          >
                            <span>{isBusiness ? '🏢' : '💼'}</span>
                            <span>{isBusiness ? 'Business' : 'Freelancer'}</span>
                          </span>
                        </td>

                        {/* 2. Entity Name */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                            {entity.entity_name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                            {entity.category_name}
                          </div>
                        </td>

                        {/* 3. Direct Commission (%) */}
                        <td style={{ padding: '0.65rem 0.45rem', textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={editValues.direct_percent}
                              onChange={(e) => setEditValues({ ...editValues, direct_percent: e.target.value })}
                              style={{
                                width: '75px',
                                padding: '0.35rem 0.45rem',
                                textAlign: 'center',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                color: entity.is_configured ? '#0284c7' : '#94a3b8',
                              }}
                            >
                              {directVal}%
                            </span>
                          )}
                        </td>

                        {/* 4. Level 2 Commission (%) */}
                        <td style={{ padding: '0.65rem 0.45rem', textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={editValues.level_2_percent}
                              onChange={(e) => setEditValues({ ...editValues, level_2_percent: e.target.value })}
                              style={{
                                width: '75px',
                                padding: '0.35rem 0.45rem',
                                textAlign: 'center',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                color: entity.is_configured ? '#4f46e5' : '#94a3b8',
                              }}
                            >
                              {level2Val}%
                            </span>
                          )}
                        </td>

                        {/* 5. Level 3 Commission (%) */}
                        <td style={{ padding: '0.65rem 0.45rem', textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={editValues.level_3_percent}
                              onChange={(e) => setEditValues({ ...editValues, level_3_percent: e.target.value })}
                              style={{
                                width: '75px',
                                padding: '0.35rem 0.45rem',
                                textAlign: 'center',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                color: entity.is_configured ? '#4f46e5' : '#94a3b8',
                              }}
                            >
                              {level3Val}%
                            </span>
                          )}
                        </td>

                        {/* 6. Level 4 Commission (%) */}
                        <td style={{ padding: '0.65rem 0.45rem', textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={editValues.level_4_percent}
                              onChange={(e) => setEditValues({ ...editValues, level_4_percent: e.target.value })}
                              style={{
                                width: '75px',
                                padding: '0.35rem 0.45rem',
                                textAlign: 'center',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                color: entity.is_configured ? '#4f46e5' : '#94a3b8',
                              }}
                            >
                              {level4Val}%
                            </span>
                          )}
                        </td>

                        {/* 7. Level 5 Commission (%) */}
                        <td style={{ padding: '0.65rem 0.45rem', textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={editValues.level_5_percent}
                              onChange={(e) => setEditValues({ ...editValues, level_5_percent: e.target.value })}
                              style={{
                                width: '75px',
                                padding: '0.35rem 0.45rem',
                                textAlign: 'center',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                color: entity.is_configured ? '#4f46e5' : '#94a3b8',
                              }}
                            >
                              {level5Val}%
                            </span>
                          )}
                        </td>

                        {/* 8. Reward (%) */}
                        <td style={{ padding: '0.65rem 0.45rem', textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={editValues.reward_percent}
                              onChange={(e) => setEditValues({ ...editValues, reward_percent: e.target.value })}
                              style={{
                                width: '75px',
                                padding: '0.35rem 0.45rem',
                                textAlign: 'center',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                color: entity.is_configured ? '#d97706' : '#94a3b8',
                              }}
                            >
                              {rewardVal}%
                            </span>
                          )}
                        </td>

                        {/* 11. Actions */}
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          {isEditing ? (
                            <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                              <button
                                onClick={() => handleSaveInline(entity)}
                                disabled={isSaving}
                                className="pro-btn-primary"
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.8rem',
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                }}
                                title="Save changes"
                              >
                                {isSaving ? '...' : 'Save'}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="pro-btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                                title="Cancel"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center' }}>
                              <button
                                onClick={() => handleStartEdit(entity)}
                                className="pro-btn-edit"
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.8rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                                title="Edit percentages inline"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleOpenModal(entity)}
                                className="pro-btn-secondary"
                                style={{
                                  padding: '0.35rem 0.6rem',
                                  fontSize: '0.8rem',
                                }}
                                title="Open full edit dialog"
                              >
                                ⚙️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && filteredEntities.length > 0 && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              fontSize: '0.85rem',
              color: '#64748b',
            }}
          >
            <div>
              Showing <strong style={{ color: '#0f172a' }}>{Math.min(filteredEntities.length, (currentPage - 1) * pageSize + 1)}</strong> to{' '}
              <strong style={{ color: '#0f172a' }}>{Math.min(filteredEntities.length, currentPage * pageSize)}</strong> of{' '}
              <strong style={{ color: '#0f172a' }}>{filteredEntities.length}</strong> entities
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                className="pro-btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
              >
                Previous
              </button>
              <span style={{ padding: '0 0.5rem', fontWeight: 600 }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pro-btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Commission Settings Modal Dialog */}
      {modalEntity && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="modal-card"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  Edit Commission & Reward Settings
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', opacity: 0.9 }}>
                  {modalEntity.entity_name} ({modalEntity.entity_type === 'business' ? 'Business Entity' : 'Freelancer Entity'} #{modalEntity.entity_id})
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} style={{ padding: '1.5rem' }}>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                  color: '#475569',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>Registered Email:</span>
                  <strong style={{ color: '#0f172a' }}>{modalEntity.email}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Category:</span>
                  <strong style={{ color: '#0f172a' }}>{modalEntity.category_name}</strong>
                </div>
              </div>

              {/* Commission Percentage Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Direct Commission (%) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="form-input"
                    value={modalForm.direct_percent}
                    onChange={(e) => setModalForm({ ...modalForm, direct_percent: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px' }}
                    required
                  />
                  {modalValidationErrors.direct_percent && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {modalValidationErrors.direct_percent}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Reward (%) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="form-input"
                    value={modalForm.reward_percent}
                    onChange={(e) => setModalForm({ ...modalForm, reward_percent: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px' }}
                    required
                  />
                  {modalValidationErrors.reward_percent && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {modalValidationErrors.reward_percent}
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  marginBottom: '0.65rem',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '0.35rem',
                }}
              >
                Network Multi-Level Commission Structure
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Level 2 Commission (%) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="form-input"
                    value={modalForm.level_2_percent}
                    onChange={(e) => setModalForm({ ...modalForm, level_2_percent: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px' }}
                    required
                  />
                  {modalValidationErrors.level_2_percent && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {modalValidationErrors.level_2_percent}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Level 3 Commission (%) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="form-input"
                    value={modalForm.level_3_percent}
                    onChange={(e) => setModalForm({ ...modalForm, level_3_percent: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px' }}
                    required
                  />
                  {modalValidationErrors.level_3_percent && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {modalValidationErrors.level_3_percent}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Level 4 Commission (%) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="form-input"
                    value={modalForm.level_4_percent}
                    onChange={(e) => setModalForm({ ...modalForm, level_4_percent: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px' }}
                    required
                  />
                  {modalValidationErrors.level_4_percent && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {modalValidationErrors.level_4_percent}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Level 5 Commission (%) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="form-input"
                    value={modalForm.level_5_percent}
                    onChange={(e) => setModalForm({ ...modalForm, level_5_percent: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px' }}
                    required
                  />
                  {modalValidationErrors.level_5_percent && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {modalValidationErrors.level_5_percent}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="pro-btn-secondary"
                  disabled={savingRowKey !== null}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pro-btn-primary"
                  disabled={savingRowKey !== null}
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  {savingRowKey ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEntityCommissionPage;
