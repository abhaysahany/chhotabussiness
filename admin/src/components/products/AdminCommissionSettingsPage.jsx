import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Percent,
  Zap,
  Layers,
  Award,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  RotateCcw,
  ShieldCheck,
  Building2,
  Coins,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  getGlobalCommissionSettings,
  saveGlobalCommissionSettings,
} from '../../api/adminCommissionService';
import { formatDateTime } from '../../utils/timezone';
import {
  FieldError,
  getInputErrorStyle,
  extractBackendErrors,
} from '../../utils/validation';

const toBasisPoints = (val) => {
  if (val === '' || val === null || val === undefined) return NaN;
  const parsed = Number(val);
  if (!Number.isFinite(parsed)) return NaN;
  return Math.round(parsed * 100);
};

const formatPct = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return '0.00%';
  return `${num.toFixed(2).replace(/\.00$/, '')}%`;
};

function AdminCommissionSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [exists, setExists] = useState(false);

  // Saved global record from backend (drives Section B)
  const [savedConfig, setSavedConfig] = useState(null);

  // Dynamic level schema metadata from backend
  const [levelsMeta, setLevelsMeta] = useState([]);

  // Controlled form values
  const [directInput, setDirectInput] = useState('');
  const [levelInputs, setLevelInputs] = useState({});
  const [rewardLevel1Input, setRewardLevel1Input] = useState('');
  const [rewardLevel2Input, setRewardLevel2Input] = useState('');
  const [conversionRateInr, setConversionRateInr] = useState(100);

  // Validation & feedback state
  const [fieldErrors, setFieldErrors] = useState({});
  const [formBannerError, setFormBannerError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const applyServerDataToState = useCallback((resData, recordExists) => {
    const levels = Array.isArray(resData?.levels) ? resData.levels : [];
    setLevelsMeta(
      levels.map((l) => ({
        level: l.level,
        key: l.key,
        label: l.label || `Level ${l.level}`,
      }))
    );

    const hasRecord = recordExists !== false && resData?.direct_percent !== null && resData?.direct_percent !== undefined;
    setExists(hasRecord);
    if (resData?.diamond_conversion_rate) {
      setConversionRateInr(Number(resData.diamond_conversion_rate) || 100);
    }

    if (hasRecord) {
      setSavedConfig(resData);
      setDirectInput(String(resData.direct_percent ?? 0));
      setRewardLevel1Input(String(resData.reward_level_1_percent ?? 0));
      setRewardLevel2Input(String(resData.reward_level_2_percent ?? 0));
      const lvlMap = {};
      levels.forEach((l) => {
        lvlMap[l.key] = String(l.percent ?? 0);
      });
      setLevelInputs(lvlMap);
    } else {
      setSavedConfig(null);
      setDirectInput('');
      setRewardLevel1Input('');
      setRewardLevel2Input('');
      const lvlMap = {};
      levels.forEach((l) => {
        lvlMap[l.key] = '';
      });
      setLevelInputs(lvlMap);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      setFieldErrors({});
      setFormBannerError('');
      const res = await getGlobalCommissionSettings();
      if (res && res.status === 'success' && res.data) {
        applyServerDataToState(res.data, res.exists);
      } else {
        setLoadError(res?.message || 'Unable to load Global Commission Settings.');
      }
    } catch (err) {
      console.error('Error fetching Global Commission Settings:', err);
      const { message } = extractBackendErrors(err);
      setLoadError(message || 'Failed to load Global Commission Settings from server.');
    } finally {
      setLoading(false);
    }
  }, [applyServerDataToState]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Live percentage calculations (integer basis points prevent JS float drift)
  const liveSummary = useMemo(() => {
    const directBp = toBasisPoints(directInput);
    const rewardL1Bp = toBasisPoints(rewardLevel1Input);
    const rewardL2Bp = toBasisPoints(rewardLevel2Input);

    let levelBpSum = 0;
    let hasInvalidNumber =
      Number.isNaN(directBp) || Number.isNaN(rewardL1Bp) || Number.isNaN(rewardL2Bp);

    levelsMeta.forEach((lvl) => {
      const bp = toBasisPoints(levelInputs[lvl.key]);
      if (Number.isNaN(bp)) {
        hasInvalidNumber = true;
      } else {
        levelBpSum += bp;
      }
    });

    const validDirectBp = Number.isNaN(directBp) ? 0 : directBp;
    const validRewardL1Bp = Number.isNaN(rewardL1Bp) ? 0 : rewardL1Bp;
    const validRewardL2Bp = Number.isNaN(rewardL2Bp) ? 0 : rewardL2Bp;
    const rewardTotalBp = validRewardL1Bp + validRewardL2Bp;
    const totalBp = validDirectBp + levelBpSum + rewardTotalBp;
    const remainingBp = 10000 - totalBp;

    return {
      hasInvalidNumber,
      directPercent: validDirectBp / 100,
      levelTotalPercent: levelBpSum / 100,
      rewardLevel1Percent: validRewardL1Bp / 100,
      rewardLevel2Percent: validRewardL2Bp / 100,
      rewardTotalPercent: rewardTotalBp / 100,
      totalPercent: totalBp / 100,
      remainingPercent: remainingBp / 100,
      isExact100: !hasInvalidNumber && totalBp === 10000,
    };
  }, [directInput, rewardLevel1Input, rewardLevel2Input, levelInputs, levelsMeta]);

  const validateForm = () => {
    const errors = {};
    let totalBp = 0;

    const validateSingleField = (rawVal, key, label) => {
      if (rawVal === '' || rawVal === null || rawVal === undefined || String(rawVal).trim() === '') {
        errors[key] = `${label} percentage is required.`;
        return;
      }
      const num = Number(rawVal);
      if (!Number.isFinite(num)) {
        errors[key] = `${label} percentage must be a valid number.`;
        return;
      }
      if (num < 0) {
        errors[key] = `${label} percentage cannot be negative.`;
        return;
      }
      if (num > 100) {
        errors[key] = `${label} percentage cannot exceed 100%.`;
        return;
      }
      totalBp += Math.round(num * 100);
    };

    validateSingleField(directInput, 'direct_percent', 'Direct Income');
    levelsMeta.forEach((lvl) => {
      validateSingleField(levelInputs[lvl.key], lvl.key, lvl.label);
    });
    validateSingleField(rewardLevel1Input, 'reward_level_1_percent', 'Reward Level 1 – Direct Sponsor');
    validateSingleField(rewardLevel2Input, 'reward_level_2_percent', "Reward Level 2 – Sponsor's Sponsor");

    if (Object.keys(errors).length === 0 && totalBp !== 10000) {
      const totalPct = (totalBp / 100).toFixed(2);
      const remainingPct = ((10000 - totalBp) / 100).toFixed(2);
      errors.total_percent = `Total distribution must equal exactly 100%. Current total is ${totalPct}% (remaining: ${remainingPct}%).`;
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormBannerError(errors.total_percent || Object.values(errors)[0]);
      return false;
    }

    setFormBannerError('');
    return true;
  };

  const handleFieldChange = (key, value, setter) => {
    setter(value);
    if (fieldErrors[key] || fieldErrors.total_percent) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        delete next.total_percent;
        return next;
      });
    }
    if (formBannerError) {
      setFormBannerError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!validateForm()) {
      return;
    }

    const payload = {
      direct_percent: Number(Number(directInput).toFixed(2)),
      reward_level_1_percent: Number(Number(rewardLevel1Input).toFixed(2)),
      reward_level_2_percent: Number(Number(rewardLevel2Input).toFixed(2)),
    };
    levelsMeta.forEach((lvl) => {
      payload[lvl.key] = Number(Number(levelInputs[lvl.key]).toFixed(2));
    });

    try {
      setSaving(true);
      setFormBannerError('');
      setFieldErrors({});
      const res = await saveGlobalCommissionSettings(payload);

      if (res && res.status === 'success' && res.data) {
        applyServerDataToState(res.data, true);
        showToast(res.message || 'Global Commission Settings updated successfully!', 'success');
      } else {
        setFormBannerError(res?.message || 'Failed to save Global Commission Settings.');
      }
    } catch (err) {
      console.error('Error saving Global Commission Settings:', err);
      const { message, errors: backendErrors } = extractBackendErrors(err);
      if (backendErrors && Object.keys(backendErrors).length > 0) {
        const flatErrors = {};
        Object.entries(backendErrors).forEach(([k, v]) => {
          flatErrors[k] = Array.isArray(v) ? v[0] : v;
        });
        setFieldErrors(flatErrors);
      }
      setFormBannerError(message || 'Validation failed while saving Commission Settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToSaved = () => {
    setFieldErrors({});
    setFormBannerError('');
    if (savedConfig) {
      applyServerDataToState(savedConfig, true);
      showToast('Settings reset to saved state.', 'info');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div
          style={{
            backgroundColor: toastType === 'error' ? '#fef2f2' : '#ecfdf5',
            color: toastType === 'error' ? '#b91c1c' : '#047857',
            border: `1.5px solid ${toastType === 'error' ? '#fecaca' : '#a7f3d0'}`,
            padding: '0.9rem 1.35rem',
            borderRadius: '14px',
            fontWeight: 700,
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.65rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {toastType === 'error' ? <AlertTriangle size={18} color="#dc2626" /> : <CheckCircle2 size={18} color="#059669" />}
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.2rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* 1. Executive 3D Luxury Hero Banner */}
      <div className="adm-hero-banner">
        <div className="adm-hero-top-row">
          <div className="adm-hero-pod-3d adm-pod-purple">
            <Percent size={32} strokeWidth={2.4} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9333ea', background: 'rgba(147, 51, 234, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(147, 51, 234, 0.2)' }}>
                ● REVENUE DISTRIBUTION ENGINE
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: liveSummary.isExact100 ? '#059669' : '#d97706', background: liveSummary.isExact100 ? 'rgba(5, 150, 105, 0.08)' : 'rgba(217, 119, 6, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: `1px solid ${liveSummary.isExact100 ? 'rgba(5, 150, 105, 0.2)' : 'rgba(217, 119, 6, 0.2)'}` }}>
                ● {liveSummary.isExact100 ? '100% Balanced Split' : `Current: ${liveSummary.totalPercent.toFixed(1)}% / 100%`}
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
              Commission &amp; Revenue Settings
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '680px', lineHeight: 1.5 }}>
              System-wide MLM income distribution matrix controlling Direct Sponsor, Multi-tier Level Income, and Diamond Reward allocations.
            </p>
          </div>

          <div style={{ flexShrink: 0 }}>
            <button
              type="button"
              className="adm-hero-btn-primary"
              onClick={fetchSettings}
              disabled={loading || saving}
              style={{ padding: '0.75rem 1.4rem', fontSize: '0.86rem' }}
            >
              <RefreshCw size={16} strokeWidth={2.4} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Matrix</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Executive 3D KPI Vault Cards (Single Horizontal Row: 4 Cards) */}
      <div className="adm-kpi-grid-4">
        {/* Card 1: Direct Income Share */}
        <div className="adm-kpi-card adm-kpi-card-steel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#3569a7',
                  background: 'rgba(53, 105, 167, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● DIRECT SPONSOR
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                DIRECT INCOME
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-steel" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Zap size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#1e40af' }}>
              {liveSummary.directPercent.toFixed(1).replace(/\.0$/, '')}%
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Zap size={13} color="#3569a7" />
              <span>Direct referral split</span>
            </span>
            <span style={{ color: '#3569a7', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Primary Split
            </span>
          </div>
        </div>

        {/* Card 2: Level Income Pool */}
        <div className="adm-kpi-card adm-kpi-card-amber">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#d97706',
                  background: 'rgba(217, 119, 6, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● MULTI-TIER POOL
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                LEVEL TIERS POOL
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-amber" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Layers size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#d97706' }}>
              {liveSummary.levelTotalPercent.toFixed(1).replace(/\.0$/, '')}%
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Layers size={13} color="#d97706" />
              <span>{levelsMeta.length} Tiers active</span>
            </span>
            <span style={{ color: '#d97706', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Multi-Tier
            </span>
          </div>
        </div>

        {/* Card 3: Diamond Rewards Pool */}
        <div className="adm-kpi-card adm-kpi-card-purple">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#9333ea',
                  background: 'rgba(147, 51, 234, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● 2-LEVEL DIAMOND
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                REWARDS POOL
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-purple" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Award size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#9333ea' }}>
              {liveSummary.rewardTotalPercent.toFixed(1).replace(/\.0$/, '')}%
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Award size={13} color="#9333ea" />
              <span>₹{conversionRateInr} / Diamond</span>
            </span>
            <span style={{ color: '#9333ea', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● 2 Levels
            </span>
          </div>
        </div>

        {/* Card 4: 100% Balanced Split Status */}
        <div className={`adm-kpi-card ${liveSummary.isExact100 ? 'adm-kpi-card-emerald' : 'adm-kpi-card-amber'}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: liveSummary.isExact100 ? '#0d9488' : '#b45309',
                  background: liveSummary.isExact100 ? 'rgba(13, 148, 136, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● TOTAL BALANCE
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                TOTAL ALLOCATION
              </div>
            </div>
            <div
              className={`adm-3d-pod ${liveSummary.isExact100 ? 'adm-pod-emerald' : 'adm-pod-amber'}`}
              style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}
            >
              {liveSummary.isExact100 ? <CheckCircle2 size={19} strokeWidth={2.4} /> : <AlertTriangle size={19} strokeWidth={2.4} />}
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: liveSummary.isExact100 ? '#0d9488' : '#dc2626' }}>
              {liveSummary.totalPercent.toFixed(1).replace(/\.0$/, '')}%
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <ShieldCheck size={13} color={liveSummary.isExact100 ? '#0d9488' : '#dc2626'} />
              <span>{liveSummary.isExact100 ? '100% Balanced' : `${liveSummary.remainingPercent.toFixed(1)}% Remaining`}</span>
            </span>
            <span style={{ color: liveSummary.isExact100 ? '#0d9488' : '#dc2626', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● {liveSummary.isExact100 ? 'Enforced' : 'Deficit'}
            </span>
          </div>
        </div>
      </div>

      {/* Loading or Error State */}
      {loading ? (
        <div className="adm-table-card" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
          <div className="adm-3d-pod adm-pod-purple admFloatPodSlow" style={{ width: '48px', height: '48px', margin: '0 auto 1rem auto' }}>
            <Percent size={24} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>Loading Commission Settings...</div>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>Reading system-wide MLM configuration from database</p>
        </div>
      ) : loadError ? (
        <div
          style={{
            background: '#fef2f2',
            border: '1.5px solid #fecaca',
            color: '#991b1b',
            padding: '1.25rem',
            borderRadius: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertTriangle size={20} color="#dc2626" />
            <div>
              <strong style={{ display: 'block', fontSize: '0.92rem' }}>Error Loading Commission Configuration:</strong>
              <span style={{ fontSize: '0.82rem', color: '#b91c1c' }}>{loadError}</span>
            </div>
          </div>
          <button
            type="button"
            className="adm-hero-btn-primary"
            onClick={fetchSettings}
            style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* SECTION A: Commission Percentage Configuration Form */}
          <div
            className="adm-table-card"
            style={{
              padding: '1.6rem',
              borderRadius: '20px',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.05)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1.4rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div className="adm-3d-pod adm-pod-steel" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                    <Percent size={16} strokeWidth={2.4} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    Section A — Commission Percentage Configuration
                  </h2>
                </div>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                  Configure the single global split across Direct Income, all Level Income tiers, and Diamond Rewards. Combined allocations must equal exactly 100%.
                </p>
              </div>

              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  background: 'rgba(53, 105, 167, 0.08)',
                  color: '#3569a7',
                  border: '1px solid rgba(53, 105, 167, 0.25)',
                }}
              >
                ● Single Global Rule
              </span>
            </div>

            {formBannerError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fecaca',
                  color: '#991b1b',
                  borderRadius: '12px',
                  padding: '0.85rem 1.15rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                }}
              >
                <AlertTriangle size={18} color="#dc2626" />
                <span>{formBannerError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.4rem' }}>
                {/* 1. Direct Income Box */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.35rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="adm-3d-pod adm-pod-steel" style={{ width: '28px', height: '28px', borderRadius: '8px' }}>
                        <Zap size={14} strokeWidth={2.4} />
                      </div>
                      <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#1e3a8a' }}>
                        1. Direct Sponsor Income
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', background: '#dbeafe', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '6px' }}>
                      Direct Sponsor
                    </span>
                  </div>

                  <label
                    htmlFor="direct_percent"
                    style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.45rem' }}
                  >
                    Direct Income Percentage (%)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="direct_percent"
                      name="direct_percent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={directInput}
                      onChange={(e) => handleFieldChange('direct_percent', e.target.value, setDirectInput)}
                      placeholder="e.g. 40"
                      className="adm-toolbar-input"
                      style={{
                        width: '100%',
                        height: '46px',
                        paddingRight: '35px',
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        ...getInputErrorStyle(fieldErrors.direct_percent),
                      }}
                    />
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94a3b8', fontSize: '0.95rem' }}>
                      %
                    </span>
                  </div>
                  <p style={{ margin: '0.45rem 0 0 0', fontSize: '0.73rem', color: '#64748b', lineHeight: 1.4 }}>
                    Immediate commission percentage disbursed directly to the sponsor upon order completion.
                  </p>
                  <FieldError error={fieldErrors.direct_percent} />
                </div>

                {/* 3. Diamond Reward Income (2 Levels) Box */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
                    border: '1.5px solid #ccfbf1',
                    borderRadius: '16px',
                    padding: '1.35rem',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="adm-3d-pod adm-pod-emerald" style={{ width: '28px', height: '28px', borderRadius: '8px' }}>
                        <Award size={14} strokeWidth={2.4} />
                      </div>
                      <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f766e' }}>
                        3. Diamond Reward Pool (2 Levels)
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0d9488', background: '#ccfbf1', border: '1px solid #99f6e4', padding: '2px 8px', borderRadius: '6px' }}>
                      Subtotal: {liveSummary.rewardTotalPercent.toFixed(1).replace(/\.0$/, '')}%
                    </span>
                  </div>

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid #99f6e4',
                      borderRadius: '10px',
                      padding: '0.45rem 0.8rem',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      color: '#0f766e',
                      marginBottom: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <span>💎</span>
                    <span>Diamond Conversion Rate: ₹{conversionRateInr.toFixed(2).replace(/\.00$/, '')} = 1 Diamond</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.9rem' }}>
                    <div>
                      <label
                        htmlFor="reward_level_1_percent"
                        style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}
                      >
                        Level 1 — Direct Sponsor
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id="reward_level_1_percent"
                          name="reward_level_1_percent"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={rewardLevel1Input}
                          onChange={(e) => handleFieldChange('reward_level_1_percent', e.target.value, setRewardLevel1Input)}
                          placeholder="e.g. 15"
                          className="adm-toolbar-input"
                          style={{
                            width: '100%',
                            height: '42px',
                            paddingRight: '30px',
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            ...getInputErrorStyle(fieldErrors.reward_level_1_percent),
                          }}
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94a3b8', fontSize: '0.85rem' }}>
                          %
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.3 }}>
                        Direct Sponsor's Diamond allocation.
                      </div>
                      <FieldError error={fieldErrors.reward_level_1_percent} />
                    </div>

                    <div>
                      <label
                        htmlFor="reward_level_2_percent"
                        style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}
                      >
                        Level 2 — Upline Sponsor
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id="reward_level_2_percent"
                          name="reward_level_2_percent"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={rewardLevel2Input}
                          onChange={(e) => handleFieldChange('reward_level_2_percent', e.target.value, setRewardLevel2Input)}
                          placeholder="e.g. 5"
                          className="adm-toolbar-input"
                          style={{
                            width: '100%',
                            height: '42px',
                            paddingRight: '30px',
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            ...getInputErrorStyle(fieldErrors.reward_level_2_percent),
                          }}
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94a3b8', fontSize: '0.85rem' }}>
                          %
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.3 }}>
                        Sponsor's Sponsor Diamond allocation.
                      </div>
                      <FieldError error={fieldErrors.reward_level_2_percent} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Dynamic Level Income Tiers */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
                  border: '1.5px solid #fef3c7',
                  borderRadius: '16px',
                  padding: '1.35rem',
                  marginTop: '1.4rem',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="adm-3d-pod adm-pod-amber" style={{ width: '30px', height: '30px', borderRadius: '8px' }}>
                      <Layers size={16} strokeWidth={2.4} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#92400e' }}>
                        2. Multi-tier Level Income Grid
                      </span>
                      <div style={{ fontSize: '0.76rem', color: '#78350f', marginTop: '1px' }}>
                        Dynamic level matrix from MySQL schema. Each tier receives its assigned percentage from total distributable base.
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '8px' }}>
                    Levels Subtotal: {liveSummary.levelTotalPercent.toFixed(1).replace(/\.0$/, '')}%
                  </span>
                </div>

                {levelsMeta.length === 0 ? (
                  <div style={{ padding: '1.25rem', background: '#ffffff', border: '1px dashed #fcd34d', borderRadius: '12px', color: '#9a3412', fontSize: '0.86rem', textAlign: 'center' }}>
                    No dynamic level columns were detected in the database schema.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.85rem' }}>
                    {levelsMeta.map((lvl) => (
                      <div
                        key={lvl.key}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #fde68a',
                          borderRadius: '12px',
                          padding: '0.85rem',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <label
                            htmlFor={lvl.key}
                            style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400e' }}
                          >
                            {lvl.label}
                          </label>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                            Tier {lvl.level}
                          </span>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input
                            id={lvl.key}
                            name={lvl.key}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={levelInputs[lvl.key] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLevelInputs((prev) => ({ ...prev, [lvl.key]: val }));
                              if (fieldErrors[lvl.key] || fieldErrors.total_percent) {
                                setFieldErrors((prev) => {
                                  const next = { ...prev };
                                  delete next[lvl.key];
                                  delete next.total_percent;
                                  return next;
                                });
                              }
                              if (formBannerError) setFormBannerError('');
                            }}
                            placeholder="0"
                            className="adm-toolbar-input"
                            style={{
                              width: '100%',
                              height: '40px',
                              paddingRight: '28px',
                              fontSize: '1rem',
                              fontWeight: 800,
                              color: '#0f172a',
                              ...getInputErrorStyle(fieldErrors[lvl.key]),
                            }}
                          />
                          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94a3b8', fontSize: '0.8rem' }}>
                            %
                          </span>
                        </div>
                        <FieldError error={fieldErrors[lvl.key]} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Realtime Distribution Balance Bar */}
              <div
                style={{
                  marginTop: '1.4rem',
                  padding: '1.2rem 1.4rem',
                  borderRadius: '16px',
                  border: liveSummary.isExact100 ? '1.5px solid #86efac' : '1.5px solid #fca5a5',
                  background: liveSummary.isExact100
                    ? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'
                    : 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    {liveSummary.isExact100 ? (
                      <CheckCircle2 size={20} color="#059669" />
                    ) : (
                      <AlertTriangle size={20} color="#dc2626" />
                    )}
                    <span
                      style={{
                        fontSize: '1.12rem',
                        fontWeight: 800,
                        color: liveSummary.isExact100 ? '#166534' : '#991b1b',
                      }}
                    >
                      Total Allocation: {liveSummary.totalPercent.toFixed(2).replace(/\.00$/, '')}%
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: liveSummary.isExact100 ? '#15803d' : '#b91c1c', marginTop: '0.2rem' }}>
                    {liveSummary.hasInvalidNumber
                      ? 'Enter valid non-negative numbers in all percentage fields.'
                      : liveSummary.isExact100
                        ? 'Remaining Percentage: 0% — Perfectly balanced 100% distribution allocation.'
                        : liveSummary.remainingPercent > 0
                          ? `Remaining Percentage: ${liveSummary.remainingPercent.toFixed(2).replace(/\.00$/, '')}% (Must total exactly 100% before saving)`
                          : `Remaining Percentage: ${liveSummary.remainingPercent.toFixed(2).replace(/\.00$/, '')}% (Exceeds 100% limit by ${Math.abs(liveSummary.remainingPercent).toFixed(2).replace(/\.00$/, '')}%)`}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {exists && (
                    <button
                      type="button"
                      onClick={handleResetToSaved}
                      disabled={saving}
                      style={{
                        padding: '0.65rem 1.25rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#475569',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <RotateCcw size={14} />
                      <span>Reset</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving || !liveSummary.isExact100}
                    className="adm-hero-btn-primary"
                    style={{
                      padding: '0.7rem 1.6rem',
                      fontSize: '0.88rem',
                      opacity: saving || !liveSummary.isExact100 ? 0.6 : 1,
                      cursor: saving || !liveSummary.isExact100 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Save size={16} strokeWidth={2.4} />
                    <span>{saving ? 'Saving...' : 'Save Commission Settings'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* SECTION B: Current Active Commission Settings Table */}
          <div
            className="adm-table-card"
            style={{
              padding: '1.6rem',
              borderRadius: '20px',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                paddingBottom: '0.85rem',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="adm-3d-pod adm-pod-emerald" style={{ width: '30px', height: '30px', borderRadius: '8px' }}>
                    <ShieldCheck size={16} strokeWidth={2.4} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    Section B — Current Active Production Split Matrix
                  </h2>
                </div>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                  Authoritative production rules persisted in MySQL. Future commissions read directly from this active record.
                </p>
              </div>

              {savedConfig?.updated_at && (
                <div style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'right' }}>
                  <div>Last Updated: <strong style={{ color: '#0f172a' }}>{formatDateTime(savedConfig.updated_at)}</strong></div>
                  {savedConfig.updated_by_admin_name && (
                    <div style={{ marginTop: '2px' }}>Updated By: <strong style={{ color: '#3569a7' }}>{savedConfig.updated_by_admin_name}</strong></div>
                  )}
                </div>
              )}
            </div>

            {!exists || !savedConfig ? (
              <div
                style={{
                  padding: '2.5rem',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: '14px',
                  border: '1.5px dashed #cbd5e1',
                  color: '#64748b',
                  fontSize: '0.9rem',
                }}
              >
                No active global Commission Settings record found. Configure valid allocations totaling 100% above and save.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={{ padding: '0.9rem 1.15rem', fontWeight: 800 }}>Direct Income</th>
                      {(savedConfig.levels || levelsMeta).map((lvl) => (
                        <th key={lvl.key} style={{ padding: '0.9rem 1.15rem', fontWeight: 800 }}>
                          {lvl.label}
                        </th>
                      ))}
                      <th style={{ padding: '0.9rem 1.15rem', fontWeight: 800 }}>Reward Lvl 1</th>
                      <th style={{ padding: '0.9rem 1.15rem', fontWeight: 800 }}>Reward Lvl 2</th>
                      <th style={{ padding: '0.9rem 1.15rem', fontWeight: 800, textAlign: 'center' }}>Total Sum</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="adm-table-row">
                      <td style={{ padding: '1.1rem', fontWeight: 800, color: '#1d4ed8', fontSize: '1.05rem' }}>
                        {formatPct(savedConfig.direct_percent)}
                      </td>
                      {(savedConfig.levels || []).map((lvl) => (
                        <td key={lvl.key} style={{ padding: '1.1rem', fontWeight: 800, color: '#b45309', fontSize: '1rem' }}>
                          {formatPct(lvl.percent)}
                        </td>
                      ))}
                      <td style={{ padding: '1.1rem', fontWeight: 800, color: '#0d9488', fontSize: '1.05rem' }}>
                        {formatPct(savedConfig.reward_level_1_percent)}
                      </td>
                      <td style={{ padding: '1.1rem', fontWeight: 800, color: '#0d9488', fontSize: '1.05rem' }}>
                        {formatPct(savedConfig.reward_level_2_percent)}
                      </td>
                      <td style={{ padding: '1.1rem', fontWeight: 800, color: '#059669', fontSize: '1.1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            background: '#ecfdf5',
                            border: '1.5px solid #a7f3d0',
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            display: 'inline-block',
                          }}
                        >
                          {formatPct(savedConfig.total_percent)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCommissionSettingsPage;
