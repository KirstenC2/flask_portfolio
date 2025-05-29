# Flask Project

A simple Flask web application with basic routing and templates.

## Project Structure
```
project_root/
├── app.py              # Main application file
├── requirements.txt    # Dependencies
├── Dockerfile          # Docker configuration
├── .dockerignore       # Files to exclude from Docker image
├── static/             # Static files (CSS, JS, images)
│   └── css/
│       └── style.css   # CSS styles
└── templates/          # HTML templates
    ├── index.html      # Home page
    └── about.html      # About page
```

## Setup

### Running Locally

1. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

2. Run the application:
   ```
   python app.py
   ```

3. Open your browser and go to:
   ```
   http://127.0.0.1:5000/
   ```

### Running with Docker

1. Build the Docker image:
   ```
   docker build -t flask-app .
   ```

2. Run the container:
   ```
   docker run -p 5000:5000 flask-app
   ```

3. Open your browser and go to:
   ```
   http://localhost:5000/
   ```

## Features
- Simple navigation between Home and About pages
- Responsive design with basic CSS styling
- Docker containerization for easy deployment
