from models import db, Project, Skill, Study, Experience, Education, LifeEvent, ExperienceProject, Post, Introduction
from datetime import datetime
import json

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

    # Seed introduction
    if Introduction.query.count() == 0:
        intro = Introduction(
            languages_code=json.dumps(['ko', 'zh', 'en']),
            role='TPM',
            skill_passages=json.dumps({
                'ko': {
                    'Roadmapping': '비즈니스 목표와 사용자 가치를 기준으로 결과 중심 로드맵을 설계합니다. 분기별 우선순위를 명확히 하고 리스크·의존성을 조기에 드러냅니다.',
                    'Stakeholder Management': '명확한 기대치 설정과 정례 커뮤니케이션으로 신뢰를 구축합니다. 갈등은 데이터와 근거로 조정하고, 의사결정 단서를 투명하게 공유합니다.',
                    'Execution & Delivery': '주간 실행 리듬을 유지하고 장애물을 신속히 제거합니다. 데모/리뷰를 통해 자주 가치를 검증하며 일정·범위를 유연하게 조정합니다.',
                    'Risk Management': '가설-영향 매트릭스로 리스크를 분류하고 조기 경보 지표를 설정합니다. 고위험 의존성은 분리·단계화하여 실패 반경을 최소화합니다.',
                    'Metrics & OKRs': '선행 지표와 결과 지표를 분리해 관리하고, 분기별 OKR 점검으로 학습을 다음 주기에 반영합니다.',
                    'Program Planning': '상위 목표를 이정표와 작업 패키지로 분해하고, 크리티컬 패스를 관리해 납기 예측 가능성을 높입니다.'
                },
                'zh': {
                    'Roadmapping': '以业务目标与用户价值为导向制定结果型路线图，按季度明确优先级，并及早暴露风险与依赖。',
                    'Stakeholder Management': '通过清晰的预期管理与例行沟通建立信任；遇到分歧以数据与事实达成一致，并透明化决策依据。',
                    'Execution & Delivery': '保持每周执行节奏，快速清除阻碍；通过频繁演示与评审验证价值，并灵活调整范围与计划。',
                    'Risk Management': '用“假设-影响”矩阵分级风险，设置早期预警指标；对高风险依赖进行解耦与分阶段落地，降低失败半径。',
                    'Metrics & OKRs': '区分前导指标与结果指标；按季度复盘OKR，将学习沉淀至下一周期的优先级与方案。',
                    'Program Planning': '将上层目标分解为里程碑与工作包，管理关键路径并最大化并行度，提高交付可预测性。'
                },
                'en': {
                    'Roadmapping': 'Outcome-driven roadmaps aligned to business goals and user value; surface risks/dependencies early with quarterly priorities.',
                    'Stakeholder Management': 'Set clear expectations and communicate routinely; resolve conflicts with data and transparent decision criteria.',
                    'Execution & Delivery': 'Maintain a weekly cadence, unblock fast, and validate value with frequent demos; adjust scope/time as needed.',
                    'Risk Management': 'Classify risks via hypothesis–impact matrix, define early warning indicators, and stage high-risk dependencies.',
                    'Metrics & OKRs': 'Separate leading and lagging metrics; quarterly OKR reviews convert learning into next-cycle priorities.',
                    'Program Planning': 'Decompose objectives into milestones/work packages, manage the critical path, and maximize parallelization for predictability.'
                }
            })
        )
        db.session.add(intro)
        db.session.commit()

    # Seed blog posts
    if Post.query.count() == 0:
        sample_posts = [
            Post(
                title='Welcome to My Blog',
                slug='welcome-to-my-blog',
                content_md='''# Welcome\n\nThis is the first post on my new blog. Written in **Markdown**!''',
                content_html=None,
                tags='intro,personal'
            ),
            Post(
                title='Technical Notes: Flask + React',
                slug='flask-react-notes',
                content_md='''## Flask + React\n\nSome quick notes on wiring a Flask API to a React SPA.''',
                content_html=None,
                tags='flask,react,notes'
            )
        ]
        # Render HTML if markdown lib available at seed time
        try:
            import markdown as md
            import bleach
            def _render(text):
                html = md.markdown(text, extensions=['extra', 'toc', 'sane_lists'])
                allowed_tags = bleach.sanitizer.ALLOWED_TAGS.union({'p','pre','code','blockquote','hr','br','h1','h2','h3','h4','h5','h6','ul','ol','li','strong','em','a'})
                allowed_attrs = {**bleach.sanitizer.ALLOWED_ATTRIBUTES}
                allowed_attrs.update({'a': ['href', 'title', 'name', 'target', 'rel']})
                return bleach.linkify(bleach.clean(html, tags=allowed_tags, attributes=allowed_attrs))
            for p in sample_posts:
                p.content_html = _render(p.content_md)
        except Exception:
            pass
        db.session.add_all(sample_posts)
        db.session.commit()
