/**
 * Paleta categórica (tema escuro) para projetos. A ordem é validada para daltonismo
 * entre vizinhos; a cor segue o projeto (ordem de criação), nunca a posição na lista.
 * A partir do 9º projeto a cor vira neutra em vez de gerar matiz novo.
 */
export const PROJECT_COLORS = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
  "#e66767"
] as const;

export const PROJECT_COLOR_FALLBACK = "#6b7280";

export function projectColor(colorIndex: number | null | undefined) {
  if (colorIndex === null || colorIndex === undefined || colorIndex < 0) return PROJECT_COLOR_FALLBACK;
  return PROJECT_COLORS[colorIndex] ?? PROJECT_COLOR_FALLBACK;
}
