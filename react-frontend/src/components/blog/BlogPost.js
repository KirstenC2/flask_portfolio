import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { marked } from 'marked';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // 你原本代碼漏掉這個 state 定義
  const [password, setPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const api = useMemo(() => axios.create({ 
    baseURL: 'http://localhost:5001', 
    withCredentials: true 
  }), []);
  const renderContent = (content) => {
      if (!content) return '';
      
      // 簡單判斷：如果包含典型的 HTML 標籤，視為 HTML
      // 否則，使用 marked 轉換（marked 也能處理混雜的 HTML）
      const isHtml = /<[a-z][\s\S]*>/i.test(content);
      
      return isHtml ? content : marked.parse(content);
    };
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

  if (loading) return <div className="container" style={{ padding: '5rem 1.5rem' }}><p>Loading...</p></div>;
  if (!post) return <div className="container" style={{ padding: '5rem 1.5rem' }}><p>Post not found.</p></div>;

  return (
    <div className="container" style={{ padding: '5rem 1.5rem' }}>
      <Link to="/blog">← Back to Blog</Link>
      <h1 style={{ marginTop: '0.5rem' }}>{post.title}</h1>
      <small style={{ color: '#666' }}>{post.updated_at ? new Date(post.updated_at).toLocaleString() : ''}</small>
      
      {/* Tags 展示 */}
      {post.tags && post.tags.length > 0 && (
        <div className="tags" style={{ marginTop: '0.5rem' }}>
          {post.tags.map((t, idx) => (
            <span key={idx} className="tag-chip">{t}</span>
          ))}
        </div>
      )}

      {locked ? (
        <form onSubmit={handleUnlock}>{/* ... 密碼解鎖表單 ... */}</form>
      ) : (
        <div 
          className="markdown-body" // 建議加入這個 class 以便套用 github-markdown-css
          style={{ marginTop: '1rem' }} 
          dangerouslySetInnerHTML={{ __html: renderContent(post.content_html || post.content_markdown) }} 
        />
      )}
    </div>
  );
}