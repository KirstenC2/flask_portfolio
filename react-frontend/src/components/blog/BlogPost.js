import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useMemo(() => axios.create({ baseURL: 'http://localhost:5001' }), []);

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
      <div style={{ marginTop: '1rem' }} dangerouslySetInnerHTML={{ __html: post.content_html || '' }} />
    </div>
  );
}
