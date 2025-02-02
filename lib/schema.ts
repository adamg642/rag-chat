import { sql } from "@vercel/postgres"
import { drizzle } from "drizzle-orm/vercel-postgres"
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  embedding: text("embedding").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  emailContent: text("email_content").notNull(),
  scheduledEmailDate: timestamp("scheduled_email_date").notNull(),
  emailSentAt: timestamp("email_sent_at"),
})

export const db = drizzle(sql)

