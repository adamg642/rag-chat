import { db, documents } from "@/lib/schema"
import { eq, lte, isNull } from "drizzle-orm"
import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  // Check for a secret token to ensure this route is only called by authorized services
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  const currentDate = new Date()

  const documentsToEmail = await db
    .select()
    .from(documents)
    .where(lte(documents.scheduledEmailDate, currentDate))
    .where(isNull(documents.emailSentAt))

  const emailsSent = []

  for (const doc of documentsToEmail) {
    try {
      await sendEmail(doc.emailContent)
      await db.update(documents).set({ emailSentAt: new Date() }).where(eq(documents.id, doc.id))
      emailsSent.push(doc.id)
    } catch (error) {
      console.error(`Failed to send email for document ${doc.id}:`, error)
    }
  }

  return NextResponse.json({ success: true, emailsSent: emailsSent.length })
}

async function sendEmail(content: string) {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: process.env.EMAIL_TO!,
      subject: "Scheduled Email from RAG Chatbot",
      text: content,
    })

    console.log("Email sent successfully:", data)
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

