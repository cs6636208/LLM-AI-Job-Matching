import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firstNames = ['John', 'Jane', 'Alex', 'Emily', 'Chris', 'Katie', 'Michael', 'Sarah', 'David', 'Laura', 'Robert', 'Emma', 'Daniel', 'Olivia', 'James', 'Sophia', 'William', 'Isabella', 'Joseph', 'Mia'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

const roles = ['Software Engineer', 'Senior React Developer', 'Backend Developer', 'Data Scientist', 'Product Manager', 'UX Designer', 'DevOps Engineer', 'QA Tester', 'System Analyst', 'Marketing Specialist', 'HR Manager'];

const allSkills = {
  tech: ['React', 'Node.js', 'Python', 'Java', 'C++', 'Go', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'Next.js', 'TypeScript', 'GraphQL', 'Redis', 'SAP'],
  design: ['Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'UI/UX Research'],
  soft: ['Leadership', 'Communication', 'Agile', 'Scrum', 'Problem Solving', 'Mentoring', 'Team Player']
};

const educationLevels = ["Bachelor's Degree", "Bachelor's Degree", "Master's Degree", "PhD"];

const candidates = [];

for (let i = 1; i <= 100; i++) {
  const role = roles[Math.floor(Math.random() * roles.length)];
  const exp = Math.floor(Math.random() * 15) + 1; // 1 to 15 years
  
  let pool = [...allSkills.tech, ...allSkills.soft];
  if (role.includes('Design')) pool = [...allSkills.design, ...allSkills.soft];
  
  const shuffled = pool.sort(() => 0.5 - Math.random());
  const selectedSkills = shuffled.slice(0, Math.floor(Math.random() * 5) + 4);

  candidates.push({
    id: `CAND-${i.toString().padStart(3, '0')}`,
    name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    currentRole: role,
    yearsOfExperience: exp,
    skills: selectedSkills,
    education: educationLevels[Math.floor(Math.random() * educationLevels.length)],
    summary: `Experienced ${role} with ${exp} years in the industry. Passionate about delivering high quality work and continuous learning.`,
  });
}

const fileContent = `export const mockResumes = ${JSON.stringify(candidates, null, 2)};`;
const dir = path.join(__dirname, '../src/data');

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(path.join(dir, 'mockResumes.js'), fileContent);
console.log('Successfully generated 100 mock resumes at src/data/mockResumes.js');
