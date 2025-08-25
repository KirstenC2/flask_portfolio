import os
import re
from flask import Blueprint, request, jsonify, session
from models import db, Post, Admin
from routers.admin import token_required
from datetime import datetime

# Optional markdown + sanitization
try:
    import markdown as md
    import bleach
except Exception:  # packages may not yet be installed during first run
    md = None
    bleach = None

blog_bp = Blueprint('blog', __name__)


def slugify(title: str) -> str:
    s = re.sub(r'[^a-zA-Z0-9\s-]', '', (title or '').strip()).lower()
    s = re.sub(r'\s+', '-', s)
    s = re.sub(r'-+', '-', s)
    return s or 'post'


def render_markdown_safe(text: str) -> str:
    if not text:
        return ''
    html = md.markdown(text, extensions=['extra', 'toc', 'sane_lists']) if md else text
    if bleach:
        allowed_tags = bleach.sanitizer.ALLOWED_TAGS.union({
            'p', 'pre', 'code', 'blockquote', 'hr', 'br',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
            'strong', 'em', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
        })
        allowed_attrs = {**bleach.sanitizer.ALLOWED_ATTRIBUTES}
        allowed_attrs.update({'a': ['href', 'title', 'name', 'target', 'rel'], 'img': ['src', 'alt', 'title']})
        html = bleach.clean(html, tags=allowed_tags, attributes=allowed_attrs)
        html = bleach.linkify(html)
    return html


def is_protected(p: Post) -> bool:
    tags = [t.strip().lower() for t in (p.tags.split(',') if p.tags else [])]
    return 'hidden' in tags


def is_unlocked(slug: str) -> bool:
    unlocked = session.get('unlocked_posts') or []
    return slug in unlocked


def post_to_dict(p: Post, redact: bool = False):
    data = {
        'id': p.id,
        'title': p.title,
        'slug': p.slug,
        'tags': p.tags.split(',') if p.tags else [],
        'created_at': p.created_at.isoformat() if p.created_at else None,
        'updated_at': p.updated_at.isoformat() if p.updated_at else None,
        'protected': is_protected(p),
    }
    if redact:
        data.update({'content_md': None, 'content_html': None})
    else:
        data.update({'content_md': p.content_md, 'content_html': p.content_html})
    return data


# Public endpoints
@blog_bp.route('/api/posts', methods=['GET'])
def list_posts():
    q = Post.query.order_by(Post.created_at.desc()).all()
    items = []
    for p in q:
        redact = is_protected(p) and not is_unlocked(p.slug)
        items.append(post_to_dict(p, redact=redact))
    return jsonify(items)


@blog_bp.route('/api/posts/<path:slug_or_id>', methods=['GET'])
def get_post(slug_or_id):
    post = None
    if str(slug_or_id).isdigit():
        post = Post.query.get(int(slug_or_id))
    if not post:
        post = Post.query.filter_by(slug=slug_or_id).first()
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    redact = is_protected(post) and not is_unlocked(post.slug)
    return jsonify(post_to_dict(post, redact=redact))


@blog_bp.route('/api/posts/<path:slug_or_id>/unlock', methods=['POST'])
def unlock_post(slug_or_id):
    """Unlock a protected post if password matches BLOG_PROTECT_PASSWORD.
    Stores unlocked slug in cookie session.
    """
    post = None
    if str(slug_or_id).isdigit():
        post = Post.query.get(int(slug_or_id))
    if not post:
        post = Post.query.filter_by(slug=slug_or_id).first()
    if not post:
        return jsonify({'message': 'Post not found'}), 404

    if not is_protected(post):
        return jsonify({'message': 'Post is not protected', 'unlocked': True})

    data = request.get_json(silent=True) or {}
    password = (data.get('password') or '').strip()
    # Validate against admin user's password
    admin = Admin.query.first()
    if admin and admin.check_password(password):
        unlocked = session.get('unlocked_posts') or []
        if post.slug not in unlocked:
            unlocked.append(post.slug)
        session['unlocked_posts'] = unlocked
        return jsonify({'unlocked': True})
    return jsonify({'unlocked': False, 'message': 'Invalid password'}), 401


# Admin endpoints
@blog_bp.route('/api/admin/posts', methods=['POST', 'OPTIONS'])
@token_required
def create_post(current_admin):
    data = request.get_json(force=True) or {}
    title = (data.get('title') or '').strip()
    content_md = data.get('content_md') or ''
    tags = data.get('tags')
    if isinstance(tags, list):
        tags = ','.join([t.strip() for t in tags if t and isinstance(t, str)])
    slug = (data.get('slug') or '').strip() or slugify(title)

    html = render_markdown_safe(content_md)

    p = Post(title=title, slug=slug, content_md=content_md, content_html=html, tags=tags)
    db.session.add(p)
    db.session.commit()
    return jsonify(post_to_dict(p)), 201


@blog_bp.route('/api/admin/posts/<int:post_id>', methods=['PUT', 'OPTIONS'])
@token_required
def update_post(current_admin, post_id):
    p = Post.query.get_or_404(post_id)
    data = request.get_json(force=True) or {}

    if 'title' in data:
        p.title = (data.get('title') or '').strip()
    if 'slug' in data:
        new_slug = (data.get('slug') or '').strip()
        if new_slug:
            p.slug = new_slug
    if 'content_md' in data:
        p.content_md = data.get('content_md') or ''
        p.content_html = render_markdown_safe(p.content_md)
    if 'tags' in data:
        tags = data.get('tags')
        if isinstance(tags, list):
            tags = ','.join([t.strip() for t in tags if t and isinstance(t, str)])
        p.tags = tags

    p.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(post_to_dict(p))


@blog_bp.route('/api/admin/posts/<int:post_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_post(current_admin, post_id):
    p = Post.query.get_or_404(post_id)
    db.session.delete(p)
    db.session.commit()
    return jsonify({'message': 'Post deleted'})
