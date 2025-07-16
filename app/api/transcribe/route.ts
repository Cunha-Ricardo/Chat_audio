import { openai } from "@ai-sdk/openai"
import { experimental_transcribe as transcribe } from "ai"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return Response.json({ error: "No audio file provided" }, { status: 400 })
    }

    const audioBuffer = await audioFile.arrayBuffer()
    const audioUint8Array = new Uint8Array(audioBuffer)

    const result = await transcribe({
      model: openai.transcription("whisper-1"),
      audio: audioUint8Array,
    })

    return Response.json({ text: result.text })
  } catch (error) {
    console.error("Transcription error:", error)
    return Response.json({ error: "Transcription failed" }, { status: 500 })
  }
}
