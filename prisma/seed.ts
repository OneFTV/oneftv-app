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
