export interface CategoryTemplate {
  id: string
  name: string
  description: string
  categories: {
    name: string
    format: string
    gender?: string
    skillLevel?: string
    maxTeams: number
    pointsPerSet: number
    numSets: number
    groupSize: number
    proLeague: boolean
  }[]
}

export const CATEGORY_TEMPLATES: CategoryTemplate[] = [
  {
    id: 'tafc_strict',
    name: 'TAFC Strict (10 categorias)',
    description: 'Template oficial TAFC com 10 categorias: Pro M/F, A/B/C/D M/F',
    categories: [
      { name: 'Pro Masculino', format: 'bracket', gender: 'male', skillLevel: 'pro', maxTeams: 32, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: true },
      { name: 'Pro Feminino', format: 'bracket', gender: 'female', skillLevel: 'pro', maxTeams: 16, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: true },
      { name: 'A Masculino', format: 'bracket', gender: 'male', skillLevel: 'advanced', maxTeams: 32, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: false },
      { name: 'A Feminino', format: 'bracket', gender: 'female', skillLevel: 'advanced', maxTeams: 16, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: false },
      { name: 'B Masculino', format: 'bracket', gender: 'male', skillLevel: 'intermediate', maxTeams: 32, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: false },
      { name: 'B Feminino', format: 'bracket', gender: 'female', skillLevel: 'intermediate', maxTeams: 16, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: false },
      { name: 'C Masculino', format: 'bracket', gender: 'male', skillLevel: 'beginner', maxTeams: 32, pointsPerSet: 15, numSets: 1, groupSize: 4, proLeague: false },
      { name: 'C Feminino', format: 'bracket', gender: 'female', skillLevel: 'beginner', maxTeams: 16, pointsPerSet: 15, numSets: 1, groupSize: 4, proLeague: false },
      { name: 'D Masculino', format: 'group_knockout', gender: 'male', skillLevel: 'beginner', maxTeams: 16, pointsPerSet: 12, numSets: 1, groupSize: 4, proLeague: false },
      { name: 'D Feminino', format: 'group_knockout', gender: 'female', skillLevel: 'beginner', maxTeams: 16, pointsPerSet: 12, numSets: 1, groupSize: 4, proLeague: false },
    ],
  },
  {
    id: 'lbf_stage',
    name: 'LBF Stage (4 categorias)',
    description: 'Liga Brasileira de Futevôlei: Open, A, B, Iniciante',
    categories: [
      { name: 'Open', format: 'bracket', gender: 'mixed', skillLevel: 'pro', maxTeams: 24, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: true },
      { name: 'Classe A', format: 'bracket', gender: 'mixed', skillLevel: 'advanced', maxTeams: 32, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: false },
      { name: 'Classe B', format: 'bracket', gender: 'mixed', skillLevel: 'intermediate', maxTeams: 32, pointsPerSet: 15, numSets: 1, groupSize: 4, proLeague: false },
      { name: 'Iniciante', format: 'group_knockout', gender: 'mixed', skillLevel: 'beginner', maxTeams: 16, pointsPerSet: 12, numSets: 1, groupSize: 4, proLeague: false },
    ],
  },
  {
    id: 'nfa_tour',
    name: 'NFA Tour (4 categorias)',
    description: 'NFA: Open (splits into D1/D2/D3), Women, Master, Beginners',
    categories: [
      { name: 'Open', format: 'bracket', gender: 'male', skillLevel: 'pro', maxTeams: 96, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: true },
      { name: "Women's Division", format: 'bracket', gender: 'female', skillLevel: 'advanced', maxTeams: 16, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: false },
      { name: 'Master Division', format: 'bracket', gender: 'male', skillLevel: 'advanced', maxTeams: 16, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: false },
      { name: 'Beginners Division', format: 'bracket', gender: 'mixed', skillLevel: 'beginner', maxTeams: 32, pointsPerSet: 15, numSets: 1, groupSize: 4, proLeague: false },
    ],
  },
  {
    id: 'simples',
    name: 'Simples (1 categoria)',
    description: 'Torneio simples com uma única categoria aberta',
    categories: [
      { name: 'Principal', format: 'bracket', gender: 'mixed', maxTeams: 16, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: false },
    ],
  },
  {
    id: 'nfa_kotb',
    name: 'NFA KotB (4 categorias)',
    description: 'NFA King of the Beach: Open (splits into D1/D2/D3), Women, Master, Beginners',
    categories: [
      { name: 'Open', format: 'king_of_the_beach', gender: 'male', skillLevel: 'pro', maxTeams: 96, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: true },
      { name: "Women's Division", format: 'king_of_the_beach', gender: 'female', skillLevel: 'advanced', maxTeams: 16, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: false },
      { name: 'Master Division', format: 'king_of_the_beach', gender: 'male', skillLevel: 'advanced', maxTeams: 16, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: false },
      { name: 'Beginners Division', format: 'king_of_the_beach', gender: 'mixed', skillLevel: 'beginner', maxTeams: 32, pointsPerSet: 15, numSets: 1, groupSize: 4, proLeague: false },
    ],
  },
  {
    id: 'kotb',
    name: 'King of the Beach',
    description: 'Formato King of the Beach com grupos e rodízio de duplas',
    categories: [
      { name: 'King of the Beach', format: 'king_of_the_beach', gender: 'mixed', maxTeams: 16, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: false },
    ],
  },
  {
    id: 'qualify_pro',
    name: 'Qualify + Pro (2 categorias)',
    description: 'Classificatória alimenta a chave principal Pro',
    categories: [
      { name: 'Pro', format: 'bracket', gender: 'mixed', skillLevel: 'pro', maxTeams: 16, pointsPerSet: 18, numSets: 1, groupSize: 4, proLeague: true },
      { name: 'Qualify', format: 'group_knockout', gender: 'mixed', skillLevel: 'advanced', maxTeams: 32, pointsPerSet: 15, numSets: 1, groupSize: 4, proLeague: false },
    ],
  },
]
