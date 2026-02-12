# Primer 

Primer is a specialized, mobile-responsive prompt management application designed for AI enthusiasts and developers. It provides a centralized hub to store, version, and organize prompts for various AI models like Claude, ChatGPT, and Gemini.

## Features

- **Prompt Management**: Create, edit, and organize prompts with ease.
- **Versioning**: Maintain different versions of prompts for different models or iterations.
- **Categories**: Organize prompts into customizable categories.
- **Search**: Quickly find prompts using a built-in search functionality.
- **Authentication**: Secure access with user account management.
- **Responsive Design**: Optimized for both desktop and mobile use.
- **Command Palette**: Quick navigation and actions (`Cmd/Ctrl + K`).

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Neon](https://neon.tech/))
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/)

## Getting Started

### Prerequisites

- Node.js 20+ installed
- A PostgreSQL database (e.g., local or Neon)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd primer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` (or create one) to `.env` and add your database URL and auth secret.
   ```bash
   DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

This project is open source and available under the [MIT License](LICENSE).


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
