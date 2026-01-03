import { z } from "zod";
import { insertGroupSchema, insertPostSchema, insertEventSchema, insertPollSchema, joinGroupSchema, groups, members, posts, events, polls, pollOptions, pollVotes } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  groups: {
    list: {
      method: "GET" as const,
      path: "/api/groups",
      responses: {
        200: z.array(z.custom<typeof groups.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/groups",
      input: insertGroupSchema,
      responses: {
        201: z.custom<typeof groups.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    join: {
      method: "POST" as const,
      path: "/api/groups/join",
      input: joinGroupSchema,
      responses: {
        200: z.custom<typeof groups.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/groups/:id",
      responses: {
        200: z.custom<typeof groups.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  posts: {
    list: {
      method: "GET" as const,
      path: "/api/groups/:groupId/posts",
      responses: {
        200: z.array(z.custom<typeof posts.$inferSelect & { user: any }>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/groups/:groupId/posts",
      input: insertPostSchema,
      responses: {
        201: z.custom<typeof posts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  events: {
    list: {
      method: "GET" as const,
      path: "/api/groups/:groupId/events",
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/groups/:groupId/events",
      input: insertEventSchema,
      responses: {
        201: z.custom<typeof events.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  polls: {
    list: {
      method: "GET" as const,
      path: "/api/groups/:groupId/polls",
      responses: {
        200: z.array(z.custom<typeof polls.$inferSelect & { options: any[] }>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/groups/:groupId/polls",
      input: insertPollSchema,
      responses: {
        201: z.custom<typeof polls.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    vote: {
      method: "POST" as const,
      path: "/api/polls/:pollId/vote",
      input: z.object({ optionId: z.number() }),
      responses: {
        200: z.void(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
