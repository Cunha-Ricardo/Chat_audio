export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json()

    if (!message) {
      return Response.json({ error: "No message provided" }, { status: 400 })
    }

    // Usar o assistente específico
    const assistantId = "asst_rK2Ki7GwU6uCySTE3dVGTwRO"

    // Criar uma thread para a conversa
    const thread = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        messages: [
          ...history.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          })),
          {
            role: "user",
            content: message,
          },
        ],
      }),
    })

    const threadData = await thread.json()
    const threadId = threadData.id

    // Executar o assistente
    const run = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        assistant_id: assistantId,
      }),
    })

    const runData = await run.json()
    const runId = runData.id

    // Aguardar a conclusão
    let runStatus = "in_progress"
    while (runStatus === "in_progress" || runStatus === "queued") {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const statusCheck = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      })

      const statusData = await statusCheck.json()
      runStatus = statusData.status
    }

    // Obter as mensagens da thread
    const messages = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
      },
    })

    const messagesData = await messages.json()
    const lastMessage = messagesData.data[0]
    const response = lastMessage.content[0].text.value

    return Response.json({ response })
  } catch (error) {
    console.error("Assistant error:", error)
    return Response.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
