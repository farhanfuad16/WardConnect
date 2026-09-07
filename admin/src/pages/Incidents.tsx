import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getIncidents, updateIncident, deleteIncident } from '../lib/api';

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

const severityColors: Record<string, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#DC2626',
};

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ severity: '', verified: '' });

  useEffect(() => {
    loadIncidents();
  }, [filter]);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (filter.severity) params.severity = filter.severity;
      const data = await getIncidents(params) as { incidents: Incident[] };
      setIncidents(data.incidents || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#102A2A', margin: '0 0 8px' }}>
              Incidents
            </h1>
            <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
              Review and manage reported incidents
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={filter.severity}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
              style={{
                padding: '10px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white',
                color: '#374151'
              }}
            >
              <option value="">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
            Loading incidents...
          </div>
        )}

        {error && (
          <div style={{
            padding: '16px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            color: '#DC2626',
            marginBottom: '24px'
          }}>
            <strong>Error:</strong> {error}
            <button
              onClick={loadIncidents}
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
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{ color: '#64748B', fontSize: '16px' }}>No incidents found</p>
          </div>
        )}

        {incidents.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Severity</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Reported By</th>
                  <th style={thStyle}>Verified</th>
                  <th style={thStyle}>Date</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '500', color: '#102A2A' }}>{incident.title}</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {incident.description}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: `${severityColors[incident.severity] || '#94A3B8'}20`,
                        color: severityColors[incident.severity] || '#94A3B8'
                      }}>
                        {incident.severity}
                      </span>
                    </td>
                    <td style={tdStyle}>{incident.category}</td>
                    <td style={tdStyle}>{incident.reportedBy}</td>
                    <td style={tdStyle}>
                      {incident.verifiedBy ? (
                        <span style={{ color: '#10B981', fontWeight: '500' }}>Verified</span>
                      ) : (
                        <span style={{ color: '#F59E0B', fontWeight: '500' }}>Pending</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {new Date(incident.incidentDate || incident.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {!incident.verifiedBy && (
                          <button
                            onClick={() => handleVerify(incident.id)}
                            style={{
                              padding: '6px 12px',
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
                            padding: '6px 12px',
                            background: '#FEE2E2',
                            color: '#DC2626',
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '600',
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  background: '#F9FAFB'
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '14px',
  color: '#374151'
};