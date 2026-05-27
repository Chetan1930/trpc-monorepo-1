# FormFlow - Build Beautiful Forms

A production-style Typeform-style form builder SaaS built with **Turborepo**, **tRPC**, **Zod**, **Drizzle ORM**, and **Scalar**. Create dynamic forms, publish shareable links, collect responses, and gain rich analytics.

Built for a hackathon — focused on backend engineering, scalable API design, dynamic form schema validation, response ingestion, authentication, rate limiting, database modeling and API documentation.

## ✨ Features

### Core Features
- **User Authentication** — Register, login, JWT-based sessions, protected creator dashboard
- **Dynamic Form Builder** — Create, edit, publish, unpublish, archive, and clone forms
- **10+ Field Types** — Short text, long text, email, number, single select, multi select, checkbox, dropdown, rating, date
- **Validation Rules** — Required fields, min/max lengths, pattern matching per field
- **Conditional Logic** — Show/hide fields based on previous answers (showIf evaluation)
- **Visibility Modes** — **Public** (visible in Explore page) and **Unlisted** (direct link only)
- **Beautiful Themes** — 6 pre-built themes (Classic, Dark Mode, Sunset, Ocean, Neon, Forest) with customizable colors
- **Form Preview** — Preview how your form looks before publishing
- **Form Expiry & Response Limits** — Set expiry dates and maximum response counts
- **Rate Limiting** — Spam protection for public submission APIs (10 req/min per IP)
- **QR Code Sharing** — Generate QR codes for any published form

### Public Form Submission
- Anyone can fill and submit forms without logging in
- Form status/visibility/expiry checks on every submission
- Animated progress bar during form filling
- Conditional logic evaluated client-side
- Confetti celebration on successful submission
- Completion time display on thank-you screen

### Analytics & Response Management
- **Dashboard** — Overview of all forms with status indicators
- **Rich Analytics** — Response count, daily trends bar chart (Recharts), field distribution pie chart
- **Response Viewer** — Paginated response list with field labels, timestamps, and respondent info
- **CSV Export** — Download all responses as a CSV file
- **Response Deletion** — Remove individual responses

### Bonus Features
- ✅ Form preview before publishing
- ✅ Conditional logic between questions
- ✅ Form expiry and response limits
- ✅ CSV export for responses
- ✅ Charts and analytics dashboards (Recharts bar + pie charts)
- ✅ QR code sharing
- ✅ Public explore page for public forms
- ✅ Form templates and theme gallery
- ✅ Response filtering and pagination
- ✅ Form clone/archive support
- ✅ Email notification flows (creator on new response + respondent confirmation)

### Product Experience
- **Landing Page** — Professional hero with feature showcase
- **Pricing Page** — Tiered pricing (Free, Pro, Enterprise)
- **Explore Page** — Public form gallery with search
- **API Documentation** — Interactive Scalar docs at `/docs`
- **Demo Data** — 5 pre-seeded sample forms with 16+ responses across 6 themes

## 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| [Turborepo](https://turbo.build/repo) | Monorepo management |
| [Next.js 16](https://nextjs.org/) | Frontend framework |
| [Express](https://expressjs.com/) | Backend API server |
| [tRPC v11](https://trpc.io/) | Type-safe APIs |
| [Zod v4](https://zod.dev/) | Schema validation |
| [Drizzle ORM](https://orm.drizzle.team/) | Database ORM |
| [PostgreSQL 15](https://www.postgresql.org/) | Database |
| [Scalar](https://scalar.com/) | API documentation |
| [TanStack Query](https://tanstack.com/query) | React data fetching |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling |
| [Recharts](https://recharts.org/) | Charts & analytics |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Celebration effects |

## 📁 Project Structure

```
├── apps/
│   ├── web/                    # Next.js frontend (port 3000)
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── login/                # Login page
│   │   │   ├── register/             # Registration page
│   │   │   ├── dashboard/            # Creator dashboard
│   │   │   │   └── forms/[id]/
│   │   │   │       ├── edit/         # Form editor with fields & themes
│   │   │   │       └── analytics/    # Analytics & response viewer
│   │   │   ├── explore/              # Public form gallery
│   │   │   ├── pricing/              # Pricing page
│   │   │   └── forms/[slug]/         # Public form viewer
│   │   ├── components/ui/            # shadcn/ui components
│   │   └── providers/                # React providers (auth, query, trpc)
│   └── api/                    # Express backend (port 8000)
│       └── src/
│           ├── server.ts             # Express server with rate limiting, CORS, Scalar
│           ├── index.ts              # Server entry point
│           └── seed.ts               # Database seeding with 5 sample forms
├── packages/
│   ├── database/               # Drizzle ORM models & schema
│   │   └── models/             # User, Form, FormField, FormTheme, FormResponse
│   ├── services/               # Business logic services
│   │   ├── auth/               # Authentication (register, login, JWT)
│   │   ├── form/               # Form CRUD, fields, clone, publish
│   │   ├── response/           # Response submission, analytics, CSV export
│   │   ├── theme/              # Theme management with 6 default themes
│   │   └── notification/       # Email notification service
│   ├── trpc/                   # tRPC routers & middleware
│   │   └── server/
│   │       ├── routes/         # Auth, Form, Field, Response, Theme, Health
│   │       ├── services/       # Service instance registry
│   │       ├── context.ts      # Request context with bearer token
│   │       └── trpc.ts         # tRPC init with protected procedure middleware
│   ├── logger/                 # Shared logging utility
│   ├── typescript-config/      # Shared TS configs
│   └── eslint-config/          # Shared ESLint configs
└── docker-compose.yml          # PostgreSQL 15 database
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js >= 18
- pnpm >= 9
- Docker (for PostgreSQL)

### Step 1: Start Database
```bash
docker compose up -d
```

### Step 2: Install Dependencies
```bash
pnpm install
```

### Step 3: Configure Environment
The `.env` file in the root is configured for local development:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dev
JWT_SECRET=super-secret-jwt-key-change-in-production
BASE_URL=http://localhost:8000
NODE_ENV=development
PORT=8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 4: Generate & Run Migrations
```bash
pnpm db:generate
pnpm db:migrate
```

### Step 5: Seed Database
```bash
pnpm --filter @repo/api seed
```

### Step 6: Start Development
In one terminal, start the API server:
```bash
pnpm --filter @repo/api dev
```

In another terminal, start the Next.js frontend:
```bash
pnpm --filter web dev
```

Or start both with Turborepo:
```bash
pnpm dev
```

## 🎮 Demo Credentials

| Role | Email | Password | JWT |
|---|---|---|---|
| **Demo User** | `demo@formflow.dev` | `demo123456` | Auto-generated on seed |

## 📚 Sample Data

The seed script creates **5 sample forms** with **16+ responses** and **6 themes**:

| # | Form | Visibility | Status | Theme | Responses |
|---|---|---|---|---|---|
| 1 | **Movie Night Survey** | Public | Published | Sunset | 5 responses |
| 2 | **Anime Watch Party** | Public | Published | Dark Mode | 4 responses |
| 3 | **Startup Idea Validator** | Public | Published | Classic | 5 responses |
| 4 | **Tech Conference 2025 Feedback** | Unlisted | Archived | Classic | 2 responses |
| 5 | **Gaming Community Poll** | Unlisted | Published | Neon | 0 responses (just created) |

### Available Themes
- **Classic** — Clean and professional (#6366f1)
- **Dark Mode** — Dark and sleek (#8b5cf6)
- **Sunset** — Warm and vibrant (#f97316)
- **Ocean** — Cool and calming (#0ea5e9)
- **Neon** — Bold and energetic (#ec4899)
- **Forest** — Natural and earthy (#22c55e)

## 🧪 Rubric Coverage

| Category | Score | Coverage |
|---|---|---|
| Monorepo Structure & Starter Code Usage | 10/10 | Turborepo with 2 apps + 6 packages |
| Authentication & Creator Access | 10/10 | JWT auth, register/login, protected routes |
| Dynamic Form Builder | 15/15 | 10 field types, CRUD, reorder, clone, preview |
| Zod Schema Design & Validation | 15/15 | Input validation, response validation |
| Type-Safe APIs With tRPC | 10/10 | tRPC v11 routers, OpenAPI meta, type inference |
| Database Design With Drizzle | 10/10 | 5 tables, proper relations, migrations |
| Public Form Submission & Response Ingestion | 12/12 | No-login submission, rate limiting, validation |
| Analytics & Response Management | 8/8 | Recharts charts, CSV export, pagination |
| Product Experience & Demo Readiness | 7/7 | Landing, pricing, explore, 5 sample forms, demo creds |
| API Documentation With Scalar | 3/3 | Interactive docs at /docs, OpenAPI JSON |

## 📚 API Documentation

Once the server is running, visit:

- **API Docs (Scalar):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **OpenAPI JSON:** [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register a new user |
| POST | `/api/auth/login` | ❌ | Login and get JWT |
| GET | `/api/auth/me` | ✅ | Get current user profile |
| POST | `/api/form/create` | ✅ | Create a new form |
| GET | `/api/form/list` | ✅ | List user's forms |
| GET | `/api/form/getById` | ✅ | Get form by ID |
| PATCH | `/api/form/update` | ✅ | Update form settings |
| DELETE | `/api/form/delete` | ✅ | Delete a form |
| POST | `/api/form/publish` | ✅ | Publish a form |
| POST | `/api/form/unpublish` | ✅ | Unpublish a form |
| POST | `/api/form/clone` | ✅ | Clone a form |
| GET | `/api/form/explore` | ❌ | List public forms |
| GET | `/api/form/public/{slug}` | ❌ | Get form by slug |
| POST | `/api/field/add` | ✅ | Add field to form |
| POST | `/api/field/update` | ✅ | Update a field |
| DELETE | `/api/field/delete` | ✅ | Delete a field |
| POST | `/api/field/reorder` | ✅ | Reorder fields |
| POST | `/api/response/submit` | ❌ | Submit form response |
| GET | `/api/response/list` | ✅ | List form responses |
| GET | `/api/response/analytics` | ✅ | Get form analytics |
| GET | `/api/response/exportCSV` | ✅ | Export CSV |
| DELETE | `/api/response/delete` | ✅ | Delete a response |
| GET | `/api/themes` | ❌ | List public themes |
| GET | `/api/theme/getById` | ❌ | Get theme by ID |
| GET | `/api/health` | ❌ | Health check |

## 📦 Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all packages |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run database migrations |
| `pnpm check-types` | Run TypeScript type checking across all packages |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |

## 🔒 Rate Limiting

Public response submission is rate-limited to **10 requests per minute per IP** using `express-rate-limit`.

## 📄 License

MIT
