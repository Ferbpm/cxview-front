import type { GridOptions, LocaleText } from 'ag-grid-community'

/** Configuración base reutilizable para los listados del sistema. */
export const agGridLocaleEs: LocaleText = {
  page: 'Página',
  more: 'Más',
  to: 'a',
  of: 'de',
  next: 'Siguiente',
  last: 'Última',
  first: 'Primera',
  previous: 'Anterior',
  loadingOoo: 'Cargando…',
  noRowsToShow: 'No hay datos para mostrar.',
  pageSizeSelectorLabel: 'Filas por página:',
}

export function createStandardGridOptions<TData>(): Pick<GridOptions<TData>, 'localeText' | 'pagination' | 'paginationPageSize' | 'paginationPageSizeSelector' | 'animateRows'> {
  return {
    localeText: agGridLocaleEs,
    pagination: true,
    paginationPageSize: 10,
    paginationPageSizeSelector: [10, 25, 50],
    animateRows: true,
  }
}

/** Formato consistente para las fechas presentadas en grillas: dd/mm/yyyy. */
export function formatGridDate(value: string | null | undefined): string {
  if (!value) return '—'
  const isoDate = value.slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '—'
}
