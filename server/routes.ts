import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // === GROUPS ===
  app.get(api.groups.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const groups = await storage.getUserGroups(userId);
    res.json(groups);
  });

  app.post(api.groups.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.groups.create.input.parse(req.body);
      const group = await storage.createGroup(req.user.claims.sub, input);
      res.status(201).json(group);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      throw err;
    }
  });

  app.post(api.groups.join.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.groups.join.input.parse(req.body);
      const group = await storage.getGroupByCode(input.code);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      await storage.joinGroup(req.user.claims.sub, group.id);
      res.json(group);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      throw err;
    }
  });

  app.get(api.groups.get.path, isAuthenticated, async (req: any, res) => {
    const group = await storage.getGroup(Number(req.params.id));
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  });

  // === POSTS ===
  app.get(api.posts.list.path, isAuthenticated, async (req, res) => {
    const posts = await storage.getGroupPosts(Number(req.params.groupId));
    res.json(posts);
  });

  app.post(api.posts.create.path, isAuthenticated, async (req: any, res) => {
    const input = api.posts.create.input.parse(req.body);
    const post = await storage.createPost(req.user.claims.sub, Number(req.params.groupId), input);
    res.status(201).json(post);
  });

  // === EVENTS ===
  app.get(api.events.list.path, isAuthenticated, async (req, res) => {
    const events = await storage.getGroupEvents(Number(req.params.groupId));
    res.json(events);
  });

  app.post(api.events.create.path, isAuthenticated, async (req: any, res) => {
    const input = api.events.create.input.parse(req.body);
    const event = await storage.createEvent(req.user.claims.sub, Number(req.params.groupId), input);
    res.status(201).json(event);
  });

  // === POLLS ===
  app.get(api.polls.list.path, isAuthenticated, async (req, res) => {
    const polls = await storage.getGroupPolls(Number(req.params.groupId));
    res.json(polls);
  });

  app.post(api.polls.create.path, isAuthenticated, async (req: any, res) => {
    const input = api.polls.create.input.parse(req.body);
    const poll = await storage.createPoll(req.user.claims.sub, Number(req.params.groupId), input);
    res.status(201).json(poll);
  });

  app.post(api.polls.vote.path, isAuthenticated, async (req: any, res) => {
    await storage.votePoll(req.user.claims.sub, req.body.optionId);
    res.json({ success: true });
  });

  return httpServer;
}
