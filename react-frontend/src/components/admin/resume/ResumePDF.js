import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 30, fontFamily: 'Helvetica' },
    leftColumn: { width: '32%', borderRight: '1pt solid #EEEEEE', paddingRight: 15 },
    rightColumn: { width: '68%', paddingLeft: 15 },
    name: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', marginBottom: 5 },
    headerTitle: { fontSize: 10, color: '#3498DB', marginBottom: 15, textTransform: 'uppercase' },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#2C3E50', borderBottom: '1pt solid #3498DB', paddingBottom: 3, marginTop: 15, marginBottom: 8, textTransform: 'uppercase' },
    contactItem: { fontSize: 8, color: '#7F8C8D', marginBottom: 4 },
    // 技能分組樣式
    skillCategory: { marginBottom: 8 },
    skillLabel: { fontSize: 9, fontWeight: 'bold', color: '#34495E', marginBottom: 2 },
    skillText: { fontSize: 8, color: '#7F8C8D', lineHeight: 1.3 },
    // 經歷樣式
    jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    jobTitle: { fontSize: 10, fontWeight: 'bold', color: '#34495E' },
    jobDate: { fontSize: 8, color: '#95A5A6' },
    bulletPoint: { fontSize: 9, color: '#555555', marginBottom: 3, marginLeft: 5, lineHeight: 1.4 }
});

const ResumePDF = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.leftColumn}>
                <Text style={styles.name}>{data.name}</Text>
                <Text style={styles.headerTitle}>{data.title}</Text>
                
                <View style={{ marginBottom: 15 }}>
                    <Text style={styles.contactItem}>{data.location}</Text>
                    <Text style={styles.contactItem}>{data.email}</Text>
                    <Text style={styles.contactItem}>{data.phone}</Text>
                </View>

                <Text style={styles.sectionTitle}>Skills</Text>
                {data.skillGroups.map((group, i) => (
                    <View key={i} style={styles.skillCategory}>
                        <Text style={styles.skillLabel}>{group.category}</Text>
                        <Text style={styles.skillText}>{group.items}</Text>
                    </View>
                ))}

                <Text style={styles.sectionTitle}>Languages</Text>
                <Text style={styles.contactItem}>English (Fluent)</Text>
                <Text style={styles.contactItem}>Chinese (Native)</Text>
                <Text style={styles.contactItem}>Korean (Intermediate)</Text>
            </View>

            <View style={styles.rightColumn}>
                <Text style={styles.sectionTitle}>Work Experience</Text>
                {data.experience.map((exp, i) => (
                    <View key={i} style={{ marginBottom: 12 }}>
                        <View style={styles.jobHeader}>
                            <Text style={styles.jobTitle}>{exp.company} - {exp.role}</Text>
                            <Text style={styles.jobDate}>{exp.period}</Text>
                        </View>
                        <Text style={styles.bulletPoint}>• {exp.desc}</Text>
                    </View>
                ))}

                <Text style={styles.sectionTitle}>Education</Text>
                <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>UCSI University</Text>
                    <Text style={styles.jobDate}>2021 - 2024</Text>
                </View>
                <Text style={styles.bulletPoint}>Bachelor of Science (Hons) in Computing (GPA: 3.69)</Text>
            </View>
        </Page>
    </Document>
);

export default ResumePDF;