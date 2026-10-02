import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getIncidents, createIncident, updateIncident, deleteIncident } from '../lib/api';
import { hasCoords, osmLink } from '../lib/map';
import { timeAgoWithDate } from '../lib/time';

interface Incident {
  id: number;
  title: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  category: string;
  status: string;
  latitude: string | null;
  longitude: string | null;
  verifiedBy: number | null;
  wardName: string | null;
  createdAt: string;
}

// Must match the server's exact enum (server/routes/incidents.ts) — there
// is no "critical" level, only these three.
const SEVERITIES = ['High', 'Medium', 'Low'] as const;

// `status` is free text in the database; these are the values the form offers.
const STATUSES = ['Active', 'Monitoring', 'Resolved'];

const CATEGORY_SUGGESTIONS = ['Fire', 'Waterlogging', 'Flood', 'Road accident', 'Building collapse', 'Gas leak', 'Power outage', 'Other'];

const severityColors: Record<string, string> = {
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#EF4444',
};

const EMPTY_FORM = {
  title: '',
  category: '',
  severity: 'High' as Incident['severity'],
  status: 'Active',
  description: '',
  latitude: '',
  longitude: '',
  verified: true,
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-2)' } as const;
const inputStyle = { width: '100%', padding: '10px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '14px' } as const;
const buttonStyle = { padding: '8px 14px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' } as const;

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ severity: '', verified: '' });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Incident | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    loadIncidents();
    const interval = setInterval(() => loadIncidents(true), 15000);
    return () => clearInterval(interval);
  }, [filter.severity]);

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

  // The API has no verified filter, so this one is applied to the loaded list.
  const shown = incidents.filter((i) =>
    filter.verified === 'verified' ? i.verifiedBy != null : filter.verified === 'pending' ? i.verifiedBy == null : true,
  );

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { latitude, longitude, verified, ...rest } = formData;
    const lat = latitude.trim();
    const lng = longitude.trim();
    if ((lat === '') !== (lng === '')) {
      alert('Enter both latitude and longitude, or leave both empty.');
      return;
    }
    if (lat !== '' && (!Number.isFinite(Number(lat)) || Math.abs(Number(lat)) > 90 || !Number.isFinite(Number(lng)) || Math.abs(Number(lng)) > 180)) {
      alert('Latitude must be between -90 and 90, and longitude between -180 and 180.');
      return;
    }
    const fields = { ...rest, title: rest.title.trim(), category: rest.category.trim(), description: rest.description.trim() };
    setSaving(true);
    try {
      if (editing) {
        // null clears a previously saved location
        await updateIncident(editing.id, { ...fields, latitude: lat === '' ? null : Number(lat), longitude: lng === '' ? null : Number(lng) });
      } else {
        await createIncident(lat === '' ? { ...fields, verified } : { ...fields, verified, latitude: Number(lat), longitude: Number(lng) });
      }
      closeForm();
      loadIncidents(true);
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (incident: Incident) => {
    setEditing(incident);
    setFormData({
      title: incident.title,
      category: incident.category,
      severity: incident.severity,
      status: incident.status,
      description: incident.description,
      latitude: incident.latitude ? String(Number(incident.latitude)) : '',
      longitude: incident.longitude ? String(Number(incident.longitude)) : '',
      verified: incident.verifiedBy != null,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert('This browser cannot provide your location.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setFormData((f) => ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) })),
      (err) => alert(`Couldn't get your location: ${err.message}`),
    );
  };

  const handleVerify = async (id: number, verified: boolean) => {
    setBusyId(id);
    try {
      await updateIncident(id, { verified });
      await loadIncidents(true);
    } catch (err: any) {
      alert(`Failed to ${verified ? 'verify' : 'update'}: ${err.message}`);
    } finally {
      setBusyId(null);
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

  // Keep an existing free-text status selectable when editing
  const statusOptions = STATUSES.includes(formData.status) ? STATUSES : [formData.status, ...STATUSES];

  return (
    <AdminLayout>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 8px' }}>
              Incidents
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
              Publish and manage public incidents shown on residents' map
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
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
            <select
              value={filter.verified}
              onChange={(e) => setFilter({ ...filter, verified: e.target.value })}
              style={{
                padding: '10px 16px',
                border: '1px solid var(--border-strong)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--surface)',
                color: 'var(--text-2)'
              }}
            >
              <option value="">Verified & pending</option>
              <option value="verified">Verified only</option>
              <option value="pending">Pending only</option>
            </select>
            <button
              onClick={() => {
                setEditing(null);
                setFormData(EMPTY_FORM);
                setShowForm(true);
              }}
              style={{
                padding: '10px 20px',
                background: '#0F766E',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              + New Incident
            </button>
          </div>
        </div>

        {showForm && (
          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--ink)', margin: '0 0 20px' }}>
              {editing ? `Edit Incident #${editing.id}` : 'New Incident'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    minLength={2}
                    placeholder="e.g. Fire near Kafrul Market"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <input
                    type="text"
                    list="incident-categories"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    placeholder="Pick or type a category"
                    style={inputStyle}
                  />
                  <datalist id="incident-categories">
                    {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label style={labelStyle}>Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as Incident['severity'] })}
                    style={inputStyle}
                  >
                    {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={inputStyle}
                  >
                    {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  minLength={10}
                  rows={3}
                  placeholder="What happened, and what residents should do (at least 10 characters)"
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Map location (optional)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Latitude, e.g. 23.8103"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    style={{ ...inputStyle, width: 'auto', flex: '1 1 160px' }}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Longitude, e.g. 90.3681"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    style={{ ...inputStyle, width: 'auto', flex: '1 1 160px' }}
                  />
                  <button
                    type="button"
                    onClick={useMyLocation}
                    style={{ padding: '10px 16px', background: 'var(--btn-bg)', color: 'var(--text-2)', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                  >
                    Use my location
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '8px 0 0' }}>
                  Without a location the incident is listed but has no pin on the residents' map. To find coordinates, right-click the spot on openstreetmap.org or Google Maps and copy them.
                </p>
              </div>
              {!editing && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px', color: 'var(--text-2)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                  />
                  Mark as verified (untick if it still needs confirming)
                </label>
              )}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    background: '#0F766E',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: saving ? 'wait' : 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Publish Incident'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  style={{
                    padding: '10px 20px',
                    background: 'var(--btn-bg)',
                    color: 'var(--text-2)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

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

        {!loading && shown.length === 0 && (
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

        {shown.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {shown.map((incident) => (
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
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-3)' }}>{incident.status}</span>
                      {incident.verifiedBy ? (
                        <span style={{ color: '#10B981', fontWeight: '600', fontSize: '12px' }}>Verified</span>
                      ) : (
                        <span style={{ color: '#F59E0B', fontWeight: '600', fontSize: '12px' }}>Pending verification</span>
                      )}
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-3)', margin: '0 0 10px', lineHeight: '1.5' }}>
                      {incident.description}
                    </p>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                      #{incident.id} • {incident.category} • {incident.wardName || 'No ward'} • {timeAgoWithDate(incident.createdAt)}
                      {hasCoords(incident.latitude, incident.longitude) ? (
                        <>
                          {' • '}
                          <a href={osmLink(incident.latitude!, incident.longitude!)} target="_blank" rel="noreferrer" style={{ color: 'var(--link)', fontWeight: 600 }}>
                            View on map
                          </a>
                        </>
                      ) : (
                        ' • No map location'
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {!incident.verifiedBy && (
                      <button
                        onClick={() => handleVerify(incident.id, true)}
                        disabled={busyId === incident.id}
                        style={{ ...buttonStyle, background: '#10B981', color: 'white', cursor: busyId === incident.id ? 'wait' : 'pointer' }}
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(incident)}
                      style={{ ...buttonStyle, background: 'var(--btn-bg)', color: 'var(--text-2)' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(incident.id)}
                      style={{ ...buttonStyle, background: 'var(--danger-bg-2)', color: 'var(--danger-text)' }}
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
