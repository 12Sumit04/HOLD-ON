import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// ==========================================
// CHECK ENVIRONMENT VARIABLES
// ==========================================

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is missing from .env')
}

if (!process.env.RIME_API_KEY) {
  console.warn('⚠️ RIME_API_KEY is missing from .env')
}

// ==========================================
// GEMINI
// ==========================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

// ==========================================
// CONVERSATION MEMORY
// ==========================================

const conversationHistory = []

const MAX_HISTORY = 10

// ==========================================
// WAIT FUNCTION
// ==========================================

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// ==========================================
// GEMINI WITH RETRY + FALLBACK
// ==========================================

async function askGemini() {
  const models = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-2.5-flash-lite',
  ]

  let lastError = null

  for (const model of models) {
    // Try each model twice
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(
          `🤖 Trying Gemini model: ${model} (attempt ${attempt})`
        )

        const response =
          await ai.models.generateContent({
            model: model,

            contents: conversationHistory,

            config: {
              systemInstruction: `
You are HOLD ON, a fast and intelligent voice assistant.

You can see the recent conversation history.

Use previous messages to understand follow-up
questions and references.

Keep every response short and conversational.

Usually answer in 1 to 3 sentences.

Avoid unnecessary introductions.

Your responses will be converted into speech,
so prioritize speed, clarity, and natural language.
`,

              thinkingConfig: {
                thinkingLevel: 'minimal',
              },
            },
          })

        const reply = response.text

        if (!reply) {
          throw new Error(
            'Gemini returned an empty response.'
          )
        }

        console.log(
          `✅ Gemini responded using ${model}`
        )

        return reply

      } catch (error) {
        lastError = error

        console.error(
          `❌ ${model} failed:`,
          error.message
        )

        // Wait before retrying
        if (attempt < 2) {
          console.log(
            '⏳ Waiting 1.5 seconds before retry...'
          )

          await wait(1500)
        }
      }
    }
  }

  throw lastError
}

// ==========================================
// CHAT API
// ==========================================

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body

    // Validate message
    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'Please provide a message.',
      })
    }

    console.log('\n==============================')
    console.log('User message:', message)

    // Add user message to memory
    conversationHistory.push({
      role: 'user',
      parts: [
        {
          text: message,
        },
      ],
    })

    // Keep only recent messages
    if (
      conversationHistory.length >
      MAX_HISTORY
    ) {
      conversationHistory.splice(
        0,
        conversationHistory.length -
          MAX_HISTORY
      )
    }

    console.log(
      'Conversation messages:',
      conversationHistory.length
    )

    // START TIMER
    const geminiStartTime =
      Date.now()

    // Ask Gemini
    const reply =
      await askGemini()

    // END TIMER
    const geminiEndTime =
      Date.now()

    console.log(
      `⚡ Gemini response time: ${
        geminiEndTime -
        geminiStartTime
      } ms`
    )

    // Save assistant response
    conversationHistory.push({
      role: 'model',
      parts: [
        {
          text: reply,
        },
      ],
    })

    // Keep memory limited
    if (
      conversationHistory.length >
      MAX_HISTORY
    ) {
      conversationHistory.splice(
        0,
        conversationHistory.length -
          MAX_HISTORY
      )
    }

    console.log(
      'Gemini reply:',
      reply
    )

    console.log(
      '==============================\n'
    )

    // Send response
    res.json({
      reply: reply,
    })

  } catch (error) {

    console.error(
      '\n❌ GEMINI ERROR:'
    )

    console.error(
      error
    )

    // Check Gemini status
    const status =
      error.status ||
      error.statusCode ||
      500

    // If Gemini is overloaded
    if (status === 503) {

      return res.status(503).json({
        error:
          'Gemini is temporarily busy. Please try again in a moment.',
      })
    }

    // Rate limit
    if (status === 429) {

      return res.status(429).json({
        error:
          'Too many requests. Please wait a moment and try again.',
      })
    }

    // Other errors
    res.status(500).json({
      error:
        error.message ||
        'Something went wrong while talking to Gemini.',
    })
  }
})

// ==========================================
// RIME TEXT TO SPEECH API
// ==========================================

app.post('/api/speak', async (req, res) => {
  try {
    const { text } = req.body

    if (!text) {
      return res.status(400).json({
        error: 'Text is required.',
      })
    }

    console.log(
      '🎙️ Generating Rime voice...'
    )

    const response = await fetch(
      'https://users.rime.ai/v1/rime-tts',
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${process.env.RIME_API_KEY}`,

          'Content-Type':
            'application/json',

          Accept:
            'audio/mpeg',
        },

        body: JSON.stringify({
          speaker: 'astra',
          text: text,
          modelId: 'mistv3',
          lang: 'eng',
        }),
      }
    )

    // Handle Rime errors
    if (!response.ok) {

      const errorText =
        await response.text()

      console.error(
        '❌ Rime API error:',
        response.status,
        errorText
      )

      return res.status(
        response.status
      ).json({
        error: errorText,
      })
    }

    // Get audio
    const audioBuffer =
      await response.arrayBuffer()

    res.setHeader(
      'Content-Type',
      'audio/mpeg'
    )

    res.send(
      Buffer.from(audioBuffer)
    )

    console.log(
      '✅ Rime voice generated'
    )

  } catch (error) {

    console.error(
      '❌ Rime server error:',
      error
    )

    res.status(500).json({
      error:
        'Rime speech generation failed.',
    })
  }
})

// ==========================================
// START SERVER
// ==========================================

const PORT = 3001

app.listen(PORT, () => {

  console.log('\n==============================')

  console.log(
    '🚀 HOLD ON BACKEND RUNNING'
  )

  console.log(
    `📡 http://localhost:${PORT}`
  )

  console.log(
    '==============================\n'
  )

})