// ============================================================
// CATEGORY CLASSIFICATION ENGINE
// Maps job titles to domains, categories, and normalized roles.
// Uses compact regex patterns instead of verbose keyword lists.
// ============================================================

// ── Domain Definitions ─────────────────────────────────────
export const DOMAINS = {
    PROFESSIONAL: 'Professional',
    OPERATIONS: 'Operations & Skilled Work'
};

// ── Category Definitions ───────────────────────────────────
// Each category uses compact regex patterns for matching.
// priority: higher = wins when multiple categories match.
export const CATEGORIES = {
    'Technology': {
        domain: DOMAINS.PROFESSIONAL,
        label: 'Technology',
        // Compact patterns that match software/engineering roles
        patterns: [
            // Core software roles
            /^(software|application|web|mobile|ios|android|game|firmware|qa|test|automation|devops|site reliability|infrastructure|cloud|platform|systems|release|build|tools|api|integration|protocol|runtime|core|low latency|hft|blockchain|crypto|smart contract|web3|scala|java|python|go|rust|c\+\+|c#|node|react|angular|vue|typescript|javascript|full[-\s]stack)\s+(engineer|developer|architect|lead|manager|intern|director|vp|head)/i,
            // Seniority-prefixed roles
            /^(staff|principal|senior|junior|lead|chief|distinguished|fellow)\s+(software|application|web|mobile|ios|android|game|embedded|firmware|qa|test|automation|devops|site reliability|infrastructure|cloud|platform|systems|release|build|tools|api|integration|protocol|runtime|core|low latency|hft|blockchain|crypto|smart contract|web3|scala|java|python|go|rust|c\+\+|c#|node|react|angular|vue|typescript|javascript|full[-\s]stack)\s+(engineer|developer|architect)/i,
            // Architect roles
            /^(solutions|technical|enterprise|system|cloud|infrastructure|devops|platform|data|application|integration|network|security|technology|it)\s+architect/i,
            // Engineering leadership
            /^(director|head|vp|vice president|chief)\s+of\s+(engineering|technology|software|development|platform|infrastructure|devops)/i,
            // Abbreviations and specific titles
            /^(swe|sde|sdet|qa|sre|tpm|em|vpe|cto|devrel|hft|web3)\b/i,
            // Quality/testing roles
            /^quality\s+(assurance|engineer)|test\s+(automation|engineer)|software\s+(engineer|developer)\s+in\s+test/i,
            // Developer relations
            /^(developer\s+(advocate|relations)|devrel|open\s+source\s+engineer)/i,
            // Engineering manager / tech lead
            /^(engineering\s+manager|tech\s+lead|technical\s+program\s+manager|tpm)/i,
            // VP/Director of engineering
            /^(vp\s+engineering|vpe|director\s+of\s+engineering|head\s+of\s+engineering|engineering\s+director)/i,
            // Distinguished/fellow engineer
            /^(distinguished\s+engineer|fellow\s+engineer)/i,
            // Game dev
            /^(game\s+(programmer|dev)|gameplay\s+engineer|graphics\s+programmer)/i
        ],
        aliases: {
            'swe': 'Software Engineer',
            'sde': 'Software Development Engineer',
            'sdet': 'Software Development Engineer in Test',
            'qa': 'Quality Assurance Engineer',
            'sre': 'Site Reliability Engineer',
            'tpm': 'Technical Program Manager',
            'em': 'Engineering Manager',
            'vpe': 'VP of Engineering',
            'cto': 'Chief Technology Officer',
            'devrel': 'Developer Relations Engineer',
            'hft': 'High-Frequency Trading Engineer',
            'web3': 'Web3 Engineer'
        },
        priority: 10
    },

    'IT & Infrastructure': {
        domain: DOMAINS.PROFESSIONAL,
        label: 'IT & Infrastructure',
        patterns: [
            // IT support/admin roles
            /^(it\s+(support|specialist|administrator|manager|director|analyst|consultant|coordinator|technician|auditor|compliance|governance|risk|procurement|vendor\s+manager|asset\s+manager|intern|apprentice|lead|supervisor|team\s+lead|operations\s+manager|scheduler|dispatcher)|help\s*(desk|desk\s+engineer)|desktop\s+support|technical\s+support|service\s+desk)/i,
            // System/network admin
            /^(system\s+administrator|sysadmin|network\s+(engineer|administrator|architect|technician|analyst)|database\s+administrator|dba)/i,
            // Infrastructure/cloud ops
            /^(infrastructure\s+(engineer|architect)|cloud\s+(administrator|operations|engineer)|system\s+engineer|systems\s+(administrator|engineer|analyst)|data\s+center|datacenter|server\s+engineer|storage\s+engineer|backup\s+engineer|virtualization\s+engineer|vmware)/i,
            // IT operations
            /^(it\s+operations|itops|it\s+service\s+management|itsm|incident\s+manager|problem\s+manager|change\s+management|itil|configuration\s+management|cmdb|it\s+asset\s+management|itam)/i,
            // Security operations (lower priority than Security category)
            /^(soc\s+analyst|security\s+operations|network\s+security|information\s+security)/i,
            // Identity/access management
            /^(identity\s+engineer|access\s+management|iam\s+engineer|identity\s+and\s+access\s+management|directory\s+services|active\s+directory|ldap\s+engineer|okta\s+engineer)/i,
            // Endpoint/mobile device management
            /^(endpoint\s+(engineer|administrator)|mobile\s+device\s+management|mdm|intune\s+engineer|sccm\s+engineer|patch\s+management|vulnerability\s+management)/i,
            // Field/service engineering
            /^(field\s+(engineer|technician)|service\s+engineer|support\s+engineer|pc\s+technician|computer\s+engineer|hardware\s+engineer)/i,
            // IT analyst roles
            /^(it\s+(business\s+)?analyst|technical\s+analyst|system\s+analyst|systems\s+analyst)/i,
            // CIO
            /^(cio|chief\s+information\s+officer)/i
        ],
        aliases: {
            'sysadmin': 'System Administrator',
            'dba': 'Database Administrator',
            'itops': 'IT Operations',
            'itsm': 'IT Service Management',
            'itil': 'ITIL',
            'cmdb': 'Configuration Management Database',
            'itam': 'IT Asset Management',
            'iam': 'Identity and Access Management',
            'mdm': 'Mobile Device Management',
            'sccm': 'System Center Configuration Manager',
            'cio': 'Chief Information Officer'
        },
        priority: 5
    },

    'Data & AI': {
        domain: DOMAINS.PROFESSIONAL,
        label: 'Data & AI',
        patterns: [
            // Data science/analysis roles
            /^(data\s+(scientist|analyst|engineer|architect|platform\s+engineer|infrastructure\s+engineer|pipeline\s+engineer|modeler|governance\s+engineer|quality\s+engineer|steward|curator|operations\s+engineer|product\s+manager|product\s+owner|strategist|journalist)|analytics\s+engineer|business\s+intelligence|bi\s+(engineer|analyst|developer))/i,
            // Data warehouse/ETL
            /^(data\s+warehouse|data\s+warehousing|etl\s+(engineer|developer)|data\s+pipeline)/i,
            // ML/AI roles
            /^(machine\s+learning|ml\s+(engineer|ops|scientist|researcher)|ai\s+(engineer|researcher|scientist|developer|ops)|deep\s+learning|nlp|natural\s+language\s+processing|computer\s+vision|cv\s+(engineer|researcher|scientist)|research\s+(scientist|engineer)|applied\s+(scientist|researcher|ml\s+scientist))/i,
            // MLOps/DataOps
            /^(mlops|dataops|ai\s+ops|ai\s+operations|data\s+operations)/i,
            // Abbreviations
            /^(mle|ml\s+engineer|bi\s+engineer|bi\s+analyst|bi\s+developer|etl\s+engineer|etl\s+developer)\b/i
        ],
        aliases: {
            'mle': 'Machine Learning Engineer',
            'ml': 'Machine Learning',
            'nlp': 'Natural Language Processing',
            'cv': 'Computer Vision',
            'bi': 'Business Intelligence',
            'etl': 'Extract Transform Load',
            'mlops': 'ML Operations',
            'dataops': 'Data Operations'
        },
        priority: 10
    },

    'Business & Operations': {
        domain: DOMAINS.PROFESSIONAL,
        label: 'Business & Operations',
        patterns: [
            // Operations roles
            /^(operations\s+(manager|director|analyst|coordinator|associate|lead|vp|head|specialist)|business\s+(operations|analyst|manager|development|partner|strategist|consultant|intelligence|systems\s+analyst)|program\s+(manager|director|coordinator|analyst)|project\s+(manager|coordinator|analyst|scheduler|planner)|product\s+operations|revenue\s+operations|sales\s+operations|marketing\s+operations)/i,
            // Management consulting
            /^(management\s+consultant|strategy\s+(consultant|manager|director|lead)|business\s+consultant|corporate\s+strategy|strategic\s+(planning|advisor)|operations\s+consultant)/i,
            // Supply chain / logistics (professional level)
            /^(supply\s+chain|logistics\s+(manager|director|analyst|coordinator)|procurement|sourcing|vendor\s+manager|purchasing\s+(manager|director)|demand\s+planner|inventory\s+(manager|analyst)|operations\s+research)/i,
            // Program management (non-technical)
            /^(program\s+manager|project\s+manager|pm|pmo|delivery\s+manager|scrum\s+master|agile\s+coach|project\s+coordinator|program\s+coordinator)/i,
            // Business analysis
            /^(business\s+analyst|ba|business\s+systems\s+analyst|process\s+(analyst|engineer|improvement)|requirements\s+analyst)/i,
            // Quality management
            /^(quality\s+(manager|assurance|control|engineer|analyst)|qa\s+(manager|lead)|six\s+sigma|lean\s+(manager|consultant)|continuous\s+improvement)/i,
            // Administrative operations
            /^(office\s+(manager|administrator|coordinator)|executive\s+(assistant|coordinator)|administrative\s+(assistant|coordinator|manager)|operations\s+assistant)/i,
            // PM abbreviation
            /^pm\b/i
        ],
        aliases: {
            'pm': 'Program Manager',
            'pmo': 'Project Management Office',
            'ba': 'Business Analyst',
            'qa': 'Quality Assurance'
        },
        priority: 5
    },

    'Corporate': {
        domain: DOMAINS.PROFESSIONAL,
        label: 'Corporate',
        patterns: [
            // Executive/C-suite
            /^(ceo|chief\s+executive\s+officer|coo|chief\s+operating\s+officer|cfo|chief\s+financial\s+officer|cao|chief\s+administrative\s+officer|cro|chief\s+revenue\s+officer|cmo|chief\s+marketing\s+officer|chief\s+of\s+staff|president|vice\s+president|vp|executive\s+(director|vp|chairman)|board\s+member|managing\s+director)/i,
            // Legal
            /^(legal\s+(counsel|advisor|manager|director|assistant|coordinator|analyst|intern|clerk|paralegal|secretary)|attorney|lawyer|general\s+counsel|compliance\s+(officer|manager|analyst|director)|regulatory\s+(affairs|compliance|manager|analyst)|contract\s+(manager|administrator|analyst)|paralegal|corporate\s+(counsel|secretary|governance)|intellectual\s+property|patent\s+(attorney|agent|engineer)|litigation|employment\s+counsel)/i,
            // HR (non-recruiting)
            /^(hr\s+(manager|director|generalist|coordinator|assistant|business\s+partner|analyst|specialist|vp|head|intern|associate|operations)|human\s+resources|people\s+(operations|manager|partner|analyst|team|director|lead)|talent\s+(management|development|acquisition|operations)|employee\s+(relations|experience|engagement|success)|compensation|benefits|payroll|workforce\s+(planning|analytics)|organizational\s+development|learning\s+and\s+development|l\s*&\s*d|training\s+(manager|coordinator|specialist)|culture\s+(manager|lead)|diversity|equity|inclusion|dei|people\s+analytics|hrbp|hr\s+business\s+partner)/i,
            // Administrative
            /^(administrative\s+(assistant|coordinator|manager|director|support)|executive\s+(assistant|coordinator|administrator)|personal\s+assistant|office\s+(manager|administrator|coordinator)|receptionist|front\s+desk|clerk|administrator|admin\s+(assistant|coordinator|manager))/i,
            // Facilities
            /^(facilities\s+(manager|coordinator|director|engineer|technician)|workplace\s+(manager|experience|operations)|real\s+estate|property\s+(manager|coordinator)|office\s+services|building\s+(manager|engineer))/i,
            // Internal audit
            /^(internal\s+audit|auditor|audit\s+(manager|director|analyst|associate)|risk\s+(manager|analyst|officer|management)|internal\s+controls|sox|sarbanes\s+oxley)/i
        ],
        aliases: {
            'ceo': 'Chief Executive Officer',
            'coo': 'Chief Operating Officer',
            'cfo': 'Chief Financial Officer',
            'cao': 'Chief Administrative Officer',
            'cro': 'Chief Revenue Officer',
            'cmo': 'Chief Marketing Officer',
            'vp': 'Vice President',
            'hrbp': 'HR Business Partner',
            'dei': 'Diversity Equity and Inclusion',
            'l&d': 'Learning and Development',
            'sox': 'Sarbanes-Oxley'
        },
        priority: 3
    },

    'Finance': {
        domain: DOMAINS.PROFESSIONAL,
        label: 'Finance',
        patterns: [
            // Core finance roles
            /^(financial\s+(analyst|manager|director|controller|advisor|consultant|planner|accountant|associate|vp|head|operations|reporting|planning)|finance\s+(manager|director|analyst|vp|controller|associate|intern|operations)|accountant|accounting\s+(manager|director|analyst|clerk|assistant|coordinator|supervisor|vp|controller|intern)|controller|treasury|audit|auditor|tax\s+(manager|analyst|director|accountant|associate|consultant|advisor)|payroll|billing|budget\s+(analyst|manager)|cost\s+(analyst|accountant|engineer|manager))/i,
            // Investment roles
            /^(investment\s+(banker|analyst|associate|manager|consultant|advisor)|private\s+equity|venture\s+capital|vc|hedge\s+fund|portfolio\s+(manager|analyst|associate)|asset\s+(manager|management|analyst)|wealth\s+(manager|management|advisor)|financial\s+advisor|stock\s+broker|trader|trading\s+(analyst|associate|manager)|quant\s+(analyst|developer|trader|researcher)|risk\s+(manager|analyst|officer)|credit\s+(analyst|manager|officer|risk)|underwriter|underwriting)/i,
            // FP&A
            /^(fp\s*&\s*a|financial\s+planning|corporate\s+finance|m\s*&\s*a|mergers\s+and\s+acquisitions)/i,
            // Abbreviations
            /^(cfa|cpa|controller|treasurer|actuary|actuarial)/i
        ],
        aliases: {
            'vc': 'Venture Capital',
            'fp&a': 'Financial Planning and Analysis',
            'm&a': 'Mergers and Acquisitions',
            'cfa': 'Chartered Financial Analyst',
            'cpa': 'Certified Public Accountant'
        },
        priority: 8
    },

    'Product': {
        domain: DOMAINS.PROFESSIONAL,
        label: 'Product',
        patterns: [
            // Product management
            /^(product\s+(manager|owner|director|vp|head|lead|analyst|designer|marketing|operations|intern|associate|coordinator|specialist|strategist|growth|data\s+scientist)|pm\s+(manager|director|lead)|technical\s+product\s+(manager|owner)|associate\s+product\s+(manager|owner)|senior\s+product\s+(manager|owner|director)|group\s+product\s+(manager|director))/i,
            // Product design (overlaps with Design category - lower priority there)
            /^(product\s+designer|ux\s+designer|ui\s+designer|product\s+design\s+(manager|lead|director))/i,
            // PM abbreviation - disambiguate from Program Manager
            // "Product Manager" is more common than "Program Manager" in tech
            /^pm\b/i
        ],
        aliases: {
            'pm': 'Product Manager'
        },
        priority: 9
    },

    'Design': {
        domain: DOMAINS.PROFESSIONAL,
        label: 'Design',
        patterns: [
            // Design roles
            /^(ui\s+(designer|engineer|developer|lead|manager|director)|ux\s+(designer|researcher|engineer|strategist|lead|manager|director|writer|architect)|user\s+(experience|interface)\s+(designer|researcher|engineer|architect)|product\s+designer|visual\s+designer|graphic\s+designer|motion\s+designer|interaction\s+designer|industrial\s+designer|design\s+(manager|director|lead|vp|head|engineer|operations|strategist|researcher|technologist|intern|associate|coordinator|specialist)|creative\s+(director|lead|manager|designer|strategist)|art\s+(director|manager|lead)|brand\s+(designer|manager|strategist|director)|web\s+designer|digital\s+designer|design\s+systems|design\s+engineer|design\s+technologist)/i,
            // UX research
            /^(ux\s+researcher|user\s+researcher|user\s+experience\s+researcher|research\s+(manager|director)\s+of\s+(ux|design|user\s+experience))/i,
            // Design leadership
            /^(head\s+of\s+(design|creative|ux|product\s+design)|vp\s+of\s+(design|creative|ux)|director\s+of\s+(design|creative|ux|product\s+design))/i
        ],
        aliases: {
            'ui': 'User Interface',
            'ux': 'User Experience'
        },
        priority: 8
    },

    'Marketing': {
        domain: DOMAINS.PROFESSIONAL,
        label: 'Marketing',
        patterns: [
            // Marketing roles
            /^(marketing\s+(manager|director|coordinator|specialist|analyst|associate|intern|vp|head|lead|consultant|strategist|operations|automation|communications|assistant|executive|representative|officer)|digital\s+marketing|content\s+(marketing|manager|strategist|writer|creator|specialist|coordinator)|social\s+media\s+(manager|coordinator|specialist|strategist)|seo|sem|ppc|growth\s+(marketing|manager|hacker|lead)|brand\s+(manager|marketing|strategist|director)|product\s+marketing|demand\s+generation|field\s+marketing|email\s+marketing|marketing\s+automation|cmo|chief\s+marketing\s+officer|marketing\s+analytics|marketing\s+science|marketing\s+technology|martech|advertising|media\s+(buyer|planner|manager|director)|public\s+relations|pr\s+(manager|specialist|director)|communications\s+(manager|director|specialist)|corporate\s+communications|events\s+(manager|coordinator|director|planner)|trade\s+marketing|partner\s+marketing|affiliate\s+(marketing|manager)|influencer\s+(marketing|manager))/i,
            // Content-specific
            /^(copywriter|copy\s+writer|technical\s+writer|content\s+writer|content\s+strategist|content\s+manager|content\s+director|editor|editorial|publishing)/i,
            // Growth/marketing science
            /^(growth\s+(manager|lead|hacker|engineer)|marketing\s+(scientist|analytics|engineer)|cmo)/i
        ],
        aliases: {
            'seo': 'Search Engine Optimization',
            'sem': 'Search Engine Marketing',
            'ppc': 'Pay Per Click',
            'cmo': 'Chief Marketing Officer',
            'pr': 'Public Relations',
            'martech': 'Marketing Technology'
        },
        priority: 6
    },

    'Sales': {
        domain: DOMAINS.PROFESSIONAL,
        label: 'Sales',
        patterns: [
            // Sales roles
            /^(sales\s+(manager|director|representative|associate|executive|vp|head|lead|engineer|consultant|analyst|coordinator|specialist|operations|development|enablement|support|assistant|intern|trainer|recruiter|administrator|planner|forecaster)|account\s+(executive|manager|director|representative|vp|lead)|business\s+development|bd\s+(manager|director|vp|lead)|sales\s+development|sdr|bdr|account\s+executive|ae|customer\s+success|cs\s+(manager|director|vp)|client\s+(manager|director|partner|executive|success)|key\s+account|enterprise\s+(sales|account\s+executive|account\s+manager)|inside\s+sales|outside\s+sales|field\s+sales|channel\s+(sales|manager|partner)|partner\s+(manager|sales|director|executive)|revenue\s+(manager|director|operations|vp)|sales\s+enablement|sales\s+operations|sales\s+engineering|solutions\s+(engineer|consultant|architect)|sales\s+consultant|sales\s+trainer|sales\s+recruiter)/i,
            // Customer success
            /^(customer\s+success|customer\s+experience|cx\s+(manager|lead)|client\s+success|success\s+(manager|director|vp))/i,
            // Sales leadership
            /^(vp\s+of\s+(sales|revenue|business\s+development|account\s+management|customer\s+success)|head\s+of\s+(sales|revenue|business\s+development|customer\s+success)|chief\s+revenue\s+officer|cro|chief\s+commercial\s+officer|cco)/i
        ],
        aliases: {
            'sdr': 'Sales Development Representative',
            'bdr': 'Business Development Representative',
            'ae': 'Account Executive',
            'cs': 'Customer Success',
            'cx': 'Customer Experience',
            'cro': 'Chief Revenue Officer',
            'cco': 'Chief Commercial Officer',
            'bd': 'Business Development'
        },
        priority: 7
    },

    'HR & Recruiting': {
        domain: DOMAINS.PROFESSIONAL,
        label: 'HR & Recruiting',
        patterns: [
            // Recruiting roles
            /^(recruiter|recruiting\s+(manager|director|coordinator|specialist|assistant|intern|lead|vp|head|operations|sourcer)|talent\s+(acquisition|sourcer|partner|manager|director|lead|consultant|coordinator|specialist|vp|head)|sourcer|technical\s+recruiter|executive\s+recruiter|campus\s+recruiter|recruitment\s+(manager|consultant|coordinator|specialist)|staffing\s+(manager|coordinator|specialist|consultant)|headhunter)/i,
            // HR generalist/specialist
            /^(hr\s+(generalist|manager|director|coordinator|assistant|business\s+partner|analyst|specialist|vp|head|intern|associate|operations|consultant|administrator)|human\s+resources|people\s+(operations|manager|partner|analyst|team|director|lead|generalist)|employee\s+(relations|experience|engagement|success|communications)|workforce\s+(planning|analytics)|organizational\s+development|talent\s+(management|development)|learning\s+and\s+development|l\s*&\s*d|training\s+(manager|coordinator|specialist|developer)|compensation|benefits|payroll|hrbp|hr\s+business\s+partner|people\s+analytics|people\s+partner|people\s+manager|people\s+director|people\s+vp|people\s+head|people\s+lead|people\s+generalist|people\s+operations|people\s+team|people\s+success|people\s+experience|people\s+engagement|people\s+development|people\s+culture|culture\s+(manager|lead|director)|diversity|equity|inclusion|dei|inclusion\s+(manager|director|lead)|belonging|employee\s+resource\s+group)/i,
            // HR leadership
            /^(chief\s+human\s+resources\s+officer|chro|vp\s+of\s+(hr|human\s+resources|people|talent|recruiting)|head\s+of\s+(hr|human\s+resources|people|talent|recruiting|people\s+operations))/i
        ],
        aliases: {
            'hrbp': 'HR Business Partner',
            'dei': 'Diversity Equity and Inclusion',
            'chro': 'Chief Human Resources Officer',
            'l&d': 'Learning and Development'
        },
        priority: 7
    },

    'Security': {
        domain: DOMAINS.PROFESSIONAL,
        label: 'Security',
        patterns: [
            // Security roles
            /^(security\s+(engineer|analyst|architect|manager|director|consultant|specialist|officer|lead|vp|head|coordinator|administrator|intern|associate|operations|researcher|assessor|auditor|trainer|advisor)|cyber\s+(security|engineer|analyst|architect|consultant|specialist)|information\s+security|infosec|network\s+security|application\s+security|appsec|cloud\s+security|devsecops|penetration\s+tester|pen\s+tester|ethical\s+hacker|red\s+team|blue\s+team|purple\s+team|threat\s+(intelligence|hunter|analyst|detection)|incident\s+response|soc\s+(analyst|engineer|manager)|vulnerability\s+(management|analyst|researcher)|security\s+operations\s+center|security\s+analytics|security\s+automation|security\s+architecture|security\s+engineering|security\s+research|security\s+science|security\s+data\s+scientist|security\s+data\s+engineer|security\s+software\s+engineer|security\s+devops|security\s+compliance|security\s+audit|security\s+governance|security\s+risk|security\s+awareness|security\s+training|security\s+education|security\s+culture|security\s+champion|security\s+advocate)/i,
            // CISO
            /^(ciso|chief\s+information\s+security\s+officer|chief\s+security\s+officer|cso)/i,
            // GRC
            /^(grc|governance\s+risk\s+compliance|security\s+governance|security\s+risk\s+(manager|analyst)|security\s+compliance\s+(manager|analyst|officer))/i,
            // Cryptography
            /^(cryptographer|cryptography\s+(engineer|researcher)|security\s+cryptographer)/i
        ],
        aliases: {
            'infosec': 'Information Security',
            'appsec': 'Application Security',
            'ciso': 'Chief Information Security Officer',
            'cso': 'Chief Security Officer',
            'grc': 'Governance Risk and Compliance',
            'soc': 'Security Operations Center'
        },
        priority: 9
    },

    'Hardware & Embedded Systems': {
        domain: DOMAINS.PROFESSIONAL,
        label: 'Hardware & Embedded Systems',
        patterns: [
            // Hardware engineering
            /^(hardware\s+(engineer|designer|architect|manager|director|lead|vp|head|technician|intern|developer|test\s+engineer|validation\s+engineer|verification\s+engineer)|electrical\s+(engineer|designer|technician)|electronics\s+(engineer|technician|designer)|fpga\s+(engineer|designer|developer)|asic\s+(engineer|designer|developer)|vlsi\s+(engineer|designer)|chip\s+(designer|engineer|architect)|semiconductor|soc\s+(engineer|architect|designer)|circuit\s+(designer|engineer)|pcb\s+(designer|engineer)|board\s+(designer|engineer)|rf\s+(engineer|designer|technician)|antenna\s+(engineer|designer)|signal\s+integrity|power\s+(engineer|electronics|systems)|embedded\s+(engineer|software\s+engineer|systems\s+engineer|developer|designer|architect|firmware\s+engineer)|firmware\s+(engineer|developer|architect|designer)|iot\s+(engineer|developer|architect|firmware)|robotics\s+(engineer|software\s+engineer|systems\s+engineer|developer)|mechanical\s+(engineer|designer|technician)|mechatronics|automotive\s+(engineer|systems)|aerospace\s+(engineer|systems)|dsp\s+(engineer|developer)|verification\s+engineer|validation\s+engineer|test\s+engineer\s+(hardware|silicon|chip))/i,
            // Hardware leadership
            /^(director|head|vp|chief)\s+of\s+(hardware|engineering\s+(hardware|silicon|semiconductor)|electrical\s+engineering|embedded\s+systems)/i
        ],
        aliases: {
            'fpga': 'Field-Programmable Gate Array',
            'asic': 'Application-Specific Integrated Circuit',
            'vlsi': 'Very Large Scale Integration',
            'soc': 'System on Chip',
            'pcb': 'Printed Circuit Board',
            'rf': 'Radio Frequency',
            'iot': 'Internet of Things',
            'dsp': 'Digital Signal Processing'
        },
        priority: 8
    }
};

// ── Operations & Skilled Work (catch-all for non-professional roles) ──
// This category catches jobs that don't match any Professional category.
// It has the lowest priority so it only matches when nothing else does.
export const OPERATIONS_CATEGORY = {
    domain: DOMAINS.OPERATIONS,
    label: 'Operations & Skilled Work',
    patterns: [
        // Catch-all: matches any job title that wasn't classified
        // This is applied AFTER all other categories fail
        /^.*$/i
    ],
    aliases: {},
    priority: 0
};

// ── Numeric category IDs for backend/frontend labeling ─────
// Tech=1, Infra=2, Data=3, Security=4, Product=5, Design=6,
// Marketing=7, Sales=8, Finance=9, Business=10, HR=11,
// Corporate=12, Hardware=13, Operations=14
export const CATEGORY_IDS = {
    'Technology': 1,
    'IT & Infrastructure': 2,
    'Data & AI': 3,
    'Security': 4,
    'Product': 5,
    'Design': 6,
    'Marketing': 7,
    'Sales': 8,
    'Finance': 9,
    'Business & Operations': 10,
    'HR & Recruiting': 11,
    'Corporate': 12,
    'Hardware & Embedded Systems': 13,
    'Operations & Skilled Work': 14
};

/** Get numeric ID for a category name */
export function getCategoryId(category) {
    return CATEGORY_IDS[category] || 0;
}

/** Get category name from numeric ID */
export function getCategoryName(id) {
    for (const [name, num] of Object.entries(CATEGORY_IDS)) {
        if (num === id) return name;
    }
    return 'Uncategorized';
}

// ── Category order for display ──────────────────────────────
export const CATEGORY_ORDER = [
    'Technology',
    'IT & Infrastructure',
    'Data & AI',
    'Security',
    'Product',
    'Design',
    'Marketing',
    'Sales',
    'Finance',
    'Business & Operations',
    'HR & Recruiting',
    'Corporate',
    'Hardware & Embedded Systems',
    'Operations & Skilled Work'
];

// ── Domain order for display ────────────────────────────────
export const DOMAIN_ORDER = ['All Jobs', DOMAINS.PROFESSIONAL, DOMAINS.OPERATIONS];

// ── Color map for category pills ───────────────────────────
export const CATEGORY_COLORS = {
    'Technology': '#6c5ce7',
    'IT & Infrastructure': '#0984e3',
    'Data & AI': '#00b894',
    'Security': '#e17055',
    'Product': '#fd79a8',
    'Design': '#a29bfe',
    'Marketing': '#fdcb6e',
    'Sales': '#00cec9',
    'Finance': '#55efc4',
    'Business & Operations': '#74b9ff',
    'HR & Recruiting': '#e84393',
    'Corporate': '#636e72',
    'Hardware & Embedded Systems': '#fab1a0',
    'Operations & Skilled Work': '#b2bec3'
};

// ── Classification Functions ───────────────────────────────

/**
 * Classify a single job by its title.
 * @param {object} job - Job object with a `title` property
 * @returns {{ domain: string, category: string, normalized_role: string }}
 */
// Build a flat alias lookup map once (O(1) per word instead of O(n) per category)
const ALIAS_MAP = (() => {
    const map = {};
    for (const [catName, catDef] of Object.entries(CATEGORIES)) {
        if (catDef.aliases) {
            for (const [alias, normalized] of Object.entries(catDef.aliases)) {
                map[alias] = { category: catName, priority: catDef.priority, normalized };
            }
        }
    }
    return map;
})();

export function classifyJob(job) {
    const title = (job.title || '').trim();
    if (!title) {
        return { domain: '', category: 'Uncategorized', normalized_role: '' };
    }

    let bestCategory = 'Uncategorized';
    let bestPriority = -1;
    let matchedPattern = null;

    for (const [catName, catDef] of Object.entries(CATEGORIES)) {
        for (const pattern of catDef.patterns) {
            const match = title.match(pattern);
            if (match) {
                if (catDef.priority > bestPriority) {
                    bestCategory = catName;
                    bestPriority = catDef.priority;
                    matchedPattern = match;
                }
                break; // First match per category is enough
            }
        }
    }

    // Check aliases (abbreviations like SWE, SDE, PM) using O(1) lookup map
    const titleLower = title.toLowerCase();
    const words = titleLower.split(/[\s,/-]+/);
    for (const word of words) {
        const aliasEntry = ALIAS_MAP[word];
        if (aliasEntry && aliasEntry.priority > bestPriority) {
            bestCategory = aliasEntry.category;
            bestPriority = aliasEntry.priority;
        }
    }

    // ── Fallback: if still uncategorized, assign to Operations & Skilled Work ──
    if (bestCategory === 'Uncategorized' || bestPriority <= 0) {
        bestCategory = OPERATIONS_CATEGORY.label;
        bestPriority = OPERATIONS_CATEGORY.priority;
    }

    // Determine normalized role
    let normalized_role = title;
    if (bestCategory !== 'Uncategorized') {
        const catDef = CATEGORIES[bestCategory] || OPERATIONS_CATEGORY;
        // Check if the matched word is an alias
        const firstWord = words[0];
        const firstAlias = ALIAS_MAP[firstWord];
        if (firstAlias && firstAlias.category === bestCategory) {
            normalized_role = firstAlias.normalized;
        } else if (matchedPattern) {
            // Use the matched text as normalized role
            normalized_role = matchedPattern[0].trim();
            // Capitalize first letter
            normalized_role = normalized_role.charAt(0).toUpperCase() + normalized_role.slice(1);
        }
    }

    const domain = bestCategory !== 'Uncategorized'
        ? (CATEGORIES[bestCategory] || OPERATIONS_CATEGORY).domain
        : '';

    return { domain, category: bestCategory, normalized_role };
}

/**
 * Classify all jobs in an array, adding domain/category/normalized_role.
 * @param {Array} jobs
 */
export function classifyJobs(jobs) {
    for (const job of jobs) {
        if (!job.domain || !job.category) {
            const result = classifyJob(job);
            job.domain = result.domain;
            job.category = result.category;
            job.normalized_role = result.normalized_role;
        }
    }
}

/**
 * Get category counts for display in pills.
 * @param {Array} jobs
 * @returns {object} Map of category -> count
 */
export function getCategoryCounts(jobs) {
    const counts = {};
    for (const cat of CATEGORY_ORDER) {
        counts[cat] = 0;
    }
    counts['Uncategorized'] = 0;

    for (const job of jobs) {
        const cat = job.category || 'Uncategorized';
        if (counts[cat] !== undefined) {
            counts[cat]++;
        } else {
            counts['Uncategorized']++;
        }
    }

    return counts;
}

/**
 * Get categories that have jobs for a given domain.
 * @param {string} domain - Domain name or 'All Jobs'
 * @param {Array} jobs
 * @returns {Array} Array of category names
 */
export function getCategoriesForDomain(domain, jobs) {
    if (domain === 'All Jobs' || !domain) {
        return CATEGORY_ORDER.filter(cat => {
            return jobs.some(j => j.category === cat);
        });
    }

    return CATEGORY_ORDER.filter(cat => {
        const catDef = CATEGORIES[cat] || (cat === OPERATIONS_CATEGORY.label ? OPERATIONS_CATEGORY : null);
        return catDef && catDef.domain === domain && jobs.some(j => j.category === cat);
    });
}

/**
 * Get the CSS class for a category pill.
 * @param {string} category
 * @returns {string}
 */
export function getCategoryClass(category) {
    if (!category || category === 'Uncategorized') return 'category-uncategorized';
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    return `category-${slug}`;
}
