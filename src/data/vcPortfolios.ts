import fs from 'fs';
import path from 'path';
import { csvToObjects } from './parser';

const CSV_PATH = path.join(process.cwd(), 'data', 'Portfolio.csv');

export interface VCFirm {
  name: string;
  type: 'VC' | 'accelerator';
  portfolioUrl: string;
  jobBoardUrl: string;
  hasJobBoard: boolean;
  displayName: string;
}

let _cache: VCFirm[] | null = null;

export function getVCFirms(): VCFirm[] {
  if (_cache) return _cache;

  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  type Row = { Name: string; Type: string; Portfolio: string; JobBoard: string };

  const rows = csvToObjects<Row>(raw);

  _cache = rows
    .filter((r) => r.Name?.trim())
    .map((r) => {
      const jobBoard = r.JobBoard?.trim();
      const hasJob = Boolean(jobBoard && jobBoard !== 'N/A' && jobBoard.startsWith('http'));
      return {
        name: r.Name.trim(),
        displayName: formatDisplayName(r.Name.trim()),
        type: (r.Type?.trim().toLowerCase() === 'accelerator' ? 'accelerator' : 'VC') as VCFirm['type'],
        portfolioUrl: r.Portfolio?.trim() || '',
        jobBoardUrl: hasJob ? jobBoard : `https://www.google.com/search?q=${encodeURIComponent(r.Name.trim() + ' portfolio companies careers')}`,
        hasJobBoard: hasJob,
      };
    });

  return _cache;
}

function formatDisplayName(name: string): string {
  // Normalize common abbreviations for display
  const map: Record<string, string> = {
    ycombinator: 'Y Combinator',
    a16z: 'Andreessen Horowitz (a16z)',
  };
  return map[name.toLowerCase()] || name;
}

export function getVCFirmsByType(type: 'VC' | 'accelerator'): VCFirm[] {
  return getVCFirms().filter((f) => f.type === type);
}
