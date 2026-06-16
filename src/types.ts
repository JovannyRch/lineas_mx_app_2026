export type LineResult = {
  company: string;
  lines: string[];
  isRegistered?: boolean;
  possibleProviders?: string[];
  possibleDisclaimer?: string;
  notFoundProviders?: string[];
  error?: string;
  temporaryUnavailable?: boolean;
};

export type DisplayLine = {
  id: string;
  operadora: string;
  numero: string;
  disclaimer?: string;
  isPossible?: boolean;
  isNotFound?: boolean;
  isError?: boolean;
  isUnavailable?: boolean;
};

export type ProviderResponse = {
  provider: string;
  result: LineResult;
};

export type FilterTab = 'all' | 'confirmed' | 'possible' | 'errors';

export type RiskLevel = {
  label: string;
  color: string;
  description: string;
};
