import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth";
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
  app.post("/api/upload", isAuthenticated, upload.single("file"), (req, res) => {
    if (!(req as any).file) return res.status(400).json({ message: "No file uploaded" });
    const file = (req as any).file;
    const mediaType = file.mimetype.startsWith("video/") ? "video" : "image";
    const url = `/uploads/${file.filename}`;
    res.json({ url, mediaType });
  });

  // === GROUPS ===
  app.get(api.groups.list.path, isAuthenticated, async (req, res) => {
    const userId = req.session.userId!;
    const groups = await storage.getUserGroups(userId);
    res.json(groups);
  });

  app.post(api.groups.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.groups.create.input.parse(req.body);
      const group = await storage.createGroup(req.session.userId!, input);
      res.status(201).json(group);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.groups.join.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.groups.join.input.parse(req.body);
      const group = await storage.getGroupByCode(input.code);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      await storage.joinGroup(req.session.userId!, group.id);
      res.json(group);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.groups.get.path, isAuthenticated, async (req, res) => {
    const group = await storage.getGroup(Number(req.params.id));
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  });

  // === MEMBERS ===
  app.get("/api/groups/:groupId/members", isAuthenticated, async (req, res) => {
    const groupId = Number(req.params.groupId);
    const members = await storage.getGroupMembers(groupId);
    res.json(members);
  });

  // Leave group (current user leaves themselves)
  app.delete("/api/groups/:groupId/leave", isAuthenticated, async (req, res) => {
    const groupId = Number(req.params.groupId);
    const userId = req.session.userId!;

    const role = await storage.getMemberRole(userId, groupId);
    if (!role) return res.status(404).json({ message: "You are not a member of this group" });

    // If the leaving user is an admin, ensure there's at least one other admin
    if (role === "admin") {
      const allMembers = await storage.getGroupMembers(groupId);
      const otherAdmins = allMembers.filter(m => m.role === "admin" && m.userId !== userId);
      if (otherAdmins.length === 0) {
        return res.status(400).json({
          message: "You're the only admin. Transfer admin to someone else before leaving.",
        });
      }
    }

    await storage.removeMember(userId, groupId);
    res.json({ ok: true });
  });

  app.delete("/api/groups/:groupId/members/:userId", isAuthenticated, async (req, res) => {
    const groupId = Number(req.params.groupId);
    const requesterId = req.session.userId!;
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

  app.post(api.posts.create.path, isAuthenticated, async (req, res) => {
    const input = api.posts.create.input.parse(req.body);
    const post = await storage.createPost(req.session.userId!, Number(req.params.groupId), input);
    res.status(201).json(post);
  });

  // === EVENTS ===
  app.get(api.events.list.path, isAuthenticated, async (req, res) => {
    const events = await storage.getGroupEvents(Number(req.params.groupId));
    res.json(events);
  });

  app.post(api.events.create.path, isAuthenticated, async (req, res) => {
    const input = api.events.create.input.parse(req.body);
    const event = await storage.createEvent(req.session.userId!, Number(req.params.groupId), input);
    res.status(201).json(event);
  });

  // === POLLS ===
  app.get(api.polls.list.path, isAuthenticated, async (req, res) => {
    const polls = await storage.getGroupPolls(Number(req.params.groupId));
    res.json(polls);
  });

  app.post(api.polls.create.path, isAuthenticated, async (req, res) => {
    const input = api.polls.create.input.parse(req.body);
    const poll = await storage.createPoll(req.session.userId!, Number(req.params.groupId), input);
    res.status(201).json(poll);
  });

  app.post(api.polls.vote.path, isAuthenticated, async (req, res) => {
    await storage.votePoll(req.session.userId!, req.body.optionId);
    res.json({ success: true });
  });

  // === MESSAGES (Group Chat) ===
  app.get("/api/groups/:groupId/messages", isAuthenticated, async (req, res) => {
    const messages = await storage.getGroupMessages(Number(req.params.groupId));
    res.json(messages);
  });

  app.post("/api/groups/:groupId/messages", isAuthenticated, async (req, res) => {
    const { content, mediaUrl, mediaType } = req.body;
    const hasContent = content && typeof content === "string" && content.trim().length > 0;
    const hasMedia = mediaUrl && typeof mediaUrl === "string" && mediaUrl.trim().length > 0;
    if (!hasContent && !hasMedia) {
      return res.status(400).json({ message: "A message or media is required" });
    }
    const message = await storage.createMessage(req.session.userId!, Number(req.params.groupId), {
      content: hasContent ? content.trim() : undefined,
      mediaUrl: hasMedia ? mediaUrl.trim() : undefined,
      mediaType: hasMedia ? (mediaType || "image") : undefined,
    });
    res.status(201).json(message);
  });

  app.patch("/api/groups/:groupId/messages/:messageId", isAuthenticated, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Content is required" });
      }
      const updated = await storage.editMessage(Number(req.params.messageId), req.session.userId!, content.trim());
      res.json(updated);
    } catch (err: any) {
      if (err.message === "Forbidden") return res.status(403).json({ message: "You can only edit your own messages" });
      throw err;
    }
  });

  app.delete("/api/groups/:groupId/messages/:messageId", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteMessage(Number(req.params.messageId), req.session.userId!);
      res.json({ success: true });
    } catch (err: any) {
      if (err.message === "Forbidden") return res.status(403).json({ message: "You can only delete your own messages" });
      throw err;
    }
  });

  // === GROUP PHOTO ===
  app.patch("/api/groups/:id/photo", isAuthenticated, async (req, res) => {
    try {
      const { photoUrl } = req.body;
      if (typeof photoUrl !== "string") return res.status(400).json({ message: "photoUrl required" });
      const updated = await storage.updateGroupPhoto(Number(req.params.id), req.session.userId!, photoUrl);
      res.json(updated);
    } catch (err: any) {
      if (err.message === "Forbidden") return res.status(403).json({ message: "Only admins can update the group photo" });
      throw err;
    }
  });

  return httpServer;
}
