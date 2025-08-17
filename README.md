# Whiteboard Canvas App

A collaborative whiteboard drawing application built with Next.js 15, featuring real-time drawing capabilities, draft/publish workflow, and collaborative commenting system.

## ✨ Features

- **Interactive Drawing Canvas**: Create drawings with various tools and colors
- **Draft & Publish System**: Save drawings as drafts or publish them for sharing
- **Collaborative Sharing**: Share published drawings with other users
- **Real-time Comments**: Add and view multiple comments on whiteboards
- **User Authentication**: Secure authentication with Clerk
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Database**: [Neon PostgreSQL](https://neon.tech/) (Serverless)
- **ORM**: [Prisma](https://www.prisma.io/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- A Clerk account for authentication
- A Neon PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd whiteboard-canvas-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory and add the following variables:

   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

   # Database
   DATABASE_URL=your_neon_database_url

   # Next.js
   NEXTAUTH_URL=http://localhost:3000

   # Clerk Redirects
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/whiteboards
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/whiteboards
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/whiteboards
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/whiteboards
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 🗂️ Project Structure

```
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication routes
│   ├── whiteboards/       # Whiteboard pages
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Reusable React components
│   ├── ui/               # UI components
│   └── whiteboard/       # Whiteboard-specific components
├── lib/                   # Utility functions and configurations
│   ├── prisma.ts         # Prisma client setup
│   └── utils.ts          # Helper utilities
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Prisma schema
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## 🎨 Key Features Explained

### Drawing Canvas
- Interactive HTML5 Canvas for drawing
- Multiple drawing tools (pen, eraser, shapes)
- Color picker and brush size options
- Undo/Redo functionality

### Draft & Publish System
- **Drafts**: Private drawings visible only to the creator
- **Published**: Public drawings that can be shared with others
- Easy toggle between draft and published states

### Collaborative Comments
- Add comments to specific areas of the whiteboard
- Real-time comment updates
- User avatars and timestamps
- Reply to existing comments

### Authentication & Authorization
- Secure user authentication with Clerk
- Protected routes for authenticated users
- User profile management
- Session handling

## 🔧 Configuration

### Clerk Setup
1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Copy your publishable key and secret key
3. Configure redirect URLs in your Clerk dashboard
4. Set up webhooks for user synchronization

### Database Setup
1. Create a Neon PostgreSQL database
2. Copy the connection string
3. Configure Prisma schema as needed
4. Run migrations

## 📱 API Routes

- `POST /api/whiteboards` - Create a new whiteboard
- `GET /api/whiteboards` - Get user's whiteboards
- `PUT /api/whiteboards/[id]` - Update whiteboard
- `DELETE /api/whiteboards/[id]` - Delete whiteboard
- `POST /api/comments` - Add comment to whiteboard
- `GET /api/comments/[whiteboardId]` - Get whiteboard comments

## 🚀 Deployment

### Vercel (Recommended)

1. **Deploy to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Configure Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Ensure production URLs are updated

3. **Update Clerk Configuration**
   - Update redirect URLs to use your production domain
   - Update webhook endpoints

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify


## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Clerk for seamless authentication
- Neon for serverless PostgreSQL
- Prisma for the excellent ORM
- Tailwind CSS for styling utilities

## 📞 Support

If you have any questions or need help with setup, please:
- Open an issue on GitHub
- Check the [documentation](docs/)
- Contact the maintainers

---

**Happy Drawing! 🎨**