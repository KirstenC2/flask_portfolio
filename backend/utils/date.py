
def _parse_dt(val):
    if not val:
        return None
    from datetime import datetime
    try:
        return datetime.fromisoformat(val)
    except ValueError:
        try:
            return datetime.strptime(val, '%Y-%m-%d')
        except Exception:
            return None