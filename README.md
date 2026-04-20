# Primer

Primer is a specialized, mobile-responsive prompt management application designed for AI enthusiasts and developers. It provides a centralized hub to store, version, and organize prompts for various AI models like Claude, ChatGPT, and Gemini.

## Features

- **Prompt Management**: Create, edit, and organize prompts with ease.
- **Versioning**: Maintain different versions of prompts for different models or iterations.
- **Categories**: Organize prompts into customizable categories.
- **Search**: Quickly find prompts using a built-in search functionality.
- **Authentication**: Sign in with Google OAuth.
- **Responsive Design**: Optimized for both desktop and mobile use.
- **Command Palette**: Quick navigation and actions (`Cmd/Ctrl + K`).

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Neon](https://neon.tech/))
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/) with Google OAuth

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (e.g., Neon)
- A Google OAuth app ([Google Cloud Console](https://console.cloud.google.com))

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

3. Set up environment variables — create a `.env` file:
   ```bash
   DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
   AUTH_SECRET="your-secret-key"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. Push the schema to your database:
   ```bash
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## License

This project is open source and available under the [MIT License](LICENSE).
