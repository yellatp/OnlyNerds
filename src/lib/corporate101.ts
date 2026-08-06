// ============================================================
// Corporate & Tech 101
// The stuff nobody teaches you in college: how a typical tech
// company is organized, who reports to whom, and the jargon
// cheat sheet everyone assumes you know.
// ============================================================

export interface Corp101Department {
  name: string;
  desc: string;
}

export interface Corp101Role {
  role: string;
  reportsTo: string;
  does: string;
}

export interface Corp101Term {
  term: string;
  means: string;
  sayInstead: string;
}

export interface Corp101TermGroup {
  title: string;
  terms: Corp101Term[];
}

export const CORP101_DEPARTMENTS: Corp101Department[] = [
  { name: 'Engineering / IT', desc: 'Builds and runs the software, data, and infrastructure.' },
  { name: 'Product', desc: 'Decides what to build and why; owns roadmap and priorities.' },
  { name: 'Program / Project Management (PMO)', desc: 'Keeps delivery on schedule, tracks risks, coordinates teams.' },
  { name: 'Business / Operations', desc: 'Runs the daily business: sales, support, finance, HR.' },
  { name: 'Data & Analytics', desc: 'Sits inside or alongside engineering, owning insights, models, and reporting.' },
  { name: 'Security / Compliance / Legal', desc: 'Reviews risk, access, and regulatory obligations.' },
];

export const CORP101_ROLES: Corp101Role[] = [
  { role: 'CEO / CTO / CIO', reportsTo: 'Board', does: 'Executives who set strategy and own the company or its technology.' },
  { role: 'Engineering Manager / Tech Lead', reportsTo: 'Director / VP', does: 'Your usual manager as an engineer; owns the team, reviews, and delivery.' },
  { role: 'Software Engineer (SWE/SDE)', reportsTo: 'Engineering Manager', does: 'Builds features and services. SDE is the common short form in big tech.' },
  { role: 'Data Engineer', reportsTo: 'Data Engineering Lead', does: 'Builds pipelines and the data platform everyone else relies on.' },
  { role: 'Data Analyst', reportsTo: 'Analytics/BI Manager', does: 'Answers business questions with data; owns dashboards and reports.' },
  { role: 'Data Scientist', reportsTo: 'Data Science Manager', does: 'Builds models and experiments to drive decisions.' },
  { role: 'ML Engineer / AI Engineer', reportsTo: 'ML/Data Science Manager', does: 'Turns models into reliable production services.' },
  { role: 'DevOps / Platform Engineer', reportsTo: 'Infra/Platform Manager', does: 'Owns CI/CD, environments, reliability, and cloud.' },
  { role: 'QA / SDET', reportsTo: 'QA / Engineering Manager', does: 'Owns testing. SDET = Software Development Engineer in Test.' },
  { role: 'Product Manager (PM)', reportsTo: 'Head of Product', does: 'Defines requirements, success metrics, and priorities.' },
  { role: 'Scrum Master / Agile Coach', reportsTo: 'PMO / Engineering', does: 'Facilitates Scrum ceremonies and removes blockers.' },
];

export const CORP101_TERM_GROUPS: Corp101TermGroup[] = [
  {
    title: 'Tech & delivery acronyms',
    terms: [
      { term: 'SLA', means: 'Service Level Agreement. A formal contract or commitment defining the minimum standard of service, e.g. 99.9% uptime or P95 latency under 100ms.', sayInstead: '' },
      { term: 'PR / MR', means: 'Pull Request / Merge Request. Submitting your code branch for teammates to review before it is merged into the main project.', sayInstead: '' },
      { term: 'QA', means: 'Quality Assurance. The team or process that tests software to ensure it works and meets requirements before release.', sayInstead: '' },
      { term: 'UAT', means: 'User Acceptance Testing. The final phase where actual users or clients confirm the software solves their business problem.', sayInstead: '' },
      { term: 'BVT / Smoke Test', means: 'Build Verification Test. Initial tests on a fresh build to check it is stable enough for deeper testing.', sayInstead: '' },
      { term: 'KPI', means: 'Key Performance Indicator. A measurable value for how well a person, team, or company achieves objectives, e.g. resolve 20 tickets a day.', sayInstead: '' },
      { term: 'CI/CD', means: 'Continuous Integration / Continuous Deployment. Automated pipelines that build, test, and deploy code updates.', sayInstead: '' },
      { term: 'LGTM', means: 'Looks Good To Me. A quick comment developers leave on a PR to approve code.', sayInstead: '' },
      { term: 'MVP', means: 'Minimum Viable Product. A basic version with just enough features to satisfy early customers.', sayInstead: '' },
      { term: 'POC', means: 'Proof of Concept. A small-scale test to prove whether a new idea or software will actually work.', sayInstead: '' },
      { term: 'RFC', means: 'Request for Comments. A document proposing a new idea or system design for the team to review and critique before building it.', sayInstead: '' },
      { term: 'RTM', means: 'Read The Manual (or Read The Message). A nudge to check documentation before asking.', sayInstead: '' },
      { term: 'E2E', means: 'End-to-End. Testing a complete user journey from start to finish across all systems.', sayInstead: '' },
      { term: 'Bug / Defect', means: 'A flaw in software that produces an incorrect or unexpected result.', sayInstead: '' },
      { term: 'RCA', means: 'Root Cause Analysis. Investigating why a major bug or outage happened so it does not happen again.', sayInstead: '' },
      { term: 'Test Case', means: 'A set of conditions or variables used to determine whether a software feature works.', sayInstead: '' },
      { term: 'REPO', means: 'Repository. A storage location (like GitHub) where code is kept.', sayInstead: '' },
      { term: 'SOP', means: 'Standard Operating Procedure. Step-by-step written instructions for doing routine work consistently. Not the academic Statement of Purpose.', sayInstead: '' },
      { term: 'Ad-hoc', means: 'Done on an as-needed, case-by-case basis. An ad-hoc task is an unplanned, spontaneous request outside your regular schedule.', sayInstead: '' },
    ],
  },
  {
    title: 'Data team terms',
    terms: [
      { term: 'DW / Data Lake / Lakehouse', means: 'Central storage for large data volumes. A data warehouse (Snowflake, BigQuery) holds clean, structured data for analysis; a data lake holds raw data of all kinds; a lakehouse combines both.', sayInstead: '' },
      { term: 'ETL / ELT', means: 'Extract, Transform, Load (or Load first). Extract from a source, transform and clean it, load it into a warehouse. ELT loads raw data first and transforms it in the cloud.', sayInstead: '' },
      { term: 'DAG', means: 'Directed Acyclic Graph. The task-and-dependency flowchart you constantly hear about if your team uses Airflow or similar orchestration.', sayInstead: '' },
      { term: 'Schema', means: 'The blueprint of how data is organized in a database: tables, columns, data types, and relationships.', sayInstead: '' },
      { term: 'Ad-hoc Query', means: 'A quick, unplanned database search or report pulled on the spot to answer an urgent business question.', sayInstead: '' },
      { term: 'Data Drift', means: 'When the statistical properties of incoming data change over time, silently breaking models or dashboards.', sayInstead: '' },
      { term: 'BI', means: 'Business Intelligence. Turning raw data into dashboards and charts using tools like Tableau, Power BI, or Looker.', sayInstead: '' },
      { term: 'SQL', means: 'Structured Query Language. The universal language used to talk to databases.', sayInstead: '' },
    ],
  },
  {
    title: 'Developer terms',
    terms: [
      { term: 'Commit / Push / Merge', means: 'Commit saves a local checkpoint of code. Push uploads local checkpoints to the remote repo. Merge combines a branch into the main project (main or master).', sayInstead: '' },
      { term: 'Merge Conflict', means: 'When two people edit the same line of code differently and the system cannot decide which to keep, forcing a manual fix.', sayInstead: '' },
      { term: 'Refactoring', means: 'Cleaning up and restructuring code without changing its external behavior.', sayInstead: '' },
      { term: 'Tech Debt', means: 'Shortcut code written quickly to meet a deadline that everyone knows needs to be rewritten properly later.', sayInstead: '' },
      { term: 'Deployment / Release', means: 'Pushing code from testing environments to Prod so real users can use it.', sayInstead: '' },
      { term: 'Hotfix', means: 'An emergency fix pushed straight to production outside the normal release schedule to patch a critical bug.', sayInstead: '' },
      { term: 'Stack Trace / Error Logs', means: 'The output that tells you exactly what went wrong and on which line when code crashes.', sayInstead: '' },
      { term: 'Bug Bash', means: 'A coordinated event to find and fix as many bugs as possible.', sayInstead: '' },
      { term: 'Ship It', means: 'Slang for launching or releasing something into production. Usually a celebratory vibe.', sayInstead: '' },
      { term: 'Churn', means: 'When users, customers, or staff stop using a product or leave. High churn is bad news.', sayInstead: '' },
      { term: 'Boilerplate', means: 'Standard, pre-written blocks of code or document templates reused for every new project.', sayInstead: '' },
      { term: 'Spike', means: 'A time-boxed research task. "I need a spike on this API" means "give me a day to test if it works".', sayInstead: '' },
      { term: 'Story Points', means: 'A rough estimate of the effort or complexity of a task, used in sprint planning.', sayInstead: '' },
    ],
  },
  {
    title: 'Environments & operations',
    terms: [
      { term: 'Prod', means: 'Production. The live environment real users use. Rule of thumb: never break Prod.', sayInstead: '' },
      { term: 'Non-Prod / Staging / UAT', means: 'Testing environments that look like Prod but are safe to break without affecting real users.', sayInstead: '' },
      { term: 'VPC / VPN', means: 'Virtual Private Cloud / Virtual Private Network. Secure, encrypted ways to access company networks or isolate cloud resources.', sayInstead: '' },
      { term: 'Legacy System', means: 'Old software, code, or databases the company still relies on but everyone hates updating.', sayInstead: '' },
      { term: 'ITSM', means: 'IT Service Management. The framework for managing IT services, often run through tools like Jira or ServiceNow.', sayInstead: '' },
      { term: 'Change Management', means: 'A structured approach to implementing change within an organization.', sayInstead: '' },
      { term: 'Operationalize', means: 'Turning a concept or goal into repeatable, measurable processes.', sayInstead: '' },
      { term: 'Business Continuity', means: 'Planning to ensure operations continue during disruptions.', sayInstead: '' },
      { term: 'Sanity Check', means: 'A quick informal test to confirm something is not completely broken before showing anyone.', sayInstead: '' },
      { term: 'Dry Run', means: 'A practice run of a deployment, presentation, or data migration to make sure it goes smoothly when it counts.', sayInstead: '' },
      { term: 'On-call', means: 'The rotation where engineers respond to incidents outside business hours.', sayInstead: '' },
      { term: 'Resource Constraints', means: 'The polite way of saying "we do not have the people or money".', sayInstead: '' },
      { term: 'Scalability', means: 'The ability to grow or handle increased demand efficiently.', sayInstead: '' },
    ],
  },
  {
    title: 'Agile ceremonies & board terms',
    terms: [
      { term: 'Stand-up / Daily', means: 'A short (15 min) morning sync where everyone says what they did yesterday, what they are doing today, and whether they are blocked.', sayInstead: '' },
      { term: 'Sprint', means: 'A fixed timeframe (usually 1-2 weeks) in which a team commits to completing a batch of backlog tasks.', sayInstead: '' },
      { term: 'Retrospective', means: 'A meeting at the end of a sprint to reflect on what went well and what could be improved.', sayInstead: '' },
      { term: 'Backlog', means: 'A prioritized list of tasks, features, or bug fixes that still need to be done.', sayInstead: '' },
      { term: 'WIP', means: 'Work In Progress. Tasks started but not finished. Teams often limit WIP to avoid burnout.', sayInstead: '' },
      { term: 'BLOCKED / Blocker', means: 'A status meaning you cannot move forward because you are waiting on someone or a missing resource.', sayInstead: '' },
      { term: 'Backburner', means: 'To de-prioritize a task or put it on hold.', sayInstead: '' },
    ],
  },
  {
    title: 'Communication shorthand',
    terms: [
      { term: 'EOD / COB', means: 'End of Day / Close of Business (usually 5:00 PM). "Send me that report by EOD."', sayInstead: 'State the exact date and time, e.g. by 4pm PST Monday' },
      { term: 'OOO', means: 'Out of Office (vacation or away message).', sayInstead: '' },
      { term: 'FYI / FYA', means: 'For Your Information / For Your Action.', sayInstead: '' },
      { term: 'BRB', means: 'Be Right Back.', sayInstead: '' },
      { term: 'TBD', means: 'To Be Decided.', sayInstead: '' },
      { term: 'ETA', means: 'Estimated Time of Arrival (or when a task or fix will be finished).', sayInstead: '' },
      { term: 'ASAP', means: 'As Soon As Possible. Used when something is urgently required.', sayInstead: '' },
      { term: 'Reaching Out', means: 'A polished way of saying you are initiating contact to request input, share updates, or chase something.', sayInstead: '' },
      { term: 'Ping', means: 'Send a quick message or notification. "I will ping Sean."', sayInstead: 'Contact' },
      { term: 'Touch Base', means: 'Quickly connect or check in. "Let me touch base after lunch."', sayInstead: 'Follow up' },
    ],
  },
  {
    title: 'Performance & productivity',
    terms: [
      { term: 'Bandwidth', means: 'How much time or mental energy someone has for a task or new work. "I do not have bandwidth for that this week."', sayInstead: 'Availability' },
      { term: 'Move the Needle', means: 'Make a noticeable, measurable impact on a project or metric.', sayInstead: 'Effective' },
      { term: 'North Star Metric', means: 'A single key metric that best captures the value delivered to users.', sayInstead: '' },
      { term: 'Time to Value (TTV)', means: 'The time it takes for a customer or user to realize the benefit of a product or service.', sayInstead: '' },
      { term: 'Outcomes Over Outputs', means: 'Focusing on results and impact rather than activity and deliverables.', sayInstead: '' },
      { term: 'Fail Forward', means: 'Embracing mistakes as learning opportunities.', sayInstead: '' },
      { term: 'Deliverable', means: 'Something (tangible or intangible) produced as part of a project.', sayInstead: 'Outcome' },
      { term: 'Action Item', means: 'A task or action that needs to be performed by an individual or team. A to-do list item.', sayInstead: '' },
      { term: 'Quick Win', means: 'A fast task that shows progress on paper, though it may not move the real metrics.', sayInstead: '' },
      { term: 'Low-Hanging Fruit', means: 'Easy wins that require minimal effort.', sayInstead: 'Easy task' },
      { term: 'Mission Critical', means: 'Absolutely essential to the success or function of the business.', sayInstead: 'Crucial' },
      { term: 'Core Competency', means: 'A company or employee defining strength or capability.', sayInstead: '' },
      { term: 'Big Rock Items', means: 'The most critical priorities in a given quarter or year.', sayInstead: '' },
      { term: 'Value Add', means: 'An improvement that increases the worth of a product, service, or process.', sayInstead: 'Benefit' },
      { term: 'Synergy', means: 'Combined effort that leads to better results than individual efforts.', sayInstead: 'Teamwork' },
      { term: 'Wheelhouse', means: 'Your area of expertise or skill. "Excel formulas are not in my wheelhouse."', sayInstead: 'Strength' },
    ],
  },
  {
    title: 'Meetings & corporate buzzwords',
    terms: [
      { term: 'Circle Back', means: 'Revisit a topic later, usually after gathering more info.', sayInstead: 'Follow up' },
      { term: 'Close the Loop', means: 'Wrap up a topic or process with a firm conclusion.', sayInstead: 'Finish' },
      { term: 'Double-Click', means: 'Dig deeper into a topic or issue.', sayInstead: 'Explore' },
      { term: 'Download', means: 'Give information to other team members. "Here to download last week call."', sayInstead: 'Share' },
      { term: 'Full Disclosure', means: 'Complete admission of information related to a situation or decision.', sayInstead: '' },
      { term: 'Hard Stop', means: 'A firm end time for a meeting or commitment.', sayInstead: 'End' },
      { term: 'Ideate / Brainstorm', means: 'Generate new ideas, usually as a group.', sayInstead: 'Brainstorm' },
      { term: 'Leverage', means: 'Use strategies, relationships, or resources to maximum benefit.', sayInstead: 'Make the most of' },
      { term: 'Mind Meld', means: 'Come together to share ideas and perspectives before something important.', sayInstead: 'Discussion' },
      { term: 'Take It Offline', means: 'Move a discussion out of a large meeting into a private chat or 1-on-1.', sayInstead: 'Later' },
      { term: 'Out of Pocket', means: 'Unreachable for a while (or, in some contexts, "I paid for it myself").', sayInstead: 'Unavailable' },
      { term: 'Piggyback', means: 'Build on an existing idea or initiative instead of starting from scratch.', sayInstead: 'Build on' },
      { term: 'Pivot', means: 'Strategically shift direction or focus in response to changes.', sayInstead: 'Switch' },
      { term: 'Punt', means: 'Postpone a decision or task to a later time.', sayInstead: 'Delay' },
      { term: 'Put a Pin in It', means: 'Temporarily set aside a topic or decision.', sayInstead: 'Pause' },
      { term: 'Park It', means: 'Hold a project or idea until approval or another event occurs.', sayInstead: '' },
      { term: 'Table This', means: 'Postpone or set aside a topic or decision for a later date.', sayInstead: 'Move on' },
      { term: '30,000-Foot View', means: 'Consider the big picture rather than getting hung up on details.', sayInstead: 'Overview' },
      { term: 'Alignment', means: 'A shared understanding of a goal and how to work toward it together.', sayInstead: 'Agreement' },
      { term: 'Deep Dive', means: 'A thorough, detailed look into a problem, dataset, or piece of code.', sayInstead: '' },
      { term: 'Drill Down', means: 'Look at the details of something rather than the summary.', sayInstead: '' },
      { term: 'Flesh Out', means: 'Expand a vague idea into a detailed, concrete plan.', sayInstead: '' },
      { term: 'Brain Dump', means: 'Pour out every idea or pointer in your head, useful or not, during a brainstorm.', sayInstead: '' },
      { term: 'Blue-Sky Thinking', means: 'Creative, out-of-the-box idea generation with no constraints.', sayInstead: '' },
      { term: 'Think Outside the Box', means: 'Come up with creative, non-obvious solutions.', sayInstead: '' },
      { term: 'In the Weeds', means: 'Knee-deep in unnecessary detail, having lost the big picture.', sayInstead: '' },
      { term: 'Ducks in a Row', means: 'Prepared and organized for a task or presentation.', sayInstead: '' },
      { term: 'Herding Cats', means: 'Trying to align a team where no one agrees, reads emails, or shows up on time.', sayInstead: '' },
      { term: 'Boil the Ocean', means: 'Take on an impossibly large task or widen scope until it becomes unmanageable.', sayInstead: '' },
      { term: 'Break Down Silos', means: 'Collaborate across teams to reduce barriers and improve efficiency.', sayInstead: '' },
      { term: 'Run It Up the Flagpole', means: 'Propose an idea to gauge reaction or get feedback before committing.', sayInstead: '' },
      { term: 'Get on Board', means: 'Agree with a plan, strategy, or idea.', sayInstead: '' },
      { term: 'Good to Go', means: 'Confirmed that a task, project, or action is fine and can proceed.', sayInstead: '' },
      { term: 'Game Changer', means: 'A unique plan or idea that gives a significant competitive advantage.', sayInstead: '' },
      { term: 'Move the Goalposts', means: 'Changing the objectives, scope, or requirements after work has started.', sayInstead: '' },
      { term: 'At the End of the Day', means: 'Corporate filler meaning "ultimately" or "when all is said and done".', sayInstead: '' },
      { term: 'Strategic Alignment', means: 'Ensuring all work aligns with business goals.', sayInstead: '' },
    ],
  },
  {
    title: 'Strategy & leadership',
    terms: [
      { term: 'Disrupt', means: 'Innovate or introduce something new that changes a market.', sayInstead: 'Change' },
      { term: 'Scale', means: 'Expand a team, product, service, or business to handle more demand.', sayInstead: 'Grow' },
      { term: 'Seamless', means: 'A process or experience that is smooth and easy.', sayInstead: 'Easy' },
      { term: 'Traction', means: 'When a business, idea, or campaign is gaining momentum and achieving results.', sayInstead: '' },
      { term: 'Headwinds', means: 'Challenges or constraints that slow down business growth.', sayInstead: '' },
      { term: 'Paradigm Shift', means: 'A major change in approach or perspective about a business idea or brand.', sayInstead: '' },
      { term: 'Trim the Fat', means: 'Cut down or reduce unnecessary expenses or project details.', sayInstead: '' },
      { term: 'Silver Bullet', means: 'A one-stop, easy solution to a very complicated problem.', sayInstead: '' },
      { term: 'Pain Point', means: 'A problem or challenge the business keeps mentioning and needs solved.', sayInstead: '' },
      { term: 'Resonate', means: 'When an idea or message connects with someone. "That pitch resonated."', sayInstead: '' },
      { term: 'Evangelist', means: 'A customer or employee who is a strong advocate and promotes the brand.', sayInstead: '' },
      { term: 'Skin in the Game', means: 'Having a personal interest in the outcome of a project or decision.', sayInstead: '' },
      { term: 'Push the Envelope', means: 'Push beyond current limits and get the most out of someone or something.', sayInstead: '' },
      { term: 'Reinvent the Wheel', means: 'Re-do work that has already been done instead of reusing it.', sayInstead: '' },
      { term: 'Laser Focus', means: 'Extreme, single-minded focus on one thing.', sayInstead: '' },
      { term: 'Jump the Shark', means: 'When a brand is no longer preferred by consumers or quality has declined.', sayInstead: '' },
      { term: 'White Paper', means: 'A detailed business or technical report on a specific subject.', sayInstead: '' },
      { term: 'Deck', means: 'A PowerPoint or Google Slides presentation, e.g. an investor deck.', sayInstead: '' },
      { term: 'One-Pager', means: 'A single-page summary of a report or plan.', sayInstead: '' },
      { term: 'Land and Expand', means: 'A sales strategy: get in small, then sell more once you are in the door.', sayInstead: '' },
      { term: 'Go-to-Market', means: 'The polished way of saying "we are launching something and hoping it does not flop".', sayInstead: '' },
      { term: 'Stakeholder', means: 'Anyone affected by or interested in a project outcome: executives, users, product managers, etc.', sayInstead: '' },
      { term: 'Cross-Functional Collaboration', means: 'Teams from different departments working together.', sayInstead: '' },
    ],
  },
  {
    title: 'Enterprise systems',
    terms: [
      { term: 'SAP', means: 'Systems, Applications, and Products. A massive suite big companies use for HR, payroll, supply chain, and finance. If a company "runs on SAP", its core business data lives inside it.', sayInstead: '' },
      { term: 'ERP', means: 'Enterprise Resource Planning. The broad category of software (like SAP) that ties all business departments together.', sayInstead: '' },
      { term: 'CRM', means: 'Customer Relationship Management. Software (like Salesforce) to track customer interactions, sales pipelines, and support tickets.', sayInstead: '' },
      { term: 'IAM', means: 'Identity and Access Management. The systems and rules controlling who has access to what software and data.', sayInstead: '' },
    ],
  },
  {
    title: 'Company culture slang',
    terms: [
      { term: 'Clock Watcher', means: 'A colleague who actually leaves on time, which some find suspicious.', sayInstead: '' },
      { term: 'Hot Desking', means: 'Unassigned desks; you hunt for a chair, charger, and sometimes your will to live.', sayInstead: '' },
      { term: 'Dumpster Fire', means: 'When everything is falling apart but the email still ends politely.', sayInstead: '' },
      { term: 'Fire Drill', means: 'A last-minute panic dressed up as a priority, often caused by someone else planning.', sayInstead: '' },
      { term: 'Drink the Kool-Aid', means: 'Total belief in the company culture, no matter how unusual it seems.', sayInstead: '' },
      { term: 'Balls in the Air', means: 'Several activities or tasks going on simultaneously. Same as "too much on the plate".', sayInstead: '' },
      { term: 'Bring to the Table', means: 'The skills, expertise, ideas, or experience you offer to a project or organization.', sayInstead: '' },
      { term: 'Buy-In', means: 'Convincing people to agree to something they did not ask for.', sayInstead: '' },
      { term: 'Baked In', means: 'Already included. Used for factors "baked in" to a model, plan, or roadmap.', sayInstead: '' },
      { term: 'Above My Paygrade', means: 'A polite way to avoid a decision: "I do not want to deal with this, and I do not have to."', sayInstead: '' },
      { term: 'No-Brainer', means: 'An "obvious" decision, where disagreeing feels risky.', sayInstead: '' },
      { term: 'One-on-One', means: 'A private manager meeting, either helpful and relaxed or an awkward review.', sayInstead: '' },
      { term: 'Touchpoint', means: 'Any interaction with a customer or colleague, now tracked somewhere.', sayInstead: '' },
      { term: 'Throw Under the Bus', means: 'Blaming a teammate for something when they do not expect it.', sayInstead: '' },
      { term: 'Make Hay While the Sun Shines', means: 'Take maximum advantage of an opportunity while it lasts.', sayInstead: '' },
      { term: 'Win-Win', means: 'An outcome where everyone is supposedly happy (or at least pretending to be).', sayInstead: '' },
    ],
  },
  {
    title: 'Color tags (systems, deployments, data, AI & teams)',
    terms: [
      { term: 'Greenfield Project', means: 'Building software from scratch on a blank slate - no legacy code, full freedom over the tech stack.', sayInstead: '' },
      { term: 'Brownfield Project', means: 'Developing within an existing codebase or legacy infrastructure, with existing tech debt and compatibility constraints.', sayInstead: '' },
      { term: 'Black-Box (testing/design)', means: 'Testing or interacting with a system without knowing its internals - only inputs and outputs matter.', sayInstead: '' },
      { term: 'White-Box (Clear-Box)', means: 'Testing with full visibility into source code, internal logic, and data flows.', sayInstead: '' },
      { term: 'Gray-Box', means: 'A hybrid - partial internal knowledge (e.g. DB schemas) without full source access.', sayInstead: '' },
      { term: 'Blue-Green Deployment', means: 'Two identical live environments. Blue serves 100% of traffic; Green hosts the new version. Switch traffic via the load balancer for zero downtime and instant rollback.', sayInstead: '' },
      { term: 'Dark Launching / Black Release', means: 'Deploying code or a model to production silently without exposing it to users - used for load tests or comparing outputs against the old version.', sayInstead: '' },
      { term: 'Canary Deployment', means: 'Routing a small slice of traffic (2-5%) to the new version to observe stability before full rollout. Named after the canary in the coal mine.', sayInstead: '' },
      { term: 'Bronze / Silver / Gold (Medallion)', means: 'Data maturity layers: Bronze = raw unrefined data, Silver = cleaned/deduped/joined, Gold = business-ready aggregated models for reporting and ML.', sayInstead: '' },
      { term: 'AI Red Teaming', means: 'Adversarial testing of AI models - jailbreaking LLMs, injecting malicious prompts, or extracting training data to find weaknesses.', sayInstead: '' },
      { term: 'AI Blue Teaming', means: 'Building guardrails to defend against adversarial prompts - system prompts, output filters, safety fine-tuning, content moderation.', sayInstead: '' },
      { term: 'Black-Box AI vs Glass-Box AI', means: 'Black-box AI has decision-making too complex to trace; glass-box (white-box) AI is interpretable (decision trees, linear regression).', sayInstead: '' },
      { term: 'Yellow Team', means: 'The builders - software developers and architects writing functional code and feature backlogs.', sayInstead: '' },
      { term: 'Orange Team', means: 'The educators - cross-functional coaches who train developers on secure coding and threat modeling.', sayInstead: '' },
      { term: 'Purple Team', means: 'Where attack (Red) and defense (Blue) work together continuously to find gaps in CI/CD and monitoring.', sayInstead: '' },
    ],
  },
];

export const CORP101_TOTAL_TERMS = CORP101_TERM_GROUPS.reduce((n, g) => n + g.terms.length, 0);
