"use client"

import { useState } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Save } from "lucide-react"

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages, action: "save" }),
      })

      if (response.ok) {
        // Clear the conversation after saving
        setMessages([])
      } else {
        console.error("Failed to save conversation")
      }
    } catch (error) {
      console.error("Error saving conversation:", error)
    }
    setIsSaving(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>RAG Chatbot</CardTitle>
          <Button onClick={handleSave} disabled={messages.length === 0 || isSaving} size="sm" variant="outline">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`rounded-lg p-2 ${m.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-grow"
            />
            <Button type="submit">Send</Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}

