import { db } from "./db";
import { groups, members, posts, events, polls, pollOptions, pollVotes, users } from "@shared/schema";
import { eq, and, desc, gt } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  // Groups
  getUserGroups(userId: string): Promise<any[]>;
  getGroup(id: number): Promise<any | undefined>;
  getGroupByCode(code: string): Promise<any | undefined>;
  createGroup(userId: string, group: any): Promise<any>;
  joinGroup(userId: string, groupId: number, role?: string): Promise<void>;
  isMember(userId: string, groupId: number): Promise<boolean>;

  // Posts
  getGroupPosts(groupId: number): Promise<any[]>;
  createPost(userId: string, groupId: number, post: any): Promise<any>;

  // Events
  getGroupEvents(groupId: number): Promise<any[]>;
  createEvent(userId: string, groupId: number, event: any): Promise<any>;

  // Polls
  getGroupPolls(groupId: number): Promise<any[]>;
  createPoll(userId: string, groupId: number, poll: any): Promise<any>;
  votePoll(userId: string, pollOptionId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUserGroups(userId: string): Promise<any[]> {
    const userMemberships = await db.select().from(members).where(eq(members.userId, userId));
    const groupIds = userMemberships.map(m => m.groupId);
    if (groupIds.length === 0) return [];
    
    // In a real app we'd use 'inArray', but simple iteration is fine for MVP
    const results = [];
    for (const gid of groupIds) {
      const [g] = await db.select().from(groups).where(eq(groups.id, gid));
      if (g) results.push(g);
    }
    return results;
  }

  async getGroup(id: number): Promise<any | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async getGroupByCode(code: string): Promise<any | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.code, code));
    return group;
  }

  async createGroup(userId: string, groupData: any): Promise<any> {
    const code = randomBytes(4).toString("hex").toUpperCase();
    const [group] = await db.insert(groups).values({
      ...groupData,
      code,
      createdBy: userId,
    }).returning();
    
    await this.joinGroup(userId, group.id, "admin");
    return group;
  }

  async joinGroup(userId: string, groupId: number, role: string = "member"): Promise<void> {
    const [existing] = await db.select().from(members).where(and(eq(members.userId, userId), eq(members.groupId, groupId)));
    if (existing) return;

    await db.insert(members).values({
      userId,
      groupId,
      role,
    });
  }

  async isMember(userId: string, groupId: number): Promise<boolean> {
    const [member] = await db.select().from(members).where(and(eq(members.userId, userId), eq(members.groupId, groupId)));
    return !!member;
  }

  async getGroupPosts(groupId: number): Promise<any[]> {
    const groupPosts = await db.select({
      post: posts,
      user: users
    })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.groupId, groupId))
    .orderBy(desc(posts.createdAt));
    
    return groupPosts.map(({ post, user }) => ({ ...post, user }));
  }

  async createPost(userId: string, groupId: number, postData: any): Promise<any> {
    const [post] = await db.insert(posts).values({
      ...postData,
      userId,
      groupId,
    }).returning();
    return post;
  }

  async getGroupEvents(groupId: number): Promise<any[]> {
    return await db.select().from(events).where(eq(events.groupId, groupId)).orderBy(events.startTime);
  }

  async createEvent(userId: string, groupId: number, eventData: any): Promise<any> {
    const [event] = await db.insert(events).values({
      ...eventData,
      userId,
      groupId,
      createdBy: userId
    }).returning();
    return event;
  }

  async getGroupPolls(groupId: number): Promise<any[]> {
    const groupPolls = await db.select().from(polls).where(eq(polls.groupId, groupId)).orderBy(desc(polls.createdAt));
    
    // Fetch options and votes for each poll (simplified N+1 for MVP)
    const results = [];
    for (const poll of groupPolls) {
      const options = await db.select().from(pollOptions).where(eq(pollOptions.pollId, poll.id));
      const optionsWithVotes = [];
      for (const opt of options) {
        const votes = await db.select().from(pollVotes).where(eq(pollVotes.pollOptionId, opt.id));
        optionsWithVotes.push({ ...opt, votes: votes.length });
      }
      results.push({ ...poll, options: optionsWithVotes });
    }
    return results;
  }

  async createPoll(userId: string, groupId: number, pollData: any): Promise<any> {
    const [poll] = await db.insert(polls).values({
      question: pollData.question,
      groupId,
      createdBy: userId,
    }).returning();

    for (const optText of pollData.options) {
      await db.insert(pollOptions).values({
        pollId: poll.id,
        text: optText,
      });
    }

    return poll;
  }

  async votePoll(userId: string, pollOptionId: number): Promise<void> {
    // Basic vote logic: check if user already voted in this poll? 
    // For MVP, just allow voting on an option.
    // Ideally we should find the pollId from the option, then check if user voted on that poll.
    
    await db.insert(pollVotes).values({
      pollOptionId,
      userId,
    });
  }
}

export const storage = new DatabaseStorage();
