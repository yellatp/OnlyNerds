import fs from 'fs';
import path from 'path';
import { csvToObjects, smartCareerLink } from './parser';

const CSV_PATH = path.join(process.cwd(), 'data', 'Privately_Listed_Companies.csv');

export interface PrivateCompany {
  name: string;
  sector: string;
  fundingRound: string;
  amountRaised: string;
  subSector: string;
  careerUrl: string;
}

let _cache: PrivateCompany[] | null = null;

export function getPrivateCompanies(): PrivateCompany[] {
  if (_cache) return _cache;

  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  type Row = {
    Company_Name: string;
    Sector: string;
    Funding_round: string;
    Amount_raised: string;
    'Sub-sector': string;
    'Source Website': string;
  };

  const rows = csvToObjects<Row>(raw);

  _cache = rows
    .filter((r) => r.Company_Name?.trim())
    .map((r) => ({
      name: r.Company_Name.trim(),
      sector: r.Sector?.trim() || 'Other',
      fundingRound: r.Funding_round?.trim() || '--',
      amountRaised: r.Amount_raised?.trim() || '--',
      subSector: r['Sub-sector']?.trim() || '',
      careerUrl: smartCareerLink(r.Company_Name.trim()),
    }));

  return _cache;
}

export function getPrivateSectors(): string[] {
  return [...new Set(getPrivateCompanies().map((c) => c.sector))].sort();
}

export function getPrivateRounds(): string[] {
  const rounds = [...new Set(getPrivateCompanies().map((c) => c.fundingRound))];
  return rounds.filter((r) => r && r !== '--').sort();
}
