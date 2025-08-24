from models import db, Project, Skill, Study, Experience, Education, LifeEvent, ExperienceProject
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
            Skill(name='Python', category='Programming', proficiency=4),
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
                title="Software Intern",
                company="FootfallCam (Sungai Long)",
                description="Created responsive user interfaces using HTML, CSS, JavaScript, and React. Collaborated with designers to implement pixel-perfect UIs.",
                start_date=datetime(2024, 9, 1),
                end_date=datetime(2024, 12, 22),
                is_current=False,
                order=2
            ),
            Experience(
                title="Research Intern",
                company="UCSI University, Kuala Lumpur, Malaysia",
                description="Conducted research on Machine Learning models for image classification.",
                start_date=datetime(2021, 7, 1),
                end_date=datetime(2021, 12, 31),
                is_current=False,
                order=1
            )
        ]
        db.session.add_all(sample_experiences)
        db.session.commit()
        # Link sample projects to the created experiences
        exp_intern = Experience.query.filter_by(title="Software Intern", company="FootfallCam (Sungai Long)").first()
        exp_research = Experience.query.filter_by(title="Research Intern", company="UCSI University, Kuala Lumpur, Malaysia").first()
        xp = []
        if exp_intern:
            xp.extend([
                ExperienceProject(
                    experience_id=exp_intern.id,
                    title="Retail Analytics Dashboard",
                    description="Built interactive dashboards to visualize foot traffic and conversion metrics.",
                    technologies="React, Chart.js, REST API",
                    github_url=None,
                    project_url=None
                ),
                ExperienceProject(
                    experience_id=exp_intern.id,
                    title="Component Library",
                    description="Abstracted reusable UI components and improved developer velocity.",
                    technologies="React, CSS Modules",
                    github_url=None,
                    project_url=None
                ),
            ])
        if exp_research:
            xp.extend([
                ExperienceProject(
                    experience_id=exp_research.id,
                    title="Image Classifier Benchmark",
                    description="Compared CNN architectures for small dataset performance and inference speed.",
                    technologies="Python, TensorFlow, scikit-learn",
                    github_url=None,
                    project_url=None
                )
            ])
        if xp:
            db.session.add_all(xp)
            db.session.commit()
    # If there are experiences but no per-experience projects yet, seed some defaults
    if ExperienceProject.query.count() == 0 and Experience.query.count() > 0:
        exp_intern = Experience.query.filter_by(title="Software Intern", company="FootfallCam (Sungai Long)").first()
        exp_research = Experience.query.filter_by(title="Research Intern", company="UCSI University, Kuala Lumpur, Malaysia").first()
        xp = []
        if exp_intern:
            xp.extend([
                ExperienceProject(
                    experience_id=exp_intern.id,
                    title="Retail Analytics Dashboard",
                    description="Built interactive dashboards to visualize foot traffic and conversion metrics.",
                    technologies="React, Chart.js, REST API",
                    github_url=None,
                    project_url=None
                ),
                ExperienceProject(
                    experience_id=exp_intern.id,
                    title="Component Library",
                    description="Abstracted reusable UI components and improved developer velocity.",
                    technologies="React, CSS Modules",
                    github_url=None,
                    project_url=None
                ),
            ])
        if exp_research:
            xp.extend([
                ExperienceProject(
                    experience_id=exp_research.id,
                    title="Image Classifier Benchmark",
                    description="Compared CNN architectures for small dataset performance and inference speed.",
                    technologies="Python, TensorFlow, scikit-learn",
                    github_url=None,
                    project_url=None
                )
            ])
        if xp:
            db.session.add_all(xp)
            db.session.commit()

    if Education.query.count() == 0:
        sample_education = [
            Education(
                degree="Bachelor of Science in Computing (Computer Science)",
                school="UCSI Universi",
                description="Focused on software engineering, web development, and database systems. Graduated with honors.",
                start_date=datetime(2021, 1, 1),
                end_date=datetime(2023, 12, 31),
                is_current=False,
                order=2
            ),
            Education(
                degree="Foundation in Arts (Business Studies with Computing Technology)",
                school="Universiti Tunku Abdul Rahman (UTAR), Malaysia",
                description="Business studies with computing technology.",
                start_date=datetime(2018, 1, 7),
                end_date=datetime(2019, 1, 3),
                is_current=False,
                order=1
            )
        ]
        db.session.add_all(sample_education)
        db.session.commit()
    if LifeEvent.query.count() == 0:
        sample_life_events = [
            LifeEvent(
                title="Moved to Taipei",
                description="Relocated to Taipei to pursue new opportunities and personal growth.",
                start_date=datetime(2024, 5, 28),
                end_date=None,
                is_current=True,
                order=3
            ),
            LifeEvent(
                title="PTPTN loan waived",
                description="PTPTN loan waived for my degree as a first class honors student.",
                start_date=datetime(2025, 8, 18),
                end_date=None,
                is_current=False,
                order=4
            ),
             LifeEvent(
                title="MUET exam (Malaysian University English Test)",
                description="MUET exam passed with a band 3.",
                start_date=datetime(2018, 12, 5),
                end_date=None,
                is_current=False,
                order=5
            )
        ]
        db.session.add_all(sample_life_events)
        db.session.commit()
