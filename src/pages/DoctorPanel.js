import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiMenu, FiX, FiClipboard, FiGlobe, FiTool, FiSettings, FiLogOut, FiCalendar, FiArrowRight, FiSearch, FiInbox, FiEye, FiTrash2 } from 'react-icons/fi';
import { FaStethoscope, FaRegHospital } from 'react-icons/fa';
import './DoctorPanel.css';

const Api = "https://s-doctorbackend-admin.onrender.com";
// const Api = "http://localhost:5000";

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no-show', label: 'No Show' },
];

const getDisplayStatus = (status) => {
  if (status === 'success' || status === 'new') return 'new';
  if (status === 'pending') return 'new';
  return status || 'new';
};

const getStatusLabel = (status) => {
  const display = getDisplayStatus(status);
  const option = STATUS_OPTIONS.find(o => o.value === display);
  return option ? option.label : status;
};

function DoctorPanel() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [savedAvailabilities, setSavedAvailabilities] = useState([]);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeView, setActiveView] = useState('bookings');
  const [modeFilter, setModeFilter] = useState('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [previewModal, setPreviewModal] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchAppointments(), fetchAvailabilities(), fetchSettings()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${Api}/api/appointments`, { headers: getAuthHeaders() });
      setAppointments(res.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      if (error.response?.status === 401) handleLogout();
    }
  };

  const fetchAvailabilities = async () => {
    try {
      const res = await axios.get(`${Api}/api/availability`, { headers: getAuthHeaders() });
      // console.log(res.data);
      setSavedAvailabilities(res.data);
    } catch (error) {
      console.error('Error fetching availabilities:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${Api}/api/settings`, { headers: getAuthHeaders() });
      setPrice(res.data.basePrice || '');
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateStatus = async (appointmentId, newStatus) => {
    try {
      await axios.put(`${Api}/api/appointment/${appointmentId}/status`, { status: newStatus }, { headers: getAuthHeaders() });
      setAppointments(prev => prev.map(a => a._id === appointmentId ? { ...a, status: newStatus } : a));
      toast.success(`Status updated to ${getStatusLabel(newStatus)}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await axios.delete(`${Api}/api/appointment`, { headers: getAuthHeaders(), data: { ids: [id] } });
      setAppointments(prev => prev.filter(a => a._id !== id));
      setPreviewModal(null);
      toast.success('Appointment deleted');
    } catch (error) {
      toast.error('Failed to delete appointment');
    }
  };

  const updatePrice = async () => {
    if (!price || isNaN(price) || price <= 0) return toast.error('Price must be a positive number');
    try {
      await axios.post(`${Api}/api/settings/price`, { doctorId: 'doctor1', basePrice: parseInt(price) }, { headers: getAuthHeaders() });
      toast.success('Price updated successfully');
    } catch (error) {
      toast.error('Failed to update price');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const filteredAppointments = useMemo(() => {
    let result = [...appointments];
    if (modeFilter !== 'all') result = result.filter(a => (a.bookingMode || 'offline') === modeFilter);
    if (statusFilter !== 'all') result = result.filter(a => getDisplayStatus(a.status) === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
        (a.phone || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.serviceType || '').toLowerCase().includes(q)
      );
    }
    if (dateFrom) result = result.filter(a => new Date(a.appointmentDate) >= new Date(dateFrom));
    if (dateTo) {
      const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
      result = result.filter(a => new Date(a.appointmentDate) <= to);
    }
    return result;
  }, [appointments, modeFilter, statusFilter, searchQuery, dateFrom, dateTo]);

  const onlineCount = appointments.filter(a => a.bookingMode === 'online').length;
  const offlineCount = appointments.filter(a => (a.bookingMode || 'offline') === 'offline').length;
  const clearFilters = () => { setSearchQuery(''); setStatusFilter('all'); setDateFrom(''); setDateTo(''); };
  const hasFilters = searchQuery || statusFilter !== 'all' || dateFrom || dateTo;

  useEffect(() => {
    setCurrentPage(1);
  }, [modeFilter, statusFilter, searchQuery, dateFrom, dateTo]);

  const totalItems = filteredAppointments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  const handleNavClick = (view, mode = 'all') => {
    setActiveView(view);
    if (view === 'bookings') setModeFilter(mode);
    setSidebarOpen(false);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="admin-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <FiX /> : <FiMenu />}</button>
        <h2>Admin Panel</h2>
      </div>

      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2><span className="logo-icon"><FaStethoscope /></span> Admin Panel</h2>
          <p>Doctor Dashboard</p>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Appointments</div>
          <button className={`sidebar-nav-item ${activeView === 'bookings' && modeFilter === 'all' ? 'active' : ''}`} onClick={() => handleNavClick('bookings', 'all')}>
            <span className="nav-icon"><FiClipboard /></span> All Bookings <span className="nav-badge">{appointments.length}</span>
          </button>
          <button className={`sidebar-nav-item ${activeView === 'bookings' && modeFilter === 'online' ? 'active' : ''}`} onClick={() => handleNavClick('bookings', 'online')}>
            <span className="nav-icon"><FiGlobe /></span> Online <span className="nav-badge">{onlineCount}</span>
          </button>
          <button className={`sidebar-nav-item ${activeView === 'bookings' && modeFilter === 'offline' ? 'active' : ''}`} onClick={() => handleNavClick('bookings', 'offline')}>
            <span className="nav-icon"><FaRegHospital /></span> Offline <span className="nav-badge">{offlineCount}</span>
          </button>

          <div className="sidebar-section-label">Manage</div>
          <button className="sidebar-nav-item" onClick={() => navigate('/admin/availabilities')}>
            <span className="nav-icon"><FiTool /></span> Availability & Services
          </button>
          <button className={`sidebar-nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => handleNavClick('settings')}>
            <span className="nav-icon"><FiSettings /></span> Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-nav-item" onClick={handleLogout}>
            <span className="nav-icon"><FiLogOut /></span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* BOOKINGS VIEW */}
        {activeView === 'bookings' && (
          <>
            <div className="main-header">
              <h1>{modeFilter === 'all' ? 'All Bookings' : modeFilter === 'online' ? 'Online Bookings' : 'Offline Bookings'}</h1>
              <div className="main-header-right">
                <div className="header-stat-pill"><span className="stat-dot online"></span> Online: {onlineCount}</div>
                <div className="header-stat-pill"><span className="stat-dot offline"></span> Offline: {offlineCount}</div>
              </div>
            </div>

            {/* Availability Banner */}
            {savedAvailabilities.length > 0 && (
              <div className="availability-banner" onClick={() => navigate('/admin/availabilities')}>
                <div className="avail-banner-left">
                  <div className="avail-banner-icon"><FiCalendar /></div>
                  <div className="avail-banner-info">
                    <h3>{savedAvailabilities.length} Saved Availabilit{savedAvailabilities.length === 1 ? 'y' : 'ies'}</h3>
                    <p>
                      {savedAvailabilities[0] && (
                        <>Latest: {formatDate(savedAvailabilities[0].fromDate)} — {formatDate(savedAvailabilities[0].toDate)} | {savedAvailabilities[0].startTime} - {savedAvailabilities[0].endTime}</>
                      )}
                    </p>
                  </div>
                </div>
                <span className="avail-banner-arrow"><FiArrowRight /></span>
              </div>
            )}

            {/* Filter Bar */}
            <div className="filter-bar">
              <div className="search-input-wrapper">
                <span className="search-icon"><FiSearch /></span>
                <input type="text" placeholder="Search by name, phone, email, or service..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <input type="date" className="filter-date-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
              <input type="date" className="filter-date-input" value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" />
              {hasFilters && <button className="filter-clear-btn" onClick={clearFilters}><FiX /> Clear</button>}
            </div>

            {/* Bookings Table */}
            <div className="bookings-table-card">
              <div className="bookings-table-header">
                <h2>Appointments <span className="bookings-count">({filteredAppointments.length} of {appointments.length})</span></h2>
              </div>

              {loading ? (
                <div>{[...Array(5)].map((_, i) => <div key={i} className="skeleton-row" />)}</div>
              ) : filteredAppointments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><FiInbox /></div>
                  <h3>No appointments found</h3>
                  <p>{hasFilters ? 'Try adjusting your filters.' : 'New appointments will appear here.'}</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="bookings-table-wrapper">
                    <table className="bookings-table">
                      <thead>
                        <tr>
                          <th>#</th><th>Patient</th><th>Phone</th><th>Date</th><th>Time</th><th>Mode</th><th>Service</th><th>Price</th><th>Status</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAppointments.map((a, i) => (
                          <tr key={a._id}>
                            <td>{startIndex + i + 1}</td>
                            <td><span className="patient-name">{a.firstName} {a.lastName}</span><span className="patient-email">{a.email}</span></td>
                            <td>{a.phone || '—'}</td>
                            <td>{formatDate(a.appointmentDate)}</td>
                            <td>{a.appointmentTime || '—'}</td>
                            <td><span className={`mode-badge mode-${a.bookingMode || 'offline'}`}>{(a.bookingMode || 'offline') === 'online' ? <FiGlobe /> : <FaRegHospital />} {a.bookingMode || 'offline'}</span></td>
                            <td>{a.serviceType || '—'}</td>
                            <td>{a.price > 0 ? `₹${a.price}` : 'Free'}</td>
                            <td>
                              <select className="status-select" value={getDisplayStatus(a.status)} onChange={e => updateStatus(a._id, e.target.value)}>
                                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                            </td>
                            <td>
                              <button className="action-btn" onClick={() => setPreviewModal(a)} title="Preview"><FiEye /></button>
                              <button className="action-btn delete" onClick={() => deleteAppointment(a._id)} title="Delete" style={{ marginLeft: 4 }}><FiTrash2 /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="bookings-mobile-cards">
                    {paginatedAppointments.map((a, i) => (
                      <div key={a._id} className="booking-mobile-card" onClick={() => setPreviewModal(a)}>
                        <div className="bmc-top">
                          <span className="bmc-num">#{startIndex + i + 1}</span>
                          <span className={`mode-badge mode-${a.bookingMode || 'offline'}`}>
                            {(a.bookingMode || 'offline') === 'online' ? <FiGlobe /> : <FaRegHospital />} {a.bookingMode || 'offline'}
                          </span>
                        </div>
                        <div className="bmc-name">{a.firstName} {a.lastName}</div>
                        <div className="bmc-details">
                          <span>{formatDate(a.appointmentDate)}</span>
                          <span>{a.appointmentTime || '—'}</span>
                          <span>{a.price > 0 ? `₹${a.price}` : 'Free'}</span>
                        </div>
                        <div className="bmc-service">{a.serviceType || '—'}</div>
                        <div className="bmc-bottom">
                          <select className="status-select" value={getDisplayStatus(a.status)} onChange={e => { e.stopPropagation(); updateStatus(a._id, e.target.value); }} onClick={e => e.stopPropagation()}>
                            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                          <button className="action-btn delete" onClick={e => { e.stopPropagation(); deleteAppointment(a._id); }}><FiTrash2 /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Control */}
                  <div className="pagination-wrapper">
                    <div className="pagination-info">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} entries
                    </div>
                    <div className="pagination-controls">
                      <div className="page-size-selector">
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
                      <div className="page-buttons">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        >
                          Prev
                        </button>
                        <span className="page-indicator">{currentPage} / {totalPages}</span>
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* SETTINGS VIEW */}
        {activeView === 'settings' && (
          <>
            <div className="main-header"><h1>Settings</h1></div>
            <div className="settings-card">
              <h2>Consultation Price</h2>
              <p className="description">Set the base price for appointment consultations.</p>
              <div className="settings-field">
                <label>Base Price (₹)</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Enter price" />
              </div>
              <button className="settings-btn" onClick={updatePrice}>Update Price</button>
            </div>
          </>
        )}

        {/* PREVIEW MODAL */}
        {previewModal && (
          <div className="modal-overlay" onClick={() => setPreviewModal(null)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-card-header">
                <h3>Appointment Details</h3>
                <button className="modal-close-btn" onClick={() => setPreviewModal(null)}><FiX /></button>
              </div>
              <div className="modal-card-body">
                <div className="modal-detail-grid">
                  {[
                    ['First Name', previewModal.firstName],
                    ['Last Name', previewModal.lastName],
                    ['Phone', previewModal.phone],
                    ['Email', previewModal.email],
                    ['Date', formatDate(previewModal.appointmentDate)],
                    ['Time', previewModal.appointmentTime],
                  ].map(([label, val]) => (
                    <div key={label} className="modal-detail-item">
                      <div className="modal-detail-label">{label}</div>
                      <div className="modal-detail-value">{val || '—'}</div>
                    </div>
                  ))}
                  <div className="modal-detail-item">
                    <div className="modal-detail-label">Booking Mode</div>
                    <div className="modal-detail-value">
                      <span className={`mode-badge mode-${previewModal.bookingMode || 'offline'}`}>
                        {(previewModal.bookingMode || 'offline') === 'online' ? <FiGlobe /> : <FaRegHospital />} {previewModal.bookingMode || 'offline'}
                      </span>
                    </div>
                  </div>
                  <div className="modal-detail-item">
                    <div className="modal-detail-label">Service Type</div>
                    <div className="modal-detail-value">{previewModal.serviceType || '—'}</div>
                  </div>
                  <div className="modal-detail-item">
                    <div className="modal-detail-label">Price</div>
                    <div className="modal-detail-value">{previewModal.price > 0 ? `₹${previewModal.price}` : 'Free'}</div>
                  </div>
                  <div className="modal-detail-item">
                    <div className="modal-detail-label">Status</div>
                    <div className="modal-detail-value">
                      <span className={`status-badge status-${getDisplayStatus(previewModal.status)}`}>
                        <span className="status-dot"></span> {getStatusLabel(previewModal.status)}
                      </span>
                    </div>
                  </div>
                  {previewModal.meetingType && <div className="modal-detail-item"><div className="modal-detail-label">Meeting Type</div><div className="modal-detail-value">{previewModal.meetingType}</div></div>}
                  {previewModal.meetingContact && <div className="modal-detail-item"><div className="modal-detail-label">Meeting Contact</div><div className="modal-detail-value">{previewModal.meetingContact}</div></div>}
                  <div className="modal-detail-item full-width">
                    <div className="modal-detail-label">Booked On</div>
                    <div className="modal-detail-value">{formatDate(previewModal.createdAt)} {formatTime(previewModal.createdAt)}</div>
                  </div>
                </div>
              </div>
              <div className="modal-card-footer">
                <button className="modal-btn secondary" onClick={() => setPreviewModal(null)}>Close</button>
                <button className="modal-btn primary" onClick={() => deleteAppointment(previewModal._id)}>Delete Booking</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DoctorPanel;