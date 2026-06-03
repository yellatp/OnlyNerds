import path from 'path';
import parquet from 'parquetjs';
const { ParquetReader } = parquet;

const PARQUET_PATH = path.join(process.cwd(), 'public', 'data', 'Portfolio.parquet');

export interface VCFirm {
  name: string;
  type: 'VC' | 'accelerator';
  portfolioUrl: string;
  jobBoardUrl: string;
  hasJobBoard: boolean;
  displayName: string;
}

let _cache: VCFirm[] | null = null;

export async function getVCFirms(): Promise<VCFirm[]> {
  if (_cache) return _cache;

  const reader = await ParquetReader.openFile(PARQUET_PATH);
  const cursor = reader.getCursor();
  const results: VCFirm[] = [];
  let row: Record<string, unknown> | null;
  while ((row = await cursor.next()) !== null) {
    const name = String(row.name ?? '');
    results.push({
      name: name.trim(),
      displayName: formatDisplayName(name.trim()),
      type: (String(row.type ?? 'VC').trim().toLowerCase() === 'accelerator' ? 'accelerator' : 'VC') as VCFirm['type'],
      portfolioUrl: String(row.portfolioUrl ?? '').trim(),
      jobBoardUrl: String(row.jobBoardUrl ?? '').trim(),
      hasJobBoard: Boolean(row.hasJobBoard),
    });
  }
  reader.close();
  _cache = results;
  return _cache;
}

function formatDisplayName(name: string): string {
  const map: Record<string, string> = {
    ycombinator: 'Y Combinator',
    a16z: 'Andreessen Horowitz (a16z)',
  };
  return map[name.toLowerCase()] || name;
}

export async function getVCFirmsByType(type: 'VC' | 'accelerator'): Promise<VCFirm[]> {
  const firms = await getVCFirms();
  return firms.filter((f) => f.type === type);
}
