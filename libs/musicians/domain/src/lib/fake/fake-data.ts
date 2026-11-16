import type { Genre, Goal, Instrument, SkillLevel } from '../musician';

/** Raw material for fake profiles (neighborhoods live in `../neighborhoods`). */
export { NEIGHBORHOODS } from '../neighborhoods';

// prettier-ignore
export const FIRST_NAMES = [
  'Ana', 'Bruno', 'Camila', 'Diego', 'Elisa', 'Felipe', 'Gabriela', 'Heitor',
  'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Pedro',
  'Rafaela', 'Samuel', 'Tainá', 'Vinícius', 'Yara', 'André', 'Bianca', 'Caio',
  'Débora', 'Enzo', 'Fernanda', 'Gustavo', 'Helena', 'Igor', 'Júlia', 'Leonardo',
  'Manuela', 'Otávio', 'Paula', 'Renato', 'Sofia', 'Thiago', 'Valentina', 'Wesley',
] as const;

// prettier-ignore
export const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Rodrigues',
  'Almeida', 'Nascimento', 'Carvalho', 'Araújo', 'Ribeiro', 'Gomes', 'Martins',
  'Rocha', 'Moreira', 'Teixeira', 'Cardoso', 'Freitas', 'Mendes', 'Campos',
] as const;

/** Drummers are the classic missing piece, so they are well represented. */
export const INSTRUMENT_WEIGHTS: readonly (readonly [Instrument, number])[] = [
  ['drums', 20],
  ['electric-guitar', 18],
  ['vocals', 16],
  ['bass', 14],
  ['keys', 8],
  ['acoustic-guitar', 8],
  ['percussion', 6],
  ['sax', 4],
  ['trumpet', 3],
  ['violin', 3],
];

export const LEVEL_WEIGHTS: readonly (readonly [SkillLevel, number])[] = [
  ['beginner', 15],
  ['intermediate', 40],
  ['advanced', 30],
  ['professional', 15],
];

/**
 * Genres that tend to go together. A profile draws most genres from one
 * scene, so the data has real clusters for the compatibility score to find.
 */
export const SCENES: readonly (readonly Genre[])[] = [
  ['rock', 'indie', 'punk', 'metal', 'blues'],
  ['mpb', 'samba', 'pagode', 'forro', 'jazz'],
  ['pop', 'funk', 'hip-hop', 'electronic', 'reggae'],
  ['jazz', 'blues', 'soul', 'mpb', 'funk'],
  ['sertanejo', 'forro', 'pop', 'gospel', 'pagode'],
];

export const GOAL_WEIGHTS: readonly (readonly [Goal, number])[] = [
  ['original-band', 30],
  ['covers', 25],
  ['jam', 20],
  ['paid-gigs', 15],
  ['recording', 10],
];

export const BIOS = [
  'Toco desde a adolescência e quero voltar a ensaiar toda semana.',
  'Procuro gente comprometida para montar um som autoral.',
  'Já toquei em bar e casamento, curto tocar ao vivo.',
  'Estudo música há uns anos, quero ganhar rodagem com banda.',
  'Tenho algumas composições guardadas esperando a banda certa.',
  'Saí da última banda e estou com saudade de palco.',
  'Gosto de jam sem compromisso, mas topo coisa séria também.',
  'Trabalho durante o dia; à noite e no fim de semana é música.',
  'Curto gravar em casa e quero levar as ideias para um estúdio.',
  'Pontual, levo meu equipamento e gosto de ensaio produtivo.',
  'Quero tocar covers para começar e ir puxando autoral.',
  'Busco parceria para tocar em eventos e ter um extra.',
] as const;
