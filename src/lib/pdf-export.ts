import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { DisplayLine, RiskLevel } from '@/types';

function generateHTML(curp: string, lines: DisplayLine[], riskLevel: RiskLevel): string {
  const fecha = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const confirmed = lines.filter(
    (l) => !l.isPossible && !l.isNotFound && !l.isError && !l.isUnavailable
  );
  const possible = lines.filter((l) => l.isPossible);
  const notFound = lines.filter((l) => l.isNotFound);
  const errors = lines.filter((l) => l.isError || l.isUnavailable);

  const getRiskColor = (label: string) => {
    if (label === 'Sin Registro') return '#94A3B8';
    if (label === 'Bajo') return '#10B981';
    return '#F59E0B';
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #1a1a1a;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #208AEF;
          }
          .title {
            font-size: 28px;
            font-weight: 700;
            color: #208AEF;
            margin-bottom: 8px;
          }
          .subtitle {
            font-size: 14px;
            color: #6b7280;
          }
          .info-section {
            background: #f8f9fc;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 24px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: 600;
            color: #374151;
          }
          .info-value {
            color: #111827;
            font-family: 'Courier New', monospace;
          }
          .risk-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 14px;
            color: white;
          }
          .summary {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
          }
          .summary-card {
            flex: 1;
            padding: 16px;
            border-radius: 12px;
            text-align: center;
          }
          .summary-card.confirmed {
            background: #FEF2F2;
            border: 2px solid #EF4444;
          }
          .summary-card.possible {
            background: #FEF3C7;
            border: 2px solid #F59E0B;
          }
          .summary-card.notfound {
            background: #ECFDF5;
            border: 2px solid #10B981;
          }
          .summary-number {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .summary-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .section-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #111827;
            padding-left: 12px;
            border-left: 4px solid #208AEF;
          }
          .line-item {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 8px;
          }
          .line-item.confirmed {
            border-left: 4px solid #EF4444;
          }
          .line-item.possible {
            border-left: 4px solid #F59E0B;
          }
          .line-item.notfound {
            border-left: 4px solid #10B981;
          }
          .line-item.error {
            border-left: 4px solid #94A3B8;
          }
          .line-operadora {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
          }
          .line-numero {
            font-size: 13px;
            color: #6b7280;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">MisLineas</div>
          <div class="subtitle">Reporte de Consulta de Líneas Telefónicas</div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label">CURP:</span>
            <span class="info-value">${curp}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Fecha de consulta:</span>
            <span class="info-value">${fecha}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Nivel de riesgo:</span>
            <span class="risk-badge" style="background: ${getRiskColor(riskLevel.label)}">
              ${riskLevel.label}
            </span>
          </div>
        </div>

        <div class="summary">
          <div class="summary-card confirmed">
            <div class="summary-number" style="color: #EF4444">${confirmed.length}</div>
            <div class="summary-label" style="color: #EF4444">Registradas</div>
          </div>
          <div class="summary-card possible">
            <div class="summary-number" style="color: #F59E0B">${possible.length}</div>
            <div class="summary-label" style="color: #F59E0B">Posibles</div>
          </div>
          <div class="summary-card notfound">
            <div class="summary-number" style="color: #10B981">${notFound.length}</div>
            <div class="summary-label" style="color: #10B981">Sin registro</div>
          </div>
        </div>

        ${confirmed.length > 0 ? `
          <div class="section-title">Líneas Registradas</div>
          ${confirmed.map((line) => `
            <div class="line-item confirmed">
              <div class="line-operadora">${line.operadora}</div>
              <div class="line-numero">${line.numero}</div>
              ${line.disclaimer ? `<div class="line-numero" style="margin-top: 4px; font-style: italic">${line.disclaimer}</div>` : ''}
            </div>
          `).join('')}
        ` : ''}

        ${possible.length > 0 ? `
          <div class="section-title" style="margin-top: 24px">Líneas Posibles</div>
          ${possible.map((line) => `
            <div class="line-item possible">
              <div class="line-operadora">${line.operadora}</div>
              <div class="line-numero">${line.numero}</div>
              ${line.disclaimer ? `<div class="line-numero" style="margin-top: 4px; font-style: italic">${line.disclaimer}</div>` : ''}
            </div>
          `).join('')}
        ` : ''}

        ${notFound.length > 0 ? `
          <div class="section-title" style="margin-top: 24px">Sin Registro</div>
          ${notFound.map((line) => `
            <div class="line-item notfound">
              <div class="line-operadora">${line.operadora}</div>
              <div class="line-numero">${line.numero}</div>
            </div>
          `).join('')}
        ` : ''}

        ${errors.length > 0 ? `
          <div class="section-title" style="margin-top: 24px">Errores</div>
          ${errors.map((line) => `
            <div class="line-item error">
              <div class="line-operadora">${line.operadora}</div>
              <div class="line-numero">${line.numero}</div>
            </div>
          `).join('')}
        ` : ''}

        <div class="footer">
          <p>Reporte generado por MisLineas · com.jvz.lineasmx</p>
          <p style="margin-top: 4px">Este reporte es informativo. Para ejercer tus derechos ARCO, contacta directamente a las operadoras.</p>
        </div>
      </body>
    </html>
  `;
}

export async function exportPDFReport(
  curp: string,
  lines: DisplayLine[],
  riskLevel: RiskLevel
): Promise<void> {
  const html = generateHTML(curp, lines, riskLevel);

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const filename = `MisLineas_${curp}_${new Date().toISOString().split('T')[0]}.pdf`;
  const sourceFile = new File(uri);
  const destFile = new File(Paths.document, filename);

  await sourceFile.copy(destFile);

  await Sharing.shareAsync(destFile.uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Exportar reporte PDF',
    UTI: 'com.adobe.pdf',
  });
}
