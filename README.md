# OneFTV - Tournament Management Platform

A comprehensive, full-stack web application for organizing and managing footvolley tournaments worldwide. Built with Next.js 14, TypeScript, Prisma, and Tailwind CSS.

## Features

### Tournament Formats
- **King of the Beach (KotB)**: Rotating partner format where every player pairs with every other player. Individual standings determine rankings.
- **Single Elimination Bracket**: Traditional knockout tournament with seeded brackets.
- **Group + Knockout**: Group stage followed by elimination rounds for top finishers.
- **Round Robin**: Every team plays against every other team.

### Core Functionality
- **User Authentication**: Secure login/registration with NextAuth.js (credentials provider)
- **Tournament Creation**: Configure format, courts, days, hours, game duration, max players
- **Smart Scheduling**: Automatic schedule generation optimized for court availability
- **Live Score Tracking**: Enter and update game scores in real-time
- **Global Rankings**: Player rankings aggregated across all tournaments
- **Player Profiles**: Individual stats, tournament history, performance charts
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Scheduling Engine
The smart scheduling engine calculates maximum possible games based on:
- Number of courts available
- Number of tournament days
- Hours available per day
- Average game duration (default: 20 minutes)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom footvolley branding
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM with MySQL
- **Authentication**: NextAuth.js with JWT strategy
- **Charts**: Recharts for performance visualization
- **Validation**: Zod schema validation

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/OneFTV/oneftv-app.git
cd oneftv-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and set your NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
```

4. Initialize the database:
```bash
npx prisma db push
```

5. Seed the database with sample data:
```bash
npx prisma db seed
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Login Credentials
- **Admin**: admin@footvolley.com / admin123
- **Athletes**: [name]@email.com / player123

## Project Structure

```
oneftv-app/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data (39 athletes, sample tournaments)
├── src/
│   ├── app/
│   │   ├── api/            # API routes
│   │   │   ├── auth/       # Authentication endpoints
│   │   │   ├── tournaments/ # Tournament CRUD + generation
│   │   │   ├── athletes/   # Athlete listing and profiles
│   │   │   ├── games/      # Game score management
│   │   │   └── rankings/   # Global rankings
│   │   ├── dashboard/      # User dashboard
│   │   ├── tournaments/    # Tournament pages (list, create, detail, manage)
│   │   ├── athletes/       # Athlete pages (list, profile, create)
│   │   ├── rankings/       # Rankings page
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration page
│   │   └── profile/        # User profile
│   ├── components/
│   │   └── layout/         # Navbar, Footer
│   ├── lib/
│   │   ├── auth.ts         # NextAuth configuration
│   │   ├── db.ts           # Prisma client singleton
│   │   ├── scheduling.ts   # Tournament scheduling engine
│   │   └── kotb.ts         # King of the Beach logic
│   └── types/
│       └── index.ts        # TypeScript types and interfaces
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Deployment on EC2

1. SSH into your EC2 instance
2. Install Node.js 18+:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. Install MySQL:
```bash
sudo apt-get install -y mysql-server
sudo mysql -e "CREATE!DATABASE oneftv;"
```

4. Clone and set up:
```bash
git clone https://github.com/OneFTV/oneftv-app.git
cd oneftv-app
npm install
cp .env.example .env
# Edit .env with production values and MySQL connection string
npx prisma db push
npx prisma db seed
npm run build
```

5. Start with PM2 (recommended):
```bash
sudo npm install -g pm2
pm2 start npm --name "oneftv" -- start
pm2 startup
pm2 save
```

6. Set up Nginx reverse proxy (optional but recommended):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## MySQL Setup

The application uses MySQL as the database. To set up MySQL:

1. Install MySQL on your system (if not already installed):
```bash
sudo apt-get install -y mysql-server
```

2. Create a new database:
```bash
sudo mysql -e "CREATE DATABASE oneftv;"
```

3. Update `.env` with your MySQL connection string:
```
DATABASE_URL="mysql://root:password@localhost:3306/oneftv"
```

4. Run migrations:
```bash
npx prisma db push
npx prisma db seed
```

## Inspired By

- [National Footvolley Association (NFA)](https://www.footvolleyusa.com/)
- King of the Beach tournament format
- Footvolley communities worldwide

## License

MIT
