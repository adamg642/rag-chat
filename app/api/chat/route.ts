import { openai } from "@ai-sdk/openai"
import { streamText, embed, cosineSimilarity, generateText } from "ai"
import { db, documents } from "@/lib/schema"

export async function POST(req: Request) {
  const { messages, action } = await req.json()

  if (action === "save") {
    const conversationText = messages.map((m) => `${m.role}: ${m.content}`).join("\n")
    await analyzeAndSaveDocument(conversationText)
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    })
  }

  const lastMessage = messages[messages.length - 1].content

  // Embed the user's message
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: lastMessage,
  })

  // Retrieve all documents from the database
  const allDocuments = await db.select().from(documents)

  // Find the most similar document
  const similarDocuments = allDocuments
    .map((doc) => ({
      ...doc,
      similarity: cosineSimilarity(embedding, JSON.parse(doc.embedding)),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 1)

  const context = similarDocuments.map((doc) => doc.content).join("\n")

  const stream = streamText({
    model: openai("gpt-4o"),
    messages: [
      { role: "system", content: "You are a helpful assistant. Use the provided context to answer questions." },
      ...messages,
    ],
    context: `Relevant information: ${context}`,
  })

  return new Response(stream.toReadableStream())
}

async function analyzeAndSaveDocument(content: string) {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: content,
  })

  const currentDate = new Date().toISOString().split("T")[0]
  const analysisPrompt = `
    Analyze the following conversation and determine:
    1. When an email should be sent based on the content (provide a specific date in YYYY-MM-DD format, starting from ${currentDate})
    2. What should be included in the email
    3. Provide a brief summary of the conversation
    4. Identify any action items or follow-ups

    Conversation:
    ${content}

    Response format:
    SEND_EMAIL_DATE: [YYYY-MM-DD]
    EMAIL_CONTENT: [Provide the email content here]
    SUMMARY: [Brief summary of the conversation]
    ACTION_ITEMS: [List of action items or follow-ups]
  `

  const { text: analysis } = await generateText({
    model: openai("gpt-4o"),
    prompt: analysisPrompt,
  })

  const emailDate = analysis.split("SEND_EMAIL_DATE:")[1].split("\n")[0].trim()
  const emailContent = analysis.split("EMAIL_CONTENT:")[1].split("SUMMARY:")[0].trim()
  const summary = analysis.split("SUMMARY:")[1].split("ACTION_ITEMS:")[0].trim()
  const actionItems = analysis.split("ACTION_ITEMS:")[1].trim()

  await db.insert(documents).values({
    content,
    embedding: JSON.stringify(embedding),
    emailContent,
    scheduledEmailDate: new Date(emailDate),
  })

  // You might want to store the summary and action items in separate fields if you add them to your schema
}

