const { ParquetSchema, ParquetWriter } = require('parquetjs');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'data');

if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

function parseCSV(content) {
  const rows = [];
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  let i = 0;
  while (i < lines.length) {
    const row = [];
    while (i < lines.length && lines[i] !== '\n') {
      if (lines[i] === '"') {
        i++;
        let field = '';
        while (i < lines.length) {
          if (lines[i] === '"' && lines[i + 1] === '"') { field += '"'; i += 2; }
          else if (lines[i] === '"') { i++; break; }
          else { field += lines[i++]; }
        }
        row.push(field);
        if (i < lines.length && lines[i] === ',') i++;
      } else {
        let field = '';
        while (i < lines.length && lines[i] !== ',' && lines[i] !== '\n') { field += lines[i++]; }
        if (i < lines.length && lines[i] === ',') i++;
        row.push(field.trim());
      }
    }
    if (i < lines.length && lines[i] === '\n') i++;
    if (row.length > 0 && row.some(f => f.length > 0)) rows.push(row);
  }
  return rows;
}

function csvToObjects(content) {
  const rows = parseCSV(content);
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
    return obj;
  });
}

function toStr(v, fallback = '') {
  if (v == null || v === 'N/A' || v === '') return fallback;
  return String(v).trim();
}

function toNum(v, fallback = 0) {
  if (v == null || v === '' || v === 'N/A') return fallback;
  const n = Number(String(v).trim());
  return isNaN(n) ? fallback : n;
}

async function convertPortfolio() {
  console.log('Converting Portfolio.csv...');
  const raw = fs.readFileSync(path.join(DATA_DIR, 'Portfolio.csv'), 'utf-8');
  const rows = csvToObjects(raw);

  const schema = new ParquetSchema({
    name: { type: 'UTF8' },
    type: { type: 'UTF8' },
    portfolioUrl: { type: 'UTF8' },
    jobBoardUrl: { type: 'UTF8' },
    hasJobBoard: { type: 'BOOLEAN' },
    displayName: { type: 'UTF8' },
  });

  const writer = await ParquetWriter.openFile(schema, path.join(PUBLIC_DIR, 'Portfolio.parquet'));
  for (const r of rows) {
    const jobBoard = toStr(r.JobBoard);
    const hasJob = Boolean(jobBoard && jobBoard !== 'N/A' && jobBoard.startsWith('http'));
    await writer.appendRow({
      name: toStr(r.Name),
      type: toStr(r.Type, 'VC').toLowerCase() === 'accelerator' ? 'accelerator' : 'VC',
      portfolioUrl: toStr(r.Portfolio),
      jobBoardUrl: hasJob ? jobBoard : `https://www.google.com/search?q=${encodeURIComponent(toStr(r.Name) + ' portfolio companies careers')}`,
      hasJobBoard: hasJob,
      displayName: formatName(toStr(r.Name)),
    });
  }
  await writer.close();
  console.log(`  Wrote ${rows.length} rows`);
}

async function convertPrivate() {
  console.log('Converting Privately_Listed_Companies.csv...');
  const raw = fs.readFileSync(path.join(DATA_DIR, 'Privately_Listed_Companies.csv'), 'utf-8');
  const rows = csvToObjects(raw);

  const schema = new ParquetSchema({
    name: { type: 'UTF8' },
    sector: { type: 'UTF8' },
    fundingRound: { type: 'UTF8' },
    amountRaised: { type: 'UTF8' },
    subSector: { type: 'UTF8' },
    careerUrl: { type: 'UTF8' },
  });

  const writer = await ParquetWriter.openFile(schema, path.join(PUBLIC_DIR, 'Privately_Listed_Companies.parquet'));
  for (const r of rows) {
    if (!toStr(r.Company_Name)) continue;
    await writer.appendRow({
      name: toStr(r.Company_Name),
      sector: toStr(r.Sector, 'Other'),
      fundingRound: toStr(r.Funding_round, '--'),
      amountRaised: toStr(r.Amount_raised, '--'),
      subSector: toStr(r['Sub-sector']),
      careerUrl: smartLink(toStr(r.Company_Name)),
    });
  }
  await writer.close();
  console.log(`  Wrote ${rows.length} rows`);
}

async function convertH1B() {
  console.log('Converting startups_h1b_database.csv...');
  const raw = fs.readFileSync(path.join(DATA_DIR, 'startups_h1b_database.csv'), 'utf-8');
  const rows = csvToObjects(raw);

  const schema = new ParquetSchema({
    name: { type: 'UTF8' },
    sector: { type: 'UTF8' },
    category: { type: 'UTF8' },
    tags: { type: 'UTF8' },
    likelihood: { type: 'UTF8' },
    fortune500: { type: 'BOOLEAN' },
    fortune1500: { type: 'BOOLEAN' },
    boutique: { type: 'BOOLEAN' },
    analystsPick: { type: 'BOOLEAN' },
    publiclyTraded: { type: 'BOOLEAN' },
    careerUrl: { type: 'UTF8' },
  });

  const writer = await ParquetWriter.openFile(schema, path.join(PUBLIC_DIR, 'startups_h1b_database.parquet'));
  for (const r of rows) {
    if (!toStr(r['Company Name'])) continue;
    const tags = toStr(r['Tags']);
    await writer.appendRow({
      name: toStr(r['Company Name']),
      sector: toStr(r['Business Sector'], 'Other'),
      category: toStr(r['Category'], 'Other'),
      likelihood: normLikelihood(toStr(r['H1B Sponsorship Likelihood'])),
      fortune500: bool(r['Fortune 500 (yes/no)']),
      fortune1500: bool(r['Fortune 1500 (Yes if 500-1500/No)']),
      boutique: bool(r['Boutique (Yes/No)']),
      analystsPick: bool(r['AnalystsPick (Popular amoung Wallstreet waiting for IPO)']),
      publiclyTraded: bool(r['Publicly traded (Yes/No)']),
      tags: tags,
      careerUrl: smartLink(toStr(r['Company Name'])),
    });
  }
  await writer.close();
  console.log(`  Wrote ${rows.length} rows`);
}

function formatName(name) {
  const map = { ycombinator: 'Y Combinator', a16z: 'Andreessen Horowitz (a16z)' };
  return map[name.toLowerCase()] || name;
}

function normLikelihood(raw) {
  const v = (raw || '').trim().toLowerCase();
  if (v.includes('very high')) return 'Very High';
  if (v.includes('high')) return 'High';
  if (v.includes('medium')) return 'Medium';
  if (v.includes('low')) return 'Low';
  return 'Unknown';
}

function bool(v) {
  return String(v || '').trim().toLowerCase() === 'yes';
}

function smartLink(name) {
  return `https://www.google.com/search?q=${encodeURIComponent(name + ' Careers')}`;
}

(async () => {
  try {
    await convertPortfolio();
    await convertPrivate();
    await convertH1B();
    console.log('All conversions complete.');
  } catch (err) {
    console.error('Conversion failed:', err);
    process.exit(1);
  }
})();
