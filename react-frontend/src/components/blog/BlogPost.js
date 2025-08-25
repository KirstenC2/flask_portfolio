import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useMemo(() => axios.create({ baseURL: 'http://localhost:5001', withCredentials: true }), []);
  const [unlocking, setUnlocking] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/api/posts/${encodeURIComponent(slug)}`);
        setPost(res.data);
      } catch (e) {
        console.error('Failed to load post', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug, api]);

  if (loading) return <div className="container" style={{ padding: '5rem 1.5rem' }}><p>Loading...</p></div>;
  if (!post) return <div className="container" style={{ padding: '5rem 1.5rem' }}><p>Post not found.</p></div>;

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError('');
    setUnlocking(true);
    try {
      const res = await api.post(`/api/posts/${encodeURIComponent(slug)}/unlock`, { password });
      if (res.data && res.data.unlocked) {
        // refetch post
        const p = await api.get(`/api/posts/${encodeURIComponent(slug)}`);
        setPost(p.data);
      } else {
        setError((res.data && res.data.message) || 'Failed to unlock');
      }
    } catch (err) {
      setError((err.response && err.response.data && err.response.data.message) || 'Failed to unlock');
    } finally {
      setUnlocking(false);
    }
  };

  const locked = post && post.protected && !post.content_html;

  return (
    <div className="container" style={{ padding: '5rem 1.5rem' }}>
      <Link to="/blog">← Back to Blog</Link>
      <h1 style={{ marginTop: '0.5rem' }}>{post.title}</h1>
      <small style={{ color: '#666' }}>{post.updated_at ? new Date(post.updated_at).toLocaleString() : ''}</small>
      {post.tags && post.tags.length > 0 && (
        <div className="tags" style={{ marginTop: '0.5rem' }}>
          {post.tags.map((t, idx) => (
            <span key={idx} className="tag-chip">{t}</span>
          ))}
        </div>
      )}
      {locked ? (
        <form onSubmit={handleUnlock} style={{ marginTop: '1rem' }}>
          <p>This post is protected. Enter the password to view it.</p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <button type="submit" disabled={unlocking} className="filter-chip" style={{ padding: '8px 14px' }}>
              {unlocking ? 'Unlocking…' : 'Unlock'}
            </button>
          </div>
          {error && <p style={{ color: '#b91c1c', marginTop: '8px' }}>{error}</p>}
        </form>
      ) : (
        <div style={{ marginTop: '1rem' }} dangerouslySetInnerHTML={{ __html: post.content_html || '' }} />
      )}
    </div>
  );
}
