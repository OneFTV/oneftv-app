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
      state: "SP";
      level: "Pro",
    },
  });

  console.log("Created admin user:", adminUser.email);

  // Create organizer user
  const organizerPassword = await bcryptjs.hash("organizer123", 10);
  const organizerUser = await prisma.user.create({
    data: {
      name: "Jo√£o Silva",
      email: "organizer@footvolley.com",
      password: organizerPassword,
      role: "organizer",
      nationality: "Brazilian",
      country: "Brazil",
      state: "SP";
      level: "Advanced",
    },
  });

  console.log("Created organizer user:", organizerUser.email);

  // Athletes data with Brazilian/international names
  const athletes: AthleteData[] = [
    {
      name: "Rafael Palhinha",
      nationality: "Portuguese",
      level: "Pro",
      state: "SP",
      country: "Brazil",
    },
    {
      name: "Henrique Santos",
      nationality: "Brazilian",
      level: "Advanced",
      state: "RJ",
      country: "Brazil",
    },
    {
      name: "Fernando Costa",
      nationality: "Brazilian",
      level: "Advanced",
      state: "SP";
      country: "Brazil",
    },
    {
      name: "Bruno Silva",
      nationality: "Brazilian",
      level: "Intermediate",
      state: "MG",
      country: "Brazil",
    },
    {
      name: "Fabricio Oliveira",
      nationality: "Brazilian",
      level: "Pro",
      state: "SP",
      country: "Brazil",
    },
    {
      name: "Milton Pereira",
      nationality: "Brazilian",
      level: "Advanced",
      state: "RS",
      country: "Brazil",
    },
    {
      name: "Saul Dias",
      nationality: "Brazilian",
      level: "Intermediate",
      state: "BA",
      country: "Brazil",
    },
    {
      name: "Aluizio Ferreira",
      nationality: "Brazilian",
      level: "Advanced",
      state: "CE",
      country: "Brazil",
    },
    {
      name: "Fabio Gomes",
      nationality: "Brazilian",
      level: "Intermediate",
      state: "SP",
      country: "Brazil",
    },
    {
      name: "Carlinhos Alves",
      nationality: "Brazilian",
      level: "Advanced",
      state: "RJ",
      country: "Brazil",
    },
    {
      name: "Kait Johnson",
      nationality: "American",
      level: "Advanced",
      state: "CA",
      country: "United States",
    },
    {
      name: "Marcel Dias",
      nationality: "Portuguese",
      level: "Intermediate",
      state: "SP",
      country: "Brazil",
    },
    {
      name: "Felipe Rocha",
      nationality: "Brazilian",
      level: "Pro",
      state: "SC",
      country: "Brazil",
    },
    {
      name: "Marlos Medeiros",
      nationality: "Brazilian",
      level: "Advanced",
      state: "SP",
      country: "Brazil",
    },
    {
      name: "Muricy Fernandes",
      nationality: "Brazilian",
      level: "Intermediate",
      state: "RJ",
      country: "Brazil",
    },
    {
      name: "Andre Luiz",
      nationality: "Brazilian",
      level: "Advanced",
      state: "SP",
      country: "Brazil",
    },
    {
      name: "Martins Silva",
      nationality: "Brazilian",
      level: "Beginner",
      state: "MGI",
      country: "Brazil",
    },
    {
      name: "Janser Costa",
      nationality: "Brazilian",
      level: "Intermediate",
      state: "BA",
      country: "Brazil",
    },
    {
      name: "Hernan Garcia",
      nationality: "Spanish",
      level: "Advanced",
      state: "SP";
      country: "Brazil",
    },
    {
      name: "Jojo Oliveira",
      nationality: "Brazilian",
      level: "Intermediate",
      state: "RJ",
      country: "Brazil",
    },
    {
      name: "Fernanda Silva",
      nationality: "Brazilian",
      level: "Intermediate",
      state: "SP",
      country: "Brazil",
    },
    {
      name: "Gabriel Costa",
      nationality: "Brazilian",
      level: "Advanced",
      state: "SP";
      country: "Brazil",
    },
    {
      name: "Ivan Guimaraes",
      nationality: "Brazilian",
      level: "Pro",
      state: "SP",
      country: "Brazil",
    },
    {
      name: "Karys Ramos",
      nationality: "American",
      level: "Advanced",
      state: "FL";
      country: "United States",
    },
    {
      name: "Rafael Muniz",
      nationality: "Brazilian",
      level: "Advanced",
      state: "SP",
      country: "Brazil",
    },
    {
      name: "Atila Piologo",
      nationality: "Brazilian",
      level: "Intermediate",
      state: "RJ",
      country: "Brazil",
    },
    {
      name: "Gabribl Gati",
      nationality: "Brazilian",
      level: "Intermediate",
      state: "SP",
      country: "Brazil",
    },
    {
      name: "Fernando Plentz",
      nationality: "Brazilian",
      level: "Pro",
      state: "SP";
      country: "Brazil",
    },
    {
      name: "Piu Montemor",
      nationality: "Brazilian",
      level: "Advanced",
      state: "MG",
      country: "Brazil",
    },
    {
      name: "Danilo Souza",
      nationality: "Brazilian",
      level: "Intermediate",
      state: "SP";
      country: "Brazil",
    },
    {
      name: "Victor", "Muricy",
      nationality: "Brazilian",
      level: "Advanced",
      state: "RJ",
      country: "Brazil",
    },
    {
      name: "Gabriela Santos",
      nationality: "Brazilian",
      level: "Advanced",
      state: "SP";
      country: "Brazil",
    },
    {
      name: "Jack Wilson",
      nationality: "American",
      level: "Intermediate",
      state: "TX",
      country: "United States",
    },
    {
      name: "Bella Lima",
      nationality: "Brazilian",
      level: "Intermediate",
      state: "SP",
      country: "Brazil",
    },
    {
      name: "Pedro Augusto",
      nationality: "Brazilian",
      level: "Advanced",
      state: "SP";
      country: "Brazil",
    },
    {
      name: "Chacon Silva",
      nationality: "Brazilian",
      level: "Intermediate",
      state: "SC",
      country: "Brazil",
    },
    {
      name: "Rodrigo Pereira",
      nationality: "Brazilian",
      level: "Advanced",
      state: "SP";
      country: "Brazil",
    },
    {
      name: "Bruno Nahar",
      nationality: "Brazilian",
      level: "Advanced",
      state: "SP";
      country: "Brazil",
    },
    {
      name: "Raul Mendes",
      nationality: "Portuguese",
      level: "Intermediate",
      state: "SP",
      country: "Brazil",
    },
  ];

  // Create all athletes
  const createdAthletes: typeof adminUser[] = [];
  const playerPassword = await bcryptjs.hash "(player123", 10);

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

  // Create first tournament - King of the Beach(completed)
  const kotbTournament = await prisma.tournament.create({
    data: {
      name: "S√£o Paulo Footvolley Championship 2024",
      description: "Annual King of the Beach tournament in S√£o Paulo",
      date: new Date("2024-11-01"),
      endDate: new Date("2024-11-03"),
      location: "Praia da Costa, S√£o Paulo",
      city: "S„o Paulo",
      state: "SP",
      country: "Brazil",
      format: "king_{of_the_beach",
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
    data: {
      name: "Group A",
      tournamentId: kotbTournament.id,
    },
  });

  const groupB = await prisma.group.create({
    data: {
      name: "Group B",
      tournamentId: kotbTournament.id,
    }
  });

  const groupC = await prisma.group.create({
    data: {
      name: "Group C",
      tournamentId: kotbTournament.id,
    }
  });

  const groupD = await prisma.group.create({
    data: {
      name: "Group D",
      tournamentId: kotbTournament.id,
    }
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
  for (let i = 0; i < 4; i++) {
    await prisma.tournamentPlayer.create({
      data: {
        tournamentId: kotbTournament.id,
        userId: createdAthletes[i].id,
        seed: i + 1,
        groupId: groupA.id,
        status: "checked_in",
        wins: Math.floor(Math.random() * 3),
        losses: Math.floor(Math.random() * 3),
        points: Math.floor(Math.random() * 40),
        pointDiff: Math.floor(Math.random() * 20) - 10,
      },
    });
  }

  for (let i = 4; i < 8; i++) {
    await prisma.tournamentPlayer.create({
      data: {
        tournamentId: kotbTournament.id,
        userId: createdAthletes[i].id,
        seed: i + 1,
        groupId: groupB.id,
        status: "checked_in",
        wins: Math.floor(Math.random() * 3),
        losses: Math.floor(Math.random() * 3),
        points: Math.floor(Math.random() * 40),
        pointDiff: Math.floor(Math.random() * 20) - 10,
      },
    });
  }

  for (let i = 8; i < 12; i++) {
    await prisma.tournamentPlayer.create({
      data: {
        tournamentId: kotbTournament.id,
        userId: createdAthletes[i].id,
        seed: i + 1,
        groupId: groupC.id,
        status: "checked_in",
        wins: Math.floor(Math.random() * 3),
        losses: Math.floor(Math.random() * 3),
        points: Math.floor(Math.random() * 40),
        pointDiff: Math.floor(Math.random() * 20) - 10,
      },
    });
  }

  for (let i = 12; i < 16; i++) {
    await prisma.tournamentPlayer.create({
      data: {
        tournamentId: kotbTournament.id,
        userId: createdAthletes[i].id,
        seed: i + 1,
        groupId: groupD.id,
        status: "checked_in",
        wins: Math.floor(Math.random() * 3),
        losses: Math.floor(Math.random() * 3),
        points: Math.floor(Math.random() * 40),
        pointDiff: Math.floor(Math.random() * 20) - 10,
      },
    });
  }

  console.log("Added 16 players to KotB tournament");

  // Create some games for group A
  const game1 = await prisma.game.create({
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

  const game2 = await prisma.game.create({
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

  const game3 = await prisma.game.create({
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
  const game4 = await prisma.game.create({
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
      winningSide: "hme",
      scheduledTime: new Date("2024-11-01T09:30:00"),(ÄÄÄÅÙ∞(ÄÅÙ§Ï((ÄÅçΩπÕ–ÅùÖµî‘ÄÙÅÖ›Ö•–Å¡…•ÕµÑπùÖµîπç…ïÖ—î°Ï(ÄÄÄÅëÖ—ÑËÅÏ(ÄÄÄÄÄÅ—Ω’…πÖµïπ—%êËÅ≠Ω—âQΩ’…πÖµïπ–π•ê∞(ÄÄÄÄÄÅù…Ω’¡%êËÅù…Ω’¡π•ê∞(ÄÄÄÄÄÅ…Ω’πë%êËÅù…Ω’¡M—ÖùïIΩ’πêπ•ê∞(ÄÄÄÄÄÅçΩ’…—9’µâï»ËÄƒ∞(ÄÄÄÄÄÅ¡±ÖÂï»≈!Ωµï%êËÅç…ïÖ—ïë—°±ï—ïÕl—tπ•ê∞(ÄÄÄÄÄÅ¡±ÖÂï»…!Ωµï%êËÅç…ïÖ—ïë—°±ï—ïÕlŸtπ•ê∞(ÄÄÄÄÄÅ¡±ÖÂï»≈›ÖÂ%êËÅç…ïÖ—ïë—°±ï—ïÕl’tπ•ê∞(ÄÄÄÄÄÅ¡±ÖÂï»…›ÖÂ%êËÅç…ïÖ—ïë—°±ï—ïÕl›tπ•ê∞(ÄÄÄÄÄÅÕçΩ…ï!ΩµîËÄƒÿ∞(ÄÄÄÄÄÅÕçΩ…ï›Ö‰ËÄƒ‡∞(ÄÄÄÄÄÅÕ—Ö—’ÃËÄâçΩµ¡±ï—ïêà∞(ÄÄÄÄÄÅ›•π•πùM•ëîËÄâÖ›Ö‰à∞(ÄÄÄÄÄÅÕç°ïë’±ïëQ•µîËÅπï‹ÅÖ—î†à»¿»–¥ƒƒ¥¿≈Pƒ¿ËÃ¿Ë¿¿à§∞(ÄÄÄÅÙ∞(ÄÅÙ§Ï((ÄÅçΩπÕΩ±îπ±Ωú†â…ïÖ—ïêÅùÖµïÃÅôΩ»Åù…Ω’¿Åà§Ï((ÄÄººÅ…ïÖ—îÅÕïçΩπêÅ—Ω’…πÖµïπ–Ä¥Å	…Öç≠ï–ÅôΩ…µÖ–Ä°’¡çΩµ•πú§(ÄÅçΩπÕ–Åâ…Öç≠ï—QΩ’…πÖµïπ–ÄÙÅÖ›Ö•–Å¡…•ÕµÑπ—Ω’…πÖµïπ–πç…ïÖ—î°Ï(ÄÄÄÅëÖ—ÑËÅÏ(ÄÄÄÄÄÅπÖµîËÄâI•ºÅëîÅ)Öπï•…ºÅ=¡ï∏ÅΩΩ—ŸΩ±±ï‰Ä»¿»‘à∞(ÄÄÄÄÄÅëïÕç…•¡—•Ω∏ËÄâ=¡ï∏Åâ…Öç≠ï–Å—Ω’…πÖµïπ–ÅôΩ»ÅÖ±∞ÅÕ≠•±∞Å±ïŸï±Ãà∞(ÄÄÄÄÄÅëÖ—îËÅπï‹ÅÖ—î†à»¿»‘¥¿Ã¥ƒ‘à§∞(ÄÄÄÄÄÅïπëÖ—îËÅπï‹ÅÖ—î†à»¿»‘¥¿Ã¥ƒÿà§∞(ÄÄÄÄÄÅ±ΩçÖ—•Ω∏ËÄâA…Ö•ÑÅëºÅΩ¡ÖçÖâÖπÑ∞ÅI•ºÅëîÅ)Öπï•…ºà∞(ÄÄÄÄÄÅç•—‰ËÄâI•ºÅëîÅ)Öπï•…ºà∞(ÄÄÄÄÄÅÕ—Ö—îËÄâI(à∞(ÄÄÄÄÄÅçΩ’π—…‰ËÄâ	…ÖÈ•∞à∞(ÄÄÄÄÄÅôΩ…µÖ–ËÄââ…Öç≠ï–à∞(ÄÄÄÄÄÅÕ—Ö—’ÃËÄâ…ïù•Õ—…Ö—•Ω∏à∞(ÄÄÄÄÄÅµÖ·A±ÖÂï…ÃËÄÃ»∞(ÄÄÄÄÄÅπ’µΩ’…—ÃËÄ–∞(ÄÄÄÄÄÅπ’µÖÂÃËÄ»∞(ÄÄÄÄÄÅ°Ω’…ÕAï…Ö‰ËÄƒ¿∞(ÄÄÄÄÄÅÖŸùÖµï5•π’—ïÃËÄ»‘∞(ÄÄÄÄÄÅ¡Ω•π—ÕAï…Mï–ËÄ»ƒ∞(ÄÄÄÄÄÅπ’µMï—ÃËÄÃ∞(ÄÄÄÄÄÅù…Ω’¡M•ÈîËÄ»∞(ÄÄÄÄÄÅΩ…ùÖπ•Èï…%êËÅΩ…ùÖπ•Èï…UÕï»π•ê∞(ÄÄÄÅÙ∞(ÄÅÙ§Ï((ÄÅçΩπÕΩ±îπ±Ωú†â…ïÖ—ïêÅÕïçΩπêÅ—Ω’…πÖµïπ–Ä°	…Öç≠ï–§Ëà∞Åâ…Öç≠ï—QΩ’…πÖµïπ–π•ê§Ï((ÄÄººÅ…ïÖ—îÅ…Ω’πëÃÅôΩ»Åâ…Öç≠ï–Å—Ω’…πÖµïπ–(ÄÅçΩπÕ–Å≈’Ö±•ô•ï…ÕIΩ’πêÄÙÅÖ›Ö•–Å¡…•ÕµÑπ…Ω’πêπç…ïÖ—î°Ï(ÄÄÄÅëÖ—ÑËÅÏ(ÄÄÄÄÄÅπÖµîËÄâE’Ö±•ô•ï…Ãà∞(ÄÄÄÄÄÅ…Ω’πë9’µâï»ËÄƒ∞(ÄÄÄÄÄÅ—Ω’…πÖµïπ—%êËÅâ…Öç≠ï—QΩ’…πÖµïπ–π•ê∞(ÄÄÄÄÄÅ—Â¡îËÄâ≠πΩç≠Ω’–à∞(ÄÄÄÅÙ∞(ÄÅÙ§Ï((ÄÅçΩπÕ–Å≈’Ö…—ï…ô•πÖ±IΩ’πêÄÙÅÖ›Ö•–Å¡…•ÕµÑπ…Ω’πêπç…ïÖ—î°Ï(ÄÄÄÅëÖ—ÑËÅÏ(ÄÄÄÄÄÅπÖµîËÄâE’Ö…—ï»Å•πÖ±Ãà∞(ÄÄÄÄÄÅ…Ω’πë9’µâï»ËÄ»∞(ÄÄÄÄÄÅ—Ω’…πÖµïπ—%êËÅâ…Öç≠ï—QΩ’…πÖµïπ–π•ê∞(ÄÄÄÄÄÅ—Â¡îËÄâ≠πΩç≠Ω’–à∞(ÄÄÄÅÙ∞(ÄÅÙ§Ï((ÄÅçΩπÕ–ÅÕïµ•ô•πÖ±IΩ’πêÄÙÅÖ›Ö•–Å¡…•ÕµÑπ…Ω’πêπç…ïÖ—î°Ï(ÄÄÄÅëÖ—ÑËÅÏ(ÄÄÄÄÄÅπÖµîËÄâMïµ§Å•πÖ±Ãà∞(ÄÄÄÄÄÅ…Ω’πë9’µâï»ËÄÃ∞(ÄÄÄÄÄÅ—Ω’…πÖµïπ—%êËÅâ…Öç≠ï—QΩ’…πÖµïπ–π•ê∞(ÄÄÄÄÄÅ—Â¡îËÄâ≠πΩç≠Ω’–à∞(ÄÄÄÅÙ∞(ÄÅÙ§Ï((ÄÅçΩπÕ–Åô•πÖ±IΩ’πêÄÙÅÖ›Ö•–Å¡…•ÕµÑπ…Ω’πêπç…ïÖ—î°Ï(ÄÄÄÅëÖ—ÑËÅÏ(ÄÄÄÄÄÅπÖµîËÄâ•πÖ∞à∞(ÄÄÄÄÄÅ…Ω’πë9’µâï»ËÄ–∞(ÄÄÄÄÄÅ—Ω’…πÖµïπ—%êËÅâ…Öç≠ï—QΩ’…πÖµïπ–π•ê∞(ÄÄÄÄÄÅ—Â¡îËÄâ≠πΩç≠Ω’–à∞(ÄÄÄÅÙ∞(ÄÅÙ§Ï((ÄÅçΩπÕΩ±îπ±Ωú†â…ïÖ—ïêÄ–Å…Ω’πëÃÅôΩ»Åâ…Öç≠ï–Å—Ω’…πÖµïπ–à§Ï((ÄÄººÅëêÅ¡±ÖÂï…ÃÄƒÿ¥Ã‘Å—ºÅâ…Öç≠ï–Å—Ω’…πÖµïπ–Ä†»¿Å¡±ÖÂï…ÃÅôΩ»Åâ…Öç≠ï–ÅôΩ…µÖ–§(ÄÅôΩ»Ä°±ï–Å§ÄÙÄƒÿÏÅ§ÄÄÃÿÏÅ§¨¨§ÅÏ(ÄÄÄÅ•òÄ°§ÄÅç…ïÖ—ïë—°±ï—ïÃπ±ïπù—†§ÅÏ(ÄÄÄÄÄÅÖ›Ö•–Å¡…•ÕµÑπ—Ω’…πÖµïπ—A±ÖÂï»πç…ïÖ—î°Ï(ÄÄÄÄÄÄÄÅëÖ—ÑËÅÏ(ÄÄÄÄÄÄÄÄÄÅ—Ω’…πÖµïπ—%êËÅâ…Öç≠ï—QΩ’…πÖµïπ–π•ê∞(ÄÄÄÄÄÄÄÄÄÅ’Õï…%êËÅç…ïÖ—ïë—°±ï—ïÕm•tπ•ê∞(ÄÄÄÄÄÄÄÄÄÅÕïïêËÅ§Ä¥Äƒ‘∞(ÄÄÄÄÄÄÄÄÄÅÕ—Ö—’ÃËÄâ…ïù•Õ—ï…ïêà∞(ÄÄÄÄÄÄÄÅÙ∞(ÄÄÄÄÄÅÙ§Ï(ÄÄÄÅÙ(ÄÅÙ((ÄÅçΩπÕΩ±îπ±Ωú†âëëïêÄ»¿Å¡±ÖÂï…ÃÅ—ºÅâ…Öç≠ï–Å—Ω’…πÖµïπ–à§Ï((ÄÄººÅ…ïÖ—îÅ≈’Ö±•ô•ï»Å…Ω’πêÅùÖµïÃ(ÄÅçΩπÕ–Å≈’Ö±ÖµîƒÄÙÅÖ›Ö•–Å¡…•ÕµÑπùÖµîπç…ïÖ—î°Ï(ÄÄÄÅëÖ—ÑËÅÏ(ÄÄÄÄÄÅ—Ω’…πÖµïπ—%êËÅâ…Öç≠ï—QΩ’…πÖµïπ–π•ê∞(ÄÄÄÄÄÅ…Ω’πë%êËÅ≈’Ö±•ô•ï…ÕIΩ’πêπ•ê∞(ÄÄÄÄÄÅçΩ’…—9’µâï»ËÄƒ∞(ÄÄÄÄÄÅ¡±ÖÂï»≈!Ωµï%êËÅç…ïÖ—ïë—°±ï—ïÕlƒŸtπ•ê∞(ÄÄÄÄÄÅ¡±ÖÂï»…!Ωµï%êËÅç…ïÖ—ïë—°±ï—ïÕlƒ›tπ•ê∞(ÄÄÄÄÄÅ¡±ÖÂï»≈›ÖÂ%êËÅç…ïÖ—ïë—°±ï—ïÕlƒ·tπ•ê∞(ÄÄÄÄÄÅ¡±ÖÂï»…›ÖÂ%êËÅç…ïÖ—ïë—°±ï—ïÕlƒÂtπ•ê∞(ÄÄÄÄÄÅÕ—Ö—’ÃËÄâÕç°ïë’±ïêà∞(ÄÄÄÄÄÅÕç°ïë’±ïëQ•µîËÅπï‹ÅÖ—î†à»¿»‘¥¿Ã¥ƒ’P¿‡Ë¿¿Ë¿¿à§∞(ÄÄÄÅÙ∞(ÄÅÙ§Ï((ÄÅçΩπÕ–Å≈’Ö±Öµî»ÄÙÅÖ›Ö•–Å¡…•ÕµÑπùÖµîπç…ïÖ—î°Ï(ÄÄÄÅëÖ—ÑËÅÏ(ÄÄÄÄÄÅ—Ω’…πÖµïπ—%êËÅâ…Öç≠ï—QΩ’…πÖµïπ–π•ê∞(ÄÄÄÄÄÅ…Ω’πë%êËÅ≈’Ö±•ô•ï…ÕIΩ’πêπ•ê∞(ÄÄÄÄÄÅçΩ’…—9’µâï»ËÄ»∞(ÄÄÄÄÄÅ¡±ÖÂï»≈!Ωµï%êËÅç…ïÖ—ïë—°±ï—ïÕl»¡tπ•ê∞(ÄÄÄÄÄÅ¡±ÖÂï»…!Ωµï%êËÅç…ïÖ—ïë—°±ï—ïÕl»≈tπ•ê∞(ÄÄÄÄÄÅ¡±ÖÂï»≈›ÖÂ%êËÅç…ïÖ—ïë—°±ï—ïÕl»…tπ•ê∞(ÄÄÄÄÄÅ¡±ÖÂï»…›ÖÂ%êËÅç…ïÖ—ïë—°±ï—ïÕl»Õtπ•ê∞(ÄÄÄÄÄÅÕ—Ö—’ÃËÄâÕç°ïë’±ïêà∞(ÄÄÄÄÄÅÕç°ïë’±ïëQ•µîËÅπï‹ÅÖ—î†à»¿»‘¥¿Ã¥ƒ’P¿‡ËÃ¿Ë¿¿à§∞(ÄÄÄÅÙ∞(ÄÅÙ§Ï((ÄÅçΩπÕ–Å≈’Ö±ÖµîÃÄÙÅÖ›Ö•–Å¡…•ÕµÑπùÖµîπç…ïÖ—î°Ï(ÄÄÄÅëÖ—ÑËÅÏ(ÄÄÄÄÄÅ—Ω’…πÖµïπ—%êËÅâ…Öç≠ï—QΩ’…πÖµïπ–π•ê∞(ÄÄÄÄÄÅ…Ω’πë%êËÅ≈’Ö±•ô•ï…ÕIΩ’πêπ•ê∞(ÄÄÄÄÄÅçΩ’…—9’µâï»ËÄÃ∞(ÄÄÄÄÄÅ¡±ÖÂï»≈!Ωµï%êËÅç…ïÖ—ïë—°±ï—ïÕl»—tπ•ê∞(ÄÄÄÄÄÅ¡±ÖÂï»…!Ωµï%êËÅç…ïÖ—ïë—°±ï—ïÕl»’tπ•ê∞(ÄÄÄÄÄÅ¡±ÖÂï»≈›ÖÂ%êËÅç…ïÖ—ïë—°±ï—ïÕl»Ÿtπ•ê∞(ÄÄÄÄÄÅ¡±ÖÂï»…›ÖÂ%êËÅç…ïÖ—ïë—°±ï—ïÕl»›tπ•ê∞(ÄÄÄÄÄÅÕ—Ö—’ÃËÄâÕç°ïë’±ïêà∞(ÄÄÄÄÄÅÕç°ïë’±ïëQ•µîËÅπï‹ÅÖ—î†à»¿»‘¥¿Ã¥ƒ’P¿‰Ë¿¿Ë¿¿à§∞¢“¿¢“ì∞†¢6ˆÁ7BVƒv÷SB“vóB&ó6÷Êv÷RÊ7&VFRá∞¢FF¢∞¢F˜W&Ê÷VÁDñC¢'&6∂WEF˜W&Ê÷VÁBÊñB¿¢&˜VÊDñC¢V∆ñfñW'5&˜VÊBÊñB¿¢6˜W'DÁV÷&W#¢B¿¢∆ñW#Üˆ÷TñC¢7&VFVDFÜ∆WFW5≥#Ö“ÊñB¿¢∆ñW#$Üˆ÷TñC¢7&VFVDFÜ∆WFW5≥#ï“ÊñB¿¢∆ñW#vîñC¢7&VFVDFÜ∆WFW5≥3“ÊñB¿¢∆ñW#$vîñC¢7&VFVDFÜ∆WFW5≥3“ÊñB¿¢7FGW3¢'66ÜVGV∆VB"¿¢66ÜVGV∆VEFñ÷S¢ÊWrFFRÇ###R”2”UCì£3£"í¬àKàJN¬Çà€€ú€€KõŸ ê‹ôX]Y]X[YöY\àõ›[ôÿ[Y\»äN¬Çà€€ú€€KõŸ óë]Xò\ŸHŸYY€€\]Y›XÿŸ\‹Ÿù[HJKà€€ú€€KõŸ óî›[[X\ûNöJN¬à€€ú€€KõŸ HHYZ[à\Ÿ\à‹ôX]Y
YZ[êõ€›õ€^Kò€€JX
N¬à€€ú€€KõŸ HH‹ôÿ[ö^ô\à\Ÿ\à‹ôX]Y
‹ôÿ[ö^ô\êõ€›õ€^Kò€€JX
N¬à€€ú€€KõŸ H	ÿ‹ôX]Y]]\Àõ[ô›H]]H\Ÿ\ú»‹ôX]Y
N¬à€€ú€€KõŸ Hà›\õò[Y[ù»‹ôX]Yò
N¬à€€ú€€KõŸ H⁄[ô»ŸàHôXX⁄
€€\]YMà^Y\ú»[à‹õ›\ÀHÿ[Y\ X
N¬à€€ú€€KõŸ HúòX⁄Ÿ]›\õò[Y[ù
ôY⁄\›ò][€ãå^Y\úÀÿ[Y\»ÿ⁄Y[Y
X
N¬üBÇõXZ[ä
Bàù[ä\ﬁ[ò»

HOà¬à]ÿZ]ö\€XKâ\ÿ€€õôX›

N¬àJBàòÿ]⁄
\ﬁ[ò»
JHOà¬à€€ú€€Kô\úõ‹äJN¬à]ÿZ]ö\€XKâ\ÿ€€õôX›

N¬àõÿŸ\‹Àô^]
JN¬àJN