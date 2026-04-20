import { db } from "./db";
import { groups, members, posts, events, polls, pollOptions, pollVotes, messages, users } from "@shared/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  // Groups
  getUserGroups(userId: string): Promise<any[]>;
  getGroup(id: number): Promise<any | undefined>;
  getGroupByCode(code: string): Promise<any | undefined>;
  createGroup(userId: string, group: any): Promise<any>;
  joinGroup(userId: string, groupId: number, role?: string): Promise<void>;
  isMember(userId: string, groupId: number): Promise<boolean>;

  // Members
  getGroupMembers(groupId: number): Promise<any[]>;
  getMemberRole(userId: string, groupId: number): Promise<string | null>;
  removeMember(userId: string, groupId: number): Promise<void>;

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

  // Messages
  getGroupMessages(groupId: number): Promise<any[]>;
  createMessage(userId: string, groupId: number, data: { content?: string; mediaUrl?: string; mediaType?: string }): Promise<any>;
  editMessage(messageId: number, userId: string, content: string): Promise<any>;
  deleteMessage(messageId: number, userId: string): Promise<void>;

  // Group updates
  updateGroupPhoto(groupId: number, adminId: string, photoUrl: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUserGroups(userId: string): Promise<any[]> {
    const userMemberships = await db.select().from(members).where(eq(members.userId, userId));
    const groupIds = userMemberships.map(m => m.groupId);
    if (groupIds.length === 0) return [];

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

    await db.insert(members).values({ userId, groupId, role });
  }

  async isMember(userId: string, groupId: number): Promise<boolean> {
    const [member] = await db.select().from(members).where(and(eq(members.userId, userId), eq(members.groupId, groupId)));
    return !!member;
  }

  async getGroupMembers(groupId: number): Promise<any[]> {
    const groupMembers = await db
      .select({ member: members, user: users })
      .from(members)
      .leftJoin(users, eq(members.userId, users.id))
      .where(eq(members.groupId, groupId));

    return groupMembers.map(({ member, user }) => ({ ...member, user }));
  }

  async getMemberRole(userId: string, groupId: number): Promise<string | null> {
    const [member] = await db.select().from(members).where(and(eq(members.userId, userId), eq(members.groupId, groupId)));
    return member?.role ?? null;
  }

  async removeMember(userId: string, groupId: number): Promise<void> {
    await db.delete(members).where(and(eq(members.userId, userId), eq(members.groupId, groupId)));
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
      groupId,
      createdBy: userId,
    }).returning();
    return event;
  }

  async getGroupPolls(groupId: number): Promise<any[]> {
    const groupPolls = await db.select().from(polls).where(eq(polls.groupId, groupId)).orderBy(desc(polls.createdAt));

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
      await db.insert(pollOptions).values({ pollId: poll.id, text: optText });
    }

    return poll;
  }

  async votePoll(userId: string, pollOptionId: number): Promise<void> {
    // Check if user already voted on any option of this poll
    const [opt] = await db.select().from(pollOptions).where(eq(pollOptions.id, pollOptionId));
    if (!opt) return;

    const existingOptionsForPoll = await db.select().from(pollOptions).where(eq(pollOptions.pollId, opt.pollId));
    const existingOptionIds = existingOptionsForPoll.map(o => o.id);

    if (existingOptionIds.length > 0) {
      const existingVote = await db.select().from(pollVotes).where(
        and(eq(pollVotes.userId, userId), inArray(pollVotes.pollOptionId, existingOptionIds))
      );
      if (existingVote.length > 0) {
        // Update: delete old vote and insert new
        await db.delete(pollVotes).where(
          and(eq(pollVotes.userId, userId), inArray(pollVotes.pollOptionId, existingOptionIds))
        );
      }
    }

    await db.insert(pollVotes).values({ pollOptionId, userId });
  }

  async getGroupMessages(groupId: number): Promise<any[]> {
    const groupMessages = await db
      .select({ message: messages, user: users })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.groupId, groupId))
      .orderBy(messages.createdAt);

    return groupMessages.map(({ message, user }) => ({ ...message, user }));
  }

  async createMessage(userId: string, groupId: number, data: { content?: string; mediaUrl?: string; mediaType?: string }): Promise<any> {
    const [message] = await db.insert(messages).values({
      userId,
      groupId,
      content: data.content || null,
      mediaUrl: data.mediaUrl || null,
      mediaType: data.mediaType || null,
    }).returning();
    return message;
  }

  async editMessage(messageId: number, userId: string, content: string): Promise<any> {
    const [msg] = await db.select().from(messages).where(eq(messages.id, messageId));
    if (!msg || msg.userId !== userId) throw new Error("Forbidden");
    const [updated] = await db
      .update(messages)
      .set({ content, editedAt: new Date() })
      .where(eq(messages.id, messageId))
      .returning();
    return updated;
  }

  async deleteMessage(messageId: number, userId: string): Promise<void> {
    const [msg] = await db.select().from(messages).where(eq(messages.id, messageId));
    if (!msg || msg.userId !== userId) throw new Error("Forbidden");
    await db.delete(messages).where(eq(messages.id, messageId));
  }

  async updateGroupPhoto(groupId: number, adminId: string, photoUrl: string): Promise<any> {
    const role = await this.getMemberRole(adminId, groupId);
    if (role !== "admin") throw new Error("Forbidden");
    const [updated] = await db
      .update(groups)
      .set({ photoUrl })
      .where(eq(groups.id, groupId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
