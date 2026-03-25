import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Set up multer storage for uploaded media
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /image\/(jpeg|png|gif|webp)|video\/(mp4|webm|quicktime|mov)/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only images and videos are allowed"));
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Serve uploaded files as static
  const express = (await import("express")).default;
  app.use("/uploads", express.static(uploadsDir));

  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // === FILE UPLOAD ===
  app.post("/api/upload", isAuthenticated, upload.single("file"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, mediaType });
  });

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
        return res.status(400).json({ message: err.errors[0].message });
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
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.groups.get.path, isAuthenticated, async (req: any, res) => {
    const group = await storage.getGroup(Number(req.params.id));
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  });

  // === MEMBERS ===
  app.get("/api/groups/:groupId/members", isAuthenticated, async (req: any, res) => {
    const groupId = Number(req.params.groupId);
    const members = await storage.getGroupMembers(groupId);
    res.json(members);
  });

  app.delete("/api/groups/:groupId/members/:userId", isAuthenticated, async (req: any, res) => {
    const groupId = Number(req.params.groupId);
    const requesterId = req.user.claims.sub;
    const targetUserId = req.params.userId;

    // Only admins can remove members
    const role = await storage.getMemberRole(requesterId, groupId);
    if (role !== "admin") {
      return res.status(403).json({ message: "Only admins can remove members" });
    }

    // Prevent self-removal of admin
    if (targetUserId === requesterId) {
      return res.status(400).json({ message: "You cannot remove yourself" });
    }

    await storage.removeMember(targetUserId, groupId);
    res.json({ success: true });
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

  // === MESSAGES (Group Chat) ===
  app.get("/api/groups/:groupId/messages", isAuthenticated, async (req, res) => {
    const messages = await storage.getGroupMessages(Number(req.params.groupId));
    res.json(messages);
  });

  app.post("/api/groups/:groupId/messages", isAuthenticated, async (req: any, res) => {
    const { content, mediaUrl, mediaType } = req.body;
    const hasContent = content && typeof content === "string" && content.trim().length > 0;
    const hasMedia = mediaUrl && typeof mediaUrl === "string" && mediaUrl.trim().length > 0;
    if (!hasContent && !hasMedia) {
      return res.status(400).json({ message: "A message or media is required" });
    }
    const message = await storage.createMessage(req.user.claims.sub, Number(req.params.groupId), {
      content: hasContent ? content.trim() : undefined,
      mediaUrl: hasMedia ? mediaUrl.trim() : undefined,
      mediaType: hasMedia ? (mediaType || "image") : undefined,
    });
    res.status(201).json(message);
  });

  app.patch("/api/groups/:groupId/messages/:messageId", isAuthenticated, async (req: any, res) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Content is required" });
      }
      const updated = await storage.editMessage(Number(req.params.messageId), req.user.claims.sub, content.trim());
      res.json(updated);
    } catch (err: any) {
      if (err.message === "Forbidden") return res.status(403).json({ message: "You can only edit your own messages" });
      throw err;
    }
  });

  app.delete("/api/groups/:groupId/messages/:messageId", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteMessage(Number(req.params.messageId), req.user.claims.sub);
      res.json({ success: true });
    } catch (err: any) {
      if (err.message === "Forbidden") return res.status(403).json({ message: "You can only delete your own messages" });
      throw err;
    }
  });

  // === GROUP PHOTO ===
  app.patch("/api/groups/:id/photo", isAuthenticated, async (req: any, res) => {
    try {
      const { photoUrl } = req.body;
      if (typeof photoUrl !== "string") return res.status(400).json({ message: "photoUrl required" });
      const updated = await storage.updateGroupPhoto(Number(req.params.id), req.user.claims.sub, photoUrl);
      res.json(updated);
    } catch (err: any) {
      if (err.message === "Forbidden") return res.status(403).json({ message: "Only admins can update the group photo" });
      throw err;
    }
  });

  return httpServer;
}
