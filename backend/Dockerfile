FROM python:3.9-slim

WORKDIR /app

COPY . .

# Create instance directory and set permissions
RUN mkdir -p /app/instance && \
    chmod 777 /app/instance

RUN pip install --no-cache-dir flask flask-sqlalchemy flask-cors

EXPOSE 5001

CMD ["python", "app.py"]
