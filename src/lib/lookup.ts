import type { DisplayLine, ProviderResponse, RiskLevel } from '@/types';

export function transformApiResponse(responses: ProviderResponse[]): DisplayLine[] {
  const lines: DisplayLine[] = [];

  for (const { provider, result } of responses) {
    if (result.temporaryUnavailable) {
      lines.push({
        id: `${provider}-unavailable`,
        operadora: provider,
        numero: 'Temporalmente no disponible',
        isUnavailable: true,
      });
      continue;
    }

    if (result.error) {
      if (result.possibleProviders && result.possibleProviders.length > 0) {
        for (const posible of result.possibleProviders) {
          lines.push({
            id: `${provider}-error-${posible}`,
            operadora: posible,
            numero: 'Error al consultar',
            isError: true,
          });
        }
      } else {
        lines.push({
          id: `${provider}-error`,
          operadora: provider,
          numero: 'Error al consultar',
          isError: true,
        });
      }
      continue;
    }

    const hasLines = result.lines && result.lines.length > 0;
    const hasPossible =
      result.isRegistered &&
      result.possibleProviders &&
      result.possibleProviders.length > 0;
    const isRegisteredWithoutLinesOrPossible =
      result.isRegistered &&
      !hasLines &&
      !(result.possibleProviders && result.possibleProviders.length > 0);

    if (!hasLines && !hasPossible && !isRegisteredWithoutLinesOrPossible) {
      if (result.possibleProviders && result.possibleProviders.length > 0) {
        for (const posible of result.possibleProviders) {
          lines.push({
            id: `${provider}-notfound-${posible}`,
            operadora: posible,
            numero: 'Sin registro',
            isNotFound: true,
          });
        }
      } else {
        lines.push({
          id: `${provider}-notfound`,
          operadora: provider,
          numero: 'Sin registro',
          isNotFound: true,
        });
      }
      continue;
    }

    for (const lineStr of result.lines ?? []) {
      const colonIdx = lineStr.indexOf(': ');
      const hasBrandPrefix = colonIdx !== -1;
      const operadora = hasBrandPrefix
        ? lineStr.slice(0, colonIdx)
        : result.company;
      const numero = hasBrandPrefix ? lineStr.slice(colonIdx + 2) : lineStr;
      lines.push({
        id: `${provider}-confirmed-${lineStr}`,
        operadora,
        numero,
        isPossible: false,
      });
    }

    if (result.isRegistered) {
      if (result.possibleProviders && result.possibleProviders.length > 0) {
        for (const posible of result.possibleProviders) {
          lines.push({
            id: `${provider}-possible-${posible}`,
            operadora: posible,
            numero: 'Numero no confirmado',
            isPossible: true,
            disclaimer: result.possibleDisclaimer,
          });
        }
      } else if (!hasLines) {
        lines.push({
          id: `${provider}-hidden`,
          operadora: result.company || provider,
          numero: 'Numero oculto',
          disclaimer:
            provider === 'Telcel'
              ? 'Telcel no informa el numero exacto de lineas registradas; solo confirma que hay al menos una vinculada a esta CURP.'
              : undefined,
          isPossible: false,
        });
      }
    }

    for (const notFound of result.notFoundProviders ?? []) {
      lines.push({
        id: `${provider}-notfound-${notFound}`,
        operadora: notFound,
        numero: 'Sin registro',
        isNotFound: true,
      });
    }
  }

  lines.sort((a, b) => {
    const aScore = a.isError ? 4 : a.isUnavailable ? 3 : a.isNotFound ? 2 : a.isPossible ? 1 : 0;
    const bScore = b.isError ? 4 : b.isUnavailable ? 3 : b.isNotFound ? 2 : b.isPossible ? 1 : 0;
    if (aScore !== bScore) return aScore - bScore;
    return a.operadora.localeCompare(b.operadora);
  });

  return lines;
}

export function getRiskLevel(lines: DisplayLine[]): RiskLevel {
  const confirmed = lines.filter(
    (l) => !l.isPossible && !l.isNotFound && !l.isError && !l.isUnavailable
  ).length;
  const possible = lines.filter(
    (l) => l.isPossible && !l.isNotFound && !l.isError && !l.isUnavailable
  ).length;

  if (confirmed === 0 && possible === 0)
    return {
      label: 'Sin Registro',
      color: '#94A3B8',
      description: 'Sin lineas vinculadas',
    };
  if (confirmed <= 2 && possible === 0)
    return {
      label: 'Bajo',
      color: '#10B981',
      description: 'Identidad protegida y consistente',
    };
  return {
    label: 'Moderado',
    color: '#F59E0B',
    description: 'Revisar lineas detectadas',
  };
}
