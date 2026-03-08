/**
 * Seed script for NFA 2022 Tour - 4th Stop Orlando, FL
 * Extracted from official NFA bracket PDFs
 *
 * Categories:
 * 1. Open Division 1 (Pro) - 32-team double-elimination bracket: W1(16)→L1(8)→W2(8)→L2(8)→W3(4)→L3(4)→L4(4)→W4(2)→L5(2)→L6(2)→SF+Final
 * 2. Open Division 2 (Advanced) - 8-team modified bracket (W1→W2→L2→L4→SF→Final)
 * 3. Open Division 3 (Intermediate) - 16-team bracket (W1→W2→SF→Final)
 * 4. Women's Division - 2 groups of 4 + elimination
 * 5. Master Division - 2 groups of 4 + elimination
 * 6. Beginners Division - 4 groups of 4 + elimination
 *
 * Run: npx ts-node prisma/seed-nfa-orlando.ts
 */

import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helper Types ────────────────────────────────────────────
interface TeamDef {
  p1: string;
  p2: string;
}

interface GroupGameDef {
  home: TeamDef;
  away: TeamDef;
  scoreHome: number;
  scoreAway: number;
  court: number;
  time: string;
}

interface BracketGameDef {
  home: TeamDef;
  away: TeamDef;
  scoreHome: number;
  scoreAway: number;
  court: number;
  time: string;
  roundName: string;
}

// ─── All Unique Players ────────────────────────────────────────
// Collected from all 6 PDFs. Each player appears once.
const ALL_PLAYERS: { name: string; level: string; country: string; state?: string }[] = [
  // Open Division players
  { name: 'Pedro Ivo', level: 'Pro', country: 'Brazil', state: 'FL' },
  { name: 'Felipe Carbonaro', level: 'Pro', country: 'Brazil', state: 'FL' },
  { name: 'Roberto Asmar', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Ademir Cabral', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Thiago Mixirica', level: 'Pro', country: 'Brazil', state: 'FL' },
  { name: 'Cesar Fiorio', level: 'Pro', country: 'Brazil', state: 'FL' },
  { name: 'Gustavo Guimaraes', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Thiago Guimaraes', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Lucas Moraes', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Vladimir Silveira', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Mazo Soares', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Wesley Oliveira', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Bruno BR7', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Victor Martinez', level: 'Advanced', country: 'United States', state: 'FL' },
  { name: 'Manoel Carneiro', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Bruno Marcelo', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Fernando Chorei', level: 'Pro', country: 'Brazil', state: 'FL' },
  { name: 'Billy Oliveira', level: 'Pro', country: 'Brazil', state: 'FL' },
  { name: 'Diego Tavares', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Yuri Ribeiro', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Breno da Mata', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Luan Maia', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Pedro Espindola', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Pedro Galimberti', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Fabricio Barancoski', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Piu Montemor', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'William Jorge', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Matheus Eller', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Felipe Netto', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Bruno Vieira', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Junior Baiano', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Michael Douglas', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Bernardo Avila', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Tuio Silveira', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Gabriel Souza', level: 'Pro', country: 'Brazil', state: 'FL' },
  { name: 'Leozinho Gomes', level: 'Pro', country: 'Brazil', state: 'FL' },
  { name: 'Ricardo Pavei', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Dalan Telles', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Afonso Pinheiro', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Pedro Kassem', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Janser Pinho', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Joao Gabriel Freitas', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Guiga Muller', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Breno Soares', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Thiago Platz', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Gilberto Camillato', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Matheus Paes', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Fe Schneider', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Patricia Rodriguez', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Rogerio Teixeira', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Thiago Cunha', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Lucca Toledo', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Zuca Palladino', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Lucas Silva', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Henrique Oliveira', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Carlos Iwata', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Rafa Barao', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Igor Martins', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Marcos Chantel', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Anderson Silva', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Moises Davalos', level: 'Pro', country: 'Paraguay' },
  { name: 'Ivan Davalos', level: 'Pro', country: 'Paraguay' },
  { name: 'Gabriela Allen-Vieira', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Fabiola Zanella', level: 'Advanced', country: 'Brazil', state: 'FL' },

  // Women's Division players (not already listed)
  { name: 'Fiorella Pelegrini', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Gabi Macedo', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Kaitlyn Brunworth', level: 'Advanced', country: 'United States', state: 'FL' },
  { name: 'Gaby Coelho', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Ana Paula Khouri', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Felicia Cunha', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Juliana Benn', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Malu Costa', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Tata Moreira', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Karol Muniz', level: 'Pro', country: 'Brazil', state: 'FL' },
  { name: 'Jarede Cesar', level: 'Pro', country: 'Brazil', state: 'FL' },
  { name: 'Duda Souza', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Julia Novaes', level: 'Intermediate', country: 'Brazil', state: 'FL' },

  // Master Division players (not already listed)
  { name: 'Araken Fernandes', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Heron Tavares', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Sandro de Sa', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Herivelto Nogueira', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Alexandre Vieira', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Socrates Demetrius', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Carlos Montemor', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Marco Muricy', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Jairo Braga', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Jefferson David', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Giovanni Silva', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Rivelino Oliveira', level: 'Advanced', country: 'Brazil', state: 'FL' },
  { name: 'Alex Batuta', level: 'Pro', country: 'Brazil', state: 'FL' },
  { name: 'Junior Pereira', level: 'Pro', country: 'Brazil', state: 'FL' },
  { name: 'Rafael Palhinha', level: 'Intermediate', country: 'Brazil', state: 'FL' },
  { name: 'Marcos Araujo', level: 'Intermediate', country: 'Brazil', state: 'FL' },

  // Beginners Division players (not already listed)
  { name: 'Erick Wiedemann', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Richard de Souza', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Marcos Souza', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Daniel Cortes', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Robin Sibalin', level: 'Beginner', country: 'United States', state: 'FL' },
  { name: 'Karoly Csak', level: 'Beginner', country: 'United States', state: 'FL' },
  { name: 'Stella Gress', level: 'Beginner', country: 'United States', state: 'FL' },
  { name: 'Bryan Martinho', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Breno Gama', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Luis Quintella', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Chandler Wilder', level: 'Beginner', country: 'United States', state: 'FL' },
  { name: 'Izhak Revah', level: 'Beginner', country: 'United States', state: 'FL' },
  { name: 'Arthur Mesquita', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Henrique Leandro', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Marcelo Oliveira', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Flavio Silva', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Alexandre Souza', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Ceni Azevedo', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Nino Ferreira', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Kris Ramos', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Rafael Barros', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Leo Andreucci', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Ricardo Pereira', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Marcel Gomes', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Filipe Palacios', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Joao Paulo Passos', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Kaique Fagundes', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Bruna Leao', level: 'Beginner', country: 'Brazil', state: 'FL' },
  { name: 'Daniela Diaz', level: 'Beginner', country: 'United States', state: 'FL' },
];

// ─── Player lookup helper ────────────────────────────────────
const userMap = new Map<string, string>(); // name -> id

function uid(name: string): string {
  const id = userMap.get(name);
  if (!id) throw new Error(`Player not found: ${name}`);
  return id;
}

function t(p1: string, p2: string): TeamDef {
  return { p1, p2 };
}

// ─── Main Seed Function ──────────────────────────────────────
async function main() {
  console.log('🏐 Seeding NFA 2022 Tour - 4th Stop Orlando, FL...');

  // Check if tournament already exists
  const existing = await prisma.tournament.findFirst({
    where: { name: '2022 NFA Tour - 4th Stop Orlando, FL' },
  });
  if (existing) {
    console.log('Tournament already exists, skipping seed.');
    return;
  }

  // ── Step 1: Create or find users ──────────────────────────
  console.log('Creating players...');
  const defaultPassword = await bcryptjs.hash('nfa2022', 10);

  for (const player of ALL_PLAYERS) {
    const emailSlug = player.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.+|\.+$/g, '');
    const email = `${emailSlug}@nfa-orlando.com`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: player.name,
        email,
        password: defaultPassword,
        role: 'user',
        nationality: player.country === 'Brazil' ? 'Brazilian' : player.country === 'Paraguay' ? 'Paraguayan' : 'American',
        country: player.country,
        state: player.state || 'FL',
        level: player.level,
      },
    });
    userMap.set(player.name, user.id);
  }

  // Also need an organizer
  const organizer = await prisma.user.upsert({
    where: { email: 'nfa@footvolleyusa.com' },
    update: {},
    create: {
      name: 'NFA - National Footvolley Association',
      email: 'nfa@footvolleyusa.com',
      password: defaultPassword,
      role: 'organizer',
      nationality: 'American',
      country: 'United States',
      state: 'FL',
      level: 'Pro',
    },
  });

  console.log(`Created ${ALL_PLAYERS.length} players`);

  // ── Step 2: Create Tournament ─────────────────────────────
  const tournament = await prisma.tournament.create({
    data: {
      name: '2022 NFA Tour - 4th Stop Orlando, FL',
      description: 'NFA National Footvolley Association Tour 2022 - 4th Stop held at Riplay Beach Sports Orlando. Features Open Division 1/2/3, Women\'s, Master, and Beginners divisions.',
      date: new Date('2022-11-12T09:00:00Z'),
      endDate: new Date('2022-11-13T19:00:00Z'),
      location: 'Riplay Beach Sports',
      city: 'Orlando',
      state: 'FL',
      country: 'United States',
      status: 'completed',
      numCourts: 4,
      numDays: 2,
      hoursPerDay: 10,
      avgGameMinutes: 20,
      pointsPerSet: 18,
      numSets: 1,
      groupSize: 4,
      organizerId: organizer.id,
      allowMultiCategory: true,
    },
  });

  console.log(`Created tournament: ${tournament.name}`);

  // ── Step 3: Create Categories ─────────────────────────────
  const catOpenDiv1 = await prisma.category.create({
    data: {
      tournamentId: tournament.id,
      name: 'Open Division 1',
      format: 'bracket',
      gender: 'male',
      skillLevel: 'pro',
      maxTeams: 32,
      pointsPerSet: 18,
      sortOrder: 1,
      status: 'completed',
    },
  });

  const catOpenDiv2 = await prisma.category.create({
    data: {
      tournamentId: tournament.id,
      name: 'Open Division 2',
      format: 'bracket',
      gender: 'male',
      skillLevel: 'advanced',
      maxTeams: 8,
      pointsPerSet: 18,
      sortOrder: 2,
      status: 'completed',
    },
  });

  const catOpenDiv3 = await prisma.category.create({
    data: {
      tournamentId: tournament.id,
      name: 'Open Division 3',
      format: 'bracket',
      gender: 'male',
      skillLevel: 'intermediate',
      maxTeams: 16,
      pointsPerSet: 18,
      sortOrder: 3,
      status: 'completed',
    },
  });

  const catWomens = await prisma.category.create({
    data: {
      tournamentId: tournament.id,
      name: "Women's Division",
      format: 'group_knockout',
      gender: 'female',
      skillLevel: 'advanced',
      maxTeams: 8,
      pointsPerSet: 18,
      groupSize: 4,
      sortOrder: 4,
      status: 'completed',
    },
  });

  const catMaster = await prisma.category.create({
    data: {
      tournamentId: tournament.id,
      name: 'Master Division',
      format: 'group_knockout',
      gender: 'male',
      skillLevel: 'advanced',
      maxTeams: 8,
      pointsPerSet: 18,
      groupSize: 4,
      sortOrder: 5,
      status: 'completed',
    },
  });

  const catBeginners = await prisma.category.create({
    data: {
      tournamentId: tournament.id,
      name: 'Beginners Division',
      format: 'group_knockout',
      gender: 'mixed',
      skillLevel: 'beginner',
      maxTeams: 16,
      pointsPerSet: 18,
      groupSize: 4,
      sortOrder: 6,
      status: 'completed',
    },
  });

  console.log('Created 6 categories');

  // ── Step 4: Register players ──────────────────────────────
  // Track registered per (userId, categoryId) to allow multi-category
  const registered = new Set<string>();
  let totalRegistrations = 0;

  async function registerPlayer(userId: string, categoryId: string) {
    const key = `${userId}:${categoryId}`;
    if (registered.has(key)) return;
    registered.add(key);
    totalRegistrations++;
    await prisma.tournamentPlayer.create({
      data: {
        tournamentId: tournament.id,
        userId,
        categoryId,
        status: 'registered',
      },
    });
  }

  // Register Open Division 1 players (all 32 teams = 64 players)
  const openDiv1Teams: TeamDef[] = [
    t('Pedro Ivo', 'Felipe Carbonaro'),
    t('Roberto Asmar', 'Ademir Cabral'),
    t('Thiago Mixirica', 'Cesar Fiorio'),
    t('Gustavo Guimaraes', 'Thiago Guimaraes'),
    t('Lucas Moraes', 'Vladimir Silveira'),
    t('Mazo Soares', 'Wesley Oliveira'),
    t('Bruno BR7', 'Victor Martinez'),
    t('Manoel Carneiro', 'Bruno Marcelo'),
    t('Fernando Chorei', 'Billy Oliveira'),
    t('Diego Tavares', 'Yuri Ribeiro'),
    t('Breno da Mata', 'Luan Maia'),
    t('Pedro Espindola', 'Pedro Galimberti'),
    t('Fabricio Barancoski', 'Piu Montemor'),
    t('William Jorge', 'Matheus Eller'),
    t('Felipe Netto', 'Bruno Vieira'),
    t('Junior Baiano', 'Michael Douglas'),
    t('Bernardo Avila', 'Tuio Silveira'),
    t('Gabriel Souza', 'Leozinho Gomes'),
    t('Ricardo Pavei', 'Dalan Telles'),
    t('Afonso Pinheiro', 'Pedro Kassem'),
    t('Janser Pinho', 'Joao Gabriel Freitas'),
    t('Guiga Muller', 'Breno Soares'),
    t('Thiago Platz', 'Gilberto Camillato'),
    t('Matheus Paes', 'Fe Schneider'),
    t('Patricia Rodriguez', 'Rogerio Teixeira'),
    t('Thiago Cunha', 'Lucca Toledo'),
    t('Zuca Palladino', 'Lucas Silva'),
    t('Henrique Oliveira', 'Carlos Iwata'),
    t('Rafa Barao', 'Igor Martins'),
    t('Marcos Chantel', 'Anderson Silva'),
    t('Moises Davalos', 'Ivan Davalos'),
    t('Gabriela Allen-Vieira', 'Fabiola Zanella'),
  ];

  for (const team of openDiv1Teams) {
    await registerPlayer(uid(team.p1), catOpenDiv1.id);
    await registerPlayer(uid(team.p2), catOpenDiv1.id);
  }

  // Register Open Division 2 players (8 teams from PDF 2)
  const openDiv2Teams: TeamDef[] = [
    t('Gabriel Souza', 'Leozinho Gomes'),
    t('Thiago Cunha', 'Lucca Toledo'),
    t('Fabricio Barancoski', 'Piu Montemor'),
    t('Bernardo Avila', 'Tuio Silveira'),
    t('Junior Baiano', 'Michael Douglas'),
    t('Marcos Chantel', 'Anderson Silva'),
    t('Pedro Espindola', 'Pedro Galimberti'),
    t('Zuca Palladino', 'Lucas Silva'),
  ];

  for (const team of openDiv2Teams) {
    await registerPlayer(uid(team.p1), catOpenDiv2.id);
    await registerPlayer(uid(team.p2), catOpenDiv2.id);
  }

  // Register Open Division 3 players (16 teams from PDF 3)
  const openDiv3Teams: TeamDef[] = [
    t('Ricardo Pavei', 'Dalan Telles'),
    t('Rafa Barao', 'Igor Martins'),
    t('Roberto Asmar', 'Ademir Cabral'),
    t('Manoel Carneiro', 'Bruno Marcelo'),
    t('Guiga Muller', 'Breno Soares'),
    t('William Jorge', 'Matheus Eller'),
    t('Thiago Platz', 'Gilberto Camillato'),
    t('Janser Pinho', 'Joao Gabriel Freitas'),
    t('Matheus Paes', 'Fe Schneider'),
    t('Lucas Moraes', 'Vladimir Silveira'),
    t('Gustavo Guimaraes', 'Thiago Guimaraes'),
    t('Breno da Mata', 'Luan Maia'),
    t('Gabriela Allen-Vieira', 'Fabiola Zanella'),
    t('Henrique Oliveira', 'Carlos Iwata'),
    t('Felipe Netto', 'Bruno Vieira'),
    t('Patricia Rodriguez', 'Rogerio Teixeira'),
  ];

  for (const team of openDiv3Teams) {
    await registerPlayer(uid(team.p1), catOpenDiv3.id);
    await registerPlayer(uid(team.p2), catOpenDiv3.id);
  }

  // Women's Division players
  const womensTeams: TeamDef[] = [
    t('Fiorella Pelegrini', 'Gabi Macedo'),
    t('Kaitlyn Brunworth', 'Gaby Coelho'),
    t('Ana Paula Khouri', 'Felicia Cunha'),
    t('Juliana Benn', 'Malu Costa'),
    t('Tata Moreira', 'Patricia Rodriguez'),
    t('Karol Muniz', 'Jarede Cesar'),
    t('Gabriela Allen-Vieira', 'Fabiola Zanella'),
    t('Duda Souza', 'Julia Novaes'),
  ];

  for (const team of womensTeams) {
    await registerPlayer(uid(team.p1), catWomens.id);
    await registerPlayer(uid(team.p2), catWomens.id);
  }

  // Master Division players
  const masterTeams: TeamDef[] = [
    t('Araken Fernandes', 'Heron Tavares'),
    t('Sandro de Sa', 'Herivelto Nogueira'),
    t('Alexandre Vieira', 'Socrates Demetrius'),
    t('Carlos Montemor', 'Marco Muricy'),
    t('Jairo Braga', 'Jefferson David'),
    t('Giovanni Silva', 'Rivelino Oliveira'),
    t('Alex Batuta', 'Junior Pereira'),
    t('Rafael Palhinha', 'Marcos Araujo'),
  ];

  for (const team of masterTeams) {
    await registerPlayer(uid(team.p1), catMaster.id);
    await registerPlayer(uid(team.p2), catMaster.id);
  }

  // Beginners Division players
  const beginnersTeams: TeamDef[] = [
    t('Erick Wiedemann', 'Richard de Souza'),
    t('Marcos Souza', 'Daniel Cortes'),
    t('Robin Sibalin', 'Karoly Csak'),
    t('Stella Gress', 'Bryan Martinho'),
    t('Breno Gama', 'Luis Quintella'),
    t('Chandler Wilder', 'Izhak Revah'),
    t('Arthur Mesquita', 'Henrique Leandro'),
    t('Marcelo Oliveira', 'Flavio Silva'),
    t('Alexandre Vieira', 'Socrates Demetrius'),
    t('Alexandre Souza', 'Ceni Azevedo'),
    t('Nino Ferreira', 'Kris Ramos'),
    t('Marco Muricy', 'Rafael Barros'),
    t('Leo Andreucci', 'Ricardo Pereira'),
    t('Marcel Gomes', 'Filipe Palacios'),
    t('Joao Paulo Passos', 'Kaique Fagundes'),
    t('Bruna Leao', 'Daniela Diaz'),
  ];

  for (const team of beginnersTeams) {
    await registerPlayer(uid(team.p1), catBeginners.id);
    await registerPlayer(uid(team.p2), catBeginners.id);
  }

  console.log(`Registered ${totalRegistrations} player entries across categories (${new Set([...registered].map(k => k.split(':')[0])).size} unique players)`);

  // ── Step 5: Helper to create a game ────────────────────────
  async function createGame(opts: {
    categoryId: string;
    roundId: string;
    groupId?: string;
    home: TeamDef;
    away: TeamDef;
    scoreHome: number;
    scoreAway: number;
    court: number;
    time: Date;
  }) {
    const winningSide = opts.scoreHome > opts.scoreAway ? 'home' : 'away';
    await prisma.game.create({
      data: {
        tournamentId: tournament.id,
        categoryId: opts.categoryId,
        roundId: opts.roundId,
        groupId: opts.groupId,
        player1HomeId: uid(opts.home.p1),
        player2HomeId: uid(opts.home.p2),
        player1AwayId: uid(opts.away.p1),
        player2AwayId: uid(opts.away.p2),
        scoreHome: opts.scoreHome,
        scoreAway: opts.scoreAway,
        status: 'completed',
        winningSide,
        courtNumber: opts.court,
        scheduledTime: opts.time,
      },
    });
  }

  const DAY1 = '2022-11-12';
  const DAY2 = '2022-11-13';

  function gameTime(day: string, time: string): Date {
    return new Date(`${day}T${time}:00Z`);
  }

  // ═══════════════════════════════════════════════════════════
  // OPEN DIVISION 1 — Full 32-team double-elimination bracket
  // Full 32-team double-elimination bracket:
  // W1(16)→L1(8)→W2(8)→L2(8)→W3(4)→L3(4)→L4(4)→W4(2)→L5(2)→L6(2)→SF(2)+3rd+Final
  // ═══════════════════════════════════════════════════════════
  console.log('Seeding Open Division 1...');

  const div1W1 = await prisma.round.create({
    data: { name: '1st Round W1', roundNumber: 1, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv1.id },
  });
  const div1L1 = await prisma.round.create({
    data: { name: '2nd Round L1', roundNumber: 2, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv1.id },
  });
  const div1W2 = await prisma.round.create({
    data: { name: '4th Round W2', roundNumber: 3, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv1.id },
  });
  const div1L2 = await prisma.round.create({
    data: { name: '3rd Round L2', roundNumber: 4, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv1.id },
  });
  const div1W3 = await prisma.round.create({
    data: { name: '4th Round W3', roundNumber: 5, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv1.id },
  });
  const div1L3 = await prisma.round.create({
    data: { name: '6th Round L3', roundNumber: 6, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv1.id },
  });
  const div1L4 = await prisma.round.create({
    data: { name: '8th Round L4', roundNumber: 7, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv1.id },
  });
  const div1W4 = await prisma.round.create({
    data: { name: '11th Round W4', roundNumber: 8, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv1.id },
  });
  const div1L5 = await prisma.round.create({
    data: { name: '11th Round L5', roundNumber: 9, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv1.id },
  });
  const div1L6 = await prisma.round.create({
    data: { name: '13th Round L6', roundNumber: 10, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv1.id },
  });
  const div1SF = await prisma.round.create({
    data: { name: 'Semi-Finals', roundNumber: 11, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv1.id },
  });
  const div1Third = await prisma.round.create({
    data: { name: '3rd Place', roundNumber: 12, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv1.id },
  });
  const div1Final = await prisma.round.create({
    data: { name: 'Final', roundNumber: 13, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv1.id },
  });

  // ── W1 (1st Round, 16 games — 32-team bracket) ──
  // M1: Roberto Asmar / Ademir Cabral 18 vs Janser Pinho / Joao Gabriel Freitas 15
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Roberto Asmar', 'Ademir Cabral'),
    away: t('Janser Pinho', 'Joao Gabriel Freitas'),
    scoreHome: 18, scoreAway: 15, court: 2,
    time: gameTime(DAY1, '09:00'),
  });
  // M2: Thiago Mixirica / Cesar Fiorio 18 vs Bernardo Avila / Tuio Silveira 10
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Thiago Mixirica', 'Cesar Fiorio'),
    away: t('Bernardo Avila', 'Tuio Silveira'),
    scoreHome: 18, scoreAway: 10, court: 3,
    time: gameTime(DAY1, '09:00'),
  });
  // M3: Gustavo Guimaraes / Thiago Guimaraes 18 vs Moises Davalos / Ivan Davalos 0 (walkover)
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Gustavo Guimaraes', 'Thiago Guimaraes'),
    away: t('Moises Davalos', 'Ivan Davalos'),
    scoreHome: 18, scoreAway: 0, court: 4,
    time: gameTime(DAY1, '09:00'),
  });
  // M4: Mazo Soares / Wesley Oliveira 18 vs Lucas Moraes / Vladimir Silveira 9
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Mazo Soares', 'Wesley Oliveira'),
    away: t('Lucas Moraes', 'Vladimir Silveira'),
    scoreHome: 18, scoreAway: 9, court: 1,
    time: gameTime(DAY1, '09:00'),
  });
  // M5: Fernando Chorei / Billy Oliveira 18 vs Manoel Carneiro / Bruno Marcelo 6
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Fernando Chorei', 'Billy Oliveira'),
    away: t('Manoel Carneiro', 'Bruno Marcelo'),
    scoreHome: 18, scoreAway: 6, court: 2,
    time: gameTime(DAY1, '09:20'),
  });
  // M6: Guiga Muller / Breno Soares 18 vs Thiago Cunha / Lucca Toledo 10
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Guiga Muller', 'Breno Soares'),
    away: t('Thiago Cunha', 'Lucca Toledo'),
    scoreHome: 18, scoreAway: 10, court: 3,
    time: gameTime(DAY1, '09:20'),
  });
  // M7: Felipe Netto / Bruno Vieira 18 vs William Jorge / Matheus Eller 8
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Felipe Netto', 'Bruno Vieira'),
    away: t('William Jorge', 'Matheus Eller'),
    scoreHome: 18, scoreAway: 8, court: 4,
    time: gameTime(DAY1, '09:20'),
  });
  // M8: Bruno BR7 / Victor Martinez 18 vs Junior Baiano / Michael Douglas 10
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Bruno BR7', 'Victor Martinez'),
    away: t('Junior Baiano', 'Michael Douglas'),
    scoreHome: 18, scoreAway: 10, court: 1,
    time: gameTime(DAY1, '09:20'),
  });
  // M17: Pedro Ivo / Felipe Carbonaro 18 vs Ricardo Pavei / Dalan Telles 0 (walkover)
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Pedro Ivo', 'Felipe Carbonaro'),
    away: t('Ricardo Pavei', 'Dalan Telles'),
    scoreHome: 18, scoreAway: 0, court: 4,
    time: gameTime(DAY1, '10:20'),
  });
  // M18: Afonso Pinheiro / Pedro Kassem 24 vs Gabriel Souza / Leozinho Gomes 22
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Afonso Pinheiro', 'Pedro Kassem'),
    away: t('Gabriel Souza', 'Leozinho Gomes'),
    scoreHome: 24, scoreAway: 22, court: 1,
    time: gameTime(DAY1, '10:20'),
  });
  // M19: Matheus Paes / Fe Schneider 18 vs Patricia Rodriguez / Rogerio Teixeira 15
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Matheus Paes', 'Fe Schneider'),
    away: t('Patricia Rodriguez', 'Rogerio Teixeira'),
    scoreHome: 18, scoreAway: 15, court: 2,
    time: gameTime(DAY1, '10:20'),
  });
  // M20: Zuca Palladino / Lucas Silva 18 vs Thiago Platz / Gilberto Camillato 4
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Zuca Palladino', 'Lucas Silva'),
    away: t('Thiago Platz', 'Gilberto Camillato'),
    scoreHome: 18, scoreAway: 4, court: 3,
    time: gameTime(DAY1, '10:20'),
  });
  // M21: Diego Tavares / Yuri Ribeiro 18 vs Breno da Mata / Luan Maia 12
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Diego Tavares', 'Yuri Ribeiro'),
    away: t('Breno da Mata', 'Luan Maia'),
    scoreHome: 18, scoreAway: 12, court: 4,
    time: gameTime(DAY1, '10:40'),
  });
  // M22: Fabricio Barancoski / Piu Montemor 20 vs Pedro Espindola / Pedro Galimberti 18
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Fabricio Barancoski', 'Piu Montemor'),
    away: t('Pedro Espindola', 'Pedro Galimberti'),
    scoreHome: 20, scoreAway: 18, court: 1,
    time: gameTime(DAY1, '10:40'),
  });
  // M23: Henrique Oliveira / Carlos Iwata 18 vs Gabriela Allen-Vieira / Fabiola Zanella 11
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Henrique Oliveira', 'Carlos Iwata'),
    away: t('Gabriela Allen-Vieira', 'Fabiola Zanella'),
    scoreHome: 18, scoreAway: 11, court: 2,
    time: gameTime(DAY1, '10:40'),
  });
  // M24: Marcos Chantel / Anderson Silva 18 vs Rafa Barao / Igor Martins 12
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W1.id,
    home: t('Marcos Chantel', 'Anderson Silva'),
    away: t('Rafa Barao', 'Igor Martins'),
    scoreHome: 18, scoreAway: 12, court: 3,
    time: gameTime(DAY1, '10:40'),
  });

  // ── L1 (2nd Round, 8 games — W1 losers play each other) ──
  // M11: Bernardo Avila / Tuio Silveira 18 vs Janser Pinho / Joao Gabriel Freitas 5
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L1.id,
    home: t('Bernardo Avila', 'Tuio Silveira'),
    away: t('Janser Pinho', 'Joao Gabriel Freitas'),
    scoreHome: 18, scoreAway: 5, court: 2,
    time: gameTime(DAY1, '09:40'),
  });
  // M12: Moises Davalos / Ivan Davalos 18 vs Lucas Moraes / Vladimir Silveira 7
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L1.id,
    home: t('Moises Davalos', 'Ivan Davalos'),
    away: t('Lucas Moraes', 'Vladimir Silveira'),
    scoreHome: 18, scoreAway: 7, court: 1,
    time: gameTime(DAY1, '09:40'),
  });
  // M15: Thiago Cunha / Lucca Toledo 18 vs Manoel Carneiro / Bruno Marcelo 6
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L1.id,
    home: t('Thiago Cunha', 'Lucca Toledo'),
    away: t('Manoel Carneiro', 'Bruno Marcelo'),
    scoreHome: 18, scoreAway: 6, court: 2,
    time: gameTime(DAY1, '10:00'),
  });
  // M16: Junior Baiano / Michael Douglas 18 vs William Jorge / Matheus Eller 4
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L1.id,
    home: t('Junior Baiano', 'Michael Douglas'),
    away: t('William Jorge', 'Matheus Eller'),
    scoreHome: 18, scoreAway: 4, court: 1,
    time: gameTime(DAY1, '10:00'),
  });
  // M27: Gabriel Souza / Leozinho Gomes 18 vs Ricardo Pavei / Dalan Telles 0 (walkover)
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L1.id,
    home: t('Gabriel Souza', 'Leozinho Gomes'),
    away: t('Ricardo Pavei', 'Dalan Telles'),
    scoreHome: 18, scoreAway: 0, court: 1,
    time: gameTime(DAY1, '11:00'),
  });
  // M28: Thiago Platz / Gilberto Camillato 18 vs Patricia Rodriguez / Rogerio Teixeira 13
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L1.id,
    home: t('Thiago Platz', 'Gilberto Camillato'),
    away: t('Patricia Rodriguez', 'Rogerio Teixeira'),
    scoreHome: 18, scoreAway: 13, court: 4,
    time: gameTime(DAY1, '11:00'),
  });
  // M31: Pedro Espindola / Pedro Galimberti 18 vs Breno da Mata / Luan Maia 7
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L1.id,
    home: t('Pedro Espindola', 'Pedro Galimberti'),
    away: t('Breno da Mata', 'Luan Maia'),
    scoreHome: 18, scoreAway: 7, court: 3,
    time: gameTime(DAY1, '11:20'),
  });
  // M32: Rafa Barao / Igor Martins 18 vs Gabriela Allen-Vieira / Fabiola Zanella 12
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L1.id,
    home: t('Rafa Barao', 'Igor Martins'),
    away: t('Gabriela Allen-Vieira', 'Fabiola Zanella'),
    scoreHome: 18, scoreAway: 12, court: 4,
    time: gameTime(DAY1, '11:20'),
  });

  // ── W2 (4th Round, 8 games — Round of 16 winners) ──
  // M9: Thiago Mixirica / Cesar Fiorio 18 vs Roberto Asmar / Ademir Cabral 8
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W2.id,
    home: t('Thiago Mixirica', 'Cesar Fiorio'),
    away: t('Roberto Asmar', 'Ademir Cabral'),
    scoreHome: 18, scoreAway: 8, court: 4,
    time: gameTime(DAY1, '09:40'),
  });
  // M10: Mazo Soares / Wesley Oliveira 18 vs Gustavo Guimaraes / Thiago Guimaraes 12
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W2.id,
    home: t('Mazo Soares', 'Wesley Oliveira'),
    away: t('Gustavo Guimaraes', 'Thiago Guimaraes'),
    scoreHome: 18, scoreAway: 12, court: 3,
    time: gameTime(DAY1, '09:40'),
  });
  // M13: Fernando Chorei / Billy Oliveira 18 vs Guiga Muller / Breno Soares 5
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W2.id,
    home: t('Fernando Chorei', 'Billy Oliveira'),
    away: t('Guiga Muller', 'Breno Soares'),
    scoreHome: 18, scoreAway: 5, court: 4,
    time: gameTime(DAY1, '10:00'),
  });
  // M14: Bruno BR7 / Victor Martinez 18 vs Felipe Netto / Bruno Vieira 10
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W2.id,
    home: t('Bruno BR7', 'Victor Martinez'),
    away: t('Felipe Netto', 'Bruno Vieira'),
    scoreHome: 18, scoreAway: 10, court: 3,
    time: gameTime(DAY1, '10:00'),
  });
  // M25: Afonso Pinheiro / Pedro Kassem 18 vs Pedro Ivo / Felipe Carbonaro 15
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W2.id,
    home: t('Afonso Pinheiro', 'Pedro Kassem'),
    away: t('Pedro Ivo', 'Felipe Carbonaro'),
    scoreHome: 18, scoreAway: 15, court: 2,
    time: gameTime(DAY1, '11:00'),
  });
  // M26: Zuca Palladino / Lucas Silva 18 vs Matheus Paes / Fe Schneider 15
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W2.id,
    home: t('Zuca Palladino', 'Lucas Silva'),
    away: t('Matheus Paes', 'Fe Schneider'),
    scoreHome: 18, scoreAway: 15, court: 3,
    time: gameTime(DAY1, '11:00'),
  });
  // M29: Diego Tavares / Yuri Ribeiro 18 vs Fabricio Barancoski / Piu Montemor 9
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W2.id,
    home: t('Diego Tavares', 'Yuri Ribeiro'),
    away: t('Fabricio Barancoski', 'Piu Montemor'),
    scoreHome: 18, scoreAway: 9, court: 2,
    time: gameTime(DAY1, '11:20'),
  });
  // M30: Marcos Chantel / Anderson Silva 18 vs Henrique Oliveira / Carlos Iwata 9
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W2.id,
    home: t('Marcos Chantel', 'Anderson Silva'),
    away: t('Henrique Oliveira', 'Carlos Iwata'),
    scoreHome: 18, scoreAway: 9, court: 1,
    time: gameTime(DAY1, '11:20'),
  });

  // ── L2 (3rd Round, 8 games — L1 winners vs W2 losers) ──
  // M33: Bernardo Avila / Tuio Silveira 18 vs Felipe Netto / Bruno Vieira 16
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L2.id,
    home: t('Bernardo Avila', 'Tuio Silveira'),
    away: t('Felipe Netto', 'Bruno Vieira'),
    scoreHome: 18, scoreAway: 16, court: 3,
    time: gameTime(DAY1, '11:40'),
  });
  // M34: Moises Davalos / Ivan Davalos 18 vs Guiga Muller / Breno Soares 12
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L2.id,
    home: t('Moises Davalos', 'Ivan Davalos'),
    away: t('Guiga Muller', 'Breno Soares'),
    scoreHome: 18, scoreAway: 12, court: 2,
    time: gameTime(DAY1, '11:40'),
  });
  // M35: Thiago Cunha / Lucca Toledo 18 vs Gustavo Guimaraes / Thiago Guimaraes 9
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L2.id,
    home: t('Thiago Cunha', 'Lucca Toledo'),
    away: t('Gustavo Guimaraes', 'Thiago Guimaraes'),
    scoreHome: 18, scoreAway: 9, court: 4,
    time: gameTime(DAY1, '11:40'),
  });
  // M36: Junior Baiano / Michael Douglas 18 vs Roberto Asmar / Ademir Cabral 13
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L2.id,
    home: t('Junior Baiano', 'Michael Douglas'),
    away: t('Roberto Asmar', 'Ademir Cabral'),
    scoreHome: 18, scoreAway: 13, court: 1,
    time: gameTime(DAY1, '11:40'),
  });
  // M37: Gabriel Souza / Leozinho Gomes 18 vs Henrique Oliveira / Carlos Iwata 11
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L2.id,
    home: t('Gabriel Souza', 'Leozinho Gomes'),
    away: t('Henrique Oliveira', 'Carlos Iwata'),
    scoreHome: 18, scoreAway: 11, court: 4,
    time: gameTime(DAY1, '12:00'),
  });
  // M38: Fabricio Barancoski / Piu Montemor 18 vs Thiago Platz / Gilberto Camillato 7
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L2.id,
    home: t('Fabricio Barancoski', 'Piu Montemor'),
    away: t('Thiago Platz', 'Gilberto Camillato'),
    scoreHome: 18, scoreAway: 7, court: 1,
    time: gameTime(DAY1, '12:00'),
  });
  // M39: Pedro Espindola / Pedro Galimberti 18 vs Matheus Paes / Fe Schneider 10
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L2.id,
    home: t('Pedro Espindola', 'Pedro Galimberti'),
    away: t('Matheus Paes', 'Fe Schneider'),
    scoreHome: 18, scoreAway: 10, court: 2,
    time: gameTime(DAY1, '12:00'),
  });
  // M40: Pedro Ivo / Felipe Carbonaro 18 vs Rafa Barao / Igor Martins 9
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L2.id,
    home: t('Pedro Ivo', 'Felipe Carbonaro'),
    away: t('Rafa Barao', 'Igor Martins'),
    scoreHome: 18, scoreAway: 9, court: 3,
    time: gameTime(DAY1, '12:00'),
  });

  // ── W3 (Quarter-Finals, 4 games) ──
  // M41: Thiago Mixirica / Cesar Fiorio 18 vs Afonso Pinheiro / Pedro Kassem 8
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W3.id,
    home: t('Thiago Mixirica', 'Cesar Fiorio'),
    away: t('Afonso Pinheiro', 'Pedro Kassem'),
    scoreHome: 18, scoreAway: 8, court: 3,
    time: gameTime(DAY1, '12:20'),
  });
  // M42: Mazo Soares / Wesley Oliveira 18 vs Zuca Palladino / Lucas Silva 12
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W3.id,
    home: t('Mazo Soares', 'Wesley Oliveira'),
    away: t('Zuca Palladino', 'Lucas Silva'),
    scoreHome: 18, scoreAway: 12, court: 4,
    time: gameTime(DAY1, '12:20'),
  });
  // M43: Fernando Chorei / Billy Oliveira 18 vs Diego Tavares / Yuri Ribeiro 12
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W3.id,
    home: t('Fernando Chorei', 'Billy Oliveira'),
    away: t('Diego Tavares', 'Yuri Ribeiro'),
    scoreHome: 18, scoreAway: 12, court: 1,
    time: gameTime(DAY1, '12:20'),
  });
  // M44: Bruno BR7 / Victor Martinez 18 vs Marcos Chantel / Anderson Silva 16
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W3.id,
    home: t('Bruno BR7', 'Victor Martinez'),
    away: t('Marcos Chantel', 'Anderson Silva'),
    scoreHome: 18, scoreAway: 16, court: 2,
    time: gameTime(DAY1, '12:20'),
  });

  // ── L3 (6th Round, 4 games — L2 winners play each other) ──
  // NOTE: Bracket shows 18-18 for all L3 matches (organizer input error). Using 20-18 as likely actual scores.
  // M45: Bernardo Avila / Tuio Silveira 20 vs Gabriel Souza / Leozinho Gomes 18
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L3.id,
    home: t('Bernardo Avila', 'Tuio Silveira'),
    away: t('Gabriel Souza', 'Leozinho Gomes'),
    scoreHome: 20, scoreAway: 18, court: 3,
    time: gameTime(DAY1, '12:40'),
  });
  // M46: Moises Davalos / Ivan Davalos 20 vs Fabricio Barancoski / Piu Montemor 18
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L3.id,
    home: t('Moises Davalos', 'Ivan Davalos'),
    away: t('Fabricio Barancoski', 'Piu Montemor'),
    scoreHome: 20, scoreAway: 18, court: 4,
    time: gameTime(DAY1, '12:40'),
  });
  // M47: Thiago Cunha / Lucca Toledo 20 vs Pedro Espindola / Pedro Galimberti 18
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L3.id,
    home: t('Thiago Cunha', 'Lucca Toledo'),
    away: t('Pedro Espindola', 'Pedro Galimberti'),
    scoreHome: 20, scoreAway: 18, court: 2,
    time: gameTime(DAY1, '12:40'),
  });
  // M48: Pedro Ivo / Felipe Carbonaro 20 vs Junior Baiano / Michael Douglas 18
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L3.id,
    home: t('Pedro Ivo', 'Felipe Carbonaro'),
    away: t('Junior Baiano', 'Michael Douglas'),
    scoreHome: 20, scoreAway: 18, court: 1,
    time: gameTime(DAY1, '12:40'),
  });

  // ── L4 (8th Round, 4 games — L3 winners vs W3 losers) ──
  // M57: Afonso Pinheiro / Pedro Kassem 21 vs Bernardo Avila / Tuio Silveira 19
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L4.id,
    home: t('Afonso Pinheiro', 'Pedro Kassem'),
    away: t('Bernardo Avila', 'Tuio Silveira'),
    scoreHome: 21, scoreAway: 19, court: 1,
    time: gameTime(DAY1, '14:20'),
  });
  // M58: Moises Davalos / Ivan Davalos 18 vs Zuca Palladino / Lucas Silva 9
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L4.id,
    home: t('Moises Davalos', 'Ivan Davalos'),
    away: t('Zuca Palladino', 'Lucas Silva'),
    scoreHome: 18, scoreAway: 9, court: 2,
    time: gameTime(DAY1, '14:20'),
  });
  // M59: Diego Tavares / Yuri Ribeiro 18 vs Thiago Cunha / Lucca Toledo 12
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L4.id,
    home: t('Diego Tavares', 'Yuri Ribeiro'),
    away: t('Thiago Cunha', 'Lucca Toledo'),
    scoreHome: 18, scoreAway: 12, court: 3,
    time: gameTime(DAY1, '14:20'),
  });
  // M60: Pedro Ivo / Felipe Carbonaro 18 vs Marcos Chantel / Anderson Silva 4
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L4.id,
    home: t('Pedro Ivo', 'Felipe Carbonaro'),
    away: t('Marcos Chantel', 'Anderson Silva'),
    scoreHome: 18, scoreAway: 4, court: 4,
    time: gameTime(DAY1, '14:20'),
  });

  // ── W4 (Winners Bracket Semi-Finals, 2 games) ──
  // M69: Thiago Mixirica / Cesar Fiorio 18 vs Mazo Soares / Wesley Oliveira 12
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W4.id,
    home: t('Thiago Mixirica', 'Cesar Fiorio'),
    away: t('Mazo Soares', 'Wesley Oliveira'),
    scoreHome: 18, scoreAway: 12, court: 1,
    time: gameTime(DAY1, '15:40'),
  });
  // M70: Fernando Chorei / Billy Oliveira 18 vs Bruno BR7 / Victor Martinez 6
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1W4.id,
    home: t('Fernando Chorei', 'Billy Oliveira'),
    away: t('Bruno BR7', 'Victor Martinez'),
    scoreHome: 18, scoreAway: 6, court: 2,
    time: gameTime(DAY1, '15:40'),
  });

  // ── L5 (11th Round, 2 games — L4 winners play each other) ──
  // M71: Moises Davalos / Ivan Davalos 18 vs Afonso Pinheiro / Pedro Kassem 9
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L5.id,
    home: t('Moises Davalos', 'Ivan Davalos'),
    away: t('Afonso Pinheiro', 'Pedro Kassem'),
    scoreHome: 18, scoreAway: 9, court: 3,
    time: gameTime(DAY1, '15:40'),
  });
  // M72: Pedro Ivo / Felipe Carbonaro 18 vs Diego Tavares / Yuri Ribeiro 7
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L5.id,
    home: t('Pedro Ivo', 'Felipe Carbonaro'),
    away: t('Diego Tavares', 'Yuri Ribeiro'),
    scoreHome: 18, scoreAway: 7, court: 4,
    time: gameTime(DAY1, '15:40'),
  });

  // ── L6 (13th Round, 2 games — L5 winners vs W4 losers) ──
  // M77: Moises Davalos / Ivan Davalos 18 vs Bruno BR7 / Victor Martinez 11
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L6.id,
    home: t('Moises Davalos', 'Ivan Davalos'),
    away: t('Bruno BR7', 'Victor Martinez'),
    scoreHome: 18, scoreAway: 11, court: 1,
    time: gameTime(DAY1, '16:40'),
  });
  // M78: Pedro Ivo / Felipe Carbonaro 18 vs Mazo Soares / Wesley Oliveira 9
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1L6.id,
    home: t('Pedro Ivo', 'Felipe Carbonaro'),
    away: t('Mazo Soares', 'Wesley Oliveira'),
    scoreHome: 18, scoreAway: 9, court: 2,
    time: gameTime(DAY1, '16:40'),
  });

  // SF1: Thiago Mixirica / Cesar Fiorio 14 vs 18 Moises Davalos / Ivan Davalos
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1SF.id,
    home: t('Thiago Mixirica', 'Cesar Fiorio'),
    away: t('Moises Davalos', 'Ivan Davalos'),
    scoreHome: 14, scoreAway: 18, court: 1,
    time: gameTime(DAY1, '17:20'),
  });

  // SF2: Fernando Chorei / Billy Oliveira 18 vs 12 Pedro Ivo / Felipe Carbonaro
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1SF.id,
    home: t('Fernando Chorei', 'Billy Oliveira'),
    away: t('Pedro Ivo', 'Felipe Carbonaro'),
    scoreHome: 18, scoreAway: 12, court: 2,
    time: gameTime(DAY1, '17:20'),
  });

  // 3rd Place: Thiago Mixirica / Cesar Fiorio 15 vs 18 Pedro Ivo / Felipe Carbonaro
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1Third.id,
    home: t('Thiago Mixirica', 'Cesar Fiorio'),
    away: t('Pedro Ivo', 'Felipe Carbonaro'),
    scoreHome: 15, scoreAway: 18, court: 1,
    time: gameTime(DAY1, '18:00'),
  });

  // FINAL: Moises Davalos / Ivan Davalos 18 vs 14 Fernando Chorei / Billy Oliveira
  await createGame({
    categoryId: catOpenDiv1.id, roundId: div1Final.id,
    home: t('Moises Davalos', 'Ivan Davalos'),
    away: t('Fernando Chorei', 'Billy Oliveira'),
    scoreHome: 18, scoreAway: 14, court: 1,
    time: gameTime(DAY1, '18:40'),
  });

  // ═══════════════════════════════════════════════════════════
  // OPEN DIVISION 2 — From standalone Division 2 PDF (8 teams, modified bracket)
  // Teams: losers from Division 1 Round of 16
  // Structure: W1(4) → W2(2) → L2(2) → L4(2) → SF(2) → 3rd(1) → Final(1) = 14 games
  // ═══════════════════════════════════════════════════════════
  console.log('Seeding Open Division 2...');

  const div2W1 = await prisma.round.create({
    data: { name: '10th Round W1', roundNumber: 1, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv2.id },
  });
  const div2W2 = await prisma.round.create({
    data: { name: '12th Round W2', roundNumber: 2, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv2.id },
  });
  const div2L2 = await prisma.round.create({
    data: { name: '12th Round L2', roundNumber: 3, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv2.id },
  });
  const div2L4 = await prisma.round.create({
    data: { name: '14th Round L4', roundNumber: 4, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv2.id },
  });
  const div2SF = await prisma.round.create({
    data: { name: 'Semi-Finals', roundNumber: 5, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv2.id },
  });
  const div2Third = await prisma.round.create({
    data: { name: '3rd Place', roundNumber: 6, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv2.id },
  });
  const div2Final = await prisma.round.create({
    data: { name: 'Final', roundNumber: 7, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv2.id },
  });

  // ── W1 (10th Round, 4 games) ──
  // M65: Gab Souza / Leozinho Gomes 18 vs Thiago Cunha / Lucca Toledo 10
  await createGame({
    categoryId: catOpenDiv2.id, roundId: div2W1.id,
    home: t('Gabriel Souza', 'Leozinho Gomes'),
    away: t('Thiago Cunha', 'Lucca Toledo'),
    scoreHome: 18, scoreAway: 10, court: 1,
    time: gameTime(DAY1, '15:20'),
  });

  // M66: Fabricio Barancoski / Piu Montemor 16 vs Marcos Chantel / Anderson Silva 18
  await createGame({
    categoryId: catOpenDiv2.id, roundId: div2W1.id,
    home: t('Fabricio Barancoski', 'Piu Montemor'),
    away: t('Marcos Chantel', 'Anderson Silva'),
    scoreHome: 16, scoreAway: 18, court: 2,
    time: gameTime(DAY1, '15:20'),
  });

  // M67: Pedro Espindola / Pedro Galimberti 7 vs Bernardo Avila / Tuio Silveira 18
  await createGame({
    categoryId: catOpenDiv2.id, roundId: div2W1.id,
    home: t('Pedro Espindola', 'Pedro Galimberti'),
    away: t('Bernardo Avila', 'Tuio Silveira'),
    scoreHome: 7, scoreAway: 18, court: 3,
    time: gameTime(DAY1, '15:20'),
  });

  // M68: Jr. Baiano / Michael Douglas 15 vs Zuca Palladino / Lucas Silva 18
  await createGame({
    categoryId: catOpenDiv2.id, roundId: div2W1.id,
    home: t('Junior Baiano', 'Michael Douglas'),
    away: t('Zuca Palladino', 'Lucas Silva'),
    scoreHome: 15, scoreAway: 18, court: 4,
    time: gameTime(DAY1, '15:20'),
  });

  // ── W2 (12th Round, 2 games) ──
  // M73: Gab Souza / Leozinho Gomes 18 vs Marcos Chantel / Anderson Silva 13
  await createGame({
    categoryId: catOpenDiv2.id, roundId: div2W2.id,
    home: t('Gabriel Souza', 'Leozinho Gomes'),
    away: t('Marcos Chantel', 'Anderson Silva'),
    scoreHome: 18, scoreAway: 13, court: 1,
    time: gameTime(DAY1, '16:00'),
  });

  // M74: Bernardo Avila / Tuio Silveira 15 vs Zuca Palladino / Lucas Silva 18
  await createGame({
    categoryId: catOpenDiv2.id, roundId: div2W2.id,
    home: t('Bernardo Avila', 'Tuio Silveira'),
    away: t('Zuca Palladino', 'Lucas Silva'),
    scoreHome: 15, scoreAway: 18, court: 2,
    time: gameTime(DAY1, '16:00'),
  });

  // ── L2 (12th Round, 2 games — losers from W1) ──
  // M75: Thiago Cunha / Lucca Toledo 18 vs Jr. Baiano / Michael Douglas 14
  await createGame({
    categoryId: catOpenDiv2.id, roundId: div2L2.id,
    home: t('Thiago Cunha', 'Lucca Toledo'),
    away: t('Junior Baiano', 'Michael Douglas'),
    scoreHome: 18, scoreAway: 14, court: 3,
    time: gameTime(DAY1, '16:00'),
  });

  // M76: Pedro Espindola / Pedro Galimberti 18 vs Fabricio Barancoski / Piu Montemor 14
  await createGame({
    categoryId: catOpenDiv2.id, roundId: div2L2.id,
    home: t('Pedro Espindola', 'Pedro Galimberti'),
    away: t('Fabricio Barancoski', 'Piu Montemor'),
    scoreHome: 18, scoreAway: 14, court: 4,
    time: gameTime(DAY1, '16:00'),
  });

  // ── L4 (14th Round, 2 games — L2 winners vs W2 losers) ──
  // M79: Thiago Cunha / Lucca Toledo 18 vs Bernardo Avila / Tuio Silveira 15
  await createGame({
    categoryId: catOpenDiv2.id, roundId: div2L4.id,
    home: t('Thiago Cunha', 'Lucca Toledo'),
    away: t('Bernardo Avila', 'Tuio Silveira'),
    scoreHome: 18, scoreAway: 15, court: 3,
    time: gameTime(DAY1, '16:40'),
  });

  // M80: Pedro Espindola / Pedro Galimberti 18 vs Marcos Chantel / Anderson Silva 14
  await createGame({
    categoryId: catOpenDiv2.id, roundId: div2L4.id,
    home: t('Pedro Espindola', 'Pedro Galimberti'),
    away: t('Marcos Chantel', 'Anderson Silva'),
    scoreHome: 18, scoreAway: 14, court: 4,
    time: gameTime(DAY1, '16:40'),
  });

  // ── Semi-Finals ──
  // M83 (1st SF): Gab Souza / Leozinho Gomes 18 vs Thiago Cunha / Lucca Toledo 13
  await createGame({
    categoryId: catOpenDiv2.id, roundId: div2SF.id,
    home: t('Gabriel Souza', 'Leozinho Gomes'),
    away: t('Thiago Cunha', 'Lucca Toledo'),
    scoreHome: 18, scoreAway: 13, court: 1,
    time: gameTime(DAY1, '17:00'),
  });

  // M84 (2nd SF): Zuca Palladino / Lucas Silva 18 vs Pedro Espindola / Pedro Galimberti 8
  await createGame({
    categoryId: catOpenDiv2.id, roundId: div2SF.id,
    home: t('Zuca Palladino', 'Lucas Silva'),
    away: t('Pedro Espindola', 'Pedro Galimberti'),
    scoreHome: 18, scoreAway: 8, court: 2,
    time: gameTime(DAY1, '17:00'),
  });

  // M88 (3rd Place): Thiago Cunha / Lucca Toledo 4 vs Pedro Espindola / Pedro Galimberti 18
  await createGame({
    categoryId: catOpenDiv2.id, roundId: div2Third.id,
    home: t('Thiago Cunha', 'Lucca Toledo'),
    away: t('Pedro Espindola', 'Pedro Galimberti'),
    scoreHome: 4, scoreAway: 18, court: 3,
    time: gameTime(DAY1, '17:40'),
  });

  // M91 (FINAL): Gab Souza / Leozinho Gomes 18 vs Zuca Palladino / Lucas Silva 13
  await createGame({
    categoryId: catOpenDiv2.id, roundId: div2Final.id,
    home: t('Gabriel Souza', 'Leozinho Gomes'),
    away: t('Zuca Palladino', 'Lucas Silva'),
    scoreHome: 18, scoreAway: 13, court: 1,
    time: gameTime(DAY1, '18:20'),
  });

  // ═══════════════════════════════════════════════════════════
  // OPEN DIVISION 3 — From standalone Division 3 PDF (16 teams)
  // Teams: losers from Division 1 Round of 32
  // Structure: W1(8) → W2(4) → SF(2) → 3rd(1) → Final(1) = 16 games
  // ═══════════════════════════════════════════════════════════
  console.log('Seeding Open Division 3...');

  const div3W1 = await prisma.round.create({
    data: { name: '7th Round W1', roundNumber: 1, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv3.id },
  });
  const div3W2 = await prisma.round.create({
    data: { name: '9th Round W2', roundNumber: 2, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv3.id },
  });
  const div3SF = await prisma.round.create({
    data: { name: 'Semi-Finals', roundNumber: 3, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv3.id },
  });
  const div3Third = await prisma.round.create({
    data: { name: '3rd Place', roundNumber: 4, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv3.id },
  });
  const div3Final = await prisma.round.create({
    data: { name: 'Final', roundNumber: 5, tournamentId: tournament.id, type: 'knockout', categoryId: catOpenDiv3.id },
  });

  // ── W1 (7th Round, 8 games) ──
  // M49: Ricardo Pavei / Dalan Telles 0 vs Rafa Barao / Igor Martins 18 (walkover)
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3W1.id,
    home: t('Ricardo Pavei', 'Dalan Telles'),
    away: t('Rafa Barao', 'Igor Martins'),
    scoreHome: 0, scoreAway: 18, court: 1,
    time: gameTime(DAY1, '13:20'),
  });

  // M50: Patricia Rodriguez / Rogerio Teixeira 11 vs Roberto Asmar / Ademir Cabral 18
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3W1.id,
    home: t('Patricia Rodriguez', 'Rogerio Teixeira'),
    away: t('Roberto Asmar', 'Ademir Cabral'),
    scoreHome: 11, scoreAway: 18, court: 2,
    time: gameTime(DAY1, '13:20'),
  });

  // M51: Manoel Carneiro / Bruno Marcelo 8 vs Guiga Muller / Breno Soares 18
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3W1.id,
    home: t('Manoel Carneiro', 'Bruno Marcelo'),
    away: t('Guiga Muller', 'Breno Soares'),
    scoreHome: 8, scoreAway: 18, court: 3,
    time: gameTime(DAY1, '13:20'),
  });

  // M52: William Jorge / Matheus Eller 18 vs Thiago Platz / Gilberto Camillato 15
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3W1.id,
    home: t('William Jorge', 'Matheus Eller'),
    away: t('Thiago Platz', 'Gilberto Camillato'),
    scoreHome: 18, scoreAway: 15, court: 4,
    time: gameTime(DAY1, '13:20'),
  });

  // M53: Janser Pinho / Joao Gabriel Freitas 12 vs Matheus Paes / Fe Schneider 18
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3W1.id,
    home: t('Janser Pinho', 'Joao Gabriel Freitas'),
    away: t('Matheus Paes', 'Fe Schneider'),
    scoreHome: 12, scoreAway: 18, court: 1,
    time: gameTime(DAY1, '13:40'),
  });

  // M54: Lucas Moraes / Vladimir Silveira 18 vs Gustavo Guimaraes / Thiago Guimaraes 4
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3W1.id,
    home: t('Lucas Moraes', 'Vladimir Silveira'),
    away: t('Gustavo Guimaraes', 'Thiago Guimaraes'),
    scoreHome: 18, scoreAway: 4, court: 2,
    time: gameTime(DAY1, '13:40'),
  });

  // M55: Breno da Mata / Luan Maia 16 vs Felipe Netto / Bruno Vieira 18
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3W1.id,
    home: t('Breno da Mata', 'Luan Maia'),
    away: t('Felipe Netto', 'Bruno Vieira'),
    scoreHome: 16, scoreAway: 18, court: 3,
    time: gameTime(DAY1, '13:40'),
  });

  // M56: Gabi Allen-Vieira / Fabiola Zanella 7 vs Henrique Oliveira / Carlos Iwata 18
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3W1.id,
    home: t('Gabriela Allen-Vieira', 'Fabiola Zanella'),
    away: t('Henrique Oliveira', 'Carlos Iwata'),
    scoreHome: 7, scoreAway: 18, court: 4,
    time: gameTime(DAY1, '13:40'),
  });

  // ── W2 (9th Round, 4 games) ──
  // M61: Rafa Barao / Igor Martins 18 vs Roberto Asmar / Ademir Cabral 13
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3W2.id,
    home: t('Rafa Barao', 'Igor Martins'),
    away: t('Roberto Asmar', 'Ademir Cabral'),
    scoreHome: 18, scoreAway: 13, court: 4,
    time: gameTime(DAY1, '15:00'),
  });

  // M62: Guiga Muller / Breno Soares 18 vs William Jorge / Matheus Eller 14
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3W2.id,
    home: t('Guiga Muller', 'Breno Soares'),
    away: t('William Jorge', 'Matheus Eller'),
    scoreHome: 18, scoreAway: 14, court: 2,
    time: gameTime(DAY1, '15:00'),
  });

  // M63: Matheus Paes / Fe Schneider 18 vs Lucas Moraes / Vladimir Silveira 10
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3W2.id,
    home: t('Matheus Paes', 'Fe Schneider'),
    away: t('Lucas Moraes', 'Vladimir Silveira'),
    scoreHome: 18, scoreAway: 10, court: 3,
    time: gameTime(DAY1, '15:00'),
  });

  // M64: Felipe Netto / Bruno Vieira 18 vs Henrique Oliveira / Carlos Iwata 12
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3W2.id,
    home: t('Felipe Netto', 'Bruno Vieira'),
    away: t('Henrique Oliveira', 'Carlos Iwata'),
    scoreHome: 18, scoreAway: 12, court: 1,
    time: gameTime(DAY1, '15:00'),
  });

  // ── Semi-Finals ──
  // M81 (1st SF): Rafa Barao / Igor Martins 18 vs Guiga Muller / Breno Soares 7
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3SF.id,
    home: t('Rafa Barao', 'Igor Martins'),
    away: t('Guiga Muller', 'Breno Soares'),
    scoreHome: 18, scoreAway: 7, court: 3,
    time: gameTime(DAY1, '16:20'),
  });

  // M82 (2nd SF): Felipe Netto / Bruno Vieira 18 vs Matheus Paes / Fe Schneider 12
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3SF.id,
    home: t('Felipe Netto', 'Bruno Vieira'),
    away: t('Matheus Paes', 'Fe Schneider'),
    scoreHome: 18, scoreAway: 12, court: 4,
    time: gameTime(DAY1, '16:20'),
  });

  // M87 (3rd Place): Guiga Muller / Breno Soares 18 vs Matheus Paes / Fe Schneider 11
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3Third.id,
    home: t('Guiga Muller', 'Breno Soares'),
    away: t('Matheus Paes', 'Fe Schneider'),
    scoreHome: 18, scoreAway: 11, court: 3,
    time: gameTime(DAY1, '17:20'),
  });

  // M90 (FINAL): Rafa Barao / Igor Martins 18 vs Felipe Netto / Bruno Vieira 14
  await createGame({
    categoryId: catOpenDiv3.id, roundId: div3Final.id,
    home: t('Rafa Barao', 'Igor Martins'),
    away: t('Felipe Netto', 'Bruno Vieira'),
    scoreHome: 18, scoreAway: 14, court: 1,
    time: gameTime(DAY1, '18:00'),
  });

  // ═══════════════════════════════════════════════════════════
  // WOMEN'S DIVISION — From PDF 4 (2 groups of 4 + elimination)
  // Complete data with all group stage and elimination games
  // ═══════════════════════════════════════════════════════════
  console.log("Seeding Women's Division...");

  const wGroupRound = await prisma.round.create({
    data: { name: 'Group Stage', roundNumber: 1, tournamentId: tournament.id, type: 'group', categoryId: catWomens.id },
  });
  const wElimRound = await prisma.round.create({
    data: { name: 'Elimination', roundNumber: 2, tournamentId: tournament.id, type: 'knockout', categoryId: catWomens.id },
  });
  const wSFRound = await prisma.round.create({
    data: { name: 'Semi-Finals', roundNumber: 3, tournamentId: tournament.id, type: 'knockout', categoryId: catWomens.id },
  });
  const wThirdRound = await prisma.round.create({
    data: { name: '3rd Place', roundNumber: 4, tournamentId: tournament.id, type: 'knockout', categoryId: catWomens.id },
  });
  const wFinalRound = await prisma.round.create({
    data: { name: 'Final', roundNumber: 5, tournamentId: tournament.id, type: 'knockout', categoryId: catWomens.id },
  });

  // Groups
  const wGroupA = await prisma.group.create({
    data: { name: 'Group A', tournamentId: tournament.id, categoryId: catWomens.id },
  });
  const wGroupB = await prisma.group.create({
    data: { name: 'Group B', tournamentId: tournament.id, categoryId: catWomens.id },
  });

  // Women's Group A games
  const wGA = [
    { home: t('Kaitlyn Brunworth', 'Gaby Coelho'), away: t('Ana Paula Khouri', 'Felicia Cunha'), sh: 19, sa: 17, c: 1, time: '09:00' },
    { home: t('Fiorella Pelegrini', 'Gabi Macedo'), away: t('Juliana Benn', 'Malu Costa'), sh: 18, sa: 12, c: 2, time: '09:00' },
    { home: t('Kaitlyn Brunworth', 'Gaby Coelho'), away: t('Juliana Benn', 'Malu Costa'), sh: 7, sa: 18, c: 3, time: '11:00' },
    { home: t('Fiorella Pelegrini', 'Gabi Macedo'), away: t('Ana Paula Khouri', 'Felicia Cunha'), sh: 18, sa: 12, c: 4, time: '11:00' },
    { home: t('Ana Paula Khouri', 'Felicia Cunha'), away: t('Juliana Benn', 'Malu Costa'), sh: 12, sa: 18, c: 1, time: '13:00' },
    { home: t('Fiorella Pelegrini', 'Gabi Macedo'), away: t('Kaitlyn Brunworth', 'Gaby Coelho'), sh: 18, sa: 6, c: 2, time: '13:00' },
  ];

  for (const g of wGA) {
    await createGame({
      categoryId: catWomens.id, roundId: wGroupRound.id, groupId: wGroupA.id,
      home: g.home, away: g.away, scoreHome: g.sh, scoreAway: g.sa, court: g.c,
      time: gameTime(DAY2, g.time),
    });
  }

  // Women's Group B games
  const wGB = [
    { home: t('Karol Muniz', 'Jarede Cesar'), away: t('Gabriela Allen-Vieira', 'Fabiola Zanella'), sh: 14, sa: 18, c: 3, time: '09:00' },
    { home: t('Tata Moreira', 'Patricia Rodriguez'), away: t('Duda Souza', 'Julia Novaes'), sh: 18, sa: 7, c: 4, time: '09:00' },
    { home: t('Karol Muniz', 'Jarede Cesar'), away: t('Duda Souza', 'Julia Novaes'), sh: 18, sa: 4, c: 1, time: '11:00' },
    { home: t('Tata Moreira', 'Patricia Rodriguez'), away: t('Gabriela Allen-Vieira', 'Fabiola Zanella'), sh: 9, sa: 18, c: 2, time: '11:00' },
    { home: t('Gabriela Allen-Vieira', 'Fabiola Zanella'), away: t('Duda Souza', 'Julia Novaes'), sh: 18, sa: 3, c: 3, time: '13:00' },
    { home: t('Tata Moreira', 'Patricia Rodriguez'), away: t('Karol Muniz', 'Jarede Cesar'), sh: 4, sa: 18, c: 4, time: '13:00' },
  ];

  for (const g of wGB) {
    await createGame({
      categoryId: catWomens.id, roundId: wGroupRound.id, groupId: wGroupB.id,
      home: g.home, away: g.away, scoreHome: g.sh, scoreAway: g.sa, court: g.c,
      time: gameTime(DAY2, g.time),
    });
  }

  // Elimination Round: 2nd B vs 3rd A, 2nd A vs 3rd B
  // Match 13: Karol Muniz (2nd B) 18 vs 6 Kaitlyn Brunworth (3rd A)
  await createGame({
    categoryId: catWomens.id, roundId: wElimRound.id,
    home: t('Karol Muniz', 'Jarede Cesar'),
    away: t('Kaitlyn Brunworth', 'Gaby Coelho'),
    scoreHome: 18, scoreAway: 6, court: 3,
    time: gameTime(DAY2, '15:00'),
  });

  // Match 14: Juliana Benn (2nd A) 18 vs 14 Tata Moreira (3rd B)
  await createGame({
    categoryId: catWomens.id, roundId: wElimRound.id,
    home: t('Juliana Benn', 'Malu Costa'),
    away: t('Tata Moreira', 'Patricia Rodriguez'),
    scoreHome: 18, scoreAway: 14, court: 4,
    time: gameTime(DAY2, '15:00'),
  });

  // Semi-Finals
  // SF1: Fiorella Pelegrini (1st A) 14 vs 18 Karol Muniz (W M13)
  await createGame({
    categoryId: catWomens.id, roundId: wSFRound.id,
    home: t('Fiorella Pelegrini', 'Gabi Macedo'),
    away: t('Karol Muniz', 'Jarede Cesar'),
    scoreHome: 14, scoreAway: 18, court: 3,
    time: gameTime(DAY2, '16:20'),
  });

  // SF2: Gabi Allen-Vieira (1st B) 18 vs 13 Juliana Benn (W M14)
  await createGame({
    categoryId: catWomens.id, roundId: wSFRound.id,
    home: t('Gabriela Allen-Vieira', 'Fabiola Zanella'),
    away: t('Juliana Benn', 'Malu Costa'),
    scoreHome: 18, scoreAway: 13, court: 4,
    time: gameTime(DAY2, '16:20'),
  });

  // 3rd Place: Fiorella 16 vs 18 Juliana Benn
  await createGame({
    categoryId: catWomens.id, roundId: wThirdRound.id,
    home: t('Fiorella Pelegrini', 'Gabi Macedo'),
    away: t('Juliana Benn', 'Malu Costa'),
    scoreHome: 16, scoreAway: 18, court: 2,
    time: gameTime(DAY2, '16:40'),
  });

  // FINAL: Karol Muniz 18 vs 10 Gabi Allen-Vieira
  await createGame({
    categoryId: catWomens.id, roundId: wFinalRound.id,
    home: t('Karol Muniz', 'Jarede Cesar'),
    away: t('Gabriela Allen-Vieira', 'Fabiola Zanella'),
    scoreHome: 18, scoreAway: 10, court: 1,
    time: gameTime(DAY2, '16:40'),
  });

  // ═══════════════════════════════════════════════════════════
  // MASTER DIVISION — From PDF 5 (2 groups of 4 + elimination)
  // ═══════════════════════════════════════════════════════════
  console.log('Seeding Master Division...');

  const mGroupRound = await prisma.round.create({
    data: { name: 'Group Stage', roundNumber: 1, tournamentId: tournament.id, type: 'group', categoryId: catMaster.id },
  });
  const mElimRound = await prisma.round.create({
    data: { name: 'Elimination', roundNumber: 2, tournamentId: tournament.id, type: 'knockout', categoryId: catMaster.id },
  });
  const mSFRound = await prisma.round.create({
    data: { name: 'Semi-Finals', roundNumber: 3, tournamentId: tournament.id, type: 'knockout', categoryId: catMaster.id },
  });
  const mThirdRound = await prisma.round.create({
    data: { name: '3rd Place', roundNumber: 4, tournamentId: tournament.id, type: 'knockout', categoryId: catMaster.id },
  });
  const mFinalRound = await prisma.round.create({
    data: { name: 'Final', roundNumber: 5, tournamentId: tournament.id, type: 'knockout', categoryId: catMaster.id },
  });

  const mGroupA = await prisma.group.create({
    data: { name: 'Group A', tournamentId: tournament.id, categoryId: catMaster.id },
  });
  const mGroupB = await prisma.group.create({
    data: { name: 'Group B', tournamentId: tournament.id, categoryId: catMaster.id },
  });

  // Master Group A
  const mGA = [
    { home: t('Araken Fernandes', 'Heron Tavares'), away: t('Carlos Montemor', 'Marco Muricy'), sh: 18, sa: 4, c: 1, time: '13:00' },
    { home: t('Sandro de Sa', 'Herivelto Nogueira'), away: t('Alexandre Vieira', 'Socrates Demetrius'), sh: 18, sa: 9, c: 3, time: '13:00' },
    { home: t('Araken Fernandes', 'Heron Tavares'), away: t('Alexandre Vieira', 'Socrates Demetrius'), sh: 18, sa: 12, c: 2, time: '14:00' },
    { home: t('Sandro de Sa', 'Herivelto Nogueira'), away: t('Carlos Montemor', 'Marco Muricy'), sh: 18, sa: 4, c: 4, time: '14:00' },
    { home: t('Araken Fernandes', 'Heron Tavares'), away: t('Sandro de Sa', 'Herivelto Nogueira'), sh: 10, sa: 18, c: 1, time: '14:40' },
    { home: t('Alexandre Vieira', 'Socrates Demetrius'), away: t('Carlos Montemor', 'Marco Muricy'), sh: 18, sa: 5, c: 3, time: '14:40' },
  ];

  for (const g of mGA) {
    await createGame({
      categoryId: catMaster.id, roundId: mGroupRound.id, groupId: mGroupA.id,
      home: g.home, away: g.away, scoreHome: g.sh, scoreAway: g.sa, court: g.c,
      time: gameTime(DAY2, g.time),
    });
  }

  // Master Group B
  const mGB = [
    { home: t('Jairo Braga', 'Jefferson David'), away: t('Rafael Palhinha', 'Marcos Araujo'), sh: 18, sa: 11, c: 2, time: '13:00' },
    { home: t('Giovanni Silva', 'Rivelino Oliveira'), away: t('Alex Batuta', 'Junior Pereira'), sh: 9, sa: 18, c: 4, time: '13:00' },
    { home: t('Jairo Braga', 'Jefferson David'), away: t('Alex Batuta', 'Junior Pereira'), sh: 10, sa: 18, c: 1, time: '14:00' },
    { home: t('Giovanni Silva', 'Rivelino Oliveira'), away: t('Rafael Palhinha', 'Marcos Araujo'), sh: 18, sa: 16, c: 3, time: '14:00' },
    { home: t('Jairo Braga', 'Jefferson David'), away: t('Giovanni Silva', 'Rivelino Oliveira'), sh: 7, sa: 18, c: 2, time: '14:40' },
    { home: t('Alex Batuta', 'Junior Pereira'), away: t('Rafael Palhinha', 'Marcos Araujo'), sh: 18, sa: 9, c: 4, time: '14:40' },
  ];

  for (const g of mGB) {
    await createGame({
      categoryId: catMaster.id, roundId: mGroupRound.id, groupId: mGroupB.id,
      home: g.home, away: g.away, scoreHome: g.sh, scoreAway: g.sa, court: g.c,
      time: gameTime(DAY2, g.time),
    });
  }

  // Elimination Round
  // Match 13: Giovanni (2nd B) 17 vs 19 Alexandre Vieira (3rd A)
  await createGame({
    categoryId: catMaster.id, roundId: mElimRound.id,
    home: t('Giovanni Silva', 'Rivelino Oliveira'),
    away: t('Alexandre Vieira', 'Socrates Demetrius'),
    scoreHome: 17, scoreAway: 19, court: 1,
    time: gameTime(DAY2, '16:20'),
  });

  // Match 14: Araken (2nd A) vs Jairo (3rd B) → Jairo won (from results: Jairo is 3rd place)
  await createGame({
    categoryId: catMaster.id, roundId: mElimRound.id,
    home: t('Araken Fernandes', 'Heron Tavares'),
    away: t('Jairo Braga', 'Jefferson David'),
    scoreHome: 15, scoreAway: 18, court: 2,
    time: gameTime(DAY2, '16:20'),
  });

  // Semi-Finals
  // SF1: Sandro de Sa (1st A) 18 vs 5 Alexandre Vieira (W M13)
  await createGame({
    categoryId: catMaster.id, roundId: mSFRound.id,
    home: t('Sandro de Sa', 'Herivelto Nogueira'),
    away: t('Alexandre Vieira', 'Socrates Demetrius'),
    scoreHome: 18, scoreAway: 5, court: 3,
    time: gameTime(DAY2, '17:00'),
  });

  // SF2: Alex Batuta (1st B) 18 vs 3 Jairo (W M14)
  await createGame({
    categoryId: catMaster.id, roundId: mSFRound.id,
    home: t('Alex Batuta', 'Junior Pereira'),
    away: t('Jairo Braga', 'Jefferson David'),
    scoreHome: 18, scoreAway: 3, court: 4,
    time: gameTime(DAY2, '17:00'),
  });

  // 3rd Place: Giovanni 7 vs 18 Jairo
  await createGame({
    categoryId: catMaster.id, roundId: mThirdRound.id,
    home: t('Giovanni Silva', 'Rivelino Oliveira'),
    away: t('Jairo Braga', 'Jefferson David'),
    scoreHome: 7, scoreAway: 18, court: 2,
    time: gameTime(DAY2, '17:40'),
  });

  // FINAL: Sandro de Sa 9 vs 18 Alex Batuta
  await createGame({
    categoryId: catMaster.id, roundId: mFinalRound.id,
    home: t('Sandro de Sa', 'Herivelto Nogueira'),
    away: t('Alex Batuta', 'Junior Pereira'),
    scoreHome: 9, scoreAway: 18, court: 1,
    time: gameTime(DAY2, '17:40'),
  });

  // ═══════════════════════════════════════════════════════════
  // BEGINNERS DIVISION — From PDF 6 (4 groups of 4 + elimination)
  // ═══════════════════════════════════════════════════════════
  console.log('Seeding Beginners Division...');

  const bGroupRound = await prisma.round.create({
    data: { name: 'Group Stage', roundNumber: 1, tournamentId: tournament.id, type: 'group', categoryId: catBeginners.id },
  });
  const bElimRound = await prisma.round.create({
    data: { name: 'Elimination', roundNumber: 2, tournamentId: tournament.id, type: 'knockout', categoryId: catBeginners.id },
  });
  const bQFRound = await prisma.round.create({
    data: { name: 'Quarter-Finals', roundNumber: 3, tournamentId: tournament.id, type: 'knockout', categoryId: catBeginners.id },
  });
  const bSFRound = await prisma.round.create({
    data: { name: 'Semi-Finals', roundNumber: 4, tournamentId: tournament.id, type: 'knockout', categoryId: catBeginners.id },
  });
  const bThirdRound = await prisma.round.create({
    data: { name: '3rd Place', roundNumber: 5, tournamentId: tournament.id, type: 'knockout', categoryId: catBeginners.id },
  });
  const bFinalRound = await prisma.round.create({
    data: { name: 'Final', roundNumber: 6, tournamentId: tournament.id, type: 'knockout', categoryId: catBeginners.id },
  });

  const bGroupA = await prisma.group.create({ data: { name: 'Group A', tournamentId: tournament.id, categoryId: catBeginners.id } });
  const bGroupB = await prisma.group.create({ data: { name: 'Group B', tournamentId: tournament.id, categoryId: catBeginners.id } });
  const bGroupC = await prisma.group.create({ data: { name: 'Group C', tournamentId: tournament.id, categoryId: catBeginners.id } });
  const bGroupD = await prisma.group.create({ data: { name: 'Group D', tournamentId: tournament.id, categoryId: catBeginners.id } });

  // Beginners Group A (6 games)
  const bGA = [
    { home: t('Marcos Souza', 'Daniel Cortes'), away: t('Robin Sibalin', 'Karoly Csak'), sh: 18, sa: 10, c: 1, time: '09:20' },
    { home: t('Erick Wiedemann', 'Richard de Souza'), away: t('Stella Gress', 'Bryan Martinho'), sh: 18, sa: 9, c: 1, time: '10:00' },
    { home: t('Marcos Souza', 'Daniel Cortes'), away: t('Stella Gress', 'Bryan Martinho'), sh: 18, sa: 10, c: 2, time: '10:40' },
    { home: t('Erick Wiedemann', 'Richard de Souza'), away: t('Robin Sibalin', 'Karoly Csak'), sh: 18, sa: 11, c: 2, time: '11:20' },
    { home: t('Robin Sibalin', 'Karoly Csak'), away: t('Stella Gress', 'Bryan Martinho'), sh: 18, sa: 12, c: 3, time: '12:00' },
    { home: t('Erick Wiedemann', 'Richard de Souza'), away: t('Marcos Souza', 'Daniel Cortes'), sh: 19, sa: 17, c: 3, time: '12:40' },
  ];

  for (const g of bGA) {
    await createGame({
      categoryId: catBeginners.id, roundId: bGroupRound.id, groupId: bGroupA.id,
      home: g.home, away: g.away, scoreHome: g.sh, scoreAway: g.sa, court: g.c,
      time: gameTime(DAY2, g.time),
    });
  }

  // Beginners Group B (6 games)
  const bGB = [
    { home: t('Chandler Wilder', 'Izhak Revah'), away: t('Arthur Mesquita', 'Henrique Leandro'), sh: 4, sa: 18, c: 2, time: '09:20' },
    { home: t('Breno Gama', 'Luis Quintella'), away: t('Marcelo Oliveira', 'Flavio Silva'), sh: 18, sa: 10, c: 2, time: '10:00' },
    { home: t('Chandler Wilder', 'Izhak Revah'), away: t('Marcelo Oliveira', 'Flavio Silva'), sh: 11, sa: 18, c: 3, time: '10:40' },
    { home: t('Breno Gama', 'Luis Quintella'), away: t('Arthur Mesquita', 'Henrique Leandro'), sh: 18, sa: 16, c: 3, time: '11:20' },
    { home: t('Arthur Mesquita', 'Henrique Leandro'), away: t('Marcelo Oliveira', 'Flavio Silva'), sh: 18, sa: 10, c: 4, time: '12:00' },
    { home: t('Breno Gama', 'Luis Quintella'), away: t('Chandler Wilder', 'Izhak Revah'), sh: 18, sa: 3, c: 4, time: '12:40' },
  ];

  for (const g of bGB) {
    await createGame({
      categoryId: catBeginners.id, roundId: bGroupRound.id, groupId: bGroupB.id,
      home: g.home, away: g.away, scoreHome: g.sh, scoreAway: g.sa, court: g.c,
      time: gameTime(DAY2, g.time),
    });
  }

  // Beginners Group C (6 games)
  const bGC = [
    { home: t('Alexandre Souza', 'Ceni Azevedo'), away: t('Nino Ferreira', 'Kris Ramos'), sh: 18, sa: 0, c: 3, time: '09:20' },
    { home: t('Alexandre Vieira', 'Socrates Demetrius'), away: t('Marco Muricy', 'Rafael Barros'), sh: 18, sa: 9, c: 3, time: '10:00' },
    { home: t('Alexandre Souza', 'Ceni Azevedo'), away: t('Marco Muricy', 'Rafael Barros'), sh: 18, sa: 9, c: 4, time: '10:40' },
    { home: t('Alexandre Vieira', 'Socrates Demetrius'), away: t('Nino Ferreira', 'Kris Ramos'), sh: 18, sa: 0, c: 4, time: '11:20' },
    { home: t('Nino Ferreira', 'Kris Ramos'), away: t('Marco Muricy', 'Rafael Barros'), sh: 0, sa: 18, c: 1, time: '12:00' },
    { home: t('Alexandre Vieira', 'Socrates Demetrius'), away: t('Alexandre Souza', 'Ceni Azevedo'), sh: 18, sa: 9, c: 1, time: '12:40' },
  ];

  for (const g of bGC) {
    await createGame({
      categoryId: catBeginners.id, roundId: bGroupRound.id, groupId: bGroupC.id,
      home: g.home, away: g.away, scoreHome: g.sh, scoreAway: g.sa, court: g.c,
      time: gameTime(DAY2, g.time),
    });
  }

  // Beginners Group D (6 games)
  const bGD = [
    { home: t('Marcel Gomes', 'Filipe Palacios'), away: t('Joao Paulo Passos', 'Kaique Fagundes'), sh: 0, sa: 18, c: 4, time: '09:20' },
    { home: t('Leo Andreucci', 'Ricardo Pereira'), away: t('Bruna Leao', 'Daniela Diaz'), sh: 18, sa: 5, c: 4, time: '10:00' },
    { home: t('Marcel Gomes', 'Filipe Palacios'), away: t('Bruna Leao', 'Daniela Diaz'), sh: 0, sa: 18, c: 1, time: '10:40' },
    { home: t('Leo Andreucci', 'Ricardo Pereira'), away: t('Joao Paulo Passos', 'Kaique Fagundes'), sh: 18, sa: 3, c: 1, time: '11:20' },
    { home: t('Joao Paulo Passos', 'Kaique Fagundes'), away: t('Bruna Leao', 'Daniela Diaz'), sh: 17, sa: 19, c: 2, time: '12:00' },
    { home: t('Leo Andreucci', 'Ricardo Pereira'), away: t('Marcel Gomes', 'Filipe Palacios'), sh: 18, sa: 0, c: 2, time: '12:40' },
  ];

  for (const g of bGD) {
    await createGame({
      categoryId: catBeginners.id, roundId: bGroupRound.id, groupId: bGroupD.id,
      home: g.home, away: g.away, scoreHome: g.sh, scoreAway: g.sa, court: g.c,
      time: gameTime(DAY2, g.time),
    });
  }

  // Beginners Elimination Round (crossover 2nd vs 3rd from other groups)
  // M25: Arthur Mesquita (2B) 19 vs 17 Marcelo Oliveira (3B) — Arthur won
  await createGame({
    categoryId: catBeginners.id, roundId: bElimRound.id,
    home: t('Arthur Mesquita', 'Henrique Leandro'),
    away: t('Marcelo Oliveira', 'Flavio Silva'),
    scoreHome: 19, scoreAway: 17, court: 1,
    time: gameTime(DAY2, '13:20'),
  });

  // M26: Alexandre Souza (2C) 18 vs 6 Robin Sibalin (3A)
  await createGame({
    categoryId: catBeginners.id, roundId: bElimRound.id,
    home: t('Alexandre Souza', 'Ceni Azevedo'),
    away: t('Robin Sibalin', 'Karoly Csak'),
    scoreHome: 18, scoreAway: 6, court: 2,
    time: gameTime(DAY2, '13:20'),
  });

  // M27: Marcos Souza (2A) 18 vs 13 Marco Muricy (3C)
  await createGame({
    categoryId: catBeginners.id, roundId: bElimRound.id,
    home: t('Marcos Souza', 'Daniel Cortes'),
    away: t('Marco Muricy', 'Rafael Barros'),
    scoreHome: 18, scoreAway: 13, court: 3,
    time: gameTime(DAY2, '13:20'),
  });

  // M28: Bruna Leao (2D) 18 vs 10 Joao Paulo Passos (3D)
  await createGame({
    categoryId: catBeginners.id, roundId: bElimRound.id,
    home: t('Bruna Leao', 'Daniela Diaz'),
    away: t('Joao Paulo Passos', 'Kaique Fagundes'),
    scoreHome: 18, scoreAway: 10, court: 4,
    time: gameTime(DAY2, '13:20'),
  });

  // Quarter-Finals
  // QF1: Erick Wiedemann (1A) 18 vs 6 Arthur Mesquita (W M25)
  await createGame({
    categoryId: catBeginners.id, roundId: bQFRound.id,
    home: t('Erick Wiedemann', 'Richard de Souza'),
    away: t('Arthur Mesquita', 'Henrique Leandro'),
    scoreHome: 18, scoreAway: 6, court: 1,
    time: gameTime(DAY2, '14:20'),
  });

  // QF2: Leo Andreucci (1D) 18 vs 7 Alexandre Souza (W M26)
  await createGame({
    categoryId: catBeginners.id, roundId: bQFRound.id,
    home: t('Leo Andreucci', 'Ricardo Pereira'),
    away: t('Alexandre Souza', 'Ceni Azevedo'),
    scoreHome: 18, scoreAway: 7, court: 2,
    time: gameTime(DAY2, '14:20'),
  });

  // QF3: Alexandre Vieira (1C) 14 vs 18 Marcos Souza (W M27) — Wait, the results say Breno Gama (1B) beat someone
  // Actually from the PDF: Alexandre Vieira (1C) vs Breno Gama (1B) + Arthur (W M25)...
  // Let me use the data from the semi-finals flow:
  // QF3: Alexandre Vieira (1C) 14 vs 18 Marcos Souza (W M27)
  await createGame({
    categoryId: catBeginners.id, roundId: bQFRound.id,
    home: t('Alexandre Vieira', 'Socrates Demetrius'),
    away: t('Marcos Souza', 'Daniel Cortes'),
    scoreHome: 14, scoreAway: 18, court: 3,
    time: gameTime(DAY2, '14:20'),
  });

  // QF4: Breno Gama (1B) 18 vs 15 Robin Sibalin/Bruna Leao (W M28)
  await createGame({
    categoryId: catBeginners.id, roundId: bQFRound.id,
    home: t('Breno Gama', 'Luis Quintella'),
    away: t('Bruna Leao', 'Daniela Diaz'),
    scoreHome: 18, scoreAway: 15, court: 4,
    time: gameTime(DAY2, '14:20'),
  });

  // Semi-Finals
  // SF1: Erick Wiedemann 14 vs 18 Leo Andreucci
  await createGame({
    categoryId: catBeginners.id, roundId: bSFRound.id,
    home: t('Erick Wiedemann', 'Richard de Souza'),
    away: t('Leo Andreucci', 'Ricardo Pereira'),
    scoreHome: 14, scoreAway: 18, court: 1,
    time: gameTime(DAY2, '15:40'),
  });

  // SF2: Marcos Souza 15 vs 18 Breno Gama
  await createGame({
    categoryId: catBeginners.id, roundId: bSFRound.id,
    home: t('Marcos Souza', 'Daniel Cortes'),
    away: t('Breno Gama', 'Luis Quintella'),
    scoreHome: 15, scoreAway: 18, court: 2,
    time: gameTime(DAY2, '15:40'),
  });

  // 3rd Place: Erick Wiedemann 18 vs 10 Marcos Souza
  await createGame({
    categoryId: catBeginners.id, roundId: bThirdRound.id,
    home: t('Erick Wiedemann', 'Richard de Souza'),
    away: t('Marcos Souza', 'Daniel Cortes'),
    scoreHome: 18, scoreAway: 10, court: 2,
    time: gameTime(DAY2, '16:00'),
  });

  // FINAL: Leo Andreucci 18 vs 10 Breno Gama
  await createGame({
    categoryId: catBeginners.id, roundId: bFinalRound.id,
    home: t('Leo Andreucci', 'Ricardo Pereira'),
    away: t('Breno Gama', 'Luis Quintella'),
    scoreHome: 18, scoreAway: 10, court: 1,
    time: gameTime(DAY2, '16:00'),
  });

  // ═══════════════════════════════════════════════════════════
  // ASSIGN PLAYERS TO GROUPS
  // ═══════════════════════════════════════════════════════════
  console.log('Assigning players to groups...');

  // Helper: assign a team (2 players) to a group
  async function assignToGroup(team: TeamDef, categoryId: string, groupId: string) {
    await prisma.tournamentPlayer.updateMany({
      where: { tournamentId: tournament.id, userId: uid(team.p1), categoryId },
      data: { groupId },
    });
    await prisma.tournamentPlayer.updateMany({
      where: { tournamentId: tournament.id, userId: uid(team.p2), categoryId },
      data: { groupId },
    });
  }

  // Women's groups
  const wGroupATeams = [
    t('Fiorella Pelegrini', 'Gabi Macedo'),
    t('Kaitlyn Brunworth', 'Gaby Coelho'),
    t('Ana Paula Khouri', 'Felicia Cunha'),
    t('Juliana Benn', 'Malu Costa'),
  ];
  const wGroupBTeams = [
    t('Tata Moreira', 'Patricia Rodriguez'),
    t('Karol Muniz', 'Jarede Cesar'),
    t('Gabriela Allen-Vieira', 'Fabiola Zanella'),
    t('Duda Souza', 'Julia Novaes'),
  ];
  for (const team of wGroupATeams) await assignToGroup(team, catWomens.id, wGroupA.id);
  for (const team of wGroupBTeams) await assignToGroup(team, catWomens.id, wGroupB.id);

  // Master groups
  const mGroupATeams = [
    t('Araken Fernandes', 'Heron Tavares'),
    t('Sandro de Sa', 'Herivelto Nogueira'),
    t('Alexandre Vieira', 'Socrates Demetrius'),
    t('Carlos Montemor', 'Marco Muricy'),
  ];
  const mGroupBTeams = [
    t('Jairo Braga', 'Jefferson David'),
    t('Giovanni Silva', 'Rivelino Oliveira'),
    t('Alex Batuta', 'Junior Pereira'),
    t('Rafael Palhinha', 'Marcos Araujo'),
  ];
  for (const team of mGroupATeams) await assignToGroup(team, catMaster.id, mGroupA.id);
  for (const team of mGroupBTeams) await assignToGroup(team, catMaster.id, mGroupB.id);

  // Beginners groups
  const bGroupATeams = [
    t('Erick Wiedemann', 'Richard de Souza'),
    t('Marcos Souza', 'Daniel Cortes'),
    t('Robin Sibalin', 'Karoly Csak'),
    t('Stella Gress', 'Bryan Martinho'),
  ];
  const bGroupBTeams = [
    t('Breno Gama', 'Luis Quintella'),
    t('Chandler Wilder', 'Izhak Revah'),
    t('Arthur Mesquita', 'Henrique Leandro'),
    t('Marcelo Oliveira', 'Flavio Silva'),
  ];
  const bGroupCTeams = [
    t('Alexandre Vieira', 'Socrates Demetrius'),
    t('Alexandre Souza', 'Ceni Azevedo'),
    t('Nino Ferreira', 'Kris Ramos'),
    t('Marco Muricy', 'Rafael Barros'),
  ];
  const bGroupDTeams = [
    t('Leo Andreucci', 'Ricardo Pereira'),
    t('Marcel Gomes', 'Filipe Palacios'),
    t('Joao Paulo Passos', 'Kaique Fagundes'),
    t('Bruna Leao', 'Daniela Diaz'),
  ];
  for (const team of bGroupATeams) await assignToGroup(team, catBeginners.id, bGroupA.id);
  for (const team of bGroupBTeams) await assignToGroup(team, catBeginners.id, bGroupB.id);
  for (const team of bGroupCTeams) await assignToGroup(team, catBeginners.id, bGroupC.id);
  for (const team of bGroupDTeams) await assignToGroup(team, catBeginners.id, bGroupD.id);

  // ═══════════════════════════════════════════════════════════
  // COMPUTE PLAYER STATS FROM GAMES
  // ═══════════════════════════════════════════════════════════
  console.log('Computing player stats from game results...');

  // Fetch all completed games for this tournament
  const allGames = await prisma.game.findMany({
    where: { tournamentId: tournament.id, status: 'completed' },
    select: {
      player1HomeId: true,
      player2HomeId: true,
      player1AwayId: true,
      player2AwayId: true,
      scoreHome: true,
      scoreAway: true,
      winningSide: true,
      categoryId: true,
      groupId: true,
    },
  });

  // Accumulate stats per (userId, categoryId)
  const stats = new Map<string, { wins: number; losses: number; pointsFor: number; pointsAgainst: number }>();

  function getStats(userId: string, categoryId: string) {
    const key = `${userId}:${categoryId}`;
    if (!stats.has(key)) stats.set(key, { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 });
    return stats.get(key)!;
  }

  for (const game of allGames) {
    if (!game.categoryId || game.scoreHome === null || game.scoreAway === null) continue;

    const homePlayers = [game.player1HomeId, game.player2HomeId].filter(Boolean) as string[];
    const awayPlayers = [game.player1AwayId, game.player2AwayId].filter(Boolean) as string[];
    const homeWon = game.winningSide === 'home';

    for (const pid of homePlayers) {
      const s = getStats(pid, game.categoryId);
      s.pointsFor += game.scoreHome!;
      s.pointsAgainst += game.scoreAway!;
      if (homeWon) s.wins++; else s.losses++;
    }
    for (const pid of awayPlayers) {
      const s = getStats(pid, game.categoryId);
      s.pointsFor += game.scoreAway!;
      s.pointsAgainst += game.scoreHome!;
      if (!homeWon) s.wins++; else s.losses++;
    }
  }

  // Update TournamentPlayer records with computed stats
  let updatedCount = 0;
  for (const [key, s] of stats) {
    const [userId, categoryId] = key.split(':');
    const pointDiff = s.pointsFor - s.pointsAgainst;
    await prisma.tournamentPlayer.updateMany({
      where: { tournamentId: tournament.id, userId, categoryId },
      data: {
        wins: s.wins,
        losses: s.losses,
        points: s.pointsFor,
        pointDiff,
      },
    });
    updatedCount++;
  }
  console.log(`Updated stats for ${updatedCount} player-category entries`);

  // ═══════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════
  const gameCount = await prisma.game.count({ where: { tournamentId: tournament.id } });
  console.log(`\n🏆 NFA 2022 Orlando seeding complete!`);
  console.log(`   Tournament: ${tournament.name}`);
  console.log(`   Categories: 6`);
  console.log(`   Registrations: ${totalRegistrations}`);
  console.log(`   Games: ${gameCount}`);
  console.log(`\n   Results:`);
  console.log(`   Open Div 1: 🥇 Moises Davalos / Ivan Davalos`);
  console.log(`   Open Div 2: 🥇 Gab Souza / Leozinho Gomes (2nd: Zuca Palladino, 3rd: Pedro Espindola)`);
  console.log(`   Open Div 3: 🥇 Rafa Barao / Igor Martins (2nd: Felipe Netto, 3rd: Guiga Muller)`);
  console.log(`   Women's:    🥇 Karol Muniz / Jarede Cesar`);
  console.log(`   Master:     🥇 Alex Batuta / Junior Pereira`);
  console.log(`   Beginners:  🥇 Leo Andreucci / Ricardo Pereira`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
