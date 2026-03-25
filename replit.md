# FriendGroup — Private Social App

A full-featured Instagram-like social app for friend groups. Users can join multiple groups via unique codes, share posts, chat, plan events, run polls, and more.

## Architecture

- **Frontend**: React + TypeScript + Vite, Tailwind CSS, shadcn/ui, TanStack Query, wouter (routing)
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Replit Auth (OAuth)

## Key Features

- **Groups**: Create or join groups with unique 8-char codes. Users can be in multiple groups.
- **Feed**: Posts with types — announcement, photo (image), video, story (ephemeral 24h)
- **Stories**: Horizontal carousel at top of feed (story-type posts)
- **Group Chat**: Real-time-style messaging with 3s polling, bubble UI
- **Events**: Schedule events with date/time/location
- **Polls**: Create polls with multiple options; vote with one vote per poll (auto-switches)
- **Members**: View all group members; admins can remove members
- **Admin Controls**: Group creator is auto-assigned admin role

## Project Structure

```
shared/
  schema.ts       — Drizzle schema + Zod schemas + types
  routes.ts       — API route definitions

server/
  index.ts        — Express server entry
  routes.ts       — API route handlers
  storage.ts      — Database access layer (IStorage interface)
  db.ts           — Drizzle db connection
  replit_integrations/auth/  — Replit Auth setup

client/src/
  App.tsx         — Routes
  pages/
    landing.tsx       — Unauthenticated landing
    dashboard.tsx     — Group list view
    group-details.tsx — Group hub (Feed, Chat, Events, Polls, Members tabs)
  components/
    layout.tsx            — Global nav
    post-card.tsx         — Post display (all types)
    poll-card.tsx         — Poll display + voting
    create-post-dialog.tsx
    create-event-dialog.tsx
    create-poll-dialog.tsx
    create-group-dialog.tsx
    join-group-dialog.tsx
  hooks/
    use-auth.ts       — Auth state
    use-groups.ts     — Groups CRUD
    use-posts.ts      — Posts CRUD
    use-events.ts     — Events CRUD
    use-polls.ts      — Polls + voting
    use-messages.ts   — Group chat messages (3s polling)
    use-members.ts    — Group members + remove
```

## Database Tables

- `users` — Replit Auth users
- `groups` — Friend groups with unique join codes
- `members` — User-group membership with roles (admin/member)
- `posts` — Posts of types: announcement, image, video, story
- `events` — Scheduled group events
- `polls` + `poll_options` + `poll_votes` — Poll system
- `messages` — Group chat messages

## Running

The `Start application` workflow runs `npm run dev` which starts Express + Vite on port 5000.
