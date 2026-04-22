export interface ResourceLink {
  name: string;
  url: string;
  desc: string;
  badge?: string;
}

export interface DorkQuery {
  label: string;
  tag: string;
  tagClass: string;
  query: string;
}

export const SMART_JOB_BOARDS: ResourceLink[] = [
  { name: 'hiring.cafe',            url: 'https://hiring.cafe/',                              desc: 'Modern job aggregator with real-time filtering and transparency scores. Less noise than the big boards.' },
  { name: 'AI Hacker Jobs',         url: 'https://aihackerjobs.com/',                         desc: 'AI-focused job board with an autonomous agent that scouts matches, customizes your resume per application, and coaches you through interviews.' },
  { name: 'VC Careers',             url: 'https://venturecapitalcareers.com/',                desc: 'Jobs specifically at VC and PE firms. Analyst to Partner-track roles.' },
  { name: 'Thiel Fellowship Jobs',  url: 'https://thielfellowship.org/jobs',                  desc: 'Roles at companies founded by Thiel Fellows. Exceptional early-stage opportunities.' },
  { name: 'Built In',               url: 'https://builtin.com/jobs',                          desc: 'Tech company jobs with culture data and salary ranges. City-specific editions.' },
  { name: 'Handshake Employers A-Z',url: 'https://app.joinhandshake.com/employers/a',         desc: 'Full alphabetical directory of employers on Handshake. Browse /employers/a through /employers/z for company discovery.' },
  { name: 'New Grad Jobs',          url: 'https://www.newgrad-jobs.com/',                     desc: 'Entry-level and new graduate focused board. Updated daily. Organized by role type.' },
  { name: 'Blockchain Jobs (Solana)',url: 'https://jobs.solana.com/jobs',                     desc: 'Solana ecosystem jobs. Similar boards exist for Ethereum, Polkadot, and other protocols.' },
  { name: 'Crypto Jobs List',       url: 'https://cryptojobslist.com',                        desc: 'Largest crypto-native job board across all chains. Engineering, research, and ops roles.' },
];

export const TECH_BLOGS: ResourceLink[] = [
  { name: 'Jane Street Tech Blog', url: 'https://blog.janestreet.com/',                     desc: 'Deep technical posts on trading systems, OCaml, and distributed computing from one of the most selective quant firms.' },
  { name: '3Blue1Brown',           url: 'https://www.3blue1brown.com/',                     desc: 'Visual mathematics: linear algebra, calculus, neural networks. Essential for ML intuition.' },
  { name: 'DS4A',                  url: 'https://www.correlation-one.com/data-science-for-all', desc: 'Data Science for All fellowship. Structured program with mentorship and real project experience.' },
  { name: 'JOE - Econ Jobs',       url: 'https://www.aeaweb.org/joe/listings',             desc: 'Job Openings for Economists. The definitive board for economics research, policy, and finance roles.' },
  { name: 'Kaggle',                url: 'https://www.kaggle.com/',                          desc: 'Competitions, public datasets, and community notebooks. Competition placements are resume-worthy.' },
  { name: 'Mathjobs.org',          url: 'https://www.mathjobs.org/',                        desc: 'Job board for mathematicians and quantitative researchers in academia and industry.' },
  { name: 'PyCon',                 url: 'https://pycon.org/',                               desc: 'Annual Python conference. Attend for networking, job hunting, and tracking where the ecosystem is going.' },
  { name: 'PyTorch',               url: 'https://pytorch.org/',                             desc: 'Official PyTorch docs and tutorials. Fluency in PyTorch is table stakes for most ML engineering roles.' },
  { name: 'Standup Maths',         url: 'https://www.youtube.com/@standupmaths',            desc: 'Matt Parker making recreational mathematics approachable. Useful for keeping mathematical intuition sharp.' },
];

export const DSA_PREP: ResourceLink[] = [
  { name: 'LeetCode Patterns',    url: 'https://seanprashad.com/leetcode-patterns/',        desc: "Sean Prashad's categorized problem guide. The most efficient approach to recognizing problem types." },
  { name: 'Striver A2Z Sheet',    url: 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z', desc: 'Complete DSA learning path from zero to advanced. TakeUForward flagship resource by Raj Vikramaditya.' },
  { name: 'Striver SDE Sheet',    url: 'https://takeuforward.org/uncategorized/strivers-sde-sheet-challenge', desc: 'Top 180 curated interview problems for SDE roles. Battle-tested by thousands of candidates.' },
  { name: 'NeetCode (Blind 75)',   url: 'https://neetcode.io/',                             desc: 'Blind 75 and NeetCode 150 with video walkthroughs. Gold standard for FAANG-level prep.' },
  { name: 'Abdul Bari',            url: 'https://www.youtube.com/@abdul_bari',              desc: 'Deep-dive DSA series covering algorithms from first principles. The go-to resource for understanding time and space complexity intuitively.' },
  { name: 'Gaurav Sen',            url: 'https://www.youtube.com/@gkcs',                    desc: 'System design and distributed systems explained clearly. Widely used for FAANG-level system design interview prep.' },
  { name: 'Keerti Purswani',       url: 'https://www.youtube.com/channel/UCqPw78XvJUKtGiq3TzAcwJQ', desc: 'System design and CS fundamentals on YouTube. Clear explanations of architecture patterns and interview-level design problems.' },
];

export const SQL_RESOURCES: ResourceLink[] = [
  { name: 'MySQL',               url: 'https://www.mysql.com/',                                     desc: 'The legendary starting point. Learn MySQL first. Every SQL concept transfers. The most widely deployed relational database.' },
  { name: 'Interview Query',     url: 'https://www.interviewquery.com/',                            desc: 'Real SQL interview questions from top tech companies. Includes company-specific question banks and difficulty ratings.' },
  { name: 'StrataScratch',       url: 'https://www.stratascratch.com/',                            desc: 'Actual interview questions from Google, Netflix, Airbnb, and more. Both SQL and Python solutions.' },
  { name: 'DataLemur',           url: 'https://datalemur.com/',                                     desc: 'SQL interview questions from Meta, Amazon, and Twitter. Beginner to advanced with hints and explanations.' },
  { name: 'LeetCode SQL',        url: 'https://leetcode.com/problemset/database/',                  desc: 'LeetCode database category. Essential for FAANG SQL prep. Mix of easy to hard problems across joins, aggregations, and window functions.' },
  { name: 'DataCamp SQL',        url: 'https://www.datacamp.com/courses/introduction-to-sql',      desc: 'Structured SQL learning path from intro to advanced. Good for building foundations before moving to interview prep.' },
  { name: 'Mode Analytics SQL',  url: 'https://mode.com/sql-tutorial/',                            desc: 'Free SQL tutorial with a live query editor. Covers basics to advanced analytics including window functions.' },
  { name: 'SQLBolt',             url: 'https://sqlbolt.com/',                                       desc: 'Interactive SQL lessons with live practice. Best starting point for absolute beginners. Clean and fast.' },
  { name: 'SQLZoo',              url: 'https://sqlzoo.net/',                                         desc: 'Interactive SQL practice with real datasets. Wide range of difficulty. Covers multiple SQL dialects.' },
];

export const AI_ML_LEARNING: ResourceLink[] = [
  { name: 'Claude Skills',        url: 'https://anthropic.skilljar.com/',                   desc: 'Official Anthropic courses on building with Claude and the API. Free, structured, and up to date.' },
  { name: 'Andrej Karpathy',      url: 'https://www.youtube.com/@AndrejKarpathy',           desc: 'Former Tesla AI Director. His neural network and GPT from scratch series is the best ground-up deep learning resource.' },
  { name: 'Andrew Ng',            url: 'https://www.deeplearning.ai/',                      desc: 'DeepLearning.AI: ML specializations, MLOps, LLMs. The industry standard for structured learning paths.' },
  { name: 'DataWars',             url: 'https://www.datawars.io/',                           desc: 'Practice data science with real-world projects. Community-driven platform with hands-on challenges across Python, SQL, and ML. Build your portfolio while you learn.' },
  { name: 'CampusX',              url: 'https://www.youtube.com/@campusx-official',         desc: 'Applied DS and ML content. Excellent for project-based learning and interview prep.' },
  { name: 'Krishnaik',            url: 'https://www.youtube.com/@krishnaik06',              desc: 'Practical data science, ML, and MLOps tutorials. Focuses on job-ready skills and real-world tools.' },
  { name: 'HuggingFace',          url: 'https://huggingface.co/learn',                      desc: 'Free NLP, diffusion, and LLM courses from the team behind Transformers. Hands-on and current.' },
  { name: 'fast.ai',              url: 'https://www.fast.ai/',                               desc: 'Top-down practical deep learning. Jeremy Howard approach: build first, understand theory after.' },
  { name: 'Made With ML',         url: 'https://madewithml.com/',                            desc: 'MLOps and production ML engineering. Covers design, serving, monitoring, and testing.' },
];

export const PYE_LEARNING_PATHS: ResourceLink[] = [
  { name: 'Data Science for Beginners', url: 'https://pye.pages.dev/resources/data-beginners',         desc: 'The precise order of operations for a real data project. EDA, cleaning, feature engineering, train/test, deployment. Python and PySpark examples.' },
  { name: 'Pick Your Sector',           url: 'https://pye.pages.dev/resources/pick-your-sector',       desc: 'How domain context changes your workflow across 16 sectors: Healthcare, FinTech, Climate, Urban Intelligence, HR Analytics, and more.' },
  { name: 'Build Your Data Stack',      url: 'https://pye.pages.dev/resources/build-your-data-stack',  desc: 'Complete guide to building a production-ready data engineering platform on free tiers. GitHub Actions, dbt, BigQuery, MLflow, DVC.' },
  { name: 'Data Science & Analytics',   url: 'https://pye.pages.dev/resources/data-science-analytics', desc: 'SQL, BI tools, statistical modeling, A/B testing. Tableau, Power BI, Python, Statistics.' },
  { name: 'Machine Learning & AI',      url: 'https://pye.pages.dev/resources/AI-ML',                  desc: 'Foundation models, deep learning, NLP, computer vision, MLOps, GenAI. PyTorch, HuggingFace, LangChain, MLflow.' },
  { name: 'Data Engineering',           url: 'https://pye.pages.dev/resources/data-engineering',       desc: 'ETL/ELT pipelines, orchestration, cloud warehouses, streaming, data quality. dbt, Airflow, Spark, Snowflake, Kafka, Databricks.' },
  { name: 'Computer Science',           url: 'https://pye.pages.dev/resources/computer-science',       desc: 'Algorithms, data structures, databases, system design, APIs, full-stack fundamentals. Python, SQL, MongoDB, FastAPI, Docker.' },
];

export const SALARY_INTEL: ResourceLink[] = [
  { name: 'Levels.fyi',           url: 'https://www.levels.fyi',                           desc: 'Most accurate crowdsourced total compensation database. Use before every salary negotiation.' },
  { name: 'Layoffs.fyi',          url: 'https://layoffs.fyi',                              desc: 'Real-time tracker of tech layoffs by company. Helps identify which companies are stable vs contracting.' },
];

export const NETWORKING_TOOLS: ResourceLink[] = [
  { name: 'Luma',                 url: 'https://lu.ma/',                                    desc: 'Modern events platform used by the startup and VC community. Better signal than Meetup for tech.' },
  { name: 'Meetup',               url: 'https://www.meetup.com/',                           desc: 'Find local tech meetups, study groups, and interest-based communities near you.' },
  { name: 'Eventbrite',           url: 'https://www.eventbrite.com/',                       desc: 'Broader events platform. Filter by city and tech keywords to find conferences and hackathons.' },
  { name: 'YC Startup Directory', url: 'https://www.ycombinator.com/companies',             desc: 'Every YC-backed company with hiring status and direct apply links. Search by domain and batch.' },
  { name: 'YC Founders Directory',url: 'https://www.ycombinator.com/founders',             desc: 'All YC founders with LinkedIn and contact. Reach out for mentorship or internship opportunities.' },
];

export const AUTOFILL_TOOLS: ResourceLink[] = [
  { name: 'Jobright.ai',          url: 'https://jobright.ai/',                              desc: 'AI job matching and autofill. Cuts application time significantly and surfaces relevant roles.' },
  { name: 'AI Hacker Jobs',       url: 'https://aihackerjobs.com/',                         desc: 'AI agent that scouts job matches, customizes your resume for every application, and coaches you through the interview process.' },
  { name: 'Simplify',             url: 'https://simplify.jobs/',                            desc: 'One-click autofill across most ATS systems. Install the browser extension and stop retyping.' },
];

export const RESUME_RESOURCES: ResourceLink[] = [
  { name: 'I Got an Offer',       url: 'https://igotanoffer.com/',                          desc: 'Resume reviews, mock interviews, and negotiation guides from ex-FAANG interviewers.' },
  { name: 'Google Resume Guide',  url: 'https://igotanoffer.com/blogs/tech/google-resume-examples-tips', desc: 'Real Google engineer resume examples with line-by-line breakdowns. Applicable to any big tech role.' },
];

export const DORK_QUERIES: DorkQuery[] = [
  {
    label: 'Easy Application Difficulty',
    tag: 'Low friction / ATS-light',
    tagClass: 'bg-emerald-900 text-emerald-300 border border-emerald-800',
    query: `("Data Analyst" OR "Data Scientist" OR "ML Engineer" OR "Product Analyst" OR "Software Engineer" OR "Analyst") ("Junior" OR "Jr" OR "New Grad" OR "Entry Level" OR "Intern" OR "internship") ("USA" OR "US" OR "United States") ("Greenhouse" OR "Ashby" OR "Lever" OR "Workable" OR "BambooHR" OR "Teamtailor" OR "Breezy HR" OR "Pinpoint" OR "Comeet")`,
  },
  {
    label: 'Moderate Difficulty - Major ATS Platforms',
    tag: 'Account required per company',
    tagClass: 'bg-amber-900 text-amber-300 border border-amber-800',
    query: `(site:myworkdayjobs.com OR site:greenhouse.io OR site:icims.com OR site:taleo.net OR site:lever.co OR site:smartrecruiters.com OR site:jobvite.com OR site:workforcenow.adp.com OR site:successfactors.com OR site:brassring.com OR site:jazzhr.com OR site:breezy.hr OR site:bamboohr.com)
("data analyst" OR "business analyst" OR "research analyst" OR "financial analyst" OR "data scientist" OR "machine learning engineer" OR "AI engineer" OR "BI analyst" OR "quantitative analyst" OR "analytics engineer")
("remote" OR "work from home" OR "work from anywhere")`,
  },
  {
    label: 'Find Real Resumes in Your Domain',
    tag: 'PDF dorking',
    tagClass: 'bg-violet-900 text-violet-300 border border-violet-800',
    query: `"data scientist resume" filetype:pdf
"YOUR TARGET ROLE resume" filetype:pdf
site:github.io "resume" "data scientist"
data scientist CV site:edu filetype:pdf
site:behance.net "data scientist" resume`,
  },
  {
    label: 'Find Portfolios and Make Contact',
    tag: 'Network via open source',
    tagClass: 'bg-blue-900 text-blue-300 border border-blue-800',
    query: `"data science portfolio" "case study"
site:github.com "data scientist" "portfolio"
"data scientist" "worked at Google" "project"
site:linkedin.com "data scientist" "Google"
"[your target role]" portfolio "resume.pdf"`,
  },
  {
    label: 'LinkedIn Active Hiring Signal',
    tag: 'Paste in LinkedIn search',
    tagClass: 'bg-slate-700 text-slate-300 border border-slate-600',
    query: `"I am hiring" OR "We are hiring" OR "We are looking for" OR "I am looking for"

Paste into LinkedIn search bar. Filter by:
  Connections (2nd degree for warm intro)
  Date posted: Past week
  Location: Your target city`,
  },
];
