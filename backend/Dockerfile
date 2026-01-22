FROM python:3.9-slim

WORKDIR /app

# Install dependencies directly (since requirements.txt might not be in backend dir)
# Include psycopg2-binary for PostgreSQL connectivity
RUN pip install --no-cache-dir \
    flask==2.3.3 \
    python-dotenv==1.0.0 \
    flask-sqlalchemy==3.1.1 \
    flask-cors==4.0.0 \
    pyjwt==2.8.0 \
    werkzeug==2.3.7 \
    psycopg2-binary==2.9.9 \
    minio==7.0.0

# Copy the application code
COPY . .

# Create instance directory and set permissions
RUN mkdir -p /app/instance && \
    chmod 777 /app/instance

EXPOSE 5001

ENV FLASK_APP=app.py
# Use Gunicorn to run the 'app' object inside 'app.py' on port 5001
CMD ["gunicorn", "-b", "0.0.0.0:5001", "app:app"]
