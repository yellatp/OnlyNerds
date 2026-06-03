import path from 'path';
import parquet from 'parquetjs';
import { smartCareerLink } from './parser';
const { ParquetReader } = parquet;

const PARQUET_PATH = path.join(process.cwd(), 'public', 'data', 'Privately_Listed_Companies.parquet');

export interface PrivateCompany {
  name: string;
  sector: string;
  fundingRound: string;
  amountRaised: string;
  subSector: string;
  careerUrl: string;
}

let _cache: PrivateCompany[] | null = null;

export async function getPrivateCompanies(): Promise<PrivateCompany[]> {
  if (_cache) return _cache;

  const reader = await ParquetReader.openFile(PARQUET_PATH);
  const cursor = reader.getCursor();
  const results: PrivateCompany[] = [];
  let row: Record<string, unknown> | null;
  while ((row = await cursor.next()) !== null) {
    results.push({
      name: String(row.name ?? '').trim(),
      sector: String(row.sector ?? 'Other').trim(),
      fundingRound: String(row.fundingRound ?? '--').trim(),
      amountRaised: String(row.amountRaised ?? '--').trim(),
      subSector: String(row.subSector ?? '').trim(),
      careerUrl: smartCareerLink(String(row.name ?? '').trim()),
    });
  }
  reader.close();
  _cache = results;
  return _cache;
}

export async function getPrivateSectors(): Promise<string[]> {
  const companies = await getPrivateCompanies();
  return [...new Set(companies.map((c) => c.sector))].sort();
}

export async function getPrivateRounds(): Promise<string[]> {
  const companies = await getPrivateCompanies();
  const rounds = [...new Set(companies.map((c) => c.fundingRound))];
  return rounds.filter((r) => r && r !== '--').sort();
}
