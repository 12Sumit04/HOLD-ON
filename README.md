HOLD ON

Voice, Without the Wait.



HOLD ON is a voice-first AI assistant designed around natural turn-taking.



Unlike a traditional chatbot with text-to-speech added on top, HOLD ON focuses on a voice-specific interaction problem:



The user should be able to interrupt the assistant while it is speaking, and the system should stop speaking and listen.



The assistant is designed to support natural conversation by allowing the user to take control of the conversation at any time.



The Problem



Most voice assistants follow a rigid interaction flow:



User speaks.

Assistant processes the request.

Assistant speaks.

User waits until the assistant finishes.



This creates an unnatural experience because humans often interrupt each other, change their minds, or ask a follow-up question before the previous response is finished.



HOLD ON focuses on improving this interaction.



When the assistant is speaking, the user can interrupt by saying:



“HOLD ON”



The system attempts to:



Detect the interruption.

Stop the current audio playback.

Cancel the active voice output.

Capture the user's new request.

Continue the conversation from the new input.

Hard Voice Problem

Interruption and Recovery



The primary voice challenge addressed by HOLD ON is:



How can a voice assistant stop speaking quickly when the user wants to interrupt and then recover the conversation naturally?



The system uses speech recognition while the assistant is speaking to listen for wake-word variations including:



HOLD ON

holdon

hold own

hold one



When detected, the current audio playback is stopped and the user's new command is processed.



The user can also manually interrupt the assistant using the microphone button.



Features

 Voice-First Interaction



Users interact primarily through speech rather than typing.



 Interruptible Conversations



The user can interrupt the assistant while it is speaking.



The assistant stops playback and listens for the user's next request.



Context-Aware Conversation



Recent conversation messages are stored and sent to the AI model so that follow-up questions can be understood in context.



 AI Voice Responses



HOLD ON converts AI responses into speech using the Rime Text-to-Speech API.



 Automatic Turn-Taking



After the assistant finishes speaking, HOLD ON automatically returns to listening mode so the user can continue the conversation.



Architecture

User Voice

&#x20;   │

&#x20;   ▼

Browser Speech Recognition

&#x20;   │

&#x20;   ▼

React Frontend

&#x20;   │

&#x20;   ▼

Express Backend

&#x20;   │

&#x20;   ▼

Gemini AI

&#x20;   │

&#x20;   ▼

AI Response

&#x20;   │

&#x20;   ▼

Rime Text-to-Speech

&#x20;   │

&#x20;   ▼

Audio Playback

&#x20;   │

&#x20;   ▼

User



Interruption Flow

Assistant Speaking

&#x20;       │

&#x20;       ▼

Wake Word Detection Active

&#x20;       │

&#x20;       ▼

User says "HOLD ON"

&#x20;       │

&#x20;       ▼

Audio Playback Stops

&#x20;       │

&#x20;       ▼

New User Command Captured

&#x20;       │

&#x20;       ▼

Gemini Processes Request

&#x20;       │

&#x20;       ▼

Rime Generates New Speech

&#x20;       │

&#x20;       ▼

Conversation Continues



Technology Stack

Frontend

React

Vite

CSS

Browser Speech Recognition API

Backend

Node.js

Express

CORS

dotenv

AI

Google Gemini

Text-to-Speech

Rime TTS API

Setup Instructions

1\. Install Node.js



Install Node.js from the official Node.js website.



After installation, verify:

node -v

npm -v



2\. Install Dependencies



Open a terminal inside the project folder and run:



npm install



3\. Create Environment Variables



Create a file named:



.env



Copy the structure from:



.env.example



Add your own API keys:



GEMINI\_API\_KEY=your\_gemini\_api\_key

RIME\_API\_KEY=your\_rime\_api\_key



4\. Start the Backend



Run:



node server.js



The backend should start on:



http://localhost:3001



5\. Start the Frontend



Open another terminal in the project folder and run:



npm run dev



Open the URL shown by Vite in your browser.



Rime Configuration



HOLD ON uses the Rime Text-to-Speech API.



Endpoint

https://users.rime.ai/v1/rime-tts

Configuration

Model ID: mistv3

Speaker: astra

Language: eng

Audio Format: audio/mpeg

Transport: HTTPS POST



The Rime API key is provided through:



RIME\_API\_KEY



Conversation Memory



The backend stores a limited recent conversation history.



The current implementation keeps up to:



10 messages



This allows HOLD ON to understand follow-up questions and conversational references.



Known Limitations

Browser Speech Recognition



HOLD ON currently relies on the browser's speech recognition implementation.



Speech recognition quality may vary depending on:



Browser

Internet connection

Microphone quality

Background noise



Google Chrome is recommended.



Wake Word Detection



Wake-word detection currently uses browser speech recognition and text matching.



It is not a dedicated always-on wake-word model.



Therefore, detection accuracy may vary.



Speech Recognition During Playback



Depending on the browser and microphone setup, the system may detect some audio from the assistant's own voice output.



Headphones can improve interruption detection.



Failure Behavior



If the AI request fails:



Could not connect to HOLD ON AI.



is displayed.



If voice generation fails:



Voice generation failed.



is displayed.



If audio playback fails:



Voice playback failed.



is displayed.



If browser speech recognition is unavailable:



Speech recognition is not supported in this browser.



is displayed.



Environment Variables



The project requires:



GEMINI\_API\_KEY=

RIME\_API\_KEY=



Real API keys should never be committed to the repository or included in the submission.



Use .env.example as a configuration template.



Demo



The demonstration should show:



A normal voice interaction.

The assistant responding with Rime TTS.

The user interrupting the assistant.

Audio playback stopping.

The assistant listening to the user's new request.

The conversation continuing naturally.

Project Goal



HOLD ON explores a simple idea:



Voice assistants should not force users to wait for them to finish speaking.



The goal is to create a more natural voice interaction where the user can interrupt, redirect, and continue the conversation freely.

