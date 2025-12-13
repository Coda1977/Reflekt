import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// Extend auth schema with our custom tables
export const schema = defineSchema({
  ...authTables,

  // Override users table to add role field
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    role: v.optional(v.union(v.literal("consultant"), v.literal("client"))),
  })
    .index("email", ["email"]),

  // Consultant profiles with branding settings
  consultantProfiles: defineTable({
    userId: v.id("users"),
    branding: v.object({
      logoUrl: v.optional(v.string()),
      primaryColor: v.string(),
      secondaryColor: v.string(),
      fontFamily: v.string(),
    }),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Workbooks (the designs/templates)
  workbooks: defineTable({
    consultantId: v.id("users"),
    title: v.string(),
    sections: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        pages: v.array(
          v.object({
            id: v.string(),
            title: v.string(),
            blocks: v.array(
              v.union(
                // Text block with Tiptap JSON
                v.object({
                  type: v.literal("text"),
                  id: v.string(),
                  content: v.string(), // Tiptap JSON as string
                }),
                // Input block
                v.object({
                  type: v.literal("input"),
                  id: v.string(),
                  label: v.string(),
                  placeholder: v.optional(v.string()),
                  multiline: v.boolean(),
                }),
                // Checkbox block
                v.object({
                  type: v.literal("checkbox"),
                  id: v.string(),
                  label: v.string(),
                  options: v.array(
                    v.object({
                      id: v.string(),
                      text: v.string(),
                    })
                  ),
                }),
                // Image block
                v.object({
                  type: v.literal("image"),
                  id: v.string(),
                  url: v.string(),
                  alt: v.optional(v.string()),
                }),
                // Table block
                v.object({
                  type: v.literal("table"),
                  id: v.string(),
                  label: v.string(),
                  columns: v.array(
                    v.object({
                      id: v.string(),
                      header: v.string(),
                    })
                  ),
                  rows: v.array(
                    v.object({
                      id: v.string(),
                      label: v.string(),
                    })
                  ),
                }),
                // iFrame block
                v.object({
                  type: v.literal("iframe"),
                  id: v.string(),
                  url: v.string(),
                  height: v.optional(v.string()),
                })
              )
            ),
          })
        ),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_consultant", ["consultantId"])
    .index("by_created_at", ["createdAt"]),

  // Workbook instances (client's copy with responses)
  workbookInstances: defineTable({
    workbookId: v.id("workbooks"),
    clientId: v.optional(v.id("users")), // Optional until client signs up
    inviteToken: v.string(), // Unique token for QR code access
    responses: v.any(), // Dynamic object with blockId as keys
    startedAt: v.optional(v.number()),
    lastUpdatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_workbook", ["workbookId"])
    .index("by_client", ["clientId"])
    .index("by_invite_token", ["inviteToken"]),
});

export default schema;
