from models import db, Project, Skill, Study, Experience, Education
from datetime import datetime

def seed_sample_data():
    # Add sample data if respective tables are empty
    if Project.query.count() == 0:
        sample_projects = [
            Project(
                title='Flask Portfolio Website',
                description='A responsive portfolio website built with Flask and SQLite to showcase projects and skills.',
                technologies='Python, Flask, SQLAlchemy, HTML, CSS, Docker',
                image_url='portfolio_website.jpg',
                github_url='https://github.com/KirstenC2/flask_portfolio'
            )
        ]
        sample_skills = [
            Skill(name='Python', category='Programming', proficiency=5),
            Skill(name='JavaScript', category='Programming', proficiency=4),
            Skill(name='TypeScript', category='Programming', proficiency=4),
            Skill(name='SQL', category='Programming', proficiency=4),
            Skill(name='HTML/CSS', category='Programming', proficiency=5),
            Skill(name='Java', category='Programming', proficiency=3),
            Skill(name='C#', category='Programming', proficiency=3),
            Skill(name='Flask', category='Frameworks', proficiency=4),
            Skill(name='React', category='Frameworks', proficiency=4),
            Skill(name='Node.js', category='Frameworks', proficiency=3),
            Skill(name='Express', category='Frameworks', proficiency=3),
            Skill(name='Django', category='Frameworks', proficiency=3),
            Skill(name='Docker', category='DevOps', proficiency=4),
            Skill(name='Git', category='DevOps', proficiency=5),
            Skill(name='CI/CD', category='DevOps', proficiency=3),
            Skill(name='AWS', category='DevOps', proficiency=3),
            Skill(name='Jira', category='DevOps', proficiency=4),
            Skill(name='SQLite', category='Databases', proficiency=4),
            Skill(name='PostgreSQL', category='Databases', proficiency=3),
            Skill(name='MongoDB', category='Databases', proficiency=3),
        ]
        sample_studies = [
            Study(
                title='Rust Programming',
                description='Learning Rust programming language for systems programming and high-performance applications.',
                category='Self-study',
                source='Rust Programming Book',
                status='In Progress',
                progress=40,
                start_date=datetime.strptime('2025-03-10', '%Y-%m-%d'),
                github_url='https://github.com/KirstenC2/rust-learning'
            ),
            Study(
                title='Full Stack Development with MERN',
                description='Comprehensive course on building full-stack applications with MongoDB, Express, React, and Node.js.',
                category='Course',
                status='Completed',
                progress=100,
                start_date=datetime.strptime('2024-09-01', '%Y-%m-%d'),
                completion_date=datetime.strptime('2024-12-20', '%Y-%m-%d'),
                github_url='https://github.com/KirstenC2/mern-project'
            )
        ]
        db.session.add_all(sample_projects)
        db.session.commit()
    if Skill.query.count() == 0:
        db.session.add_all(sample_skills)
        db.session.commit()
    if Study.query.count() == 0:
        db.session.add_all(sample_studies)
        db.session.commit()
    if Experience.query.count() == 0:
        sample_experiences = [
            Experience(
                title="Senior Full Stack Developer",
                company="Tech Innovations Inc.",
                description="Leading development of enterprise web applications using React, Node.js, and MongoDB. Implementing CI/CD pipelines and mentoring junior developers.",
                start_date=datetime(2023, 1, 1),
                end_date=None,
                is_current=True,
                order=4
            ),
            Experience(
                title="Full Stack Developer",
                company="Digital Solutions Ltd.",
                description="Developed responsive web applications with React and Express. Implemented RESTful APIs and worked with SQL and NoSQL databases.",
                start_date=datetime(2020, 3, 1),
                end_date=datetime(2022, 12, 31),
                is_current=False,
                order=3
            ),
            Experience(
                title="Frontend Developer",
                company="Web Creators Studio",
                description="Created responsive user interfaces using HTML, CSS, JavaScript, and React. Collaborated with designers to implement pixel-perfect UIs.",
                start_date=datetime(2018, 5, 1),
                end_date=datetime(2020, 2, 28),
                is_current=False,
                order=2
            ),
            Experience(
                title="Web Development Intern",
                company="Startup Incubator",
                description="Assisted in development of web applications. Learned modern JavaScript frameworks and best practices in web development.",
                start_date=datetime(2017, 6, 1),
                end_date=datetime(2018, 4, 30),
                is_current=False,
                order=1
            )
        ]
        db.session.add_all(sample_experiences)
        db.session.commit()
    if Education.query.count() == 0:
        sample_education = [
            Education(
                degree="Bachelor of Science in Computer Science",
                school="University of Technology",
                description="Focused on software engineering, web development, and database systems. Graduated with honors.",
                start_date=datetime(2014, 9, 1),
                end_date=datetime(2018, 5, 31),
                is_current=False,
                order=1
            ),
            Education(
                degree="Full Stack Web Development Certification",
                school="Tech Academy",
                description="Intensive program covering modern JavaScript frameworks, backend development, and deployment technologies.",
                start_date=datetime(2020, 1, 15),
                end_date=datetime(2020, 4, 15),
                is_current=False,
                order=2
            )
        ]
        db.session.add_all(sample_education)
        db.session.commit()
