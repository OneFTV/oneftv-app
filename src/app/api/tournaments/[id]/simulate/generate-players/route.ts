import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import bcryptjs from 'bcryptjs'
import { detectConflicts } from '@/lib/multiCategoryScheduler'
import { SchedulingService } from '@/modules/scheduling/scheduling.service'

const MALE_NAMES = [
  'Rafael Silva', 'Bruno Costa', 'Lucas Oliveira', 'Thiago Santos', 'Felipe Almeida',
  'Gustavo Pereira', 'Matheus Ribeiro', 'Pedro Henrique', 'André Souza', 'Diego Ferreira',
  'Rodrigo Lima', 'Marcelo Dias', 'Caio Martins', 'Vinícius Rocha', 'Leonardo Gomes',
  'Gabriel Nascimento', 'Fernando Cardoso', 'Daniel Barros', 'Eduardo Melo', 'Carlos Freitas',
  'Mike Johnson', 'Chris Williams', 'Jake Thompson', 'Ryan Davis', 'Brandon Miller',
  'Tyler Wilson', 'Austin Moore', 'Dylan Taylor', 'Kyle Anderson', 'Josh Martinez',
  'Renato Moreira', 'Julio Campos', 'Fabio Correia', 'Marcos Teixeira', 'Alex Monteiro',
  'Hugo Batista', 'Patrick Lopes', 'Enzo Carvalho', 'Davi Pinto', 'Samuel Araújo',
]

const FEMALE_NAMES = [
  'Ana Carolina', 'Juliana Costa', 'Camila Rodrigues', 'Fernanda Lima', 'Mariana Santos',
  'Beatriz Almeida', 'Isabela Ferreira', 'Larissa Oliveira', 'Gabriela Silva', 'Amanda Souza',
  'Sarah Johnson', 'Jessica Williams', 'Ashley Davis', 'Emily Thompson', 'Nicole Miller',
  'Patrícia Dias', 'Carla Ribeiro', 'Vanessa Martins', 'Tatiana Rocha', 'Bianca Pereira',
]

async function getOrCreateUser(name: string, gender: 'male' | 'female'): Promise<string> {
  const email = `sim_${name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}@simulation.test`
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return existing.id

  const id = uuidv4()
  const hashedPassword = await bcryptjs.hash('simulation123', 10)
  await prisma.user.create({
    data: {
      id,
      name,
      email,
      password: hashedPassword,
      role: 'user',
      updatedAt: new Date(),
    },
  })
  return id
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        Category: { include: { _count: { select: { TournamentPlayer: true } } } },
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const categories = tournament.Category
    const womensCats = categories.filter(c => c.gender === 'female' || c.name.toLowerCase().includes('women'))
    const coedCats = categories.filter(c => c.gender === 'coed' || c.name.toLowerCase().includes('coed') || c.name.toLowerCase().includes('mix'))
    const openCats = categories.filter(c =>
      (c.gender === 'male' || !c.gender) &&
      !c.name.toLowerCase().includes('women') &&
      !c.name.toLowerCase().includes('beginner') &&
      !c.name.toLowerCase().includes('coed') &&
      !c.name.toLowerCase().includes('mix')
    )
    const beginnerCats = categories.filter(c => c.name.toLowerCase().includes('beginner') || c.skillLevel === 'beginner')

    // If no gender-based split, treat all as open
    const allMaleCats = [...openCats, ...beginnerCats]
    const hasGenderSplit = womensCats.length > 0 || coedCats.length > 0

    let playersCreated = 0
    const usedMaleNames = [...MALE_NAMES].sort(() => Math.random() - 0.5)
    const usedFemaleNames = [...FEMALE_NAMES].sort(() => Math.random() - 0.5)
    let maleIdx = 0
    let femaleIdx = 0

    // Helper: register a player in a category
    async function registerPlayer(userId: string, categoryId: string) {
      const existing = await prisma.tournamentPlayer.findUnique({
        where: { tournamentId_userId_categoryId: { tournamentId: params.id, userId, categoryId } },
      })
      if (!existing) {
        await prisma.tournamentPlayer.create({
          data: {
            id: uuidv4(),
            tournamentId: params.id,
            userId,
            categoryId,
            status: 'registered',
          },
        })
        playersCreated++
      }
    }

    // Register women players: Women's + Coed
    if (hasGenderSplit) {
      for (const wCat of womensCats) {
        const needed = wCat.maxTeams * 2
        for (let i = 0; i < needed && femaleIdx < usedFemaleNames.length; i++) {
          const userId = await getOrCreateUser(usedFemaleNames[femaleIdx], 'female')
          await registerPlayer(userId, wCat.id)
          // Also register in coed
          for (const cc of coedCats) {
            await registerPlayer(userId, cc.id)
          }
          femaleIdx++
        }
      }

      // Fill remaining coed spots with males
      for (const cc of coedCats) {
        const currentCount = await prisma.tournamentPlayer.count({
          where: { tournamentId: params.id, categoryId: cc.id },
        })
        const needed = cc.maxTeams * 2 - currentCount
        for (let i = 0; i < needed && maleIdx < usedMaleNames.length; i++) {
          const userId = await getOrCreateUser(usedMaleNames[maleIdx], 'male')
          await registerPlayer(userId, cc.id)
          maleIdx++
        }
      }
    }

    // Register male players in Open and Beginners
    const maleCatsToFill = allMaleCats.length > 0 ? allMaleCats : categories.filter(c => !womensCats.includes(c) && !coedCats.includes(c))

    for (const cat of maleCatsToFill) {
      const currentCount = await prisma.tournamentPlayer.count({
        where: { tournamentId: params.id, categoryId: cat.id },
      })
      const needed = cat.maxTeams * 2 - currentCount
      const crossoverIds: string[] = []

      for (let i = 0; i < needed && maleIdx < usedMaleNames.length; i++) {
        const userId = await getOrCreateUser(usedMaleNames[maleIdx], 'male')
        await registerPlayer(userId, cat.id)
        // 1-2 beginner players also register in open (crossover)
        if (beginnerCats.includes(cat) && crossoverIds.length < 2 && openCats.length > 0) {
          crossoverIds.push(userId)
          await registerPlayer(userId, openCats[0].id)
        }
        maleIdx++
      }
    }

    // If no categories matched any filter, just fill all categories
    if (maleCatsToFill.length === 0 && !hasGenderSplit) {
      for (const cat of categories) {
        const needed = cat.maxTeams * 2
        for (let i = 0; i < needed && maleIdx < usedMaleNames.length; i++) {
          const userId = await getOrCreateUser(usedMaleNames[maleIdx], 'male')
          await registerPlayer(userId, cat.id)
          maleIdx++
        }
      }
    }

    // Auto-generate brackets/schedule for all categories
    try {
      await SchedulingService.generateSchedule(params.id, tournament.organizerId)
    } catch (scheduleError) {
      console.warn('Schedule generation warning:', scheduleError)
      // Don't fail the whole request if schedule generation has issues
    }

    // Update game scheduled times based on day assignments
    const categoriesWithDays = await prisma.category.findMany({
      where: { tournamentId: params.id },
      select: { id: true, scheduledDay: true, dayStartTime: true, dayEndTime: true },
    })

    for (const cat of categoriesWithDays) {
      if (cat.scheduledDay && cat.dayStartTime) {
        const dayNum = cat.scheduledDay
        const startTime = cat.dayStartTime || '09:00'
        const endTime = cat.dayEndTime || '18:00'

        // Parse hours/minutes
        const [startH, startM] = startTime.split(':').map(Number)
        const [endH, endM] = endTime.split(':').map(Number)
        const startMinutes = startH * 60 + startM
        const endMinutes = endH * 60 + endM

        // Get games for this category, update their scheduledTime
        const games = await prisma.game.findMany({
          where: { tournamentId: params.id, categoryId: cat.id },
          orderBy: { scheduledTime: 'asc' },
        })

        if (games.length > 0) {
          const slotDuration = games.length > 1
            ? Math.floor((endMinutes - startMinutes) / games.length)
            : endMinutes - startMinutes

          // Base date: tournament date + (dayNum - 1) days
          const baseDate = new Date(tournament.date)
          baseDate.setDate(baseDate.getDate() + dayNum - 1)

          for (let i = 0; i < games.length; i++) {
            const gameMinutes = startMinutes + i * slotDuration
            const gameDate = new Date(baseDate)
            gameDate.setHours(Math.floor(gameMinutes / 60), gameMinutes % 60, 0, 0)

            await prisma.game.update({
              where: { id: games[i].id },
              data: { scheduledTime: gameDate },
            })
          }
        }
      }
    }

    // Detect conflicts (requires scheduled games with time slots)
    const conflicts = await detectConflicts(params.id)

    return NextResponse.json({ playersCreated, conflicts })
  } catch (error) {
    console.error('Generate players error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate players'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
