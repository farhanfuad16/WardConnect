import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getNotices, createNotice, updateNotice, deleteNotice, getWards } from '../lib/api';
import { timeAgoWithDate } from '../lib/time';

interface Notice {
  id: number;
  title: string;
  body: string;
  category: string;
  authorName: string;
  createdAt: string;
  allWards?: boolean;
  wards?: { id: number; name: string }[];
}

// Must match the server's exact enum (server/routes/notices.ts) — the
// mobile app's category badges/colors use the same three values too.
const CATEGORIES = ['General Notice', 'Utility Notice', 'Emergency Alert'];

const categoryColors: Record<string, string> = {
  'General Notice': '#3B82F6',
  'Utility Notice': '#F59E0B',
  'Emergency Alert': '#EF4444',
};

export default function Notices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [formData, setFormData] = useState({ title: '', body: '', category: 'General Notice' });
  const [filter, setFilter] = useState({ category: '' });
  const [wards, setWards] = useState<{ id: number; name: string }[]>([]);
  const [allWards, setAllWards] = useState(false);
  const [selectedWardIds, setSelectedWardIds] = useState<number[]>([]);
  const [wardMenuOpen, setWardMenuOpen] = useState(false);

  useEffect(() => {
    loadNotices();
    getWards().then((data: any) => setWards(data.wards || [])).catch((err: any) => setError(err.message || 'Failed to load wards'));
    const interval = setInterval(() => loadNotices(true), 15000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadNotices = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params: any = { limit: 50 };
      if (filter.category) params.category = filter.category;
      const data = await getNotices(params) as { notices: Notice[] };
      setNotices(data.notices || []);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load notices');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!allWards && selectedWardIds.length === 0) {
        alert('Choose at least one ward, or send to all wards.');
        return;
      }
      const targeting = { allWards, wardIds: allWards ? [] : selectedWardIds };
      if (editing) {
        await updateNotice(editing.id, { ...formData, ...targeting });
      } else {
        await createNotice({ ...formData, ...targeting });
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ title: '', body: '', category: 'General Notice' });
      setAllWards(false);
      setSelectedWardIds([]);
      setWardMenuOpen(false);
      loadNotices();
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditing(notice);
    setFormData({ title: notice.title, body: notice.body, category: notice.category });
    setAllWards(notice.allWards !== false);
    setSelectedWardIds(notice.wards?.map((ward) => ward.id) || []);
    setWardMenuOpen(false);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await deleteNotice(id);
      loadNotices();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setFormData({ title: '', body: '', category: 'General Notice' });
    setAllWards(false);
    setSelectedWardIds([]);
    setWardMenuOpen(false);
  };

  return (
    <AdminLayout>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 8px' }}>
              Notices
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
              Manage community notices and announcements
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              style={{
                padding: '10px 16px',
                border: '1px solid var(--border-strong)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--surface)',
                color: 'var(--text-2)'
              }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={() => setShowForm(true)}
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
              + New Notice
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
              {editing ? 'Edit Notice' : 'New Notice'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-2)' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-2)' }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-2)' }}>
                  Content
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              {!allWards && (
                <div style={{ position: 'relative', marginTop: '-8px', marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-2)' }}>
                    Select wards
                  </label>
                  <button
                    type="button"
                    onClick={() => setWardMenuOpen((open) => !open)}
                    style={{ width: '100%', minHeight: '42px', padding: '8px 12px', border: '1px solid var(--border-strong)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text-2)', textAlign: 'left', cursor: 'pointer' }}
                  >
                    {selectedWardIds.length === 0 ? 'Choose wards' : (
                      <span style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {selectedWardIds.map((id) => {
                          const ward = wards.find((item) => item.id === id);
                          return ward ? (
                            <span key={ward.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '12px', background: 'var(--btn-bg)', fontSize: '12px' }}>
                              {ward.name}<span aria-hidden="true">×</span>
                            </span>
                          ) : null;
                        })}
                      </span>
                    )}
                  </button>
                  {wardMenuOpen && (
                    <div style={{ position: 'absolute', zIndex: 10, left: 0, right: 0, top: '74px', maxHeight: '190px', overflowY: 'auto', padding: '6px', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '8px', boxShadow: '0 6px 18px rgba(0, 0, 0, 0.15)' }}>
                      {wards.map((ward) => {
                        const selected = selectedWardIds.includes(ward.id);
                        return (
                          <button
                            type="button"
                            key={ward.id}
                            onClick={() => setSelectedWardIds((ids) => selected ? ids.filter((id) => id !== ward.id) : [...ids, ward.id])}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 10px', border: 'none', borderRadius: '6px', background: selected ? 'var(--btn-bg)' : 'transparent', color: 'var(--text-2)', textAlign: 'left', cursor: 'pointer' }}
                          >
                            {ward.name}<span aria-hidden="true">{selected ? '×' : '+'}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p style={{ color: 'var(--muted)', fontSize: '12px', margin: '6px 0 0' }}>Choose one or more wards.</p>
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px', color: 'var(--text-2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={allWards} onChange={(e) => setAllWards(e.target.checked)} />
                Send to all wards
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
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
                  {editing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '10px 20px',
                    background: 'var(--btn-bg)',
                    color: 'var(--text-2)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
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
            Loading notices...
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
              onClick={() => loadNotices()}
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

        {!loading && notices.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            background: 'var(--surface)',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{ color: 'var(--muted)', fontSize: '16px' }}>No notices found</p>
          </div>
        )}

        {notices.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notices.map((notice) => (
              <div
                key={notice.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--ink)', margin: 0 }}>
                        {notice.title}
                      </h3>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        background: `${categoryColors[notice.category] || '#94A3B8'}20`,
                        color: categoryColors[notice.category] || '#94A3B8'
                      }}>
                        {notice.category}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-3)', margin: '0 0 12px', lineHeight: '1.5' }}>
                      {notice.body}
                    </p>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                      By {notice.authorName} • {timeAgoWithDate(notice.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(notice)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--info-bg)',
                        color: '#3B82F6',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(notice.id)}
                      style={{
                        padding: '6px 12px',
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