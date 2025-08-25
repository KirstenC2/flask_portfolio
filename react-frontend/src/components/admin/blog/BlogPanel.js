import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5001' });

function TagsPills({ tags }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div style={{ marginTop: '0.25rem' }}>
      {tags.map((t, i) => (
        <span key={i} style={{ marginRight: 6, background: '#eef2f7', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{t}</span>
      ))}
    </div>
  );
}

export default function BlogPanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const emptyForm = useMemo(() => ({ id: null, title: '', slug: '', tags: '', content_md: '' }), []);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const authHeader = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
    };

  const loadPosts = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/api/posts');
      setPosts(res.data || []);
    } catch (e) {
      console.error(e);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editingId) {
        await api.put(`/api/admin/posts/${editingId}`, {
          title: form.title,
          slug: form.slug || undefined,
          tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
          content_md: form.content_md,
        }, { headers: authHeader() });
      } else {
        await api.post('/api/admin/posts', {
          title: form.title,
          slug: form.slug || undefined,
          tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
          content_md: form.content_md,
        }, { headers: authHeader() });
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadPosts();
    } catch (e) {
      console.error(e);
      setError('Save failed');
    }
  };

  const onEdit = (p) => {
    setEditingId(p.id);
    setForm({
      id: p.id,
      title: p.title || '',
      slug: p.slug || '',
      tags: (p.tags || []).join(', '),
      content_md: p.content_md || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/api/admin/posts/${id}`, { headers: authHeader() });
      await loadPosts();
    } catch (e) {
      console.error(e);
      setError('Delete failed');
    }
  };

  const onImportMd = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      setForm(f => ({ ...f, content_md: text }));
    } catch (e) {
      console.error(e);
      setError('Failed to read file');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 8 }}>{editingId ? 'Edit Post' : 'New Post'}</h2>
        {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <label>Title</label>
            <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <label>Slug (optional)</label>
            <input className="form-control" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
          </div>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <label>Tags (comma separated)</label>
            <input className="form-control" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          </div>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <label>Content (Markdown)</label>
            <textarea className="form-control" rows={10} value={form.content_md} onChange={e => setForm(f => ({ ...f, content_md: e.target.value }))} />
          </div>
          <div>
            <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'}</button>
            <label className="btn" style={{ marginLeft: 8 }}>
              Import .md
              <input type="file" accept=".md,text/markdown,text/plain" style={{ display: 'none' }} onChange={e => onImportMd(e.target.files && e.target.files[0])} />
            </label>
            <a className="btn" style={{ marginLeft: 8 }} href="/admin/blog/new">Open advanced editor</a>
            {editingId && (
              <button type="button" className="btn" style={{ marginLeft: 8 }} onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h2>All Posts</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Title</th>
                <th>Slug</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '8px 4px' }}>
                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                    <TagsPills tags={p.tags} />
                  </td>
                  <td style={{ textAlign: 'center' }}>{p.slug}</td>
                  <td style={{ textAlign: 'center' }}>{p.created_at ? new Date(p.created_at).toLocaleString() : ''}</td>
                  <td style={{ textAlign: 'center' }}>{p.updated_at ? new Date(p.updated_at).toLocaleString() : ''}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn" onClick={() => onEdit(p)}>Edit</button>
                    <button className="btn btn-danger" style={{ marginLeft: 6 }} onClick={() => onDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 16 }}>No posts yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
