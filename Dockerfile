FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .

# 🛠️ FIX 1: Explicitly install gunicorn along with requirements
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

EXPOSE 5001

# 🛠️ FIX 2: Run with Gunicorn on port 5001 instead of python dev server
# Ensure your python file is named 'main.py'. If it is 'app.py', change main:app to app:app
CMD ["gunicorn", "-b", "0.0.0.0:5001", "main:app"]