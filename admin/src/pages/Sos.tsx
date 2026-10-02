import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getSosAlerts, updateSosAlert, createIncident } from '../lib/api';
import { hasCoords, osmLink } from '../lib/map';

interface SosAlert {
  id: number;
  userId: number;
  wardId: number;
  type: string;
  status: string;
  note: string | null;
  latitude: string | null;
  longitude: string | null;
  createdAt: string;
  userName: string | null;
  wardName: string | null;
}

const STATUSES = ['pending', 'dispatched', 'resolved', 'cancelled'];

const statusColors: Record<string, string> = {
  pending: '#EF4444',
  dispatched: '#F59E0B',
  resolved: '#10B981',
  cancelled: '#94A3B8',
};

const SEVERITIES = ['High', 'Medium', 'Low'];

export default function Sos() {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Inline "promote to Incident" form, opened per-alert.
  const [promoting, setPromoting] = useState<SosAlert | null>(null);
  const [incidentForm, setIncidentForm] = useState({ title: '', category: '', severity: 'High', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [statusFilter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const data = await getSosAlerts(params) as { alerts: SosAlert[] };
      setAlerts(data.alerts || []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load SOS alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await updateSosAlert(id, status);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const openPromote = (alert: SosAlert) => {
    setPromoting(alert);
    setIncidentForm({
      title: `${alert.type} emergency reported in ${alert.wardName || 'ward'}`,
      category: alert.type,
      severity: 'High',
      description: alert.note || `Escalated from an SOS alert sent by ${alert.userName || 'a resident'}. Review before publishing.`,
    });
  };

  const cancelPromote = () => {
    setPromoting(null);
  };

  const submitPromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoting) return;
    setSubmitting(true);
    try {
      await createIncident({
        ...incidentForm,
        status: 'Active',
        // keep the alert's location so the incident shows up on residents' map
        ...(hasCoords(promoting.latitude, promoting.longitude)
          ? { latitude: Number(promoting.latitude), longitude: Number(promoting.longitude) }
          : {}),
      } as any);
      // The SOS is now being handled via a public incident — reflect that.
      await updateSosAlert(promoting.id, 'dispatched');
      setAlerts((prev) => prev.map((a) => (a.id === promoting.id ? { ...a, status: 'dispatched' } : a)));
      setPromoting(null);
      alert('Incident published. Residents in this ward will now see it on their map.');
    } catch (err: any) {
      alert(`Failed to create incident: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 8px' }}>
              SOS Alerts
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
              Private emergency calls from residents — dispatch help, then optionally publish a public Incident if it affects the wider ward.
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid var(--border-strong)',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'var(--surface)',
              color: 'var(--text-2)'
            }}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {promoting && (
          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--ink)', margin: '0 0 6px' }}>
              Publish as Incident
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 20px' }}>
              Review the details before this becomes visible to every resident in the ward.
            </p>
            <form onSubmit={submitPromote}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-2)' }}>Title</label>
                <input
                  type="text"
                  value={incidentForm.title}
                  onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-2)' }}>Category</label>
                  <input
                    type="text"
                    value={incidentForm.category}
                    onChange={(e) => setIncidentForm({ ...incidentForm, category: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-2)' }}>Severity</label>
                  <select
                    value={incidentForm.severity}
                    onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '14px' }}
                  >
                    {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-2)' }}>Description</label>
                <textarea
                  value={incidentForm.description}
                  onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  required
                  minLength={10}
                  rows={3}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '10px 20px', background: '#0F766E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'wait' : 'pointer' }}
                >
                  {submitting ? 'Publishing…' : 'Publish Incident'}
                </button>
                <button
                  type="button"
                  onClick={cancelPromote}
                  style={{ padding: '10px 20px', background: 'var(--btn-bg)', color: 'var(--text-2)', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            Loading SOS alerts...
          </div>
        )}

        {error && (
          <div style={{
            padding: '16px',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: '12px',
            color: 'var(--danger-text)',
            marginBottom: '24px'
          }}>
            <strong>Error:</strong> {error}
            <button
              onClick={loadAlerts}
              style={{ marginLeft: '12px', padding: '4px 12px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && alerts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', background: 'var(--surface)', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <p style={{ color: 'var(--muted)', fontSize: '16px' }}>No SOS alerts found</p>
          </div>
        )}

        {alerts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {alerts.map((alert) => (
              <div key={alert.id} style={{ background: 'var(--surface)', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--ink)', margin: 0 }}>
                        🆘 {alert.type}
                      </h3>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        background: `${statusColors[alert.status] || '#94A3B8'}20`,
                        color: statusColors[alert.status] || '#94A3B8'
                      }}>
                        {alert.status}
                      </span>
                    </div>
                    {alert.note && (
                      <p style={{ fontSize: '14px', color: 'var(--text-3)', margin: '0 0 10px', lineHeight: '1.5' }}>
                        {alert.note}
                      </p>
                    )}
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {alert.userName || 'Unknown resident'} • {alert.wardName || 'No ward'} • {new Date(alert.createdAt).toLocaleString()}
                      {hasCoords(alert.latitude, alert.longitude) && (
                        <>
                          {' • '}
                          <a href={osmLink(alert.latitude!, alert.longitude!)} target="_blank" rel="noreferrer" style={{ color: 'var(--link)', fontWeight: 600 }}>
                            View location
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      onClick={() => openPromote(alert)}
                      style={{ padding: '8px 14px', background: 'var(--info-bg)', color: '#3B82F6', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                    >
                      Publish as Incident
                    </button>
                    <select
                      value={alert.status}
                      disabled={updatingId === alert.id}
                      onChange={(e) => handleStatusChange(alert.id, e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: `1px solid ${statusColors[alert.status] || '#94A3B8'}`,
                        background: `${statusColors[alert.status] || '#94A3B8'}15`,
                        color: statusColors[alert.status] || 'var(--muted)',
                        cursor: updatingId === alert.id ? 'wait' : 'pointer',
                      }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </AdminLayout>
  );
}
