# Voice AI 

## Run

Requires Node.js 20.6 or later. No dependency installation is needed. Open `.env` in this folder and paste your key after `OPENAI_API_KEY=`. Keep `.env` private; it is already excluded from Git. For a fresh checkout, copy `.env.example` to `.env` first.

```powershell
cd 'C:\Users\prisc\OneDrive - Calvin University\4Fall\senior project\AI_Voice_for_Mental_Health'
npm start
```

Open [the local prototype](http://127.0.0.1:8787). Create a room and open the A and B links in separate tabs. Each participant acknowledges the fictional-data demo. Both may share messages and select Ready or Skip to advance. Either can pause or stop the whole session. The researcher view exports JSON or deletes the room.

Default text mode is scripted demo, with no API key or network AI calls. Voice mode always uses GPT-Live and requires a server API key. It tests flow, not adaptive LLM behavior. Sessions live in memory until deletion or server restart. Exports are separate copies. Secret links grant access; keep them private. The server binds only to loopback, so remote separate-location participation is not deployed yet.

## Optional LLM mode

In `.env`, set `OPENAI_API_KEY` to your key and `CHAT_MODE=openai` to enable AI text responses. `npm start` loads `.env`; restart the server after editing it. Existing shell environment variables take precedence. Never put the key in browser files or participant links. Then:

```powershell
$env:CHAT_MODE = 'openai'
$env:API_MODEL = 'gpt-4.1-2025-04-14'
npm start
```

The server calls OpenAI for requested guide support and phase-end Analyzer summaries in PS/DS. BP uses fixed prompts. Calls set `store: false`, which does not eliminate all provider processing/retention. Live paid API calls have not been verified; the integration is tested with a mock. See the [official API reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create) and [model documentation](https://developers.openai.com/api/docs/models/gpt-4.1).

## Verify

```powershell
node --test tests/*.test.mjs
```

## Materials

- [Replication protocol](protocol.md): procedure, randomization, analysis, participant handling.
- [Measures](measures.md): source instrument/scoring and coding checklist.
- [Fidelity register](fidelity.md): implemented features, departures, research-readiness work.
- `study.mjs`: phase sequences and reconstructed prompts.
- `server.mjs`: dyad sessions, controller, Driver/Analyzer, exports.
- `public/`: browser interface.
- `design_alternatives/solo/`: inactive earlier solo proposal; its CP arm and surveys do not apply here.

This is an independently written browser text reconstruction with paraphrased prompts, not the authors' exact Telegram implementation. Optional GPT-Live voice is now available as a documented modality/model extension; text remains the default. The full original questionnaires, richer rapport behavior, secure remote participation, and research consent must be finalized before recruitment. Corrections to the closing recap are logged in chat; the displayed recap is not automatically rewritten. The export's `surveys` field is currently reserved and empty.

Reference: Jiang, Z., Yeo, S., Herremans, D., & Perrault, S. T. (2026). *Scaffolded Vulnerability: Chatbot-Mediated Reciprocal Self-Disclosure and Need-Supportive Interaction in Couples*. CHI 2026. [Published article](https://doi.org/10.1145/3772318.3791370), [full-text preprint v1](https://arxiv.org/html/2602.07508v1), [authors' prototype](https://github.com/AMAAI-Lab/relational-ai). Verify preprint/published-version consistency before registration. No upstream code was copied or executed.


## Voice conversations (GPT-Live)

Select **Voice · GPT-Live** when creating a room. Both partners join their links. A clicks **Connect voice** first; B also connects. Once both audio connections are ready, take turns with **Start my speaking turn**. Microphones start off. Click **Microphone off · review**, wait for the transcript to settle, edit it, then **Share corrected transcript** or **Discard transcript**. Use **Ask voice guide** for a spoken response. Both partners hear the speaker and guide. Use headphones; A must keep their hosting tab open.

The server uses OPENAI_API_KEY and defaults to LIVE_MODEL=gpt-live-1, LIVE_VOICE=marin. No long-lived API key reaches the browser. This uses the dedicated Live endpoint, not browser speech recognition or the older Realtime API. Voice works even when text chat is in demo mode; PS/DS voice phase summaries use the configured text model through the existing Analyzer. See [voice setup and architecture](VOICE.md).

Pause, stop, disconnect, and leaving the page switch off microphone tracks. A room pause or stop disconnects the other participant when their next state poll arrives (normally within 1.5 seconds). Reconnect both partners after a pause. Partner audio uses a direct WebRTC connection; the current local prototype has no TURN relay and does not yet support arbitrary remote networks. Real microphone-to-provider playback has not been verified in this implementation session; tests use mock media and provider responses.

## Two conversation conditions

The setup now offers Condition 1 (solo + AI) and Condition 2 (two participants + AI). Solo starts after A joins; each text message receives a reply automatically. Solo voice connects without B; finish, review and share a transcript to request the AI response. With CHAT_MODE=demo, text responses remain scripted. Set CHAT_MODE=openai for AI text. Condition 2 uses the original PS partner-support protocol and requires both participants to join and vote to continue.

The original PS, DS and BP protocols differ meaningfully: PS includes partner reflections, DS omits them, and BP supplies fixed questions without AI support. They remain available through the legacy API for reproducibility, but the setup menu uses the new two-condition comparison. Random assignment was an allocation option, not a fourth protocol. This new solo-versus-duo comparison is a study adaptation.

## Connect a phone on the same Wi-Fi

Restart with npm start. HOST=0.0.0.0 in .env enables LAN listening; the terminal prints Same Wi-Fi addresses. Open the computer’s Wi-Fi IPv4 address on the phone, for example http://192.168.1.20:8787. Both devices must use the same trusted network; allow Node through Windows Firewall on private networks if prompted. 127.0.0.1 or localhost on a phone means the phone itself. Open the LAN address on the computer before creating a room so the generated participant links use that address. Send the B link to the phone. Keep the computer running. Set HOST=127.0.0.1 for computer-only access.

LAN HTTP supports text testing. Phone microphone access requires a trusted HTTPS deployment or HTTPS tunnel; direct partner audio may also need TURN across different networks. The app does not set up HTTPS or a relay. Do not port-forward this prototype.

## Microphone feedback

When a key is configured, the setup defaults to voice. Connect voice and select Start my speaking turn. A microphone meter updates ten times per second; incoming transcript text appears below it (server polling can add up to 1.5 seconds). After three seconds without audible input, the screen says “I can’t hear you.” If sound is detected but no transcript arrives, it reports the recognition/connection delay separately. After a guide request or approved solo transcript, a three-second response notice reports a delayed AI response. These notices do not stop the microphone. Finish your turn, review the transcript, and select Share corrected transcript for a solo AI reply. Pause or disconnect stops the meter and microphone.

## Voice interaction update

After joining an active voice room, the page automatically requests microphone permission and connects with the microphone muted. Start my speaking turn enables speech. Microphone off · review mutes immediately, including while a request is pending or fails. Hiding the tab mutes and finishes your turn for review; leaving closes the local media and sends a best-effort disconnect. Returning does not resume recording. Disconnect stays off until Reconnect voice is selected. If permission or playback is blocked by the browser, use Reconnect voice or Start my speaking turn.

Use the single Send to AI button to send a reviewed transcript or a typed message. Sending with an empty text box requests another AI reply. Approved voice transcripts now trigger a reply in both solo and duo rooms (BP retains its fixed-question behavior). Spoken guide transcripts are streamed into the conversation as AI messages, updated as fragments arrive, and included in exports.

## Conversational flow and closing summary

New solo/duo rooms introduce the AI and explain how to pass on a question by speaking naturally, for example “I don’t want to answer that” or “let’s talk about something else.” Send the reviewed transcript as usual. The controller recognizes common refusal/topic-change phrases and picks a different gentle topic, while the voice instructions also cover indirect wording. Ready and Skip buttons have been removed. Legacy protocol endpoints remain available for prior tests.

In voice mode, only the transcript review box is shown; the duplicate typed-message composer is hidden. Select Stop session to immediately end audio and generate a discussion summary displayed below the conversation. Summaries use submitted participant messages only, excluding unsent/discarded transcripts. Both participants can read a duo summary. If the summary API fails, the session remains stopped and an explicitly labeled transcript recap is shown. Repeated stop calls reuse the same summary. Summaries are included in research exports.

## Shared AI system prompt

Edit SUPPORT_SYSTEM_PROMPT in conversation.mjs to change the current solo/duo support persona. Both GPT-Live startup instructions and AI text responses use it through supportInstructions(), with participant context, turn-taking controls and conversational policy appended. The concise prompt covers psychology-informed support, consent before advice, respecting refusals, professional boundaries, immediate safety and faithful summaries. The closing-summary request retains its separate task-specific instructions. Legacy protocol modes retain their original prompts. Restart the server and create a new room to apply prompt changes to voice sessions.
