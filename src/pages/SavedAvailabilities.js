import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiTool, FiCalendar, FiGlobe, FiEdit2, FiTrash2, FiX, FiMapPin, FiBriefcase, FiArrowRight } from 'react-icons/fi';
import { FaRegHospital } from 'react-icons/fa';
import './SavedAvailabilities.css';

const Api = "https://s-doctorbackend-admin.onrender.com";
// const Api = "http://localhost:5000";

const DEFAULT_ONLINE_CONFIG = {
  mode: 'online',
  timeStart: '05:00',
  timeEnd: '08:00',
  sessionDuration: 45,
  location: '',
  services: [
    { name: 'General Counselling', price: 2000 },
    { name: 'Cognitive Behaviour Therapy (CBT)', price: 2000 },
    { name: 'Dialectical Behaviour Therapy (DBT)', price: 2000 },
    { name: 'Marital or Couples Therapy', price: 3000 },
  ],
  isActive: true,
};

const DEFAULT_OFFLINE_CONFIG = {
  mode: 'offline',
  timeStart: '11:00',
  timeEnd: '19:00',
  sessionDuration: 45,
  location: 'Asha Neuro Clinic',
  services: [
    { name: 'General Counselling', price: 2000 },
    { name: 'Cognitive Behaviour Therapy (CBT)', price: 2000 },
    { name: 'Dialectical Behaviour Therapy (DBT)', price: 2000 },
    { name: 'Marital or Couples Therapy', price: 3000 },
  ],
  isActive: true,
};

function SavedAvailabilities() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('services'); // 'services' | 'slots'

  // Old Availabilities state
  const [availabilities, setAvailabilities] = useState([]);
  const [loadingAvail, setLoadingAvail] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Add Slot state
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotForm, setNewSlotForm] = useState({
    fromDate: '', toDate: '', startTime: '', endTime: '', 
    slotDuration: '45', breakDuration: '15', pricePerSlot: '2000'
  });
  const [savingSlot, setSavingSlot] = useState(false);

  // Service Config state
  const [serviceConfigs, setServiceConfigs] = useState({ online: null, offline: null });
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [editingConfig, setEditingConfig] = useState(null);
  const [configForm, setConfigForm] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // Pagination for slots
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchAvailabilities();
    fetchServiceConfigs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  const fetchAvailabilities = async () => {
    setLoadingAvail(true);
    try {
      const res = await axios.get(`${Api}/api/availability`, { headers: getAuthHeaders() });
      setAvailabilities(res.data);
    } catch (error) {
      console.error('Error fetching availabilities:', error);
      if (error.response?.status === 401) navigate('/login');
    } finally {
      setLoadingAvail(false);
    }
  };

  const fetchServiceConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const res = await axios.get(`${Api}/api/service-configs`, { headers: getAuthHeaders() });
      const configs = { online: null, offline: null };
      res.data.forEach(c => { configs[c.mode] = c; });
      console.log(res.data);
      setServiceConfigs(configs);
    } catch (error) {
      console.error('Error fetching service configs:', error);
    } finally {
      setLoadingConfigs(false);
    }
  };

  // ============================================================
  // AVAILABILITY (Old Slots) ACTIONS
  // ============================================================

  const deleteAvailability = async (id) => {
    if (!window.confirm('Delete this availability?')) return;
    try {
      await axios.delete(`${Api}/api/availability/${id}`, { headers: getAuthHeaders() });
      setAvailabilities(prev => prev.filter(a => a._id !== id));
      toast.success('Availability deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const startEdit = (a) => {
    setEditingId(a._id);
    setEditForm({
      startTime: a.startTime,
      endTime: a.endTime,
      slotDuration: a.slotDuration,
      breakDuration: a.breakDuration,
      pricePerSlot: a.pricePerSlot,
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async (id) => {
    try {
      await axios.put(`${Api}/api/availability/${id}`, editForm, { headers: getAuthHeaders() });
      setAvailabilities(prev => prev.map(a => a._id === id ? { ...a, ...editForm } : a));
      setEditingId(null);
      toast.success('Availability updated');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleCreateSlot = async () => {
    if (!newSlotForm.fromDate || !newSlotForm.toDate || !newSlotForm.startTime || !newSlotForm.endTime) {
      return toast.error('Please fill in all date and time fields');
    }
    setSavingSlot(true);
    try {
      const res = await axios.post(`${Api}/api/availability`, newSlotForm, { headers: getAuthHeaders() });
      setAvailabilities(prev => [...prev, res.data.availability].sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate)));
      setShowAddSlot(false);
      setNewSlotForm({
        fromDate: '', toDate: '', startTime: '', endTime: '', 
        slotDuration: '45', breakDuration: '15', pricePerSlot: '2000'
      });
      toast.success('Availability created successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create availability');
    } finally {
      setSavingSlot(false);
    }
  };

  // ============================================================
  // SERVICE CONFIG ACTIONS
  // ============================================================

  const startEditConfig = (mode) => {
    const existing = serviceConfigs[mode];
    if (existing) {
      setConfigForm({
        mode: existing.mode,
        timeStart: existing.timeStart,
        timeEnd: existing.timeEnd,
        sessionDuration: existing.sessionDuration,
        location: existing.location || '',
        services: existing.services.map(s => ({ name: s.name, price: s.price, isActive: s.isActive !== false })),
        isActive: existing.isActive !== false,
      });
    } else {
      const def = mode === 'online' ? DEFAULT_ONLINE_CONFIG : DEFAULT_OFFLINE_CONFIG;
      setConfigForm({ ...def, services: def.services.map(s => ({ ...s })) });
    }
    setEditingConfig(mode);
  };

  const cancelEditConfig = () => { setEditingConfig(null); setConfigForm(null); };

  const saveConfig = async () => {
    if (!configForm) return;
    if (!configForm.timeStart || !configForm.timeEnd) return toast.error('Time range is required');
    if (!configForm.services?.length) return toast.error('Add at least one service');
    for (const svc of configForm.services) {
      if (!svc.name.trim()) return toast.error('Service name cannot be empty');
      if (svc.price === '' || svc.price < 0) return toast.error('Service price must be valid');
    }

    setSavingConfig(true);
    try {
      const res = await axios.post(`${Api}/api/service-config`, configForm, { headers: getAuthHeaders() });
      setServiceConfigs(prev => ({ ...prev, [configForm.mode]: res.data.config }));
      setEditingConfig(null);
      setConfigForm(null);
      toast.success(`${configForm.mode === 'online' ? 'Online' : 'Offline'} config saved!`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save');
    } finally {
      setSavingConfig(false);
    }
  };

  const addServiceToForm = () => {
    setConfigForm(p => ({ ...p, services: [...p.services, { name: '', price: 0, isActive: true }] }));
  };

  const removeServiceFromForm = (idx) => {
    setConfigForm(p => ({ ...p, services: p.services.filter((_, i) => i !== idx) }));
  };

  const updateServiceInForm = (idx, field, value) => {
    setConfigForm(p => ({
      ...p,
      services: p.services.map((s, i) =>
        i === idx ? { ...s, [field]: field === 'price' ? (value === '' ? '' : Number(value)) : value } : s
      ),
    }));
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const isExpired = (toDate) => new Date(toDate) < new Date();
  const fmt12 = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${(m || 0).toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const totalItems = availabilities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAvailabilities = availabilities.slice(startIndex, startIndex + itemsPerPage);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="sa-page">
      {/* Top Bar */}
      <div className="sa-topbar">
        <button className="sa-back-btn" onClick={() => navigate('/admin/panel')}>
          <FiArrowLeft style={{ marginRight: '6px' }} /> Back to Panel
        </button>
        <h1>Availability & Services</h1>
      </div>

      {/* Tabs */}
      <div className="sa-tabs-bar">
        <button className={`sa-tab ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>
          <FiTool /> Service Configuration
        </button>
        <button className={`sa-tab ${activeTab === 'slots' ? 'active' : ''}`} onClick={() => setActiveTab('slots')}>
          <FiCalendar /> Saved Slot Ranges
          {availabilities.length > 0 && <span className="sa-tab-badge">{availabilities.length}</span>}
        </button>
      </div>

      {/* Content */}
      <div className="sa-content">

        {/* ============================================================
            SERVICE CONFIG TAB
            ============================================================ */}
        {activeTab === 'services' && (
          <>
            <p className="sa-description">
              Configure the available services, time windows, and pricing for <strong>Online</strong> and <strong>Offline</strong> consultations. Patients see these options when booking.
            </p>

            {loadingConfigs ? (
              <div className="sa-skeleton-grid">
                <div className="sa-skeleton-card" />
                <div className="sa-skeleton-card" />
              </div>
            ) : (
              <div className="sa-config-grid">
                {/* ONLINE CONFIG */}
                {renderConfigCard('online')}
                {/* OFFLINE CONFIG */}
                {renderConfigCard('offline')}
              </div>
            )}
          </>
        )}

        {/* ============================================================
            SAVED SLOTS TAB
            ============================================================ */}
        {activeTab === 'slots' && (
          <>
            <div className="sa-section-header">
              <p className="sa-description" style={{ margin: 0 }}>
                Previously saved availability date-ranges. You can edit time, duration, and pricing for each range.
              </p>
              <button className="sa-btn primary" onClick={() => setShowAddSlot(true)}>
                + Add Slot Range
              </button>
            </div>

            {loadingAvail ? (
              <div className="sa-skeleton-grid">
                {[...Array(3)].map((_, i) => <div key={i} className="sa-skeleton-card" />)}
              </div>
            ) : availabilities.length === 0 ? (
              <div className="sa-empty">
                <div className="sa-empty-icon"><FiCalendar /></div>
                <h3>No saved slot ranges</h3>
                <p>Date-range slots will appear here once configured.</p>
              </div>
            ) : (
              /* Responsive table for slots */
              <div className="sa-table-card">
                <div className="sa-table-wrapper">
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Time</th>
                        <th>Slot</th>
                        <th>Break</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAvailabilities.map((a, idx) => (
                        <tr key={a._id} className={isExpired(a.toDate) ? 'expired-row' : ''}>
                          {editingId === a._id ? (
                            <>
                              <td>{startIndex + idx + 1}</td>
                              <td>{formatDate(a.fromDate)}</td>
                              <td>{formatDate(a.toDate)}</td>
                              <td>
                                <div className="sa-inline-edit">
                                  <input type="time" value={editForm.startTime} onChange={e => setEditForm({ ...editForm, startTime: e.target.value })} />
                                  <span>—</span>
                                  <input type="time" value={editForm.endTime} onChange={e => setEditForm({ ...editForm, endTime: e.target.value })} />
                                </div>
                              </td>
                              <td>
                                <input type="number" className="sa-inline-num" value={editForm.slotDuration} onChange={e => setEditForm({ ...editForm, slotDuration: e.target.value })} />
                              </td>
                              <td>
                                <input type="number" className="sa-inline-num" value={editForm.breakDuration} onChange={e => setEditForm({ ...editForm, breakDuration: e.target.value })} />
                              </td>
                              <td>
                                <input type="number" className="sa-inline-num" value={editForm.pricePerSlot} onChange={e => setEditForm({ ...editForm, pricePerSlot: e.target.value })} />
                              </td>
                              <td>
                                <span className={`sa-status-tag ${isExpired(a.toDate) ? 'expired' : 'active'}`}>
                                  {isExpired(a.toDate) ? 'Expired' : 'Active'}
                                </span>
                              </td>
                              <td>
                                <div className="sa-action-group">
                                  <button className="sa-btn save" onClick={() => saveEdit(a._id)}>Save</button>
                                  <button className="sa-btn cancel" onClick={cancelEdit}>Cancel</button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td>{startIndex + idx + 1}</td>
                              <td>{formatDate(a.fromDate)}</td>
                              <td>{formatDate(a.toDate)}</td>
                              <td>{a.startTime} — {a.endTime}</td>
                              <td>{a.slotDuration} min</td>
                              <td>{a.breakDuration} min</td>
                              <td>₹{a.pricePerSlot}</td>
                              <td>
                                <span className={`sa-status-tag ${isExpired(a.toDate) ? 'expired' : 'active'}`}>
                                  {isExpired(a.toDate) ? 'Expired' : 'Active'}
                                </span>
                              </td>
                              <td>
                                <div className="sa-action-group">
                                  <button className="sa-btn edit" onClick={() => startEdit(a)}><FiEdit2 /></button>
                                  <button className="sa-btn delete" onClick={() => deleteAvailability(a._id)}><FiTrash2 /></button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card view */}
                <div className="sa-mobile-cards">
                  {availabilities.map((a, idx) => (
                    <div key={a._id} className={`sa-mobile-card ${isExpired(a.toDate) ? 'expired' : ''}`}>
                      <div className="sa-mobile-card-header">
                        <span className="sa-mobile-card-num">#{idx + 1}</span>
                        <span className={`sa-status-tag ${isExpired(a.toDate) ? 'expired' : 'active'}`}>
                          {isExpired(a.toDate) ? 'Expired' : 'Active'}
                        </span>
                      </div>
                      {editingId === a._id ? (
                        <div className="sa-mobile-edit-form">
                          <div className="sa-mobile-edit-row">
                            <label>Start</label>
                            <input type="time" value={editForm.startTime} onChange={e => setEditForm({ ...editForm, startTime: e.target.value })} />
                          </div>
                          <div className="sa-mobile-edit-row">
                            <label>End</label>
                            <input type="time" value={editForm.endTime} onChange={e => setEditForm({ ...editForm, endTime: e.target.value })} />
                          </div>
                          <div className="sa-mobile-edit-row">
                            <label>Slot (min)</label>
                            <input type="number" value={editForm.slotDuration} onChange={e => setEditForm({ ...editForm, slotDuration: e.target.value })} />
                          </div>
                          <div className="sa-mobile-edit-row">
                            <label>Break (min)</label>
                            <input type="number" value={editForm.breakDuration} onChange={e => setEditForm({ ...editForm, breakDuration: e.target.value })} />
                          </div>
                          <div className="sa-mobile-edit-row">
                            <label>Price (₹)</label>
                            <input type="number" value={editForm.pricePerSlot} onChange={e => setEditForm({ ...editForm, pricePerSlot: e.target.value })} />
                          </div>
                          <div className="sa-mobile-edit-actions">
                            <button className="sa-btn save" onClick={() => saveEdit(a._id)}>Save</button>
                            <button className="sa-btn cancel" onClick={cancelEdit}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="sa-mobile-card-body">
                            <div className="sa-mobile-detail">
                              <span className="sa-mobile-label">Dates</span>
                              <span>{formatDate(a.fromDate)} <FiArrowRight /> {formatDate(a.toDate)}</span>
                            </div>
                            <div className="sa-mobile-detail">
                              <span className="sa-mobile-label">Time</span>
                              <span>{a.startTime} — {a.endTime}</span>
                            </div>
                            <div className="sa-mobile-detail-row">
                              <div className="sa-mobile-detail">
                                <span className="sa-mobile-label">Slot</span>
                                <span>{a.slotDuration} min</span>
                              </div>
                              <div className="sa-mobile-detail">
                                <span className="sa-mobile-label">Break</span>
                                <span>{a.breakDuration} min</span>
                              </div>
                              <div className="sa-mobile-detail">
                                <span className="sa-mobile-label">Price</span>
                                <span>₹{a.pricePerSlot}</span>
                              </div>
                            </div>
                          </div>
                          <div className="sa-mobile-card-footer">
                            <button className="sa-btn edit" onClick={() => startEdit(a)}><FiEdit2 /> Edit</button>
                            <button className="sa-btn delete" onClick={() => deleteAvailability(a._id)}><FiTrash2 /> Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination Control */}
                <div className="sa-pagination-wrapper">
                  <div className="sa-pagination-info">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} entries
                  </div>
                  <div className="sa-pagination-controls">
                    <div className="sa-page-size-selector">
                      <label>Rows per page:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    <div className="sa-page-buttons">
                      <button
                        className="sa-page-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      >
                        Prev
                      </button>
                      <span className="sa-page-indicator">{currentPage} / {totalPages}</span>
                      <button
                        className="sa-page-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ============================================================
          SERVICE CONFIG EDIT MODAL
          ============================================================ */}
      {editingConfig && configForm && (
        <div className="sa-modal-overlay" onClick={cancelEditConfig}>
          <div className="sa-modal" onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3>{editingConfig === 'online' ? <span style={{display: 'inline-flex', alignItems: 'center', gap: '8px'}}><FiGlobe /> Online</span> : <span style={{display: 'inline-flex', alignItems: 'center', gap: '8px'}}><FaRegHospital /> Offline</span>} Consultation Settings</h3>
              <button className="sa-modal-close" onClick={cancelEditConfig}><FiX /></button>
            </div>

            <div className="sa-modal-body">
              {/* Schedule Section */}
              <div className="sa-form-section">
                <h4 className="sa-form-section-title"><span style={{display: 'inline-flex', alignItems: 'center', gap: '6px'}}><FiCalendar /> Schedule</span></h4>
                <div className="sa-form-grid">
                  <div className="sa-form-group">
                    <label>Start Time</label>
                    <input type="time" value={configForm.timeStart} onChange={e => setConfigForm(p => ({ ...p, timeStart: e.target.value }))} />
                  </div>
                  <div className="sa-form-group">
                    <label>End Time</label>
                    <input type="time" value={configForm.timeEnd} onChange={e => setConfigForm(p => ({ ...p, timeEnd: e.target.value }))} />
                  </div>
                  <div className="sa-form-group">
                    <label>Session Duration (min)</label>
                    <input type="number" value={configForm.sessionDuration} onChange={e => setConfigForm(p => ({ ...p, sessionDuration: Number(e.target.value) }))} />
                  </div>
                </div>
                {editingConfig === 'offline' && (
                  <div className="sa-form-group full-width">
                    <label><span style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}><FiMapPin /> Clinic Location</span></label>
                    <input type="text" value={configForm.location} onChange={e => setConfigForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Asha Neuro Clinic" />
                  </div>
                )}
              </div>

              {/* Services Section */}
              <div className="sa-form-section">
                <div className="sa-form-section-header">
                  <h4 className="sa-form-section-title"><span style={{display: 'inline-flex', alignItems: 'center', gap: '6px'}}><FiBriefcase /> Services & Pricing</span></h4>
                  <button className="sa-add-service-btn" onClick={addServiceToForm}>+ Add Service</button>
                </div>
                <div className="sa-services-list">
                  {configForm.services.map((svc, idx) => (
                    <div key={idx} className="sa-service-row">
                      <div className="sa-service-num">{idx + 1}</div>
                      <div className="sa-service-name-field">
                        <input
                          type="text"
                          value={svc.name}
                          onChange={e => updateServiceInForm(idx, 'name', e.target.value)}
                          placeholder="Service name"
                        />
                      </div>
                      <div className="sa-service-price-field">
                        <span className="sa-price-symbol">₹</span>
                        <input
                          type="number"
                          value={svc.price}
                          onChange={e => updateServiceInForm(idx, 'price', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <button className="sa-service-remove" onClick={() => removeServiceFromForm(idx)} title="Remove"><FiX /></button>
                    </div>
                  ))}
                  {configForm.services.length === 0 && (
                    <div className="sa-services-empty">No services added. Click <strong>+ Add Service</strong> to begin.</div>
                  )}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="sa-form-section">
                <label className="sa-toggle">
                  <input type="checkbox" checked={configForm.isActive} onChange={e => setConfigForm(p => ({ ...p, isActive: e.target.checked }))} />
                  <span className="sa-toggle-slider"></span>
                  <span className="sa-toggle-text">{configForm.isActive ? 'Configuration Active' : 'Configuration Inactive'}</span>
                </label>
              </div>
            </div>

            <div className="sa-modal-footer">
              <button className="sa-btn cancel" onClick={cancelEditConfig}>Cancel</button>
              <button className="sa-btn primary" onClick={saveConfig} disabled={savingConfig}>
                {savingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          ADD SLOT MODAL
          ============================================================ */}
      {showAddSlot && (
        <div className="sa-modal-overlay" onClick={() => setShowAddSlot(false)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3><span style={{display: 'inline-flex', alignItems: 'center', gap: '8px'}}><FiCalendar /> Create Availability Slot Range</span></h3>
              <button className="sa-modal-close" onClick={() => setShowAddSlot(false)}><FiX /></button>
            </div>
            
            <div className="sa-modal-body">
              <div className="sa-form-section">
                <h4 className="sa-form-section-title">Date Range</h4>
                <div className="sa-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="sa-form-group">
                    <label>From Date</label>
                    <input type="date" value={newSlotForm.fromDate} onChange={e => setNewSlotForm({ ...newSlotForm, fromDate: e.target.value })} />
                  </div>
                  <div className="sa-form-group">
                    <label>To Date</label>
                    <input type="date" value={newSlotForm.toDate} onChange={e => setNewSlotForm({ ...newSlotForm, toDate: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="sa-form-section">
                <h4 className="sa-form-section-title">Time & Duration</h4>
                <div className="sa-form-grid">
                  <div className="sa-form-group">
                    <label>Start Time</label>
                    <input type="time" value={newSlotForm.startTime} onChange={e => setNewSlotForm({ ...newSlotForm, startTime: e.target.value })} />
                  </div>
                  <div className="sa-form-group">
                    <label>End Time</label>
                    <input type="time" value={newSlotForm.endTime} onChange={e => setNewSlotForm({ ...newSlotForm, endTime: e.target.value })} />
                  </div>
                  <div className="sa-form-group">
                    <label>Slot Duration (min)</label>
                    <input type="number" value={newSlotForm.slotDuration} onChange={e => setNewSlotForm({ ...newSlotForm, slotDuration: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="sa-form-section">
                <h4 className="sa-form-section-title">Pricing & Breaks</h4>
                <div className="sa-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="sa-form-group">
                    <label>Break Duration (min)</label>
                    <input type="number" value={newSlotForm.breakDuration} onChange={e => setNewSlotForm({ ...newSlotForm, breakDuration: e.target.value })} />
                  </div>
                  <div className="sa-form-group">
                    <label>Price per Slot (₹)</label>
                    <input type="number" value={newSlotForm.pricePerSlot} onChange={e => setNewSlotForm({ ...newSlotForm, pricePerSlot: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="sa-modal-footer">
              <button className="sa-btn cancel" onClick={() => setShowAddSlot(false)}>Cancel</button>
              <button className="sa-btn primary" onClick={handleCreateSlot} disabled={savingSlot}>
                {savingSlot ? 'Creating...' : 'Create Slot Range'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================
  // CONFIG CARD RENDERER
  // ============================================================

  function renderConfigCard(mode) {
    const config = serviceConfigs[mode];
    const isOnline = mode === 'online';

    if (!config) {
      return (
        <div className="sa-config-card sa-config-empty">
          <div className="sa-config-icon-large">{isOnline ? <FiGlobe /> : <FaRegHospital />}</div>
          <h3>{isOnline ? 'Online Consultation' : 'Offline Consultation'}</h3>
          <p>Not configured yet</p>
          <button className="sa-btn primary" onClick={() => startEditConfig(mode)}>
            + Create {isOnline ? 'Online' : 'Offline'} Config
          </button>
        </div>
      );
    }

    return (
      <div className="sa-config-card">
        <div className="sa-config-card-top">
          <div className="sa-config-card-title">
            <span className="sa-config-mode-icon">{isOnline ? <FiGlobe /> : <FaRegHospital />}</span>
            <div>
              <h3>{isOnline ? 'Online Consultation' : 'Offline Consultation'}</h3>
              <p className="sa-config-subtitle">
                {fmt12(config.timeStart)} — {fmt12(config.timeEnd)} IST
                {config.sessionDuration && ` • ${config.sessionDuration} min`}
                {config.location && ` • ${config.location}`}
              </p>
            </div>
          </div>
          <div className="sa-config-card-actions">
            <span className={`sa-status-tag ${config.isActive ? 'active' : 'inactive'}`}>
              {config.isActive ? 'Active' : 'Inactive'}
            </span>
            <button className="sa-btn edit" onClick={() => startEditConfig(mode)}><FiEdit2 /> Edit</button>
          </div>
        </div>

        {/* Services Table */}
        <div className="sa-config-services">
          <div className="sa-config-services-header">
            <span className="sa-config-sh-num">#</span>
            <span className="sa-config-sh-name">Service</span>
            <span className="sa-config-sh-price">Price</span>
          </div>
          {config.services.map((svc, idx) => (
            <div key={svc._id || idx} className={`sa-config-service-item ${svc.isActive === false ? 'inactive' : ''}`}>
              <span className="sa-config-si-num">{idx + 1}</span>
              <span className="sa-config-si-name">{svc.name}</span>
              <span className="sa-config-si-price">₹{svc.price.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default SavedAvailabilities;
