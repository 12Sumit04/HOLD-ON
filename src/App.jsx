import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isThinking, setIsThinking] = useState(false)

  const [message, setMessage] = useState('Ready for your voice')
  const [transcript, setTranscript] = useState('')
  const [aiReply, setAiReply] = useState('')

  const recognitionRef = useRef(null)
  const wakeRecognitionRef = useRef(null)
  const audioRef = useRef(null)

  const transcriptRef = useRef('')
  const isSpeakingRef = useRef(false)
  const wakeTriggeredRef = useRef(false)

  // ==============================
  // CLEANUP
  // ==============================

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (error) {
          console.log(error)
        }
      }

      if (wakeRecognitionRef.current) {
        try {
          wakeRecognitionRef.current.stop()
        } catch (error) {
          console.log(error)
        }
      }

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // ==============================
  // STOP LISTENING
  // ==============================

  function stopListening() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.log(error)
      }

      recognitionRef.current = null
    }

    setIsListening(false)
  }

  // ==============================
  // STOP WAKE DETECTION
  // ==============================

  function stopVoiceDetection() {
    wakeTriggeredRef.current = false

    if (wakeRecognitionRef.current) {
      try {
        wakeRecognitionRef.current.stop()
      } catch (error) {
        console.log(error)
      }

      wakeRecognitionRef.current = null
    }
  }

  // ==============================
  // ASK AI
  // ==============================

  async function askAI(userMessage) {
    try {
      setIsThinking(true)
      setMessage('HOLD ON is thinking...')
      setAiReply('')

      const response = await fetch(
        'http://localhost:3001/api/chat',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            message: userMessage,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'AI request failed'
        )
      }

      setAiReply(data.reply)
      setIsThinking(false)

      speakText(data.reply)

    } catch (error) {
      console.error('AI error:', error)

      setIsThinking(false)

      setMessage(
        'Could not connect to HOLD ON AI.'
      )
    }
  }

  // ==============================
  // NORMAL LISTENING
  // ==============================

  function startListening() {
    stopVoiceDetection()

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.log(error)
      }
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setMessage(
        'Speech recognition is not supported in this browser.'
      )
      return
    }

    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      setIsThinking(false)

      setMessage('Listening... Speak now.')

      transcriptRef.current = ''

      setTranscript('')
      setAiReply('')
    }

    recognition.onresult = (event) => {
      let spokenText = ''

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        spokenText +=
          event.results[i][0].transcript
      }

      if (spokenText.trim()) {
        transcriptRef.current =
          spokenText.trim()

        setTranscript(
          transcriptRef.current
        )
      }
    }

    recognition.onend = () => {
      setIsListening(false)

      const finalTranscript =
        transcriptRef.current.trim()

      if (finalTranscript) {
        transcriptRef.current = ''

        askAI(finalTranscript)
      } else {
        setMessage('Ready for your voice')
      }
    }

    recognition.onerror = (event) => {
      console.error(
        'Speech recognition error:',
        event.error
      )

      setIsListening(false)

      if (
        event.error !== 'aborted' &&
        event.error !== 'no-speech'
      ) {
        setMessage(
          `Voice error: ${event.error}`
        )
      }
    }

    recognitionRef.current = recognition

    recognition.start()
  }

  // ==============================
  // WAKE WORD DETECTION
  // ==============================

  function startVoiceDetection() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      return
    }

    if (wakeRecognitionRef.current) {
      try {
        wakeRecognitionRef.current.stop()
      } catch (error) {
        console.log(error)
      }
    }

    wakeTriggeredRef.current = false

    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 3

    recognition.onresult = (event) => {
      if (!isSpeakingRef.current) {
        return
      }

      const wakeWords = [
        'hold on',
        'holdon',
        'hold own',
        'hold one',
      ]

      let detectedText = ''
      let detected = false

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const result = event.results[i]

        for (
          let j = 0;
          j < result.length;
          j++
        ) {
          const text =
            result[j].transcript.toLowerCase()

          if (
            wakeWords.some((word) =>
              text.includes(word)
            )
          ) {
            detected = true
            detectedText =
              result[j].transcript

            break
          }
        }

        if (detected) break
      }

      if (!detected) return

      if (wakeTriggeredRef.current) return

      wakeTriggeredRef.current = true

      // STOP AI SPEAKING
      isSpeakingRef.current = false

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }

      setIsSpeaking(false)

      stopVoiceDetection()

      const command = detectedText
        .replace(
          /hold on|holdon|hold own|hold one/gi,
          ''
        )
        .trim()

      if (command) {
        setTranscript(command)
        askAI(command)
      } else {
        setMessage(
          'I hear you. Speak now...'
        )

        setTimeout(() => {
          startListening()
        }, 200)
      }
    }

    recognition.onerror = () => {
      // Browser speech recognition may stop randomly.
      // onend below restarts it while speaking.
    }

    recognition.onend = () => {
      if (
        isSpeakingRef.current &&
        !wakeTriggeredRef.current
      ) {
        setTimeout(() => {
          try {
            recognition.start()
          } catch (error) {
            console.log(error)
          }
        }, 300)
      }
    }

    wakeRecognitionRef.current = recognition

    recognition.start()
  }

  // ==============================
  // TEXT TO SPEECH
  // ==============================

  async function speakText(text) {
    try {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }

      isSpeakingRef.current = true

      setIsSpeaking(true)
      setIsThinking(false)

      setMessage(
        'HOLD ON is speaking...'
      )

      // Listen for interruption
      startVoiceDetection()

      const response = await fetch(
        'http://localhost:3001/api/speak',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            text,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(
          'Speech generation failed'
        )
      }

      const audioBlob =
        await response.blob()

      const audioUrl =
        URL.createObjectURL(audioBlob)

      const audio =
        new Audio(audioUrl)

      audioRef.current = audio

     audio.onended = () => {
  URL.revokeObjectURL(audioUrl)

  if (audioRef.current === audio) {
    isSpeakingRef.current = false

    stopVoiceDetection()

    setIsSpeaking(false)

    audioRef.current = null

    setMessage(
      'Listening... Speak now.'
    )

    // Automatically listen for next question
    setTimeout(() => {
      startListening()
    }, 300)
  }
}

      audio.onerror = () => {
        isSpeakingRef.current = false

        setIsSpeaking(false)

        stopVoiceDetection()

        URL.revokeObjectURL(audioUrl)

        setMessage(
          'Voice playback failed.'
        )
      }

      await audio.play()

    } catch (error) {
      console.error(
        'Speech error:',
        error
      )

      isSpeakingRef.current = false

      setIsSpeaking(false)

      stopVoiceDetection()

      setMessage(
        'Voice generation failed.'
      )
    }
  }

  // ==============================
  // MICROPHONE BUTTON
  // ==============================

  function handleMicrophone() {
    // Interrupt assistant manually
    if (isSpeakingRef.current) {
      isSpeakingRef.current = false

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }

      stopVoiceDetection()

      setIsSpeaking(false)

      setMessage(
        'Interrupted. Speak now...'
      )

      setTimeout(() => {
        startListening()
      }, 150)

      return
    }

    // Stop listening
    if (isListening) {
      stopListening()

      setMessage(
        'Ready for your voice'
      )

      return
    }

    // Start listening
    startListening()
  }

  // ==============================
  // STOP EVERYTHING
  // ==============================

  function stopEverything() {
    stopListening()
    stopVoiceDetection()

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }

    isSpeakingRef.current = false

    setIsSpeaking(false)
    setIsThinking(false)

    setMessage(
      'Ready for your voice'
    )
  }

  // ==============================
  // CLEAR
  // ==============================

  function clearConversation() {
    setTranscript('')
    setAiReply('')
    setMessage('Ready for your voice')
  }

  // ==============================
  // UI STATE
  // ==============================

  const assistantState =
    isListening
      ? 'Listening'
      : isSpeaking
      ? 'Speaking'
      : isThinking
      ? 'Thinking'
      : 'Ready'

  return (
    <main className="app">

      {/* ================= NAVBAR ================= */}

      <nav className="top-nav">

        <div className="brand">

          <div className="brand-icon">
            H
          </div>

          <div className="brand-name">
            HOLD ON
          </div>

        </div>

        <div className="nav-center">
          <span>VOICE, WITHOUT THE WAIT.</span>
        </div>

        <div className="online-status">
          <span className="online-dot"></span>
          Assistant Online
        </div>

      </nav>


      {/* ================= MAIN GRID ================= */}

      <section className="dashboard">


        {/* LEFT */}

        <section className="left-panel">

          <p className="eyebrow">
            VOICE, WITHOUT THE WAIT.
          </p>

          <h1>
            HOLD <span>ON</span>
          </h1>

          <p className="tagline">
            A voice assistant that knows
            when to stop and listen.
          </p>

          <div className="left-features">

            <div className="side-feature">
              <span>Ⅱ</span>

              <div>
                <h3>
                  Pause. Listen. Understand.
                </h3>

                <p>
                  HOLD ON intelligently pauses so you can speak freely.
                </p>
              </div>
            </div>

            <div className="side-feature">
              <span>⚡</span>

              <div>
                <h3>
                  You talk. It listens.
                </h3>

                <p>
                  Natural conversations with real turn-taking.
                </p>
              </div>
            </div>

            <div className="side-feature">
              <span>✦</span>

              <div>
                <h3>
                  Smarter responses.
                </h3>

                <p>
                  Context aware replies that feel human.
                </p>
              </div>
            </div>

          </div>

        </section>


        {/* CENTER */}

        <section className="assistant-panel">

          <div
            className={`orb-area ${
              isListening
                ? 'orb-listening'
                : ''
            } ${
              isSpeaking
                ? 'orb-speaking'
                : ''
            } ${
              isThinking
                ? 'orb-thinking'
                : ''
            }`}
          >
            <div className="orb-wave">
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
</div>

            <div className="orb-wave-line">
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
</div>
            <div className="orb-ring ring-one"></div>
            <div className="orb-ring ring-two"></div>

            <div className="assistant-orb">

              <div className="orb-core">

                <div className="wave-bars">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <h2>
                  {assistantState}
                </h2>

                <p>
                  {isListening
                    ? 'HOLD ON is listening. Speak freely.'
                    : isSpeaking
                    ? 'Say HOLD ON to interrupt.'
                    : isThinking
                    ? 'Understanding your request...'
                    : 'Tap the microphone to begin.'
                  }
                </p>

              </div>

            </div>

          </div>


          {/* CONTROLS */}

          <div className="controls">

            <button
              className="control-button"
              onClick={handleMicrophone}
            >
              {isSpeaking
                ? 'Ⅱ Pause'
                : '▶ Start'}
            </button>

            <button
              className={`main-mic ${
                isListening
                  ? 'active'
                  : ''
              }`}
              onClick={handleMicrophone}
              aria-label="Start microphone"
            >
              🎤
            </button>

            <button
              className="control-button"
              onClick={stopEverything}
            >
              ■ Stop
            </button>

          </div>

          <p className="tap-text">
            〰 Tap the microphone and start speaking
          </p>

        </section>


        {/* RIGHT */}

        <section className="transcript-panel">

          <div className="transcript-header">

            <div>
              <span>〰</span>
              LIVE TRANSCRIPT
            </div>

            <button
              onClick={clearConversation}
            >
              Clear
            </button>

          </div>

          <div className="conversation">

            {!transcript &&
              !aiReply &&
              !isListening &&
              !isThinking && (

                <div className="empty-state">
                  Your conversation will appear here.
                </div>

              )}

            {transcript && (

              <div className="message-card user-message">

                <div className="message-label">
                  <strong>You</strong>
                  <span>Just now</span>
                </div>

                <p>
                  {transcript}
                </p>

              </div>

            )}

            {isThinking && (

              <div className="message-card ai-message">

                <div className="message-label">
                  <strong>HOLD ON</strong>
                </div>

                <p className="typing">
                  Thinking
                  <span></span>
                  <span></span>
                  <span></span>
                </p>

              </div>

            )}

            {aiReply && (

              <div className="message-card ai-message">

                <div className="message-label">
                  <strong>HOLD ON</strong>
                  <span>AI</span>
                </div>

                <p>
                  {aiReply}
                </p>

              </div>

            )}

          </div>

          <div className="transcript-footer">
            ✦ HOLD ON knows when to stop and listen.
          </div>

        </section>

      </section>


      {/* ================= FEATURE CARDS ================= */}

      <section className="feature-cards">

        <div className="feature-card">
          <span>Ⅱ</span>

          <div>
            <h3>Interruptible</h3>
            <p>
              You can speak anytime.
              I'll listen.
            </p>
          </div>
        </div>

        <div className="feature-card">
          <span>🧠</span>

          <div>
            <h3>Context Aware</h3>
            <p>
              Remembers what matters
              across the conversation.
            </p>
          </div>
        </div>

        <div className="feature-card">
          <span>♟</span>

          <div>
            <h3>Natural Turn-Taking</h3>
            <p>
              Real conversations.
              No talking over you.
            </p>
          </div>
        </div>

        <div className="feature-card">
          <span>⚡</span>

          <div>
            <h3>Low Latency</h3>
            <p>
              Optimized for fast,
              natural responses.
            </p>
          </div>
        </div>

      </section>


      {/* ================= BOTTOM FEATURES ================= */}

      <section className="bottom-strip">

        <div>
          <span>⚡</span>

          <section>
            <h3>Voice First</h3>
            <p>Natural conversation</p>
          </section>
        </div>

        <div>
          <span>〰</span>

          <section>
            <h3>Hands-free</h3>
            <p>Voice-first experience</p>
          </section>
        </div>

        <div>
          <span>⬡</span>

          <section>
            <h3>Privacy first</h3>
            <p>Your data stays private</p>
          </section>
        </div>

        <div>
          <span>⚙</span>

          <section>
            <h3>Always improving</h3>
            <p>Intelligent conversations</p>
          </section>
        </div>

      </section>

    </main>
  )
}

export default App