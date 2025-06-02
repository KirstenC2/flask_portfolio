# Portfolio Website

A modern portfolio website with a React frontend and Flask API backend. This application showcases projects, skills, education history, work experience, and study progress in a responsive, user-friendly interface with a comprehensive admin panel for content management.

## Table of Contents
- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Docker Deployment](#docker-deployment)
  - [Local Development](#local-development)
- [Admin Panel](#admin-panel)
- [Database](#database)
- [API Documentation](#api-documentation)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Project Overview

This portfolio website is designed to showcase your professional profile, including projects, skills, educational background, work experience, and ongoing learning journey. The application features both a public-facing frontend for visitors and a secure admin panel for managing all content.

## Technology Stack

### Frontend
- **React**: Modern JavaScript library for building user interfaces
- **React Router**: For client-side routing
- **Axios**: Promise-based HTTP client for API requests
- **FontAwesome**: For icons and visual elements
- **CSS3**: Custom styling with responsive design principles

### Backend
- **Flask**: Lightweight Python web framework
- **SQLAlchemy**: SQL toolkit and Object-Relational Mapping (ORM)
- **SQLite**: Database for persistent storage
- **Flask-CORS**: Cross-Origin Resource Sharing support
- **PyJWT**: JSON Web Token implementation for secure authentication

### Deployment
- **Docker**: Containerization for consistent deployment
- **Docker Compose**: Multi-container application orchestration

## Project Structure

```
project_root/
├── backend/                     # Flask API backend
│   ├── app.py                   # API routes and main application
│   ├── models.py                # Database models and schema definitions
│   ├── instance/                # SQLite database storage (auto-created)
│   │   └── portfolio.db         # SQLite database file
│   └── requirements.txt         # Python dependencies
│
├── react-frontend/             # React frontend application
│   ├── public/                  # Public assets
│   │   ├── index.html          # HTML entry point
│   │   └── assets/             # Static assets (images, fonts, etc.)
│   ├── src/                     # Source code
│   │   ├── components/          # React components
│   │   │   ├── layout/          # Layout components
│   │   │   │   ├── Navbar.js    # Site navigation
│   │   │   │   └── Footer.js    # Site footer
│   │   │   ├── pages/           # Main page components
│   │   │   │   ├── Home.js      # Homepage
│   │   │   │   ├── About.js     # About page
│   │   │   │   └── Contact.js   # Contact page
│   │   │   ├── projects/        # Project-related components
│   │   │   ├── skills/          # Skills-related components
│   │   │   ├── studies/         # Study-related components
│   │   │   ├── admin/           # Admin panel components
│   │   │   │   ├── dashboard/   # Admin dashboard
│   │   │   │   ├── auth/        # Authentication components
│   │   │   │   ├── projects/    # Project management
│   │   │   │   ├── skills/      # Skills management
│   │   │   │   ├── education/   # Education management
│   │   │   │   ├── experience/  # Experience management
│   │   │   │   ├── studies/     # Studies management
│   │   │   │   └── messages/    # Contact message management
│   │   ├── services/           # API service connections
│   │   ├── contexts/           # React contexts for state management
│   │   ├── utils/              # Utility functions
│   │   ├── App.js              # Main React application
│   │   ├── index.js            # React entry point
│   │   └── App.css             # Global styling
│   ├── package.json            # NPM dependencies and scripts
│   └── README.md               # Frontend documentation
│
├── docker-compose.yml          # Docker Compose configuration
├── Dockerfile.backend          # Backend Docker configuration
├── Dockerfile.frontend         # Frontend Docker configuration
├── .env                        # Environment variables (create this manually)
├── start_portfolio.sh          # Helper script to run both frontend and backend
└── README.md                   # This documentation
```

## Features

### Public Frontend
- **Responsive Design**: Mobile-first design that works on all devices
- **Modern UI/UX**: Clean, professional styling with intuitive navigation
- **Project Showcase**: Detailed portfolio of projects with descriptions, technologies, links, and images
- **Skills Section**: Visual representation of technical skills with proficiency levels
- **Education History**: Comprehensive educational background including degrees, institutions, and achievements
- **Work Experience**: Timeline of professional experience with role descriptions and accomplishments
- **Study Progress**: Learning journey tracking with course completion status and certifications
- **Contact Form**: Direct messaging capability with form validation
- **Dark/Light Mode**: (Optional) Theme toggle for user preference

### Admin Panel
- **Secure Authentication**: JWT-based login system for administrative access
- **Dashboard Overview**: Quick statistics and recent activity summary
- **Content Management**: Complete CRUD operations for all website sections:
  - Projects management
  - Skills management
  - Education management with courses, final year project, and internship details
  - Work experience management with reordering capability
  - Studies/learning management with progress tracking
  - Messages management with read/unread status
- **Rich Text Editing**: (Optional) WYSIWYG editor for content formatting
- **Image Upload**: Support for project and profile images
- **Order Management**: Drag-and-drop interface to reorder content items

### Backend API
- **RESTful Architecture**: Well-organized API endpoints following REST principles
- **Token Authentication**: Secure routes for admin operations
- **Data Validation**: Input validation and error handling
- **Database Management**: Efficient ORM-based data access and manipulation

## Setup Instructions

### Prerequisites

- **For Docker Deployment**:
  - Docker and Docker Compose installed
  - 2GB+ RAM available for containers

- **For Local Development**:
  - Node.js (v14+) and npm (v6+)
  - Python 3.8+ with pip
  - Git (for version control)

### Docker Deployment

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/portfolio-website.git
   cd portfolio-website
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   APP_SECRET_KEY=your_secure_secret_key_here
   ADMIN_USERNAME=desired_admin_username
   ADMIN_EMAIL=your@email.com
   ADMIN_PASSWORD=secure_admin_password
   ```

3. Build and start the containers:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost
   - Admin Panel: http://localhost/admin

5. To stop the containers:
   ```bash
   docker-compose down
   ```

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/portfolio-website.git
   cd portfolio-website
   ```

2. Set up the backend:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the backend directory with your configuration variables:
   ```
   APP_SECRET_KEY=your_secure_secret_key_here
   ```

4. Set up the frontend:
   ```bash
   cd ../react-frontend
   npm install
   ```

5. Run both services:
   - Using the helper script:
     ```bash
     cd ..
     chmod +x start_portfolio.sh
     ./start_portfolio.sh
     ```
   - Or run them separately:
     - Backend:
       ```bash
       cd backend
       python app.py
       ```
     - Frontend:
       ```bash
       cd react-frontend
       npm start
       ```

6. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001
   - Admin Panel: http://localhost:3000/admin

## Admin Panel

### Initial Setup

On first run, the application will create an admin account if one doesn't exist:

1. For Docker deployment, use the credentials specified in your `.env` file
2. For local development without a `.env` file, a default admin account will be created:
   - Username: admin
   - Password: adminpass

### Accessing the Admin Panel

1. Navigate to `/admin` (e.g., http://localhost:3000/admin)
2. Login with your admin credentials
3. You'll be redirected to the admin dashboard

### Admin Features

- **Dashboard**: Overview of site statistics and quick actions
- **Projects Management**: Add, edit, delete, and reorder portfolio projects
- **Skills Management**: Manage technical skills with proficiency levels
- **Education Management**: 
  - Add/edit education history with institution, degree, and dates
  - Add courses attended during each education period
  - Include final year project details (title and description)
  - Document internships invited by professors
- **Experience Management**: Track and organize work history with detailed descriptions
- **Studies Management**: Track learning progress, courses, certifications, and resources
- **Messages**: View and manage contact form submissions

## Database

The application uses SQLite for data storage with SQLAlchemy as the ORM layer.

### Models

- **Admin**: Admin user accounts with secure password hashing
- **Project**: Portfolio projects with title, description, technologies, links, etc.
- **Skill**: Technical skills with name, category, and proficiency level
- **Education**: Educational background with institution, degree, dates, courses, projects, etc.
- **Experience**: Work experience with company, role, description, and dates
- **Study**: Learning journey entries with progress tracking and resources
- **Message**: Contact form submissions with read/unread status

### Data Migration

The application includes automatic database migration capabilities to handle schema changes safely without data loss.

## API Documentation

### Authentication Endpoints

- `POST /api/admin/login`: Admin authentication

### Public Endpoints

- `GET /api/projects`: Get all projects
- `GET /api/skills`: Get all skills
- `GET /api/education`: Get education history
- `GET /api/experience`: Get work experience
- `GET /api/studies`: Get learning/studies entries
- `POST /api/messages`: Submit a contact message

### Admin Endpoints (All require JWT authentication)

- **Projects**: 
  - `GET/POST /api/admin/projects`
  - `GET/PUT/DELETE /api/admin/projects/<id>`
- **Skills**: 
  - `GET/POST /api/admin/skills`
  - `GET/PUT/DELETE /api/admin/skills/<id>`
- **Education**: 
  - `GET/POST /api/admin/education`
  - `GET/PUT/DELETE /api/admin/education/<id>`
- **Experience**: 
  - `GET/POST /api/admin/experience`
  - `GET/PUT/DELETE /api/admin/experience/<id>`
  - `PUT /api/admin/experience/reorder`: Reorder experience entries
- **Studies**: 
  - `GET/POST /api/admin/studies`
  - `GET/PUT/DELETE /api/admin/studies/<id>`
- **Messages**: 
  - `GET /api/admin/messages`
  - `GET/PUT/DELETE /api/admin/messages/<id>`

## Customization

### Frontend Styling

The frontend uses CSS for styling with a modular approach. Main customization files:

- `src/App.css`: Global styles
- Component-specific CSS files in their respective directories

### Adding New Features

1. **Backend**: Add new models in `models.py` and corresponding routes in `app.py`
2. **Frontend**: Create new components in the appropriate directories
3. **Admin Panel**: Add new management sections to the admin dashboard

## Troubleshooting

### Common Issues

- **Database Connection Errors**: Check that the SQLite database file has correct permissions
- **API Connection Failures**: Ensure CORS is properly configured in `app.py`
- **Admin Authentication Issues**: Verify JWT secret key is consistent
- **Missing Dependencies**: Run `npm install` in the frontend directory and `pip install -r requirements.txt` in the backend directory

## License

This project is licensed under the MIT License - see the LICENSE file for details.
