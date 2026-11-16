const DAY_MONTH = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
});

/** "16 de novembro": Intl needs no Angular locale data to be registered. */
export function formatMatchDate(iso: string): string {
  return DAY_MONTH.format(new Date(iso));
}
