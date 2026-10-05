"use client"

import React, { useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
} from "@/components/ui"
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  User,
  Calculator,
  Atom,
  Languages,
  CheckCircle2,
  RefreshCw,
} from "lucide-react"

interface ChatMessage {
  id: string
  sender: "user" | "tutor"
  text: string
  subject?: string
  timestamp: string
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    sender: "tutor",
    text: "Namaste! I am your 24/7 VID AI Tutor aligned with your CBSE Class 10 & 9 curriculum. Ask me any conceptual doubt, derivation, or practice problem in Mathematics, Science, or English!",
    timestamp: "10:30 AM",
  },
  {
    id: "msg-2",
    sender: "user",
    text: "Can you explain how to solve quadratic equations by completing the square method?",
    subject: "Mathematics",
    timestamp: "10:32 AM",
  },
  {
    id: "msg-3",
    sender: "tutor",
    text: "Great question! Let's solve $ax^2 + bx + c = 0$ step-by-step using completing the square:\n\n1. Divide the entire equation by $a$ so the leading coefficient is 1: $x^2 + \\frac{b}{a}x + \\frac{c}{a} = 0$.\n2. Move the constant term to the right side: $x^2 + \\frac{b}{a}x = -\\frac{c}{a}$.\n3. Add the square of half the coefficient of $x$, which is $\\left(\\frac{b}{2a}\\right)^2$, to both sides.\n4. Write the left side as a perfect square: $\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2 - 4ac}{4a^2}$.\n5. Take the square root of both sides to get the quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.\n\nWould you like to try solving an example like $2x^2 - 5x + 3 = 0$ together?",
    timestamp: "10:32 AM",
  },
]

export default function AiTutorChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [inputText, setInputText] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("Mathematics")
  const [isThinking, setIsThinking] = useState(false)

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim()
    if (!text) return

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text,
      subject: selectedSubject,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText("")
    setIsThinking(true)

    setTimeout(() => {
      let reply = `Here is an explanation for "${text}":\n\nAccording to the CBSE curriculum, this concept relies on fundamental principles. Let's break it down into core properties, provide an intuitive illustration, and solve a representative test problem.\n\nKeep up the great learning!`
      if (text.toLowerCase().includes("pythagor")) {
        reply = "In a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides: $AC^2 = AB^2 + BC^2$. If the Hyderabad Metro pillar is 12m high and the shadow is 9m, the distance from top to shadow tip is $\\sqrt{12^2 + 9^2} = \\sqrt{144 + 81} = \\sqrt{225} = 15\\text{ m}$."
      } else if (text.toLowerCase().includes("redox") || text.toLowerCase().includes("chemical")) {
        reply = "Redox reactions involve simultaneous reduction (gain of electrons) and oxidation (loss of electrons). Remember the mnemonic OIL RIG: Oxidation Is Loss, Reduction Is Gain!"
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "tutor",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, botMsg])
      setIsThinking(false)
    }, 1000)
  }

  const promptSuggestions = [
    "Explain Pythagorean theorem with Hyderabad Metro example",
    "How to balance chemical redox equations?",
    "Key themes in Nelson Mandela: Long Walk to Freedom",
    "What are the differences between Series and Parallel circuits?",
  ]

  return (
    <AppShell
      pageTitle="AI Tutor 24/7 Educational Companion"
      breadcrumbs={[{ label: "AI Yantra", href: "/ai-tutor/analytics" }, { label: "AI Tutor Chat" }]}
    >
      <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-surface border border-border-default rounded-2xl shadow-xs overflow-hidden">
        {/* Tutor Header */}
        <div className="p-4 border-b border-border-default flex items-center justify-between bg-canvas">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-text-primary">VID AI Tutor Companion</h3>
                <Badge variant="positive" className="text-[10px]">
                  Online 24/7
                </Badge>
              </div>
              <p className="text-[11px] text-text-secondary">CBSE Curriculum Aligned • NCERT Grade 9 & 10</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {["Mathematics", "Science", "English", "Social Science"].map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubject(sub)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedSubject === sub
                    ? "bg-action-black text-canvas shadow-xs"
                    : "bg-surface border border-border-default text-text-secondary hover:text-text-primary"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-canvas/40">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 max-w-[85%] ${
                m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  m.sender === "user"
                    ? "bg-brand-primary text-canvas"
                    : "bg-purple-600 text-white"
                }`}
              >
                {m.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div
                className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                  m.sender === "user"
                    ? "bg-action-black text-canvas rounded-tr-xs"
                    : "bg-surface border border-border-default text-text-primary rounded-tl-xs shadow-xs"
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed font-sans">{m.text}</div>
                <div
                  className={`text-[10px] text-right font-mono ${
                    m.sender === "user" ? "text-text-muted/60" : "text-text-muted"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-text-muted italic mr-auto pl-10">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
              <span>AI Tutor is drafting step-by-step guidance...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 bg-canvas border-t border-border-default flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-text-muted uppercase shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-500" /> Prompt:
          </span>
          {promptSuggestions.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] bg-surface border border-border-default hover:border-purple-400 px-2.5 py-1 rounded-full text-text-secondary hover:text-text-primary whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-surface border-t border-border-default">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Ask your ${selectedSubject} question...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-canvas border border-border-default rounded-xl px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
            />
            <Button
              size="default"
              variant="primary"
              type="submit"
              disabled={!inputText.trim()}
              leadingIcon={<Send className="w-3.5 h-3.5" />}
            >
              Ask Tutor
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
