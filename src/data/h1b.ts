import fs from 'fs';
import path from 'path';
import { csvToObjects, smartCareerLink } from './parser';

const CSV_PATH = path.join(process.cwd(), 'data', 'startups_h1b_database.csv');

export type H1BLikelihood = 'Very High' | 'High' | 'Medium' | 'Low' | 'Unknown';

export interface H1BCompany {
  name: string;
  sector: string;
  category: string;
  tags: string[];
  likelihood: H1BLikelihood;
  fortune500: boolean;
  fortune1500: boolean;
  boutique: boolean;
  analystsPick: boolean;
  publiclyTraded: boolean;
  careerUrl: string;
}

function normLikelihood(raw: string): H1BLikelihood {
  const v = raw.trim().toLowerCase();
  if (v.includes('very high')) return 'Very High';
  if (v.includes('high')) return 'High';
  if (v.includes('medium')) return 'Medium';
  if (v.includes('low')) return 'Low';
  return 'Unknown';
}

function bool(v: string): boolean {
  return v.trim().toLowerCase() === 'yes';
}

let _cache: H1BCompany[] | null = null;

export function getH1BCompanies(): H1BCompany[] {
  if (_cache) return _cache;

  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  type Row = {
    'Company Name': string;
    'Business Sector': string;
    'Category': string;
    'Tags': string;
    'H1B Sponsorship Likelihood': string;
    'Fortune 500 (yes/no)': string;
    'Fortune 1500 (Yes if 500-1500/No)': string;
    'Boutique (Yes/No)': string;
    'AnalystsPick (Popular amoung Wallstreet waiting for IPO)': string;
    'Publicly traded (Yes/No)': string;
  };

  const rows = csvToObjects<Row>(raw);

  _cache = rows
    .filter((r) => r['Company Name']?.trim())
    .map((r) => ({
      name: r['Company Name'].trim(),
      sector: r['Business Sector']?.trim() || 'Other',
      category: r['Category']?.trim() || 'Other',
      tags: r['Tags']
        ? r['Tags'].split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      likelihood: normLikelihood(r['H1B Sponsorship Likelihood'] || ''),
      fortune500: bool(r['Fortune 500 (yes/no)'] || ''),
      fortune1500: bool(r['Fortune 1500 (Yes if 500-1500/No)'] || ''),
      boutique: bool(r['Boutique (Yes/No)'] || ''),
      analystsPick: bool(r['AnalystsPick (Popular amoung Wallstreet waiting for IPO)'] || ''),
      publiclyTraded: bool(r['Publicly traded (Yes/No)'] || ''),
      careerUrl: smartCareerLink(r['Company Name'].trim()),
    }));

  return _cache;
}

export function getH1BSectors(): string[] {
  return [...new Set(getH1BCompanies().map((c) => c.sector))].sort();
}

export function getH1BCategories(): string[] {
  return [...new Set(getH1BCompanies().map((c) => c.category))].sort();
}
