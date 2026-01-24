import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';
import { Carousel, Card } from 'antd';
import './ProjectCarousel.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReact } from '@fortawesome/free-brands-svg-icons';
import { faStar as fasStar } from '@fortawesome/free-solid-svg-icons'; // 實心
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons'; // 空心
const HomePage = () => {
  const [homeData, setHomeData] = useState({
    featured_projects: [],
    top_skills: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayUrls, setDisplayUrls] = useState({});

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/home');
        setHomeData(response.data);

        // 2. 資料抓到後，檢查並抓取專案圖片
        response.data.featured_projects.forEach(project => {
          if (project.image_url && !project.image_url.startsWith('http')) {
            fetchImageUrl(project.image_url);
          }
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching home data:', error);
        setError('Failed to load data.');
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const [activeIndex, setActiveIndex] = useState(1);
  const carouselRef = React.useRef();

  // 3. 專門處理後端附件圖片轉換的函式
  const fetchImageUrl = async (path) => {
    if (!path || displayUrls[path]) return;

    // 假設 path 是 "projects/filename.jpg"
    const filename = path.includes('/') ? path.split('/')[1] : path;

    try {
      const response = await fetch(`http://localhost:5001/api/attachments/view/projects/${filename}`);
      const data = await response.json();
      if (data.url) {
        setDisplayUrls(prev => ({ ...prev, [path]: data.url }));
      }
    } catch (err) {
      console.error("無法取得圖片連結", err);
    }
  };

  const handleCardClick = (index) => {
    carouselRef.current.goTo(index);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <main className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <img src="cute_profile.png" alt="Kirsten Choo" className="profile-img" />
          <h1>Hi, I'm Kirsten Choo</h1>
          <h2>Technology Maniac</h2>
          <p>A professional, passionate, and dedicated developer who loves to take on new challenges and create innovative solutions.</p>
          <div className="hero-btns">
            <Link to="/projects" className="btn btn-primary">View My Work</Link>
            <Link to="/contact" className="btn btn-secondary">Get In Touch</Link>
          </div>
        </div>
      </section>


      {/* Top Skills Section */}
      <section className="section-container skills-section">
        <div className="container skills-layout">

          {/* 左側：標題與導向按鈕 */}
          <div className="skills-left-content">
            <h2 className="section-title">My Skills</h2>
            <p className="section-description">
              Focusing on modern web technologies and specialized in building scalable applications.
            </p>
          </div>

          {/* 右側：技能星星卡片 */}
          <div className="skills-right-content">
            <div className="skills-grid">
              {homeData.top_skills.map(skill => (
                <div className="skill-card" key={skill.id}>
                  <div className="skill-header">
                    <h3>{skill.name}</h3>
                    <span className="skill-category">{skill.category}</span>
                  </div>

                  {/* 這裡換成你想要的星星 */}
                  <div className="skill-stars">
                    {[...Array(5)].map((_, index) => (
                      <FontAwesomeIcon
                        key={index}
                        icon={index < skill.proficiency ? fasStar : farStar}
                        style={{ color: index < skill.proficiency ? '#ffc107' : '#e4e5e9' }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="section-cta">
              <Link to="/skills" className="btn btn-primary">View All Skills</Link>
            </div>
          </div>

        </div>
      </section>
      {/* Projects Section */}
      <div className="project-container">
        <h2 className="section-title">My Projects</h2>
        <div className="carousel-wrapper">
          <Carousel
            ref={carouselRef}
            centerMode={true}
            infinite={true}
            centerPadding="0"
            slidesToShow={3}
            afterChange={(current) => setActiveIndex(current)}
            dots={false}
          >
            {homeData.featured_projects.map((item, index) => (
              <div key={index} onClick={() => handleCardClick(index)}>
                <div className={`project-card-container ${index === activeIndex ? 'is-active' : 'is-side'}`}>
                  <Card
                    title={item.title}
                    cover={
                      <div className="project-image-container" style={{ height: '200px', overflow: 'hidden' }}>
                        {item.image_url ? (
                          <img
                            alt={item.title}
                            src={displayUrls[item.image_url] || (item.image_url.startsWith('http') ? item.image_url : '')}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="placeholder-image" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                            <FontAwesomeIcon icon={faReact} size="3x" style={{ color: '#61dafb' }} />
                          </div>
                        )}
                      </div>
                    }
                  >
                    <Card.Meta description={item.technologies} />
                  </Card>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
        <div className="section-cta">
          <Link to="/projects" className="btn btn-primary">View All Projects</Link>
        </div>
      </div>
    </main>
  );
};

export default HomePage;
