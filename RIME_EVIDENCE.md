\# RIME Evidence — HOLD ON



\## 1. Hard Voice Claim



HOLD ON solves the voice interaction problem of \*\*Interruption and Recovery\*\*.



\### Claim



When HOLD ON is speaking, the user can interrupt the assistant by saying \*\*“HOLD ON”\*\*.



The system should:



1\. Detect the interruption.

2\. Stop the current Rime-generated audio playback.

3\. Prevent the previous response from continuing.

4\. Capture the user's new request.

5\. Process the new request.

6\. Continue the conversation naturally.



The goal is to make the interaction feel like a real conversation rather than forcing the user to wait until the assistant finishes speaking.



\---



\## 2. Voice-Specific Challenge



A traditional chatbot can still function if speech is removed.



HOLD ON is designed around a voice-specific interaction:



> The user should be able to interrupt the assistant while it is speaking.



During assistant speech, HOLD ON activates speech recognition to listen for interruption phrases such as:



\- HOLD ON

\- holdon

\- hold own

\- hold one



When an interruption is detected, the system stops the current audio playback and switches control back to the user.



\---



\## 3. Acceptance Test



\### Test Scenario



1\. Start a voice conversation with HOLD ON.

2\. Ask a question that produces a sufficiently long spoken response.

3\. While HOLD ON is speaking, say:



&#x20;  \*\*“HOLD ON”\*\*



4\. Immediately give a new question or command.



\### Expected Result



\- The current Rime audio playback stops.

\- The previous response does not continue playing.

\- HOLD ON captures the new user request.

\- HOLD ON sends the new request to the AI.

\- A new response is generated.

\- Rime generates speech for the new response.

\- The conversation continues without requiring the user to manually restart the assistant.



\---



\## 4. Test Procedure



\### Normal Flow



```text

User speaks

&#x20;     ↓

Browser Speech Recognition

&#x20;     ↓

Gemini processes request

&#x20;     ↓

Rime generates speech

&#x20;     ↓

HOLD ON speaks response



Interruption Flow

HOLD ON is speaking

&#x20;     ↓

Wake-word detection becomes active

&#x20;     ↓

User says "HOLD ON"

&#x20;     ↓

Interruption detected

&#x20;     ↓

Current audio playback is stopped

&#x20;     ↓

Wake detection stops

&#x20;     ↓

New user command is captured

&#x20;     ↓

Gemini processes the new request

&#x20;     ↓

Rime generates new speech

&#x20;     ↓

Conversation continues

5\. Implementation Evidence



The implementation includes separate state handling for:



Listening

Thinking

Speaking



During speaking:



isSpeakingRef.current tracks whether the assistant is actively speaking.

audioRef.current stores the active Rime audio object.

Wake-word detection starts while audio is playing.

The active audio is paused when an interruption is detected.

Wake-word recognition is stopped before processing the new request.



The key interruption behavior is:



Detect "HOLD ON"

&#x20;       ↓

Stop active audio

&#x20;       ↓

Set speaking state to false

&#x20;       ↓

Stop wake detection

&#x20;       ↓

Capture new command

&#x20;       ↓

Process new request

6\. Manual Stress Test

Stress Case



The user deliberately interrupts the assistant while it is delivering a long response.



Procedure

Ask HOLD ON a question that generates a long response.

Wait until Rime audio playback begins.



Interrupt while the assistant is speaking by saying:



“HOLD ON”



Give a completely different follow-up request.

Expected Behavior



The previous audio should stop and should not resume.



The new user request should replace the previous conversational turn.



7\. Result

Current Result



HOLD ON successfully demonstrates:



Voice input

AI processing

Rime Text-to-Speech output

Interruptible audio playback

Wake-word based interruption attempts

Automatic continuation after speech playback

New voice input without manually pressing the microphone button

Observed Behavior



The assistant can stop the currently playing response when an interruption is detected and transition back into the conversation flow.



8\. Limitations

Browser-Based Wake Detection



The current prototype uses browser speech recognition rather than a dedicated wake-word engine.



Wake-word recognition may vary depending on:



Browser

Microphone quality

Background noise

Internet connection

Assistant Audio Interference



In some speaker setups, the microphone may detect the assistant's own audio output.



Headphones can improve interruption detection.



Speech Recognition Availability



The prototype currently works best in Google Chrome because it uses browser speech recognition APIs.



9\. Rime Configuration



HOLD ON uses Rime for Text-to-Speech generation.



The active configuration should match the implementation in server.js.



Documented configuration:



Provider: Rime

Endpoint: https://users.rime.ai/v1/rime-tts

Model ID: mistv3

Speaker: astra

Language: eng

Audio Format: audio/mpeg

Transport: HTTPS POST



API credentials are loaded from:



RIME\_API\_KEY



The actual API key is not included in the project or submission.



10\. Conclusion



HOLD ON demonstrates that voice interaction should go beyond:



User speaks → AI responds → User waits.



The project focuses on making voice interaction more conversational.



The central behavior being tested is:



The user can take control of the conversation while the assistant is still speaking.



This makes interruption and recovery a core part of the product experience rather than simply adding speech to a traditional chatbot.







