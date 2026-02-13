import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

interface AthleteData {
  name: string;
  nationality: string;
  level: string;
  state?: string;
  country: string;
}

async function main() {
  console.log("Starting database seed...");

  // Clear existing data
  await prisma.game.deleteMany({});
  await prisma.round.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.tournamentPlayer.deleteMany({});
  await prisma.tournament.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Cleared existing data");

  // Create admin user
  const adminPassword = await bcryptjs.hash("admin123", 10);
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@footvolley.com",
      password: adminPassword,
      role: "admin",
      nationality: "Brazilian",
      country: "Brazil",
      state: "SP",
      level: "Pro",
    },
  });

  console.log("Created admin user:", adminUser.email);

  // Create organizer user
  const organizerPassword = await bcryptjs.hash("organizer123", 10);
  const organizerUser = await prisma.user.create({
    data: {
      name: "Joao Silva",
      email: "organizer@footvolley.com",
      password: organizerPassword,
      role: "organizer",
      nationality: "Brazilian",
      country: "Brazil",
      state: "SP",
      level: "Advanced",
    },
  });

  console.log("Created organizer user:", organizerUser.email);

  // Athletes data with Brazilian/international names
  const athletes: AthleteData[] = [
    { name: "Rafael Palhinha", nationality: "Portuguese", level: "Pro", state: "SP", country: "Brazil" },
    { name: "Henrique Santos", nationality: "Brazilian", level: "Advanced", state: "RJ", country: "Brazil" },
    { name: "Fernando Costa", nationality: "Brazilian", level: "Advanced", state: "SP", country: "Brazil" },
    { name: "Bruno Silva", nationality: "Brazilian", level: "Intermediate", state: "MG", country: "Brazil" },
    { name: "Fabricio Oliveira", nationality: "Brazilian", level: "Pro", state: "SP", country: "Brazil" },
    { name: "Milton Pereira", nationality: "Brazilian", level: "Advanced", state: "RS", country: "Brazil" },
    { name: "Saul Dias", nationality: "Brazilian", level: "Intermediate", state: "BA", country: "Brazil" },
    { name: "Aluizio Ferreira", nationality: "Brazilian", level: "Advanced", state: "CE", country: "Brazil" },
    { name: "Fabio Gomes", nationality: "Brazilian", level: "Intermediate", state: "SP", country: "Brazil" },
    { name: "Carlinhos Alves", nationality: "Brazilian", level: "Advanced", state: "RJ", country: "Brazil" },
    { name: "Kait Johnson", nationality: "American", level: "Advanced", state: "CA", country: "United States" },
    { name: "Marcel Dias", nationality: "Portuguese", level: "Intermediate", state: "SP", country: "Brazil" },
    { name: "Felipe Rocha", nationality: "Brazilian", level: "Pro", state: "SC", country: "Brazil" },
    { name: "Marlos Medeiros", nationality: "Brazilian", level: "Advanced", state: "SP", country: "Brazil" },
    { name: "Muricy Fernandes", nationality: "Brazilian", level: "Intermediate", state: "RJ", country: "Brazil" },
    { name: "Andre Luiz", nationality: "Brazilian", level: "Advanced", state: "SP", country: "Brazil" },
    { name: "Martins Silva", nationality: "Brazilian", level: "Beginner", state: "MG", country: "Brazil" },
    { name: "Janser Costa", nationality: "Brazilian", level: "Intermediate", state: "BA", country: "Brazil" },
    { name: "Hernan Garcia", nationality: "Spanish", level: "Advanced", state: "SP", country: "Brazil" },
    { name: "Jojo Oliveira", nationality: "Brazilian", level: "Intermediate", state: "RJ", country: "Brazil" },
    { name: "Fernanda Silva", nationality: "Brazilian", level: "Intermediate", state: "SP", country: "Brazil" },
    { name: "Gabriel Costa", nationality: "Brazilian", level: "Advanced", state: "SP", country: "Brazil" },
    { name: "Ivan Guimaraes", nationality: "Brazilian", level: "Pro", state: "SP", country: "Brazil" },
    { name: "Karys Ramos", nationality: "American", level: "Advanced", state: "FL", country: "United States" },
    { name: "Rafael Muniz", nationality: "Brazilian", level: "Advanced", state: "SP", country: "Brazil" },
    { name: "Atila Piologo", nationality: "Brazilian", level: "Intermediate", state: "RJ", country: "Brazil" },
    { name: "Gabriel Gati", nationality: "Brazilian", level: "Intermediate", state: "SP", country: "Brazil" },
    { name: "Fernando Plentz", nationality: "Brazilian", level: "Pro", state: "SP", country: "Brazil" },
    { name: "Piu Montemor", nationality: "Brazilian", level: "Advanced", state: "MG", country: "Brazil" },
    { name: "Danilo Souza", nationality: "Brazilian", level: "Intermediate", state: "SP", country: "Brazil" },
    { name: "Victor Muricy", nationality: "Brazilian", level: "Advanced", state: "RJ", country: "Brazil" },
    { name: "Gabriela Santos", nationality: "Brazilian", level: "Advanced", state: "SP", country: "Brazil" },
    { name: "Jack Wilson", nationality: "American", level: "Intermediate", state: "TX", country: "United States" },
    { name: "Bella Lima", nationality: "Brazilian", level: "Intermediate", state: "SP", country: "Brazil" },
    { name: "Pedro Augusto", nationality: "Brazilian", level: "Advanced", state: "SP", country: "Brazil" },
    { name: "Chacon Silva", nationality: "Brazilian", level: "Intermediate", state: "SC", country: "Brazil" },
    { name: "Rodrigo Pereira", nationality: "Brazilian", level: "Advanced", state: "SP", country: "Brazil" },
    { name: "Bruno Nahar", nationality: "Brazilian", level: "Advanced", state: "SP", country: "Brazil" },
    { name: "Raul Mendes", nationality: "Portuguese", level: "Intermediate", state: "SP", country: "Brazil" },
  ];

  // Create all athletes
  const createdAthletes: typeof adminUser[] = [];
  const playerPassword = await bcryptjs.hash("player123", 10);

  for (let i = 0; i < athletes.length; i++) {
    const athlete = athletes[i];
    const user = await prisma.user.create({
      data: {
        name: athlete.name,
        email: `${athlete.name.toLowerCase().replace(/\s+/g, ".")}@footvolley.com`,
        password: playerPassword,
        role: "user",
        nationality: athlete.nationality,
        country: athlete.country,
        state: athlete.state || "SP",
        level: athlete.level,
      },
    });
    createdAthletes.push(user);
  }

  console.log(`Created ${createdAthletes.length} athlete users`);

  // Create first tournament - King of the Beach (completed)
  const kotbTournament = await prisma.tournament.create({
    data: {
      name: "Sao Paulo Footvolley Championship 2024",
      description: "Annual King of the Beach tournament in Sao Paulo",
      date: new Date("2024-11-01"),
      endDate: new Date("2024-11-03"),
      location: "Praia da Costa, Sao Paulo",
      city: "Sao Paulo",
      state: "SP",
      country: "Brazil",
      format: "king_of_the_beach",
      status: "completed",
      maxPlayers: 16,
      numCourts: 2,
      numDays: 3,
      hoursPerDay: 8,
      avgGameMinutes: 20,
      pointsPerSet: 18,
      numSets: 1,
      groupSize: 4,
      organizerId: organizerUser.id,
    },
  });

  console.log("Created first tournament (King of the Beach):", kotbTournament.id);

  // Create groups for KotB tournament
  const groupA = await prisma.group.create({
    data: { name: "Group A", tournamentId: kotbTournament.id },
  });

  const groupB = await prisma.group.create({
    data: { name: "Group B", tournamentId: kotbTournament.id },
  });

  const groupC = await prisma.group.create({
    data: { name: "Group C", tournamentId: kotbTournament.id },
  });

  const groupD = await prisma.group.create({
    data: { name: "Group D", tournamentId: kotbTournament.id },
  });

  console.log("Created 4 groups for KotB tournament");

  // Create group stage round
  const groupStageRound = await prisma.round.create({
    data: {
      name: "Group Stage",
      roundNumber: 1,
      tournamentId: kotbTournament.id,
      type: "group",
    },
  });

  // Add first 16 athletes to KotB tournament (4 per group)
  const groups = [groupA, groupB, groupC, groupD];
  for (let g = 0; g < 4; g++) {
    for (let i = g * 4; i < (g + 1) * 4; i++) {
      await prisma.tournamentPlayer.create({
        data: {
          tournamentId: kotbTournament.id,
          userId: createdAthletes[i].id,
          seed: i + 1,
          groupId: groups[g].id,
          status: "checked_in",
          wins: Math.floor(Math.random() * 3),
          losses: Math.floor(Math.random() * 3),
          points: Math.floor(Math.random() * 40),
          pointDiff: Math.floor(Math.random() * 20) - 10,
        },
      });
    }
  }

  console.log("Added 16 players to KotB tournament");

  // Create some games for group A
  await prisma.game.create({
    data: {
      tournamentId: kotbTournament.id,
      groupId: groupA.id,
      roundId: groupStageRound.id,
      courtNumber: 1,
      player1HomeId: createdAthletes[0].id,
      player2HomeId: createdAthletes[1].id,
      player1AwayId: createdAthletes[2].id,
      player2AwayId: createdAthletes[3].id,
      scoreHome: 18,
      scoreAway: 16,
      status: "completed",
      winningSide: "home",
      scheduledTime: new Date("2024-11-01T09:00:00"),
    },
  });

  await prisma.game.create({
    data: {
      tournamentId: kotbTournament.id,
      groupId: groupA.id,
      roundId: groupStageRound.id,
      courtNumber: 2,
      player1HomeId: createdAthletes[0].id,
      player2HomeId: createdAthletes[2].id,
      player1AwayId: createdAthletes[1].id,
      player2AwayId: createdAthletes[3].id,
      scoreHome: 18,
      scoreAway: 14,
      status: "completed",
      winningSide: "home",
      scheduledTime: new Date("2024-11-01T10:00:00"),
    },
  });

  await prisma.game.create({
    data: {
      tournamentId: kotbTournament.id,
      groupId: groupA.id,
      roundId: groupStageRound.id,
      courtNumber: 1,
      player1HomeId: createdAthletes[0].id,
      player2HomeId: createdAthletes[3].id,
      player1AwayId: createdAthletes[1].id,
      player2AwayId: createdAthletes[2].id,
      scoreHome: 18,
      scoreAway: 17,
      status: "completed",
      winningSide: "home",
      scheduledTime: new Date("2024-11-01T11:00:00"),
    },
  });

  console.log("Created 3 games for group A");

  // Create some games for group B
  await prisma.game.create({
    data: {
      tournamentId: kotbTournament.id,
      groupId: groupB.id,
      roundId: groupStageRound.id,
      courtNumber: 2,
      player1HomeId: createdAthletes[4].id,
      player2HomeId: createdAthletes[5].id,
      player1AwayId: createdAthletes[6].id,
      player2AwayId: createdAthletes[7].id,
      scoreHome: 18,
      scoreAway: 15,
      status: "completed",
      winningSide: "home",
      scheduledTime: new Date("2024-11-01T09:30:00"),
    },
  });

  console.log("Created 1 game for group B");

  // Create second tournament - Bracket (upcoming)
  const bracketTournament = await prisma.tournament.create({
    data: {
      name: "Rio de Janeiro Beach Open 2025",
      description: "Open bracket tournament in Rio de Janeiro",
      date: new Date("2025-03-15"),
      endDate: new Date("2025-03-17"),
      location: "Copacabana Beach, Rio de Janeiro",
      city: "Rio de Janeiro",
      state: "RJ",
      country: "Brazil",
      format: "bracket",
      status: "registration",
      maxPlayers: 16,
      numCourts: 2,
      numDays: 3,
      hoursPerDay: 8,
      avgGameMinutes: 20,
      pointsPerSet: 18,
      numSets: 1,
      groupSize: 4,
      organizerId: organizerUser.id,
    },
  });

  console.log("Created second tournament (Bracket):", bracketTournament.id);

  // Create rounds for bracket tournament
  const quarterFinals = await prisma.round.create({
    data: {
      name: "Quarter Finals",
      roundNumber: 1,
      tournamentId: bracketTournament.id,
      type: "knockout",
    },
  });

  const semiFinals = await prisma.round.create({
    data: {
      name: "Semi Finals",
      roundNumber: 2,
      tournamentId: bracketTournament.id,
      type: "knockout",
    },
  });

  const finals = await prisma.round.create({
    data: {
      name: "Finals",
      roundNumber: 3,
      tournamentId: bracketTournament.id,
      type: "knockout",
    },
  });

  console.log("Created 3 rounds for bracket tournament");

  // Add 16 athletes to bracket tournament
  for (let i = 0; i < Math.min(16, createdAthletes.length); i++) {
    await prisma.tournamentPlayer.create({
      data: {
        tournamentId: bracketTournament.id,
        userId: createdAthletes[i].id,
        seed: i + 1,
        status: "registered",
      },
    });
  }

  console.log("Added players to bracket tournament");

  // Create third tournament - Round Robin (in progress)
  const rrTournament = await prisma.tournament.create({
    data: {
      name: "Miami Footvolley Classic 2025",
      description: "Round robin format tournament in Miami",
      date: new Date("2025-02-01"),
      endDate: new Date("2025-02-02"),
      location: "South Beach, Miami",
      city: "Miami",
      state: "FL",
      country: "United States",
      format: "round_robin",
      status: "in_progress",
      maxPlayers: 8,
      numCourts: 2,
      numDays: 2,
      hoursPerDay: 8,
      avgGameMinutes: 20,
      pointsPerSet: 18,
      numSets: 1,
      groupSize: 4,
      organizerId: organizerUser.id,
    },
  });

  console.log("Created third tournament (Round Robin):", rrTournament.id);

  // Add 8 athletes to RR tournament
  for (let i = 0; i < 8; i++) {
    await prisma.tournamentPlayer.create({
      data: {
        tournamentId: rrTournament.id,
        userId: createdAthletes[i].id,
        seed: i + 1,
        status: "checked_in",
        wins: Math.floor(Math.random() * 4),
        losses: Math.floor(Math.random() * 4),
        points: Math.floor(Math.random() * 50),
        pointDiff: Math.floor(Math.random() * 30) - 15,
      },
    });
  }

  console.log("Added 8 players to round robin tournament");

  // Create round robin round and games
  const rrRound = await prisma.round.create({
    data: {
      name: "Round Robin",
      roundNumber: 1,
      tournamentId: rrTournament.id,
      type: "group",
    },
  });

  // Generate all round robin games (each pair plays once)
  const rrPlayers = createdAthletes.slice(0, 8);
  for (let i = 0; i < rrPlayers.length; i++) {
    for (let j = i + 1; j < rrPlayers.length; j++) {
      const homeScore = 12 + Math.floor(Math.random() * 7); // 12-18
      const awayScore = homeScore === 18 ? 10 + Math.floor(Math.random() * 8) : 18;
      const winningSide = homeScore > awayScore ? "home" : "away";
      await prisma.game.create({
        data: {
          tournamentId: rrTournament.id,
          roundId: rrRound.id,
          courtNumber: (i % 2) + 1,
          player1HomeId: rrPlayers[i].id,
          player2HomeId: null,
          player1AwayId: rrPlayers[j].id,
          player2AwayId: null,
          scoreHome: homeScore,
          scoreAway: awayScore,
          status: "completed",
          winningSide,
          scheduledTime: new Date(new Date("2025-02-01T09:00:00").getTime() + (i * rrPlayers.length + j) * 20 * 60000),
        },
      });
    }
  }

  console.log("Created round robin games (28 games for 8 players)");

  // ================================================================
  // TOURNAMENT 4: Complete 32-team bracket tournament (64 players)
  // "Copa Footvolley Brasil 2025" - Full elimination bracket
  // ================================================================

  // We need 64 players total (32 teams of 2). We have 39 athletes, need 25 more.
  const extraAthletes: AthleteData[] = [
    { name: "Thiago Ribeiro", nationality: "Brazilian", level: "Pro", state: "SP", country: "Brazil" },
    { name: "Lucas Moura", nationality: "Brazilian", level: "Advanced", state: "RJ", country: "Brazil" },
    { name: "Neymar Jr", nationality: "Brazilian", level: "Pro", state: "SP", country: "Brazil" },
    { name: "Paulo Henrique", nationality: "Brazilian", level: "Advanced", state: "MG", country: "Brazil" },
    { name: "Caio Vinicius", nationality: "Brazilian", level: "Intermediate", state: "BA", country: "Brazil" },
    { name: "Vitor Hugo", nationality: "Brazilian", level: "Advanced", state: "RS", country: "Brazil" },
    { name: "Diego Almeida", nationality: "Brazilian", level: "Pro", state: "SP", country: "Brazil" },
    { name: "Gustavo Lima", nationality: "Brazilian", level: "Advanced", state: "CE", country: "Brazil" },
    { name: "Roberto Carlos", nationality: "Brazilian", level: "Pro", state: "SP", country: "Brazil" },
    { name: "Anderson Neto", nationality: "Brazilian", level: "Intermediate", state: "PE", country: "Brazil" },
    { name: "Joao Pedro", nationality: "Brazilian", level: "Advanced", state: "SC", country: "Brazil" },
    { name: "Matheus Santos", nationality: "Brazilian", level: "Pro", state: "RJ", country: "Brazil" },
    { name: "Eduardo Lima", nationality: "Brazilian", level: "Advanced", state: "SP", country: "Brazil" },
    { name: "Guilherme Costa", nationality: "Brazilian", level: "Intermediate", state: "SP", country: "Brazil" },
    { name: "Leandro Martins", nationality: "Brazilian", level: "Advanced", state: "MG", country: "Brazil" },
    { name: "Kevin Thompson", nationality: "American", level: "Advanced", state: "FL", country: "United States" },
    { name: "Miguel Torres", nationality: "Spanish", level: "Pro", state: "SP", country: "Brazil" },
    { name: "James Anderson", nationality: "American", level: "Advanced", state: "CA", country: "United States" },
    { name: "Chris Baker", nationality: "American", level: "Intermediate", state: "TX", country: "United States" },
    { name: "Luis Gonzalez", nationality: "Argentine", level: "Advanced", state: "SP", country: "Brazil" },
    { name: "Pablo Hernandez", nationality: "Argentine", level: "Pro", state: "RJ", country: "Brazil" },
    { name: "Marco Rossi", nationality: "Italian", level: "Advanced", state: "SP", country: "Brazil" },
    { name: "Hans Mueller", nationality: "German", level: "Intermediate", state: "SP", country: "Brazil" },
    { name: "Pierre Dupont", nationality: "French", level: "Advanced", state: "RJ", country: "Brazil" },
    { name: "Takeshi Yamamoto", nationality: "Japanese", level: "Advanced", state: "SP", country: "Brazil" },
  ];

  for (const athlete of extraAthletes) {
    const user = await prisma.user.create({
      data: {
        name: athlete.name,
        email: `${athlete.name.toLowerCase().replace(/\s+/g, ".")}@footvolley.com`,
        password: playerPassword,
        role: "user",
        nationality: athlete.nationality,
        country: athlete.country,
        state: athlete.state || "SP",
        level: athlete.level,
      },
    });
    createdAthletes.push(user);
  }

  console.log(`Created ${extraAthletes.length} additional athletes (total: ${createdAthletes.length})`);

  const bracketFullTournament = await prisma.tournament.create({
    data: {
      name: "Copa Footvolley Brasil 2025",
      description: "The biggest footvolley bracket tournament in Brazil. 32 teams battle through 5 rounds to claim the title.",
      date: new Date("2025-06-15"),
      endDate: new Date("2025-06-22"),
      location: "Arena Copacabana, Rio de Janeiro",
      city: "Rio de Janeiro",
      state: "RJ",
      country: "Brazil",
      format: "bracket",
      status: "completed",
      maxPlayers: 64,
      numCourts: 4,
      numDays: 8,
      hoursPerDay: 10,
      avgGameMinutes: 25,
      pointsPerSet: 21,
      numSets: 3,
      groupSize: 4,
      organizerId: organizerUser.id,
    },
  });

  console.log("Created Copa Footvolley Brasil 2025:", bracketFullTournament.id);

  // Register 64 players (32 teams of 2)
  for (let i = 0; i < 64; i++) {
    await prisma.tournamentPlayer.create({
      data: {
        tournamentId: bracketFullTournament.id,
        userId: createdAthletes[i].id,
        seed: i + 1,
        status: "checked_in",
      },
    });
  }

  console.log("Registered 64 players to Copa Footvolley");

  // Create 5 rounds for 32-team single elimination
  const roundNames = ["Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Final"];
  const rounds: { id: string; name: string; roundNumber: number }[] = [];
  for (let r = 0; r < 5; r++) {
    const round = await prisma.round.create({
      data: {
        name: roundNames[r],
        roundNumber: r + 1,
        tournamentId: bracketFullTournament.id,
        type: "knockout",
      },
    });
    rounds.push(round);
  }

  console.log("Created 5 knockout rounds");

  // Build the full bracket with simulated results
  // 32 teams -> Round of 32 (16 games) -> Round of 16 (8) -> QF (4) -> SF (2) -> Final (1)
  // Teams are pairs of players: [0,1], [2,3], [4,5], ...
  const teams: { p1: string; p2: string; name: string }[] = [];
  for (let i = 0; i < 64; i += 2) {
    teams.push({
      p1: createdAthletes[i].id,
      p2: createdAthletes[i + 1].id,
      name: `${createdAthletes[i].name} & ${createdAthletes[i + 1].name}`,
    });
  }

  // Simulate games round by round
  let currentTeams = [...teams]; // 32 teams
  const baseDate = new Date("2025-06-15T09:00:00");

  for (let r = 0; r < 5; r++) {
    const round = rounds[r];
    const winners: typeof currentTeams = [];
    const gamesInRound = currentTeams.length / 2;

    for (let g = 0; g < gamesInRound; g++) {
      const home = currentTeams[g * 2];
      const away = currentTeams[g * 2 + 1];

      // Simulate realistic scores (best of 3 sets, first to 21)
      const homeWins = Math.random() > 0.45; // slight away upset chance
      let scoreHome: number;
      let scoreAway: number;

      if (r === 4) {
        // Final: tighter scores
        if (homeWins) {
          scoreHome = 21;
          scoreAway = 17 + Math.floor(Math.random() * 4); // 17-20
        } else {
          scoreHome = 17 + Math.floor(Math.random() * 4);
          scoreAway = 21;
        }
      } else if (r >= 3) {
        // Semifinals: competitive
        if (homeWins) {
          scoreHome = 21;
          scoreAway = 14 + Math.floor(Math.random() * 7); // 14-20
        } else {
          scoreHome = 14 + Math.floor(Math.random() * 7);
          scoreAway = 21;
        }
      } else {
        // Earlier rounds: more variation
        if (homeWins) {
          scoreHome = 21;
          scoreAway = 8 + Math.floor(Math.random() * 13); // 8-20
        } else {
          scoreHome = 8 + Math.floor(Math.random() * 13);
          scoreAway = 21;
        }
      }

      const winningSide = homeWins ? "home" : "away";
      const courtNum = (g % 4) + 1;
      const gameTime = new Date(baseDate.getTime() + r * 86400000 + g * 1800000); // 30min apart per game

      await prisma.game.create({
        data: {
          tournamentId: bracketFullTournament.id,
          roundId: round.id,
          courtNumber: courtNum,
          player1HomeId: home.p1,
          player2HomeId: home.p2,
          player1AwayId: away.p1,
          player2AwayId: away.p2,
          scoreHome,
          scoreAway,
          status: "completed",
          winningSide,
          scheduledTime: gameTime,
        },
      });

      // Winner advances
      winners.push(homeWins ? home : away);
    }

    console.log(`Round ${r + 1} (${roundNames[r]}): Created ${gamesInRound} games`);
    currentTeams = winners;
  }

  // Update player stats based on game results
  const allBracketGames = await prisma.game.findMany({
    where: { tournamentId: bracketFullTournament.id },
  });

  const playerStats = new Map<string, { wins: number; losses: number; pf: number; pa: number }>();
  for (const game of allBracketGames) {
    const homeIds = [game.player1HomeId, game.player2HomeId].filter(Boolean) as string[];
    const awayIds = [game.player1AwayId, game.player2AwayId].filter(Boolean) as string[];
    const homeWon = game.winningSide === "home";

    for (const pid of homeIds) {
      if (!playerStats.has(pid)) playerStats.set(pid, { wins: 0, losses: 0, pf: 0, pa: 0 });
      const s = playerStats.get(pid)!;
      s.pf += game.scoreHome ?? 0;
      s.pa += game.scoreAway ?? 0;
      if (homeWon) s.wins++; else s.losses++;
    }
    for (const pid of awayIds) {
      if (!playerStats.has(pid)) playerStats.set(pid, { wins: 0, losses: 0, pf: 0, pa: 0 });
      const s = playerStats.get(pid)!;
      s.pf += game.scoreAway ?? 0;
      s.pa += game.scoreHome ?? 0;
      if (homeWon) s.losses++; else s.wins++;
    }
  }

  for (const [userId, stats] of playerStats.entries()) {
    await prisma.tournamentPlayer.updateMany({
      where: { tournamentId: bracketFullTournament.id, userId },
      data: {
        wins: stats.wins,
        losses: stats.losses,
        points: stats.pf,
        pointDiff: stats.pf - stats.pa,
      },
    });
  }

  console.log("Updated player stats for Copa Footvolley");

  // ================================================================
  // TOURNAMENT 5: TAFC Pipa 2026 - Professional League
  // 32 teams (64 players), proLeague=true
  // Semis & Final are best-of-3 sets, all others single set to 18
  // ================================================================

  const tafcTournament = await prisma.tournament.create({
    data: {
      name: "TAFC Pipa 2026",
      description: "Professional League tournament in Pipa, Brazil. 32 teams compete in a single-elimination bracket. Semifinals and Final are played best-of-3 sets.",
      date: new Date("2026-03-10"),
      endDate: new Date("2026-03-15"),
      location: "Praia do Amor, Pipa",
      city: "Pipa",
      state: "RN",
      country: "Brazil",
      format: "bracket",
      status: "completed",
      maxPlayers: 64,
      numCourts: 4,
      numDays: 6,
      hoursPerDay: 10,
      avgGameMinutes: 25,
      pointsPerSet: 18,
      numSets: 1,
      groupSize: 4,
      proLeague: true,
      organizerId: organizerUser.id,
    },
  });

  console.log("Created TAFC Pipa 2026 (Professional League):", tafcTournament.id);

  // Register 64 players
  for (let i = 0; i < 64; i++) {
    await prisma.tournamentPlayer.create({
      data: {
        tournamentId: tafcTournament.id,
        userId: createdAthletes[i].id,
        seed: i + 1,
        status: "checked_in",
      },
    });
  }

  console.log("Registered 64 players to TAFC Pipa 2026");

  // Create 5 rounds: R32, R16, QF, SF (bestOf3), Final (bestOf3)
  const tafcRoundDefs = [
    { name: "Round of 32", roundNumber: 1, bestOf3: false },
    { name: "Round of 16", roundNumber: 2, bestOf3: false },
    { name: "Quarterfinals", roundNumber: 3, bestOf3: false },
    { name: "Semifinals", roundNumber: 4, bestOf3: true },
    { name: "Final", roundNumber: 5, bestOf3: true },
  ];

  const tafcRounds: { id: string; name: string; roundNumber: number; bestOf3: boolean }[] = [];
  for (const rd of tafcRoundDefs) {
    const round = await prisma.round.create({
      data: {
        name: rd.name,
        roundNumber: rd.roundNumber,
        tournamentId: tafcTournament.id,
        type: "knockout",
        bestOf3: rd.bestOf3,
      },
    });
    tafcRounds.push({ ...round, bestOf3: rd.bestOf3 });
  }

  console.log("Created 5 rounds (SF + Final are bestOf3)");

  // Build teams (pairs)
  const tafcTeams: { p1: string; p2: string; name: string }[] = [];
  for (let i = 0; i < 64; i += 2) {
    tafcTeams.push({
      p1: createdAthletes[i].id,
      p2: createdAthletes[i + 1].id,
      name: `${createdAthletes[i].name} & ${createdAthletes[i + 1].name}`,
    });
  }

  // Helper: generate a valid score with 2-point advantage
  function genSetScore(targetPts: number, tight: boolean): { winner: number; loser: number } {
    if (tight && Math.random() > 0.5) {
      // Deuce scenario: e.g. 20-18, 22-20, 19-17 (for 15-pt sets: 17-15, 16-14)
      const extra = Math.floor(Math.random() * 3); // 0, 1, or 2 extra pairs
      return { winner: targetPts + extra, loser: targetPts - 2 + extra };
    }
    // Clean win
    const loserMin = tight ? targetPts - 5 : targetPts - 10;
    const loser = Math.max(0, loserMin + Math.floor(Math.random() * (targetPts - 2 - loserMin + 1)));
    return { winner: targetPts, loser };
  }

  // Simulate bracket
  let tafcCurrentTeams = [...tafcTeams]; // 32 teams
  const tafcBaseDate = new Date("2026-03-10T09:00:00");

  for (let r = 0; r < 5; r++) {
    const round = tafcRounds[r];
    const winners: typeof tafcCurrentTeams = [];
    const gamesInRound = tafcCurrentTeams.length / 2;
    const isBo3 = round.bestOf3;
    const isTight = r >= 2; // QF+ are tighter games

    for (let g = 0; g < gamesInRound; g++) {
      const home = tafcCurrentTeams[g * 2];
      const away = tafcCurrentTeams[g * 2 + 1];
      const homeWins = Math.random() > 0.45;
      const courtNum = (g % 4) + 1;
      const gameTime = new Date(tafcBaseDate.getTime() + r * 86400000 + g * 1800000);

      if (isBo3) {
        // Best of 3 sets
        // Decide match outcome: 2-0 or 2-1
        const straightSets = Math.random() > 0.55; // ~45% chance of going to 3 sets

        let s1Home: number, s1Away: number;
        let s2Home: number, s2Away: number;
        let s3Home: number | null = null, s3Away: number | null = null;
        let winningSide: string;

        if (straightSets) {
          // Winner takes both sets (2-0)
          if (homeWins) {
            const set1 = genSetScore(18, true);
            s1Home = set1.winner; s1Away = set1.loser;
            const set2 = genSetScore(18, true);
            s2Home = set2.winner; s2Away = set2.loser;
            winningSide = "home";
          } else {
            const set1 = genSetScore(18, true);
            s1Home = set1.loser; s1Away = set1.winner;
            const set2 = genSetScore(18, true);
            s2Home = set2.loser; s2Away = set2.winner;
            winningSide = "away";
          }
        } else {
          // Goes to 3 sets (2-1) — loser wins one set
          if (homeWins) {
            // Home wins set 1, loses set 2, wins set 3
            const set1 = genSetScore(18, true);
            s1Home = set1.winner; s1Away = set1.loser;
            const set2 = genSetScore(18, true);
            s2Home = set2.loser; s2Away = set2.winner;
            const set3 = genSetScore(15, true); // deciding set to 15
            s3Home = set3.winner; s3Away = set3.loser;
            winningSide = "home";
          } else {
            // Away wins set 1, loses set 2, wins set 3
            const set1 = genSetScore(18, true);
            s1Home = set1.loser; s1Away = set1.winner;
            const set2 = genSetScore(18, true);
            s2Home = set2.winner; s2Away = set2.loser;
            const set3 = genSetScore(15, true); // deciding set to 15
            s3Home = set3.loser; s3Away = set3.winner;
            winningSide = "away";
          }
        }

        await prisma.game.create({
          data: {
            tournamentId: tafcTournament.id,
            roundId: round.id,
            courtNumber: courtNum,
            player1HomeId: home.p1,
            player2HomeId: home.p2,
            player1AwayId: away.p1,
            player2AwayId: away.p2,
            scoreHome: s1Home,
            scoreAway: s1Away,
            set2Home: s2Home,
            set2Away: s2Away,
            set3Home: s3Home,
            set3Away: s3Away,
            status: "completed",
            winningSide,
            scheduledTime: gameTime,
          },
        });

        winners.push(homeWins ? home : away);
      } else {
        // Single set to 18
        const set = genSetScore(18, isTight);
        const scoreHome = homeWins ? set.winner : set.loser;
        const scoreAway = homeWins ? set.loser : set.winner;

        await prisma.game.create({
          data: {
            tournamentId: tafcTournament.id,
            roundId: round.id,
            courtNumber: courtNum,
            player1HomeId: home.p1,
            player2HomeId: home.p2,
            player1AwayId: away.p1,
            player2AwayId: away.p2,
            scoreHome,
            scoreAway,
            status: "completed",
            winningSide: homeWins ? "home" : "away",
            scheduledTime: gameTime,
          },
        });

        winners.push(homeWins ? home : away);
      }
    }

    const setsInfo = isBo3 ? " (best-of-3)" : " (single set)";
    console.log(`TAFC Round ${r + 1} (${tafcRoundDefs[r].name}): ${gamesInRound} games${setsInfo}`);
    tafcCurrentTeams = winners;
  }

  // Update player stats for TAFC
  const tafcGames = await prisma.game.findMany({
    where: { tournamentId: tafcTournament.id },
  });

  const tafcStats = new Map<string, { wins: number; losses: number; pf: number; pa: number }>();
  for (const game of tafcGames) {
    const homeIds = [game.player1HomeId, game.player2HomeId].filter(Boolean) as string[];
    const awayIds = [game.player1AwayId, game.player2AwayId].filter(Boolean) as string[];
    const homeWon = game.winningSide === "home";

    // Sum all set scores
    const totalHome = (game.scoreHome ?? 0) + (game.set2Home ?? 0) + (game.set3Home ?? 0);
    const totalAway = (game.scoreAway ?? 0) + (game.set2Away ?? 0) + (game.set3Away ?? 0);

    for (const pid of homeIds) {
      if (!tafcStats.has(pid)) tafcStats.set(pid, { wins: 0, losses: 0, pf: 0, pa: 0 });
      const s = tafcStats.get(pid)!;
      s.pf += totalHome;
      s.pa += totalAway;
      if (homeWon) s.wins++; else s.losses++;
    }
    for (const pid of awayIds) {
      if (!tafcStats.has(pid)) tafcStats.set(pid, { wins: 0, losses: 0, pf: 0, pa: 0 });
      const s = tafcStats.get(pid)!;
      s.pf += totalAway;
      s.pa += totalHome;
      if (homeWon) s.losses++; else s.wins++;
    }
  }

  for (const [userId, stats] of tafcStats.entries()) {
    await prisma.tournamentPlayer.updateMany({
      where: { tournamentId: tafcTournament.id, userId },
      data: {
        wins: stats.wins,
        losses: stats.losses,
        points: stats.pf,
        pointDiff: stats.pf - stats.pa,
      },
    });
  }

  console.log("Updated player stats for TAFC Pipa 2026");
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
