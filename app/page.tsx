"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, MicOff, MessageSquare, Volume2, Trash2, User, Bot, Send, Plus, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  transcription?: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export default function VoiceAIApp() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [textMessage, setTextMessage] = useState("")
  const [isSendingText, setIsSendingText] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Get active conversation
  const activeConversation = conversations.find((conv) => conv.id === activeConversationId)
  const messages = activeConversation?.messages || []

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "Nova Conversa",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setConversations((prev) => [newConversation, ...prev])
    setActiveConversationId(newConversation.id)
    setError("")
  }

  const updateConversationTitle = (conversationId: string, firstMessage: string) => {
    const title = firstMessage.length > 30 ? firstMessage.substring(0, 30) + "..." : firstMessage
    setConversations((prev) =>
      prev.map((conv) => (conv.id === conversationId ? { ...conv, title, updatedAt: new Date() } : conv)),
    )
  }

  const addMessageToConversation = (conversationId: string, userMessage: Message, aiMessage: Message) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          const updatedMessages = [...conv.messages, userMessage, aiMessage]
          // Update title if it's the first message
          const title =
            conv.messages.length === 0
              ? userMessage.content.length > 30
                ? userMessage.content.substring(0, 30) + "..."
                : userMessage.content
              : conv.title

          return {
            ...conv,
            messages: updatedMessages,
            title,
            updatedAt: new Date(),
          }
        }
        return conv
      }),
    )
  }

  const deleteConversation = (conversationId: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))
    if (activeConversationId === conversationId) {
      setActiveConversationId(null)
    }
  }

  const startRecording = async () => {
    if (!activeConversationId) {
      createNewConversation()
      return
    }

    try {
      setError("")

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        await processAudio(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)

      setTimeout(() => {
        if (mediaRecorderRef.current && isRecording) {
          stopRecording()
        }
      }, 10000)
    } catch (err) {
      setError("Erro ao acessar o microfone. Verifique as permissões.")
      console.error("Recording error:", err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    if (!activeConversationId) return

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "audio.webm")

      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!transcribeResponse.ok) {
        throw new Error("Falha na transcrição")
      }

      const transcribeData = await transcribeResponse.json()
      const transcribedText = transcribeData.text

      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: transcribedText,
          history: conversationHistory,
        }),
      })

      if (!chatResponse.ok) {
        throw new Error("Falha ao gerar resposta da IA")
      }

      const chatData = await chatResponse.json()

      const userMessage: Message = {
        role: "user",
        content: transcribedText,
        timestamp: new Date(),
        transcription: transcribedText,
      }

      const aiMessage: Message = {
        role: "assistant",
        content: chatData.response,
        timestamp: new Date(),
      }

      addMessageToConversation(activeConversationId, userMessage, aiMessage)

      setTimeout(() => {
        const scrollArea = document.querySelector("[data-radix-scroll-area-viewport]")
        if (scrollArea) {
          scrollArea.scrollTop = scrollArea.scrollHeight
        }
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      console.error("Processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const sendTextMessage = async () => {
    if (!textMessage.trim()) return

    if (!activeConversationId) {
      createNewConversation()
      return
    }

    setIsSendingText(true)
    setError("")

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textMessage,
          history: conversationHistory,
        }),
      })

      if (!chatResponse.ok) {
        throw new Error("Falha ao gerar resposta da IA")
      }

      const chatData = await chatResponse.json()

      const userMessage: Message = {
        role: "user",
        content: textMessage,
        timestamp: new Date(),
      }

      const aiMessage: Message = {
        role: "assistant",
        content: chatData.response,
        timestamp: new Date(),
      }

      addMessageToConversation(activeConversationId, userMessage, aiMessage)
      setTextMessage("")

      setTimeout(() => {
        const scrollArea = document.querySelector("[data-radix-scroll-area-viewport]")
        if (scrollArea) {
          scrollArea.scrollTop = scrollArea.scrollHeight
        }
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      console.error("Text message error:", err)
    } finally {
      setIsSendingText(false)
    }
  }

  const speakMessage = (text: string) => {
    if (text && "speechSynthesis" in window) {
      speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "pt-BR"
      utterance.rate = 0.9
      speechSynthesis.speak(utterance)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Hoje"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem"
    } else {
      return date.toLocaleDateString("pt-BR")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto h-[90vh] flex gap-4">
        {/* Sidebar - Histórico de Conversas */}
        <Card className="w-80 shadow-xl flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-gray-800">Conversas</CardTitle>
              <Button onClick={createNewConversation} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma conversa ainda</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                        activeConversationId === conversation.id
                          ? "bg-blue-100 border-blue-300 border"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                      onClick={() => setActiveConversationId(conversation.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-gray-800 truncate">{conversation.title}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{formatDate(conversation.updatedAt)}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{conversation.messages.length} mensagens</p>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteConversation(conversation.id)
                          }}
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Área Principal - Chat */}
        <Card className="flex-1 shadow-xl flex flex-col">
          <CardHeader className="text-center border-b">
            <div className="flex items-center justify-center gap-2">
              <Mic className="h-6 w-6" />
              <CardTitle className="text-2xl font-bold text-gray-800">
                {activeConversation ? activeConversation.title : "IA por Voz"}
              </CardTitle>
            </div>
            <p className="text-gray-600">
              {activeConversation ? `${messages.length} mensagens` : "Selecione uma conversa ou crie uma nova"}
            </p>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Chat Messages */}
            <div className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 px-4 py-2">
                <div className="space-y-4 pb-4">
                  {!activeConversation ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="mb-2">Bem-vindo ao Chat com IA!</p>
                        <Button onClick={createNewConversation} className="bg-blue-500 hover:bg-blue-600 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Iniciar Nova Conversa
                        </Button>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Comece a conversar!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex gap-3 max-w-[85%] ${
                            message.role === "user" ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.role === "user" ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                            }`}
                          >
                            {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          </div>
                          <div
                            className={`rounded-2xl px-4 py-3 break-words ${
                              message.role === "user"
                                ? "bg-blue-500 text-white rounded-br-md"
                                : "bg-gray-100 text-gray-800 rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                            <div
                              className={`flex items-center justify-between mt-2 gap-2 ${
                                message.role === "user" ? "flex-row-reverse" : "flex-row"
                              }`}
                            >
                              <span
                                className={`text-xs ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}
                              >
                                {formatTime(message.timestamp)}
                              </span>
                              {message.role === "assistant" && (
                                <Button
                                  onClick={() => speakMessage(message.content)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-gray-200 rounded-full"
                                >
                                  <Volume2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Input Controls */}
            {activeConversation && (
              <div className="border-t p-4 bg-gray-50 space-y-4">
                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">❌ {error}</p>
                  </div>
                )}

                {/* Text Input */}
                <div className="flex gap-2">
                  <Input
                    value={textMessage}
                    onChange={(e) => setTextMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                    disabled={isRecording || isProcessing || isSendingText}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendTextMessage()
                      }
                    }}
                  />
                  <Button
                    onClick={sendTextMessage}
                    disabled={!textMessage.trim() || isRecording || isProcessing || isSendingText}
                    className="bg-green-500 hover:bg-green-600 text-white px-4"
                  >
                    {isSendingText ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-sm text-gray-500 bg-gray-50 px-2">ou</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                {/* Voice Recording */}
                <div className="text-center space-y-3">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing || isSendingText}
                    size="lg"
                    className={`w-20 h-20 rounded-full text-white font-semibold transition-all duration-200 ${
                      isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="h-8 w-8" />
                    ) : isProcessing ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    ) : (
                      <Mic className="h-8 w-8" />
                    )}
                  </Button>

                  {/* Status */}
                  <div>
                    {isRecording && (
                      <Badge variant="destructive" className="animate-pulse">
                        🔴 Gravando... (máx. 10s)
                      </Badge>
                    )}
                    {isProcessing && <Badge variant="secondary">⏳ Processando áudio...</Badge>}
                    {isSendingText && <Badge variant="secondary">📤 Enviando mensagem...</Badge>}
                    {!isRecording && !isProcessing && !isSendingText && (
                      <p className="text-sm text-gray-600">Clique para gravar ou digite acima</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
