# Study design

## Verified source design

The source randomized 36 couples (72 adults), 12 dyads per condition. PS combined enabling chatbot support and partner-reflection scaffolding; DS retained enabling support; BP supplied core questions only. The between-dyad factor was condition and the repeated factor was pre/post measurement. Partners participated remotely from separate locations in Telegram. Content emphasized positive memories and everyday aspirations rather than conflict or trauma. PS used eight phases: rapport, autonomy question/reflection, competence question/reflection, relatedness question/reflection, summary. DS used five phases; BP three. GPT-4.1 powered a Driver and phase-summary Analyzer. Surveys assessed motivation, need satisfaction, closeness, self-esteem, vitality, positive affect, and chatbot support. Logs captured engagement, disclosure, and enacted support; interviews followed. See [Sections 3–4 and Appendices C–F](https://arxiv.org/html/2602.07508v1).

## Proposed solo adaptation — new design choices

This section specifies our proposed experiment, not additional details of the source study. It aligns with the existing senior project proposal: helping an individual describe an experience, understand what matters, and choose a next step while preserving their meaning.

### Research question and claims

Does supportive voice reflection improve immediate emotional clarity compared with the same core questions alone? Does adding communication preparation improve readiness to communicate beyond supportive reflection?

The proposed outcome is useful reflection. Disclosure depth is a process measure; more disclosure is not inherently better. A solo session cannot establish reciprocal human support or relationship closeness. Any claim about later interpersonal interaction needs a separately consented follow-up or dyadic study.

### Experimental conditions

Use participant-level random assignment to one of three arms. Each participant receives one arm to avoid learning and carryover from repeating the same personal topic.

| Arm | Included | Excluded | Intended contrast |
|---|---|---|---|
| BP: basic voice prompts | Fixed core questions, neutral acknowledgments, common controls | Personalized supportive responses and communication rehearsal | Reference activity |
| DS: direct voice support | Core questions plus choices, concise rationale, tentative reflection, and clarification | Communication rehearsal and suggested wording for another person | DS vs BP: supportive reflection package |
| CP: communication preparation | Everything in DS plus perspective uncertainty, an optional request, and rehearsal | Pretending to know or speak for the absent person | CP vs DS: preparation package |

CP is a new arm name. Do not label it Partner Support: there is no responding partner in the solo session. The contrasts test packages rather than an isolated psychological mechanism.

Hold input/output modality, synthetic voice, model version, core topic, survey timing, controls, and researcher contact constant. Use a neutral synthetic voice; do not add own-voice or family-voice cloning as another manipulation. Keep BP usable: transcription correction, pause, skip, stop, and common safety handling must exist in every arm.

### Participants and session procedure

Proposed initial population: English-speaking adults comfortable using a microphone and discussing a mild everyday experience. Do not require a diagnosis or recruit on the basis of acute distress. Document accessibility alternatives and treat text fallback as a recorded deviation in a voice study.

1. Obtain faculty/institutional review of consent, eligibility, content boundaries, retention, withdrawal, and the response procedure for participant distress.
2. Explain the reflection task, AI involvement, processing providers, and what recordings/transcripts will be retained. Participation, recording, and quotation permissions must be explicit.
3. Assign a pseudonymous participant ID. Run a neutral microphone and transcription practice that does not include the intervention.
4. Let the participant select a mild everyday event or use a standardized vignette. Choose one topic policy for the main study; personal events and vignettes should not be mixed without recording and accounting for that difference.
5. Administer baseline clarity, readiness, and immediate distress items before condition exposure. Record event intensity without collecting names or identifying third-party details.
6. Randomize using a concealed, saved allocation schedule in balanced blocks of varying size. Researchers should not choose assignments based on the participant's story.
7. Conduct a proposed 15–20 minute session with a common time cap and freedom to end early. This timing is a feasibility choice, not the source protocol. Log actual exposure, skipped phases, technical failures, and early stopping. CP has more activities; duration and content dose remain possible explanations of an observed difference.
8. Administer post-session items immediately, followed by an optional 5–10 minute interview. Ask all arms the same core interview questions.
9. Offer a separately consented follow-up after 3–7 days: whether they chose to communicate, perceived usefulness, and unwanted effects. Choosing not to communicate can be an appropriate outcome. Do not collect another person's messages without authorization.

For an initial usability pilot, propose 6–9 participants distributed across all arms, with no efficacy claims. Set the main sample through prospective power analysis for the chosen primary contrast, smallest meaningful effect, variance, attrition, and multiplicity. Do not inherit the source sample size or count a dyad as two independent assignments.

### Outcomes and instruments

Pre-register **post-session emotional clarity adjusted for baseline clarity** as the proposed primary outcome. The CSV contains a draft single item for feasibility work. Before a confirmatory study, choose and verify an appropriate instrument with faculty guidance, including wording, permissions, scoring, and evidence for this population. The CSV is not a validated substitute.

| Outcome | Timing | Interpretation |
|---|---|---|
| Emotional clarity | Pre/post | Primary candidate: ability to identify and describe feelings |
| Readiness to communicate | Pre/post | Key secondary; preparation does not establish an actual conversation |
| Immediate distress | Pre/post | Exploratory state rating; no diagnosis or treatment inference |
| Choice, clarity of guidance, perceived understanding | Post | Separate manipulation checks; do not combine automatically |
| Summary fidelity and correction effort | At review/post | Whether output preserves the participant's meaning |
| Duration, speaking time, turns, skips, ASR corrections, latency | During session | Engagement and technical exposure, not benefit |
| Communication attempt and unwanted effects | Optional follow-up | Exploratory self-report with nonresponse disclosed |

Use the same scoring direction and wording at both time points. Separate data-quality failures from dissatisfaction and adverse responses. Preserve raw item values and record missingness; never convert unanswered questions to zero.

For qualitative evaluation, two researchers independently code a consented, redacted subset and reconcile their definitions before coding the remaining data. Proposed new categories: articulating a feeling, distinguishing observation from interpretation, stating a personally meaningful need, considering an uncertain alternative, and proposing an optional concrete request. Tag whether content originated with the user or was introduced by the AI. Repetition of suggested wording alone is not evidence of independent reflection. Report agreement before reconciliation. Condition blinding may be incomplete because prompts reveal arm membership; acknowledge this.

### Analysis plan

For the proposed primary outcome, fit `post_clarity ~ condition + pre_clarity`, with diagnostics and a pre-specified approach suitable for the chosen scale. For a single ordinal item, prefer an ordinal model or a justified sensitivity analysis rather than assuming it is continuous. Report effect estimates, uncertainty, and descriptive distributions.

Pre-specify DS–BP and CP–DS contrasts and use Holm adjustment if both are confirmatory for the primary outcome. Treat remaining outcomes as secondary or exploratory and identify them accordingly. Do not infer a condition effect from a significant pre/post change in one arm and a nonsignificant change in another.

Analyze all randomized participants under a documented intention-to-treat plan, explain missing outcomes and withdrawal-related deletion, and pre-specify sensitivity analyses. Do not exclude participants for disliking the tool or not disclosing deeply. Record technical failures and deviations; make any per-protocol analysis secondary.

Duration and turns can be effects of the intervention. Present them as exposure/process outcomes; adjusting them away in the primary model can change the estimand. Consider an explicitly time-matched follow-up study if dose remains a major ambiguity.

### Interview guide — original questions

- What, if anything, became clearer during the session?
- Where did the system misunderstand you or suggest something that did not fit?
- Did you feel free to skip, disagree, or stop? Describe a moment.
- Which question or response was useful, unhelpful, or uncomfortable?
- Did the session affect what you want to do next, including choosing to do nothing?
- What would need to change before you used this again?

## If a close couples replication is selected

Use the verified source overview above and work directly from the source appendices rather than the new solo prompts. Recover the complete original instruments, scoring, question wording, reflection instructions, and coding rubrics. Verify the published article against the preprint and the public repository against the experimental arms. Record a fixed upstream commit and resolve reuse permissions before copying code; a public repository alone does not establish a license.

Proposed replication quality controls: randomize and power at the dyad level; account for both repeated participant observations and clustering within dyads; keep model, modality, content, recruitment, and setting stable; register all deviations. A move from Telegram text to spoken interaction is a modality extension. Introducing conflict is a content extension. Neither should be presented as an exact replication.

Use a dyad-aware analysis such as a justified model with dyad and participant intercepts or an appropriate dyad-level approach. Reconstruct the authors' reported analysis separately if analytical replication is desired, then document any corrections or sensitivity models. Do not silently repeat ambiguous baseline adjustment or assume the public prototype fully reproduces all conditions.

## Decisions to finalize before recruitment

Population (solo or couples); personal-event versus vignette task; primary instrument and analysis; sample size; session cap; compensation; recording and provider processing policy; retention/deletion dates; distress response procedure; and consent/quotation wording. These remain draft decisions, not approvals already obtained.
