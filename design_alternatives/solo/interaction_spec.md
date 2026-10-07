# Proposed solo interaction specification

These are original prompts for the solo adaptation. They are not copied from the paper or validated intervention materials.

## Common interaction rules

Ask one question at a time. Listen until the user finishes or submits; do not interrupt a silence with pressure to disclose. Support pause, skip, repeat, correction, and stop in all arms. Confirm uncertain transcription before interpreting it. Do not infer emotion from prosody as a fact.

Reflect tentative interpretations as possibilities and ask the user whether they fit. Keep user statements distinguishable from AI suggestions. Do not fabricate personal experiences, diagnose, claim therapeutic effectiveness, determine another person's motives, or recommend confrontation as the default. If a user describes danger or becomes distressed, leave the experiment flow and follow the institution-approved response procedure. Log the deviation without retaining unnecessary sensitive detail.

All arms receive the same brief orientation: “This is an AI reflection activity. You may correct a transcript, skip any question, pause, or stop. Choose a mild everyday experience you feel comfortable discussing.”

## Core questions in all arms

1. Event: “What happened? Describe what you observed without needing to name anyone.”
2. Feelings: “What feelings do you notice when you think about that experience?”
3. Meaning: “What mattered to you in that situation?”

BP presents these questions in order with only neutral acknowledgments and clarification of transcription. BP must not insert emotional validation, reinterpret the event, or suggest a communication plan.

## Direct support additions (DS and CP)

Provide brief, content-grounded support rather than generic praise. Examples:

- Choice: “Would you like to explore that feeling, or move to what mattered to you?”
- Rationale: “Separating what happened from your interpretation can help us keep your account accurate.”
- Tentative reflection: “You mentioned wanting recognition for your effort. Is that the main concern, or am I missing something?”
- Clarification: “Would a feeling word help, or would you prefer to describe it in your own terms?”

The controller permits up to two optional clarification turns per core phase as an initial pilot setting. Follow-ups should not introduce communication rehearsal in DS. Treat this turn budget as a new design choice to evaluate in the pilot.

## Communication preparation additions (CP only)

After the core phases, invite rather than require a next-step exercise:

1. Uncertainty: “What do you know about the other person's perspective, and what would you need to ask rather than assume?”
2. Optional request: “If you want to talk with them, what would you like them to understand or do?”
3. Rehearsal: “How could you say that in your own words while leaving room for their response?”

The AI can suggest a short draft only after the participant requests help. Identify it as a suggestion, then ask for correction. Do not generate simulated testimony from the absent person. An acceptable outcome is no conversation, a boundary, seeking human support, or postponing action.

## State flow

Common: orientation → event → feelings → meaning.

- BP: core flow → factual record review → close.
- DS: optional rapport → supported core flow → factual record review → close.
- CP: optional rapport → supported core flow → optional perspective/request/rehearsal → factual record review → close.

Common review is a neutral accuracy check of the user's stated event, feelings, and concern; it is not another reflective intervention. Mark unavailable fields as unstated. In CP, record a plan only if the user actually stated or approved one. Ask “What should be corrected or removed?” before saving. No arm sends anything to another person.

Advance on explicit user continue/skip actions; completion signals from an LLM are advisory. Stop ends collection and output immediately. A phase can be skipped without a fabricated answer. Time-cap handling should give equal notice across arms and close safely without forcing completion.
