import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getIncidents, updateIncident, deleteIncident } from '../lib/api';
import { timeAgoWithDate } from '../lib/time';

interface Incident {
  id: number;
  title: string;
  description: string;
  severity: string;
  category: string;
  reportedBy: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  incidentDate: string;
  latitude: string | null;
  longitude: string | null;
  status: string;
  createdAt: string;
}

// Must match the server's exact enum (server/routes/incidents.ts) — there
// is no "critical" level, only these three.
const SEVERITIES = ['High', 'Medium', 'Low'];

const severityColors: Record<string, string> = {
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#EF4444',
};

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ severity: '', verified: '' });

  useEffect(() => {
    loadIncidents();
    const interval = setInterval(() => loadIncidents(true), 15000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadIncidents = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params: any = { limit: 50 };
      if (filter.severity) params.severity = filter.severity;
      const data = await getIncidents(params) as { incidents: Incident[] };
      setIncidents(data.incidents || []);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load incidents');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleVerify = async (id: number) => {
    try {
      await updateIncident(id, { verifiedBy: 'admin' });
      loadIncidents();
    } catch (err: any) {
      alert(`Failed to verify: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this incident?')) return;
    try {
      await deleteIncident(id);
      loadIncidents();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  return (
    <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 8px' }}>
              Incidents
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
              Review and manage reported incidents
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={filter.severity}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
              style={{
                padding: '10px 16px',
                border: '1px solid var(--border-strong)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--surface)',
                color: 'var(--text-2)'
              }}
            >
              <option value="">All Severity</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            Loading incidents...
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
              onClick={() => loadIncidents()}
              style={{
                marginLeft: '12px',
                padding: '4px 12px',
                background: '#DC2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && incidents.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            background: 'var(--surface)',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{ color: 'var(--muted)', fontSize: '16px' }}>No incidents found</p>
          </div>
        )}

        {incidents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {incidents.map((incident) => (
              <div
                key={incident.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--ink)', margin: 0 }}>
                        {incident.title}
                      </h3>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: `${severityColors[incident.severity] || '#94A3B8'}20`,
                        color: severityColors[incident.severity] || '#94A3B8'
                      }}>
                        {incident.severity}
                      </span>
                      {incident.verifiedBy ? (
                        <span style={{ color: '#10B981', fontWeight: '600', fontSize: '12px' }}>Verified</span>
                      ) : (
                        <span style={{ color: '#F59E0B', fontWeight: '600', fontSize: '12px' }}>Pending</span>
                      )}
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-3)', margin: '0 0 10px', lineHeight: '1.5' }}>
                      {incident.description}
                    </p>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {incident.category} • {incident.reportedBy} • {timeAgoWithDate(incident.incidentDate || incident.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {!incident.verifiedBy && (
                      <button
                        onClick={() => handleVerify(incident.id)}
                        style={{
                          padding: '8px 14px',
                          background: '#10B981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(incident.id)}
                      style={{
                        padding: '8px 14px',
                        background: 'var(--danger-bg-2)',
                        color: 'var(--danger-text)',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </AdminLayout>
  );
}