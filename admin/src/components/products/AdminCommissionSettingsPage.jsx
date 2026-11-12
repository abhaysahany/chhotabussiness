import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import './products.css';

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

  // Dynamic level schema metadata from backend (e.g. [{ level: 1, key: 'level_1_percent', label: 'Level 1' }, ...])
  const [levelsMeta, setLevelsMeta] = useState([]);

  // Controlled form values (strings for clean decimal typing, no silent coercion)
  const [directInput, setDirectInput] = useState('');
  const [levelInputs, setLevelInputs] = useState({});
  const [rewardLevel1Input, setRewardLevel1Input] = useState('');
  const [rewardLevel2Input, setRewardLevel2Input] = useState('');
  const [conversionRateInr, setConversionRateInr] = useState(100);

  // Validation & feedback state
  const [fieldErrors, setFieldErrors] = useState({});
  const [formBannerError, setFormBannerError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
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
    validateSingleField(rewardLevel2Input, 'reward_level_2_percent', 'Reward Level 2 – Sponsor\'s Sponsor');

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
        showToast(res.message || 'Global Commission Settings updated successfully!');
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
    }
  };

  return (
    <div className="pro-products-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#065f46',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.88rem',
            zIndex: 999999,
            boxShadow: '0 10px 25px rgba(6, 95, 70, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
            <span>Products & Services</span>
            <span>›</span>
            <span style={{ color: '#4f46e5', fontWeight: 600 }}>Commission Settings</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#ffffff',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.55rem', fontWeight: 800, color: '#0f172a' }}>
                Commission Settings
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                System-wide MLM income distribution rules controlling Direct Income, Level Income tiers, and Reward Income for future allocations.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          disabled={loading || saving}
          style={{
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#334155',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Loading / Error State */}
      {loading && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
          Loading Global Commission Settings...
        </div>
      )}

      {!loading && loadError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1.25rem', color: '#b91c1c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <strong>Error loading configuration:</strong> {loadError}
          </div>
          <button
            type="button"
            onClick={fetchSettings}
            style={{ padding: '0.45rem 0.9rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !loadError && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* SECTION A: Commission Percentage Configuration Form */}
          <section
            aria-label="Commission Percentage Configuration Form"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#0f172a' }}>
                  Section A – Commission Percentage Configuration
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.83rem', color: '#64748b' }}>
                  Configure the single global split across Direct Income, all Level Income tiers, and Reward Income. Combined percentages must equal 100%. Changes apply to future distributions only.
                </p>
              </div>
              <span
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: '#eef2ff',
                  color: '#4338ca',
                  border: '1px solid #c7d2fe',
                }}
              >
                Single Global Configuration
              </span>
            </div>

            {formBannerError && (
              <div
                role="alert"
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  color: '#b91c1c',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  marginBottom: '1.25rem',
                }}
              >
                ⚠️ {formBannerError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {/* Card 1: Direct Income */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e3a8a' }}>
                      1. Direct Income
                    </span>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                      Direct Sponsor
                    </span>
                  </div>
                  <label
                    htmlFor="direct_percent"
                    style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}
                  >
                    Direct Income Percentage (%)
                  </label>
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
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '1rem',
                      fontWeight: 700,
                      background: '#ffffff',
                      color: '#0f172a',
                      ...getInputErrorStyle(fieldErrors.direct_percent),
                    }}
                  />
                  <FieldError error={fieldErrors.direct_percent} />
                </div>

                {/* Card 3: Two-Level Diamond Reward Income */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0e7490' }}>
                      3. Diamond Reward Income (2 Levels)
                    </span>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0891b2', background: '#cffafe', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                      Subtotal: {liveSummary.rewardTotalPercent.toFixed(2).replace(/\.00$/, '')}%
                    </span>
                  </div>

                  <div
                    style={{
                      background: '#ecfeff',
                      border: '1px solid #a5f3fc',
                      borderRadius: '8px',
                      padding: '0.45rem 0.7rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#0e7490',
                      marginBottom: '0.85rem',
                    }}
                  >
                    💎 Diamond Conversion Rate: ₹{conversionRateInr.toFixed(2).replace(/\.00$/, '')} = 1 Diamond
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
                    <div>
                      <label
                        htmlFor="reward_level_1_percent"
                        style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}
                      >
                        Reward Level 1 – Direct Sponsor
                      </label>
                      <input
                        id="reward_level_1_percent"
                        name="reward_level_1_percent"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={rewardLevel1Input}
                        onChange={(e) => handleFieldChange('reward_level_1_percent', e.target.value, setRewardLevel1Input)}
                        placeholder="e.g. 20"
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.98rem',
                          fontWeight: 700,
                          background: '#ffffff',
                          color: '#0f172a',
                          ...getInputErrorStyle(fieldErrors.reward_level_1_percent),
                        }}
                      />
                      <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '0.3rem' }}>
                        The reward allocation goes to the Sponsor of the Member who placed the order.
                      </div>
                      <FieldError error={fieldErrors.reward_level_1_percent} />
                    </div>

                    <div>
                      <label
                        htmlFor="reward_level_2_percent"
                        style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}
                      >
                        Reward Level 2 – Sponsor's Sponsor
                      </label>
                      <input
                        id="reward_level_2_percent"
                        name="reward_level_2_percent"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={rewardLevel2Input}
                        onChange={(e) => handleFieldChange('reward_level_2_percent', e.target.value, setRewardLevel2Input)}
                        placeholder="e.g. 10"
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.98rem',
                          fontWeight: 700,
                          background: '#ffffff',
                          color: '#0f172a',
                          ...getInputErrorStyle(fieldErrors.reward_level_2_percent),
                        }}
                      />
                      <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '0.3rem' }}>
                        The reward allocation goes to the Sponsor of the Direct Sponsor.
                      </div>
                      <FieldError error={fieldErrors.reward_level_2_percent} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Dynamic Level Income Tiers */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.9rem' }}>
                  <div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#92400e' }}>
                      2. Level Income (Individual Levels)
                    </span>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                      Generated dynamically from database level columns. Each level receives its configured percentage of the distributable base amount.
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', padding: '0.3rem 0.7rem', borderRadius: '8px' }}>
                    Levels Subtotal: {liveSummary.levelTotalPercent.toFixed(2).replace(/\.00$/, '')}%
                  </span>
                </div>

                {levelsMeta.length === 0 ? (
                  <div style={{ padding: '1rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', color: '#9a3412', fontSize: '0.85rem' }}>
                    No level columns were returned by the schema.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '0.9rem' }}>
                    {levelsMeta.map((lvl) => (
                      <div key={lvl.key} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem' }}>
                        <label
                          htmlFor={lvl.key}
                          style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}
                        >
                          {lvl.label} (%)
                        </label>
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
                          style={{
                            width: '100%',
                            padding: '0.55rem 0.7rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            ...getInputErrorStyle(fieldErrors[lvl.key]),
                          }}
                        />
                        <FieldError error={fieldErrors[lvl.key]} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Total & Remaining Validation Bar */}
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  border: liveSummary.isExact100 ? '1px solid #86efac' : '1px solid #fca5a5',
                  background: liveSummary.isExact100 ? '#f0fdf4' : '#fef2f2',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: liveSummary.isExact100 ? '#166534' : '#991b1b',
                    }}
                  >
                    Total Distribution: {liveSummary.totalPercent.toFixed(2).replace(/\.00$/, '')}%
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: liveSummary.isExact100 ? '#15803d' : '#b91c1c' }}>
                    {liveSummary.hasInvalidNumber
                      ? 'Enter valid non-negative numbers in all percentage fields.'
                      : liveSummary.isExact100
                        ? 'Remaining Percentage: 0% — Valid 100% allocation.'
                        : liveSummary.remainingPercent > 0
                          ? `Remaining Percentage: ${liveSummary.remainingPercent.toFixed(2).replace(/\.00$/, '')}% (must equal 100% to save)`
                          : `Remaining Percentage: ${liveSummary.remainingPercent.toFixed(2).replace(/\.00$/, '')}% (exceeds 100% by ${Math.abs(liveSummary.remainingPercent).toFixed(2).replace(/\.00$/, '')}%)`}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {exists && (
                    <button
                      type="button"
                      onClick={handleResetToSaved}
                      disabled={saving}
                      style={{
                        padding: '0.6rem 1.1rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#334155',
                        fontWeight: 600,
                        fontSize: '0.86rem',
                        cursor: saving ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Reset
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving || !liveSummary.isExact100}
                    style={{
                      padding: '0.65rem 1.4rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: saving || !liveSummary.isExact100 ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: saving || !liveSummary.isExact100 ? 'not-allowed' : 'pointer',
                      boxShadow: saving || !liveSummary.isExact100 ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.28)',
                    }}
                  >
                    {saving ? 'Saving Configuration...' : 'Save Commission Settings'}
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* SECTION B: Current Saved Global Commission Settings Table */}
          <section
            aria-label="Current Commission Settings Table"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#0f172a' }}>
                  Section B – Current Active Commission Settings
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.83rem', color: '#64748b' }}>
                  Authoritative single global configuration persisted in the backend. Future income distributions read directly from this record.
                </p>
              </div>
              {savedConfig?.updated_at && (
                <div style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'right' }}>
                  <div>Last Updated: <strong style={{ color: '#0f172a' }}>{formatDateTime(savedConfig.updated_at)}</strong></div>
                  {savedConfig.updated_by_admin_name && (
                    <div>Updated By: <strong style={{ color: '#4f46e5' }}>{savedConfig.updated_by_admin_name}</strong></div>
                  )}
                </div>
              )}
            </div>

            {!exists || !savedConfig ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.9rem' }}>
                No saved global Commission Settings record exists yet. Enter valid percentages totaling 100% above and click Save.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.9rem',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#1e3a8a' }}>Direct Income</th>
                      {(savedConfig.levels || levelsMeta).map((lvl) => (
                        <th key={lvl.key} style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#92400e' }}>
                          {lvl.label}
                        </th>
                      ))}
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0e7490' }}>Reward Level 1</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0e7490' }}>Reward Level 2</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#166534' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                      <td style={{ padding: '1rem', fontWeight: 800, color: '#1d4ed8', fontSize: '1rem' }}>
                        {formatPct(savedConfig.direct_percent)}
                      </td>
                      {(savedConfig.levels || []).map((lvl) => (
                        <td key={lvl.key} style={{ padding: '1rem', fontWeight: 700, color: '#b45309', fontSize: '0.96rem' }}>
                          {formatPct(lvl.percent)}
                        </td>
                      ))}
                      <td style={{ padding: '1rem', fontWeight: 800, color: '#0891b2', fontSize: '1rem' }}>
                        {formatPct(savedConfig.reward_level_1_percent)}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 800, color: '#0891b2', fontSize: '1rem' }}>
                        {formatPct(savedConfig.reward_level_2_percent)}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 800, color: '#15803d', fontSize: '1rem' }}>
                        {formatPct(savedConfig.total_percent)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminCommissionSettingsPage;
