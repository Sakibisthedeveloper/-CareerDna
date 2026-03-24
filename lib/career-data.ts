import { PersonalityType } from './quiz-data';

export interface Career {
    id: string;
    title: string;
    emoji: string;
    description: string;
    matchType: PersonalityType;
    matchPercentage: number; // Base percentage to start with
    salaryRange: string;
    salaries: {
        fresher: string;
        mid: string;
        senior: string;
        lead: string;
    };
    traits: string[];
    roadmap: {
        step: string;
        description: string;
    }[];
}


export const careers: Career[] = [
    // Creative Careers
    {
        id: 'ux-designer',
        title: 'UX Designer',
        emoji: '🎨',
        description: 'Design intuitive and beautiful digital experiences for users.',
        matchType: 'creative',
        matchPercentage: 92,
        salaryRange: '6-20 LPA',
        salaries: {
            fresher: '₹6L',
            mid: '₹12L',
            senior: '₹20L',
            lead: '₹35L+',
        },
        traits: ['Empathy', 'Visual Design', 'Problem Solving'],
        roadmap: [
            { step: 'Step 1', description: 'Learn Figma & Design Principles' },
            { step: 'Step 2', description: 'Build a Portfolio of Case Studies' },
            { step: 'Step 3', description: 'Learn Basic HTML/CSS' },
            { step: 'Step 4', description: 'Apply for Junior UX Roles' },
        ],
    },
    {
        id: 'content-creator',
        title: 'Content Creator',
        emoji: '🎥',
        description: 'Create engaging video, text, or audio content for brands or yourself.',
        matchType: 'creative',
        matchPercentage: 88,
        salaryRange: '3-15 LPA',
        salaries: {
            fresher: '₹3L',
            mid: '₹8L',
            senior: '₹15L',
            lead: '₹25L+',
        },
        traits: ['Storytelling', 'Editing', 'Creativity'],
        roadmap: [
            { step: 'Step 1', description: 'Pick your Niche & Platform' },
            { step: 'Step 2', description: 'Learn Video Editing/Writing' },
            { step: 'Step 3', description: 'Post Consistently & Analyze' },
            { step: 'Step 4', description: 'Monetize via Brand Deals/Ads' },
        ],
    },
    {
        id: 'graphic-designer',
        title: 'Graphic Designer',
        emoji: '✏️',
        description: 'Communicate ideas through visual concepts and layout.',
        matchType: 'creative',
        matchPercentage: 85,
        salaryRange: '3-12 LPA',
        salaries: {
            fresher: '₹3L',
            mid: '₹7L',
            senior: '₹12L',
            lead: '₹20L+',
        },
        traits: ['Creativity', 'Typography', 'Color Theory'],
        roadmap: [
            { step: 'Step 1', description: 'Master Adobe Creative Suite' },
            { step: 'Step 2', description: 'Understand Branding' },
            { step: 'Step 3', description: 'Create a Behance Portfolio' },
            { step: 'Step 4', description: 'Freelance or Agency Work' },
        ],
    },

    // Analytical Careers
    {
        id: 'data-scientist',
        title: 'Data Scientist',
        emoji: '📊',
        description: 'Extract insights from data to help businesses make smart decisions.',
        matchType: 'analytical',
        matchPercentage: 95,
        salaryRange: '10-35 LPA',
        salaries: {
            fresher: '₹10L',
            mid: '₹22L',
            senior: '₹35L',
            lead: '₹55L+',
        },
        traits: ['Statistical Analysis', 'Coding', 'Critical Thinking'],
        roadmap: [
            { step: 'Step 1', description: 'Learn Python & SQL' },
            { step: 'Step 2', description: 'Master Statistics & Math' },
            { step: 'Step 3', description: 'Learn Machine Learning Basics' },
            { step: 'Step 4', description: 'Build Data Projects' },
        ],
    },
    {
        id: 'financial-analyst',
        title: 'Financial Analyst',
        emoji: '💹',
        description: 'Guide businesses and individuals in making investment decisions.',
        matchType: 'analytical',
        matchPercentage: 90,
        salaryRange: '6-25 LPA',
        salaries: {
            fresher: '₹6L',
            mid: '₹15L',
            senior: '₹25L',
            lead: '₹40L+',
        },
        traits: ['Math Skills', 'Attention to Detail', 'Economics'],
        roadmap: [
            { step: 'Step 1', description: 'Degree in Finance/Econ' },
            { step: 'Step 2', description: 'Excel & Financial Modeling' },
            { step: 'Step 3', description: 'CFA Certification (Optional)' },
            { step: 'Step 4', description: 'Internship at Finance Firm' },
        ],
    },
    {
        id: 'research-analyst',
        title: 'Research Analyst',
        emoji: '🔬',
        description: 'Investigate market trends and competitor data.',
        matchType: 'analytical',
        matchPercentage: 87,
        salaryRange: '5-18 LPA',
        salaries: {
            fresher: '₹5L',
            mid: '₹12L',
            senior: '₹18L',
            lead: '₹28L+',
        },
        traits: ['Research', 'Report Writing', 'Logic'],
        roadmap: [
            { step: 'Step 1', description: 'Strong Research Skills' },
            { step: 'Step 2', description: 'Learn Data Visualization' },
            { step: 'Step 3', description: 'Industry Specific Knowledge' },
            { step: 'Step 4', description: 'Publish Reports/Articles' },
        ],
    },

    // Social Careers
    {
        id: 'product-manager',
        title: 'Product Manager',
        emoji: '🚀',
        description: 'Lead cross-functional teams to build products customers love.',
        matchType: 'social',
        matchPercentage: 93,
        salaryRange: '12-45 LPA',
        salaries: {
            fresher: '₹12L',
            mid: '₹25L',
            senior: '₹45L',
            lead: '₹75L+',
        },
        traits: ['Leadership', 'Communication', 'Strategy'],
        roadmap: [
            { step: 'Step 1', description: 'Understand User Needs' },
            { step: 'Step 2', description: 'Learn Agile Methodologies' },
            { step: 'Step 3', description: 'Build Simple Projects' },
            { step: 'Step 4', description: 'APM Programs' },
        ],
    },
    {
        id: 'hr-manager',
        title: 'HR Manager',
        emoji: '🤝',
        description: 'Manage the most important asset of any company: its people.',
        matchType: 'social',
        matchPercentage: 89,
        salaryRange: '5-18 LPA',
        salaries: {
            fresher: '₹5L',
            mid: '₹12L',
            senior: '₹18L',
            lead: '₹28L+',
        },
        traits: ['Empathy', 'Organization', 'Conflict Resolution'],
        roadmap: [
            { step: 'Step 1', description: 'Study Psychology/Business' },
            { step: 'Step 2', description: 'Learn Labor Laws' },
            { step: 'Step 3', description: 'Develop Soft Skills' },
            { step: 'Step 4', description: 'HR Internships' },
        ],
    },
    {
        id: 'digital-marketer',
        title: 'Digital Marketer',
        emoji: '📣',
        description: 'Connect with audiences online to promote brands and products.',
        matchType: 'social',
        matchPercentage: 88,
        salaryRange: '4-18 LPA',
        salaries: {
            fresher: '₹4L',
            mid: '₹10L',
            senior: '₹18L',
            lead: '₹30L+',
        },
        traits: ['Social Media', 'Persuasion', 'Trends'],
        roadmap: [
            { step: 'Step 1', description: 'Learn SEO & SEM' },
            { step: 'Step 2', description: 'Master Social Media Ads' },
            { step: 'Step 3', description: 'Content Marketing' },
            { step: 'Step 4', description: 'Run Live Campaigns' },
        ],
    },

    // Technical Careers
    {
        id: 'software-developer',
        title: 'Software Developer',
        emoji: '💻',
        description: 'Build the applications and systems that run the world.',
        matchType: 'technical',
        matchPercentage: 96,
        salaryRange: '8-35 LPA',
        salaries: {
            fresher: '₹8L',
            mid: '₹18L',
            senior: '₹35L',
            lead: '₹60L+',
        },
        traits: ['Coding', 'Logic', 'Persistence'],
        roadmap: [
            { step: 'Step 1', description: 'Learn HTML/CSS/JS' },
            { step: 'Step 2', description: 'Pick a Framework (React)' },
            { step: 'Step 3', description: 'Build Real Projects' },
            { step: 'Step 4', description: 'Contribute to Open Source' },
        ],
    },
    {
        id: 'cybersecurity-expert',
        title: 'Cybersecurity Expert',
        emoji: '🔒',
        description: 'Protect systems and networks from digital attacks.',
        matchType: 'technical',
        matchPercentage: 94,
        salaryRange: '7-30 LPA',
        salaries: {
            fresher: '₹7L',
            mid: '₹18L',
            senior: '₹30L',
            lead: '₹50L+',
        },
        traits: ['Security', 'Networking', 'Problem Solving'],
        roadmap: [
            { step: 'Step 1', description: 'Learn Networking Basics' },
            { step: 'Step 2', description: 'Learn Linux & Scripting' },
            { step: 'Step 3', description: 'Get Certified (CompTIA)' },
            { step: 'Step 4', description: 'CTF Competitions' },
        ],
    },
    {
        id: 'devops-engineer',
        title: 'DevOps Engineer',
        emoji: '⚙️',
        description: 'Bridge the gap between development and operations.',
        matchType: 'technical',
        matchPercentage: 91,
        salaryRange: '9-35 LPA',
        salaries: {
            fresher: '₹9L',
            mid: '₹20L',
            senior: '₹35L',
            lead: '₹55L+',
        },
        traits: ['Automation', 'Cloud (AWS)', 'Scripting'],
        roadmap: [
            { step: 'Step 1', description: 'Learn Linux System Admin' },
            { step: 'Step 2', description: 'Learn CI/CD Pipelines' },
            { step: 'Step 3', description: 'Master Docker & K8s' },
            { step: 'Step 4', description: 'Cloud Certification' },
        ],
    },
];
