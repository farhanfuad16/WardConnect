import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getNotices, createNotice, updateNotice, deleteNotice } from '../lib/api';

interface Notice {
  id: number;
  title: string;
  body: string;
  category: string;
  authorName: string;
  createdAt: string;
}

const categoryColors: Record<string, string> = {
  general: '#3B82F6',
  emergency: '#EF4444',
  event: '#10B981',
  update: '#F59E0B',
  alert: '#8B5CF6',
};

export default function Notices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [formData, setFormData] = useState({ title: '', body: '', category: 'general' });
  const [filter, setFilter] = useState({ category: '' });

  useEffect(() => {
    loadNotices();
  }, [filter]);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (filter.category) params.category = filter.category;
      const data = await getNotices(params) as { notices: Notice[] };
      setNotices(data.notices || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateNotice(editing.id, formData);
      } else {
        await createNotice(formData);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ title: '', body: '', category: 'general' });
      loadNotices();
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditing(notice);
    setFormData({ title: notice.title, body: notice.body, category: notice.category });
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
    setFormData({ title: '', body: '', category: 'general' });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#102A2A', margin: '0 0 8px' }}>
              Notices
            </h1>
            <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
              Manage community notices and announcements
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              style={{
                padding: '10px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white',
                color: '#374151'
              }}
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="emergency">Emergency</option>
              <option value="event">Event</option>
              <option value="update">Update</option>
              <option value="alert">Alert</option>
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
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#102A2A', margin: '0 0 20px' }}>
              {editing ? 'Edit Notice' : 'New Notice'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
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
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="general">General</option>
                  <option value="emergency">Emergency</option>
                  <option value="event">Event</option>
                  <option value="update">Update</option>
                  <option value="alert">Alert</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
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
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
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
                    background: '#F3F4F6',
                    color: '#374151',
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
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
            Loading notices...
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
              onClick={loadNotices}
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
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{ color: '#64748B', fontSize: '16px' }}>No notices found</p>
          </div>
        )}

        {notices.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notices.map((notice) => (
              <div
                key={notice.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#102A2A', margin: 0 }}>
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
                    <p style={{ fontSize: '14px', color: '#4B5563', margin: '0 0 12px', lineHeight: '1.5' }}>
                      {notice.body}
                    </p>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                      By {notice.authorName} • {new Date(notice.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    <button
                      onClick={() => handleEdit(notice)}
                      style={{
                        padding: '6px 12px',
                        background: '#EFF6FF',
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
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}