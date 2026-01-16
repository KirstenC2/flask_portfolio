import React, { useState, useEffect } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import ResumePDF from './ResumePDF';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faChevronLeft, faPlus, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';

const ResumeBuilder = ({ onBack }) => {
    const [resumeData, setResumeData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // 1. Fetch data from your Flask API on mount
    useEffect(() => {
        const loadResume = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/resume');
                setResumeData(response.data);
            } catch (error) {
                console.error("Failed to fetch resume:", error);
                alert("Could not load data from database.");
            } finally {
                setFetching(false);
            }
        };
        loadResume();
    }, []);

    // --- Dynamic Actions for Sections ---

    // 1. Skill Groups
    const addSkillGroup = () => {
        setResumeData(prev => ({
            ...prev,
            skillGroups: [...prev.skillGroups, { category: "New Category", items: "Skill 1, Skill 2" }]
        }));
    };

    const deleteSkillGroup = (index) => {
        setResumeData(prev => ({
            ...prev,
            skillGroups: prev.skillGroups.filter((_, i) => i !== index)
        }));
    };

    // 2. Languages
    const addLanguage = () => {
        setResumeData(prev => ({
            ...prev,
            languages: [...prev.languages, { language: "New Language", level: "Fluent" }]
        }));
    };

    const deleteLanguage = (index) => {
        setResumeData(prev => ({
            ...prev,
            languages: prev.languages.filter((_, i) => i !== index)
        }));
    };

    // 3. Work Experience
    const addExperience = () => {
        setResumeData(prev => ({
            ...prev,
            experience: [...prev.experience, { company: "Company Name", role: "Role", period: "MM/YYYY - Present", desc: "Job details..." }]
        }));
    };

    const deleteExperience = (index) => {
        setResumeData(prev => ({
            ...prev,
            experience: prev.experience.filter((_, i) => i !== index)
        }));
    };
    // Helper functions (same as before)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setResumeData(prev => ({ ...prev, [name]: value }));
    };

    const handleSkillChange = (index, field, value) => {
        const newGroups = [...resumeData.skillGroups];
        newGroups[index][field] = value;
        setResumeData(prev => ({ ...prev, skillGroups: newGroups }));
    };

    const handleLanguageChange = (index, field, value) => {
        const newLangs = [...resumeData.languages];
        newLangs[index][field] = value;
        setResumeData(prev => ({ ...prev, languages: newLangs }));
    };

    const handleExpChange = (index, field, value) => {
        const newExp = [...resumeData.experience];
        newExp[index][field] = value;
        setResumeData(prev => ({ ...prev, experience: newExp }));
    };

    const handleExportAndUpload = async () => {
        setLoading(true);
        try {
            const blob = await pdf(<ResumePDF data={resumeData} />).toBlob();
            const formData = new FormData();
            formData.append('file', blob, `${resumeData.name.replace(/\s/g, '_')}_Resume.pdf`);
            formData.append('title', `${resumeData.name} Resume`);

            await axios.post('http://localhost:5001/api/upload/resume', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("PDF generated and saved successfully!");
        } catch (error) {
            alert("Upload failed.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div style={loaderStyle}><FontAwesomeIcon icon={faSpinner} spin size="3x" /></div>;

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#2c3e50' }}>
            <div style={editPanelStyle}>
                <button onClick={onBack} style={backBtnStyle}><FontAwesomeIcon icon={faChevronLeft} /> Back</button>
                <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Resume Editor</h2>
                
                {/* Basic Info (Fixed) */}
                <div style={sectionBox}>
                    <h3 style={sectionTitleStyle}>General Information</h3>
                    <input name="name" value={resumeData.name} onChange={handleChange} style={inputStyle} />
                    <input name="title" value={resumeData.title} onChange={handleChange} style={{...inputStyle, marginTop: '10px'}} />
                </div>

                {/* Technical Skills (Dynamic) */}
                <div style={sectionBox}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 style={sectionTitleStyle}>Technical Skills</h3>
                        <button onClick={addSkillGroup} style={smallAddBtn}><FontAwesomeIcon icon={faPlus} /></button>
                    </div>
                    {resumeData.skillGroups.map((group, index) => (
                        <div key={index} style={itemCardStyle}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <input placeholder="Category" value={group.category} onChange={(e) => handleSkillChange(index, 'category', e.target.value)} style={{...inputStyle, fontWeight: 'bold'}} />
                                <button onClick={() => deleteSkillGroup(index)} style={deleteBtn}><FontAwesomeIcon icon={faTrash} /></button>
                            </div>
                            <textarea placeholder="Items" value={group.items} onChange={(e) => handleSkillChange(index, 'items', e.target.value)} style={{...inputStyle, marginTop: '5px', height: '50px'}} />
                        </div>
                    ))}
                </div>

                {/* Languages (Dynamic) */}
                <div style={sectionBox}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 style={sectionTitleStyle}>Languages</h3>
                        <button onClick={addLanguage} style={smallAddBtn}><FontAwesomeIcon icon={faPlus} /></button>
                    </div>
                    {resumeData.languages.map((lang, index) => (
                        <div key={index} style={{...itemCardStyle, display: 'flex', gap: '5px', alignItems: 'center'}}>
                            <input placeholder="Language" value={lang.language} onChange={(e) => handleLanguageChange(index, 'language', e.target.value)} style={inputStyle} />
                            <input placeholder="Level" value={lang.level} onChange={(e) => handleLanguageChange(index, 'level', e.target.value)} style={inputStyle} />
                            <button onClick={() => deleteLanguage(index)} style={deleteBtn}><FontAwesomeIcon icon={faTrash} /></button>
                        </div>
                    ))}
                </div>

                {/* Experience (Dynamic) */}
                <div style={sectionBox}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 style={sectionTitleStyle}>Experience</h3>
                        <button onClick={addExperience} style={smallAddBtn}><FontAwesomeIcon icon={faPlus} /></button>
                    </div>
                    {resumeData.experience.map((exp, index) => (
                        <div key={index} style={itemCardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => deleteExperience(index)} style={deleteBtn}><FontAwesomeIcon icon={faTrash} /></button>
                            </div>
                            <input placeholder="Company" value={exp.company} onChange={(e) => handleExpChange(index, 'company', e.target.value)} style={{...inputStyle, fontWeight: 'bold'}} />
                            <input placeholder="Role" value={exp.role} onChange={(e) => handleExpChange(index, 'role', e.target.value)} style={{...inputStyle, marginTop: '5px'}} />
                            <input placeholder="Period" value={exp.period} onChange={(e) => handleExpChange(index, 'period', e.target.value)} style={{...inputStyle, marginTop: '5px'}} />
                            <textarea placeholder="Description" value={exp.desc} onChange={(e) => handleExpChange(index, 'desc', e.target.value)} style={{...inputStyle, marginTop: '5px', height: '60px'}} />
                        </div>
                    ))}
                </div>

                <button onClick={handleExportAndUpload} disabled={loading} style={saveButtonStyle}>
                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Export & Upload PDF'}
                </button>
            </div>

            {/* PREVIEW PANEL */}
            <div style={{ width: '60%', padding: '20px', backgroundColor: '#525659' }}>
                <PDFViewer width="100%" height="100%" showToolbar={false} style={{ borderRadius: '8px', border: 'none' }}>
                    <ResumePDF data={resumeData} />
                </PDFViewer>
            </div>
        </div>
    );
};

// Styles (Condensed)
const editPanelStyle = { width: '40%', padding: '20px', overflowY: 'auto', backgroundColor: '#f4f7f6' };
const sectionBox = { backgroundColor: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #ddd' };
const sectionTitleStyle = { fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '10px' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' };
const itemCardStyle = { padding: '10px', border: '1px solid #eee', borderRadius: '6px', marginBottom: '10px', backgroundColor: '#fafafa' };
const saveButtonStyle = { width: '100%', padding: '15px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const backBtnStyle = { background: 'none', border: 'none', color: '#2980b9', cursor: 'pointer', marginBottom: '10px' };
const loaderStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' };
const deleteBtn = { background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' };
const smallAddBtn = { background: 'none', border: 'none', color: '#27ae60', cursor: 'pointer' };

export default ResumeBuilder;