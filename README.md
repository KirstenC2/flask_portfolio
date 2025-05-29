# Portfolio Website

A modern portfolio website with a React frontend and Flask API backend. This application showcases projects, skills, and study progress in a responsive, user-friendly interface.

## Project Structure
```
project_root/
├── backend/                      # Flask API backend
│   ├── app.py                    # API routes and main application
│   └── models.py                 # Database models
├── react-frontend/              # React frontend application
│   ├── public/                   # Public assets
│   └── src/                      # Source code
│       ├── components/           # React components
│       │   ├── layout/           # Layout components (Navbar, Footer)
│       │   ├── pages/            # Page components
│       │   ├── projects/         # Project-related components
│       │   ├── skills/           # Skills-related components
│       │   └── studies/          # Study-related components
│       ├── App.js                # Main React application
│       └── index.js              # React entry point
└── start_portfolio.sh            # Helper script to run both frontend and backend
```

## Setup

### Prerequisites

- Docker and Docker Compose (for containerized deployment)
- Alternatively: Node.js, npm, Python 3.x (for local development)

### Running with Docker (Recommended)

1. Build and start the containers using Docker Compose:
   ```bash
   docker-compose up --build
   ```

2. Open your browser and go to:
   ```
   http://localhost
   ```

3. To stop the containers:
   ```bash
   docker-compose down
   ```

### Running Locally (Development)

1. Install the required packages for the backend:
   ```bash
   cd backend
   pip3 install flask flask-sqlalchemy flask-cors
   ```

2. Install the required packages for the frontend:
   ```bash
   cd react-frontend
   npm install
   ```

3. Use the provided script to run both frontend and backend:
   ```bash
   chmod +x start_portfolio.sh
   ./start_portfolio.sh
   ```

4. Alternatively, you can run them separately:
   - Backend: 
     ```bash
     cd backend
     python3 app.py
     ```
   - Frontend: 
     ```bash
     cd react-frontend
     npm start
     ```

5. Open your browser and go to:
   ```
   http://localhost:3000/
   ```

## Features
- Modern single-page application (SPA) architecture
- Responsive design with clean, professional styling
- Project showcase with detailed project information
- Skills section highlighting technical abilities
- Study progress tracking with detailed learning journey
- Contact form and personal information
- RESTful API backend for data management
