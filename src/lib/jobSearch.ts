export interface Role {
  label: string;
  aliases?: string[];
}

export interface RoleGroup {
  label: string;
  roles: Role[];
}

export interface ATSSegment {
  key: string;
  label: string;
  sublabel: string;
  sites: string[];
  color: string;
}

export interface Level {
  label: string;
  query: string;
}

export interface LocationHub {
  label: string;
  terms: string[];
}

export interface PostedTime {
  label: string;
  tbs: string;
}

export const ROLE_GROUPS: RoleGroup[] = [
  {
    label: 'Data Science & AI',
    roles: [
      { label: 'Data Scientist' },
      { label: 'Applied Scientist', aliases: ['Applied Research Scientist'] },
      { label: 'ML Engineer', aliases: ['Machine Learning Engineer', 'MLE'] },
      { label: 'AI Engineer', aliases: ['AI SWE', 'AI Developer', 'AI Software Engineer'] },
      { label: 'Computer Vision', aliases: ['CV Engineer', 'Vision Engineer'] },
      { label: 'NLP Specialist', aliases: ['NLP Engineer', 'Natural Language Processing'] },
      { label: 'AI Research Scientist', aliases: ['Research Scientist'] },
      { label: 'MLOps', aliases: ['ML Platform Engineer', 'ML Infrastructure'] },
    ],
  },
  {
    label: 'Analytics & Intelligence',
    roles: [
      { label: 'Analytical Engineer' },
      { label: 'Product Analyst' },
      { label: 'Data Analyst' },
      { label: 'Business Intelligence', aliases: ['BI Engineer'] },
      { label: 'BI Analyst' },
      { label: 'BI Developer' },
      { label: 'Marketing Analyst' },
      { label: 'Growth Analyst' },
    ],
  },
  {
    label: 'Specialized Ops & SCM',
    roles: [
      { label: 'SCM Analyst', aliases: ['Supply Chain Analyst'] },
      { label: 'Supply Chain Data Scientist' },
      { label: 'Operations Analyst', aliases: ['Ops Analyst'] },
      { label: 'Logistics Data Engineer' },
      { label: 'Procurement Analyst' },
      { label: 'Business Analyst', aliases: ['BA'] },
    ],
  },
  {
    label: 'Infrastructure & Cloud',
    roles: [
      { label: 'Cloud Architect' },
      { label: 'Platform Engineer' },
      { label: 'SRE', aliases: ['Site Reliability Engineer', 'Reliability Engineer'] },
      { label: 'DevOps', aliases: ['DevOps Engineer', 'DevSecOps'] },
      { label: 'Data Architect' },
    ],
  },
  {
    label: 'Software & Platform',
    roles: [
      { label: 'Software Engineer', aliases: ['SWE', 'SDE', 'Software Development Engineer', 'Software Developer'] },
      { label: 'Fullstack Developer', aliases: ['Full Stack Engineer', 'Full-Stack Developer'] },
      { label: 'Backend Engineer', aliases: ['Backend Developer', 'Server-Side Engineer'] },
      { label: 'Frontend Engineer', aliases: ['Frontend Developer', 'UI Engineer'] },
      { label: 'Site Reliability Engineer', aliases: ['SRE'] },
    ],
  },
];

export const ATS_SEGMENTS: ATSSegment[] = [
  {
    key: 'easy',
    label: 'Quick Apply',
    sublabel: '1-page, low friction',
    sites: [
      'boards.greenhouse.io', 'jobs.lever.co', 'jobs.ashbyhq.com',
      'workable.com', 'recruitee.com', 'teamtailor.com',
    ],
    color: 'emerald',
  },
  {
    key: 'medium',
    label: 'Mid-Tier',
    sublabel: 'Account required',
    sites: [
      'bamboohr.com', 'jazzhr.com', 'personio.de',
      'rippling.com', 'humaans.io', 'pinpoint.ai',
    ],
    color: 'amber',
  },
  {
    key: 'hard',
    label: 'Enterprise',
    sublabel: 'Multi-step, portal',
    sites: [
      'myworkdayjobs.com', 'jobs.smartrecruiters.com', 'icims.com',
      'taleo.net', 'successfactors.com', 'oraclecloud.com',
    ],
    color: 'red',
  },
];

export const LEVELS: Level[] = [
  { label: 'Intern',                  query: 'Intern OR Internship' },
  { label: 'New Grad / Early Career', query: '"New Grad" OR "Recent Grad" OR "University" OR "Early Career" OR "Junior"' },
  { label: 'Mid-Level',               query: '"L4" OR "L5" OR "Mid-Level" OR "II" OR "III"' },
  { label: 'Senior / Staff',          query: '"Senior" OR "Sr" OR "Staff" OR "Lead" OR "Principal"' },
];

export const LOCATION_HUBS: LocationHub[] = [
  { label: 'USA',         terms: ['"USA"', '"US"', '"United States"', '"United States of America"'] },
  { label: 'Remote',      terms: ['"remote"', '"work from home"', '"work from anywhere"', '"fully remote"'] },
  { label: 'India',       terms: ['"India"', '"IN"', '"Bangalore"', '"Bengaluru"', '"Hyderabad"', '"Mumbai"', '"Pune"', '"Chennai"'] },
  { label: 'Canada',      terms: ['"Canada"'] },
  { label: 'UK',          terms: ['"UK"', '"United Kingdom"', '"Great Britain"'] },
  { label: 'Germany',     terms: ['"Germany"', '"Deutschland"'] },
  { label: 'Switzerland', terms: ['"Switzerland"', '"CH"'] },
  { label: 'UAE',         terms: ['"UAE"', '"United Arab Emirates"', '"Dubai"'] },
  { label: 'Luxembourg',  terms: ['"Luxembourg"'] },
  { label: 'Singapore',   terms: ['"Singapore"', '"SG"'] },
  { label: 'Australia',   terms: ['"Australia"', '"AU"'] },
];

export const POSTED_TIMES: PostedTime[] = [
  { label: 'Past 1 hour',   tbs: 'qdr:h' },
  { label: 'Past 3 hours',  tbs: 'qdr:h3' },
  { label: 'Past 5 hours',  tbs: 'qdr:h5' },
  { label: 'Past 8 hours',  tbs: 'qdr:h8' },
  { label: 'Past 12 hours', tbs: 'qdr:h12' },
  { label: 'Past 24 hours', tbs: 'qdr:d' },
  { label: 'Last 2 days',   tbs: 'qdr:d2' },
  { label: 'Last 3 days',   tbs: 'qdr:d3' },
  { label: 'Past week',     tbs: 'qdr:w' },
];
