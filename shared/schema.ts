import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./models/auth";
import { users } from "./models/auth";

// === GROUPS ===
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  photoUrl: text("photo_url"), // Group profile photo
  code: text("code").notNull().unique(), // Unique code for joining
  createdBy: varchar("created_by").notNull(), // User ID
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupsRelations = relations(groups, ({ many }) => ({
  members: many(members),
  posts: many(posts),
  events: many(events),
  polls: many(polls),
}));

// === MEMBERS ===
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(), // Link to auth users
  groupId: integer("group_id").notNull(),
  role: text("role").default("member"), // 'admin', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const membersRelations = relations(members, ({ one }) => ({
  group: one(groups, {
    fields: [members.groupId],
    references: [groups.id],
  }),
}));

// === POSTS (Announcements, Stories, Videos) ===
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // 'announcement', 'story', 'video', 'image', 'chat'
  content: text("content"), // Text content
  mediaUrl: text("media_url"), // URL for images/videos/pictures
  expiresAt: timestamp("expires_at"), // For stories
  createdAt: timestamp("created_at").defaultNow(),
});

export const postsRelations = relations(posts, ({ one }) => ({
  group: one(groups, {
    fields: [posts.groupId],
    references: [groups.id],
  }),
}));

// === EVENTS ===
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  location: text("location"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventsRelations = relations(events, ({ one }) => ({
  group: one(groups, {
    fields: [events.groupId],
    references: [groups.id],
  }),
}));

// === POLLS ===
export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  question: text("question").notNull(),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pollsRelations = relations(polls, ({ one, many }) => ({
  group: one(groups, {
    fields: [polls.groupId],
    references: [groups.id],
  }),
  options: many(pollOptions),
}));

export const pollOptions = pgTable("poll_options", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull(),
  text: text("text").notNull(),
});

export const pollOptionsRelations = relations(pollOptions, ({ one, many }) => ({
  poll: one(polls, {
    fields: [pollOptions.pollId],
    references: [polls.id],
  }),
  votes: many(pollVotes),
}));

export const pollVotes = pgTable("poll_votes", {
  id: serial("id").primaryKey(),
  pollOptionId: integer("poll_option_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pollVotesRelations = relations(pollVotes, ({ one }) => ({
  option: one(pollOptions, {
    fields: [pollVotes.pollOptionId],
    references: [pollOptions.id],
  }),
}));

// === MESSAGES (Group Chat) ===
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content"), // Optional text; at least one of content/mediaUrl required
  mediaUrl: text("media_url"), // URL for photo/video attachments
  mediaType: text("media_type"), // 'image' | 'video'
  editedAt: timestamp("edited_at"), // Set when message is edited
  createdAt: timestamp("created_at").defaultNow(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  group: one(groups, {
    fields: [messages.groupId],
    references: [groups.id],
  }),
}));

// === SCHEMAS ===
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true, createdBy: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, userId: true, expiresAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, createdBy: true });
export const insertPollSchema = createInsertSchema(polls).omit({ id: true, createdAt: true, createdBy: true }).extend({
  options: z.array(z.string()),
});
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, userId: true });
export const joinGroupSchema = z.object({ code: z.string() });

// === TYPES ===
export type Group = typeof groups.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Poll = typeof polls.$inferSelect;
export type PollOption = typeof pollOptions.$inferSelect;
export type PollVote = typeof pollVotes.$inferSelect;
export type Message = typeof messages.$inferSelect;
