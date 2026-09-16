import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { BASE_API_URL, STORAGE_KEYS } from '../../config/apiConfig';

const EVENT_TYPE_LABELS = {
  ORDER_PLACED: 'Order Placed',
  PAYMENT_SUCCESS: 'Payment Success',
  ORDER_PROCESSING: 'Processing',
  ORDER_SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  ORDER_DELIVERED: 'Delivered',
  ORDER_CANCELLED: 'Cancelled',
  REFUND_PENDING: 'Refund Pending',
  ADMIN_MESSAGE: 'Admin Message',
};

const EVENT_COLORS = {
  ORDER_PLACED: 'primary',
  PAYMENT_SUCCESS: 'success',
  ORDER_PROCESSING: 'info',
  ORDER_SHIPPED: 'warning',
  OUT_FOR_DELIVERY: 'warning',
  ORDER_DELIVERED: 'success',
  ORDER_CANCELLED: 'danger',
  REFUND_PENDING: 'warning',
  ADMIN_MESSAGE: 'secondary',
};

const STATUS_COLORS = {
  Sent: 'success',
  Failed: 'danger',
  Pending: 'warning',
};

const AdminEmailLogsPage = () => {
  const { token } = useAdminAuth();

  // Get token safely from localStorage as backup
  const getAdminToken = () => token || localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || '';

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [retryingId, setRetryingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [clearingFailed, setClearingFailed] = useState(false);
  const [toastMsg, setToastMsg] = useState({ text: '', type: '' });

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg({ text: '', type: '' }), 3500);
  };

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAdminToken()}`,
  });

  const emailLogsUrl = `${BASE_API_URL}/v1/admin/email-logs`;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.set('status', statusFilter);
      if (eventTypeFilter) params.set('eventType', eventTypeFilter);
      if (searchEmail.trim()) params.set('search', searchEmail.trim());
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`${emailLogsUrl}?${params}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch email logs');
      setLogs(data.logs || []);
      setStats(data.stats || { total: 0, sent: 0, failed: 0, pending: 0 });
      setPage(data.page || 1);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      showToast(err.message || 'Error loading email logs', 'danger');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, eventTypeFilter, searchEmail, startDate, endDate, token]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRetry = async (logId) => {
    setRetryingId(logId);
    try {
      const res = await fetch(`${emailLogsUrl}/${logId}/retry`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Retry failed');
      showToast(data.message || 'Email resent successfully!', 'success');
      fetchLogs();
    } catch (err) {
      showToast(err.message || 'Retry failed', 'danger');
    } finally {
      setRetryingId(null);
    }
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Delete this email log entry?')) return;
    setDeletingId(logId);
    try {
      const res = await fetch(`${emailLogsUrl}/${logId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      showToast('Email log deleted', 'success');
      setLogs((prev) => prev.filter((l) => l._id !== logId));
    } catch (err) {
      showToast(err.message || 'Delete failed', 'danger');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearFailed = async () => {
    if (!window.confirm('Clear all FAILED email logs? This cannot be undone.')) return;
    setClearingFailed(true);
    try {
      const res = await fetch(`${emailLogsUrl}/clear-failed`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Clear failed');
      showToast(data.message || 'Failed logs cleared', 'success');
      fetchLogs();
    } catch (err) {
      showToast(err.message || 'Clear failed', 'danger');
    } finally {
      setClearingFailed(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter('');
    setEventTypeFilter('');
    setSearchEmail('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="container-fluid px-4 py-4">
      {/* Toast */}
      {toastMsg.text && (
        <div
          className={`alert alert-${toastMsg.type} alert-dismissible position-fixed top-0 end-0 m-3 shadow`}
          style={{ zIndex: 9999, minWidth: 280 }}
          role="alert"
        >
          {toastMsg.text}
          <button type="button" className="btn-close" onClick={() => setToastMsg({ text: '', type: '' })} />
        </div>
      )}

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="h4 fw-bold mb-1">
            <i className="bi bi-envelope-check me-2 text-primary" />
            Email Logs
          </h1>
          <p className="text-muted small mb-0">Monitor transactional email delivery and retry failures</p>
        </div>
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={handleClearFailed}
          disabled={clearingFailed || stats.failed === 0}
        >
          {clearingFailed ? (
            <><span className="spinner-border spinner-border-sm me-1" />Clearing...</>
          ) : (
            <><i className="bi bi-trash me-1" />Clear Failed ({stats.failed})</>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Emails', value: stats.total, icon: 'bi-envelope', color: 'primary' },
          { label: 'Sent', value: stats.sent, icon: 'bi-check-circle', color: 'success' },
          { label: 'Failed', value: stats.failed, icon: 'bi-x-circle', color: 'danger' },
          { label: 'Pending', value: stats.pending, icon: 'bi-clock', color: 'warning' },
        ].map((card) => (
          <div key={card.label} className="col-6 col-md-3">
            <div className={`card border-0 shadow-sm bg-${card.color} bg-opacity-10`}>
              <div className="card-body d-flex align-items-center gap-3 py-3">
                <i className={`bi ${card.icon} fs-2 text-${card.color}`} />
                <div>
                  <div className={`fs-4 fw-bold text-${card.color}`}>{card.value}</div>
                  <small className="text-muted">{card.label}</small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label small fw-semibold">Search by Email</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="customer@example.com"
                value={searchEmail}
                onChange={(e) => { setSearchEmail(e.target.value); setPage(1); }}
              />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label small fw-semibold">Status</label>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="Sent">Sent</option>
                <option value="Failed">Failed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label small fw-semibold">Event Type</label>
              <select
                className="form-select form-select-sm"
                value={eventTypeFilter}
                onChange={(e) => { setEventTypeFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Events</option>
                {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label small fw-semibold">From Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label small fw-semibold">To Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              />
            </div>
            <div className="col-12 col-md-1">
              <button className="btn btn-outline-secondary btn-sm w-100" onClick={resetFilters}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <span className="fw-semibold small">
            {total} email log{total !== 1 ? 's' : ''} found
          </span>
          <button className="btn btn-sm btn-outline-primary" onClick={fetchLogs}>
            <i className="bi bi-arrow-clockwise me-1" />Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Loading email logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-envelope-x fs-1 text-muted" />
            <p className="mt-2 text-muted">No email logs found matching your filters.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="small fw-semibold ps-3">Recipient</th>
                    <th className="small fw-semibold">Event Type</th>
                    <th className="small fw-semibold">Order</th>
                    <th className="small fw-semibold">Status</th>
                    <th className="small fw-semibold">Sent At</th>
                    <th className="small fw-semibold">Created</th>
                    <th className="small fw-semibold text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td className="ps-3">
                        <div className="small fw-semibold">{log.customer?.name || '—'}</div>
                        <div className="small text-muted">{log.email}</div>
                      </td>
                      <td>
                        <span className={`badge bg-${EVENT_COLORS[log.eventType] || 'secondary'} bg-opacity-15 text-${EVENT_COLORS[log.eventType] || 'secondary'} border border-${EVENT_COLORS[log.eventType] || 'secondary'} border-opacity-25`}>
                          {EVENT_TYPE_LABELS[log.eventType] || log.eventType}
                        </span>
                      </td>
                      <td>
                        {log.order ? (
                          <span className="small font-monospace text-primary">
                            #{log.order.orderNumber || log.order._id?.toString().slice(-6)}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`badge bg-${STATUS_COLORS[log.status]} bg-opacity-15 text-${STATUS_COLORS[log.status]} border border-${STATUS_COLORS[log.status]} border-opacity-25`}>
                          <i className={`bi ${log.status === 'Sent' ? 'bi-check-circle' : log.status === 'Failed' ? 'bi-x-circle' : 'bi-clock'} me-1`} />
                          {log.status}
                        </span>
                        {log.status === 'Failed' && log.errorMessage && (
                          <div className="small text-danger mt-1" title={log.errorMessage}>
                            {log.errorMessage.length > 40 ? log.errorMessage.slice(0, 40) + '…' : log.errorMessage}
                          </div>
                        )}
                      </td>
                      <td className="small text-muted">{log.sentAt ? fmtDate(log.sentAt) : '—'}</td>
                      <td className="small text-muted">{fmtDate(log.createdAt)}</td>
                      <td className="text-end pe-3">
                        <div className="d-flex justify-content-end gap-1">
                          {log.status !== 'Sent' && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleRetry(log._id)}
                              disabled={retryingId === log._id}
                              title="Retry sending this email"
                            >
                              {retryingId === log._id ? (
                                <span className="spinner-border spinner-border-sm" />
                              ) : (
                                <i className="bi bi-arrow-repeat" />
                              )}
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(log._id)}
                            disabled={deletingId === log._id}
                            title="Delete this log entry"
                          >
                            {deletingId === log._id ? (
                              <span className="spinner-border spinner-border-sm" />
                            ) : (
                              <i className="bi bi-trash" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
                <small className="text-muted">
                  Page {page} of {pages}
                </small>
                <div className="d-flex gap-1">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <i className="bi bi-chevron-left" />
                  </button>
                  {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                    const pg = page <= 3 ? i + 1 : page - 2 + i;
                    if (pg > pages) return null;
                    return (
                      <button
                        key={pg}
                        className={`btn btn-sm ${pg === page ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setPage(pg)}
                      >
                        {pg}
                      </button>
                    );
                  })}
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                  >
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminEmailLogsPage;
