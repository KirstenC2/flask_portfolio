import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Blog.css';

export default function BlogList({ selectedSlug }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useMemo(() => axios.create({ baseURL: 'http://localhost:5001', withCredentials: true }), []);
  const [activeTag, setActiveTag] = useState('All');
  const [query, setQuery] = useState('');

  const allTags = useMemo(() => {
    const set = new Set();
    posts.forEach(p => (p.tags || []).forEach(t => set.add(t)));
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [posts]);

  const filtered = useMemo(() => {
    let list = posts;
    if (activeTag !== 'All') {
      list = list.filter(p => (p.tags || []).includes(activeTag));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(p => {
        const title = (p.title || '').toLowerCase();
        const tags = (p.tags || []).join(' ').toLowerCase();
        const content = (p.content_md || '').toLowerCase();
        return title.includes(q) || tags.includes(q) || content.includes(q);
      });
    }
    return list;
  }, [posts, activeTag, query]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get('/api/posts');
        setPosts(res.data || []);
      } catch (e) {
        console.error('Failed to load posts', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [api]);

  // Auto-scroll selected card into view when slug changes or after filtering
  useEffect(() => {
    if (!selectedSlug) return;
    const el = document.querySelector(`.blog-card[data-slug="${CSS.escape(selectedSlug)}"]`);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [selectedSlug, filtered]);

  if (loading) return <div className="container" style={{ padding: '5rem 1.5rem' }}><p>Loading posts...</p></div>;

  return (
    <div className="container" style={{ padding: '5rem 1.5rem' }}>
      <h1>Blog</h1>
      {/* Filter/Search Bar */}
      <div className="filter-bar" role="tablist" aria-label="Filter posts by tag">
        {allTags.map(tag => (
          <button
            key={tag}
            className={`filter-chip ${activeTag === tag ? 'active' : ''}`}
            onClick={() => setActiveTag(tag)}
            role="tab"
            aria-selected={activeTag === tag}
          >
            {tag}
          </button>
        ))}
        <input
          type="search"
          className="search-input"
          placeholder="Search posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search posts"
        />
      </div>
      {filtered.length === 0 && <p>No posts for this tag.</p>}
      <div className="blog-grid">
        {filtered.map(p => (
          <article
            key={p.id}
            className={`blog-card ${selectedSlug === p.slug ? 'selected' : ''}`}
            data-slug={p.slug}
          >
            <h2>
              <Link to={`/blog/${p.slug}`}>{p.title}</Link>
            </h2>
            <div className="meta">
              {p.created_at && <span className="date-badge">{new Date(p.created_at).toLocaleDateString()}</span>}
            </div>
            {/* Excerpt
            {(
              p.excerpt || (p.content_md ? p.content_md.replace(/[#>*_`\-\[\]]/g, '').slice(0, 160) + (p.content_md.length > 160 ? '…' : '') : '')
            ) && (
              // <p style={{ margin: '6px 0 0 0', color: '#374151' }}>
              //   {p.excerpt || (p.content_md ? p.content_md.replace(/[#>*_`\-\[\]]/g, '').slice(0, 160) + (p.content_md.length > 160 ? '…' : '') : '')}
              // </p>
            )} */}
            {p.tags && p.tags.length > 0 && (
              <div className="tags">
                {p.tags.map((t, idx) => (
                  <span key={idx} className="tag-chip">{t}</span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
