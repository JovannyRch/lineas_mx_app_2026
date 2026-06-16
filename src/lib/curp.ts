export const CURP_REGEX = /^[A-Z]{4}\d{6}[HMX][A-Z]{5}[A-Z0-9]\d$/;

export function getCurpValidationError(curp: string): string | null {
  if (curp.length === 0) return null;
  if (curp.length < 18) return null;
  if (!/^[A-Z]{4}/.test(curp))
    return 'Los primeros 4 caracteres deben ser letras.';
  if (!/^[A-Z]{4}\d{6}/.test(curp))
    return 'Los caracteres 5-10 deben ser la fecha de nacimiento (AAMMDD).';
  if (!/^[A-Z]{4}\d{6}[HMX]/.test(curp))
    return 'El caracter 11 debe ser H (hombre), M (mujer) o X.';
  if (!CURP_REGEX.test(curp))
    return 'Formato de CURP invalido. Verifica que los 18 caracteres sean correctos.';
  return null;
}
