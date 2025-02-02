import { db, documents } from "./schema"
import { embed } from "ai"
import { openai } from "@ai-sdk/openai"

export async function embedAndStoreDocument(content: string) {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: content,
  })

  await db.insert(documents).values({
    content,
    embedding: JSON.stringify(embedding),
  })
}

