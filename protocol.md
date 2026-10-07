# Close couples replication protocol — draft

User-selected scope: close replication with couples, protocol and working prototype. The solo design under `design_alternatives/solo` is inactive.

## Source anchor

The source randomized 36 dyads across PS, DS, and BP, using pre/post surveys, conversation-log analysis, and interviews. Recover complete methods from [Sections 3–4 and Appendices C–F](https://arxiv.org/html/2602.07508v1). Verify this preprint against the [published article](https://doi.org/10.1145/3772318.3791370) before registration. Source-matched instrument families are listed in `measures.md`; controller sequences are in `study.mjs`.

## Proposed operational procedure

These are proposed replication procedures, not approvals already obtained.

1. Recruit consenting adults in romantic relationships who are willing to share and can use the study language/platform. Both partners consent individually. Keep contact/identity records separate from pseudonymous logs. The app's fictional-data demo acknowledgment is not research consent.
2. Complete source-matched baseline questionnaires independently before condition exposure. Use approved external surveys for now; full questionnaires are not integrated into the app.
3. Randomize each dyad once using an independently prepared concealed allocation schedule. The app's shuffled blocks of three are a demo mechanism; manual arm selection is for debugging. Freeze the actual research schedule and sample/attrition plan before enrollment.
4. Partners participate from separate locations with no off-channel discussion, matching the source setting. Two tabs on one machine are a technical preview only.
5. Run the assigned PS/DS/BP session. Both participants may skip, pause, or stop. Do not silently impose an equal-duration cap: finalize timing and record any departure. Track actual exposure and incomplete phases.
6. Keep researcher involvement consistent and outside the conversation except when the approved participant response procedure requires intervention. Do not explain which arm is expected to perform best.
7. Complete post questionnaires individually; follow with an approved recorded dyad interview. Use the same interview guide across arms.
8. Export pseudonymous events, transfer to approved storage, record deviations, and delete the working room according to the approved retention plan. Exports and provider records require separate handling.

## Proposed hypotheses and analysis

Register tests of whether PS/DS deepen disclosure compared with BP, whether PS increases enacted partner support compared with DS, and whether PS improves partner closeness more than DS/BP. Select one primary outcome and a small contrast family before data collection; a candidate is partner closeness, with behavioral outcomes secondary. This hierarchy is a new registration choice.

Matching enrollment would mean 36 dyads; justify replication size prospectively using dyad clustering, repeated observations, a smallest meaningful effect, and attrition. Do not equate 72 participants with 72 independent assignments or inherit retrospective sensitivity as guaranteed power.

Handle repeated participant observations and dyad dependence explicitly. Use a scale-appropriate model, such as a justified mixed model with time × condition and dyad/participant intercepts. An ordinal closeness measure may need an ordinal model or registered sensitivity analysis. Reconstruct the authors' reported method separately from any revised analysis, documenting ambiguous baseline adjustment rather than silently repeating it.

Pre-specify contrasts, correction for multiple comparisons, missingness, technical exclusions, withdrawal, and estimand. Report effect estimates, uncertainty, distributions, and attrition by arm. Significant change in one arm and nonsignificant change in another does not establish differential effects.

Engagement outcomes belong at dyad level. Phase-level coding must account for repeated and unequal phases: compare common disclosure phases separately from PS-only reflection phases. Do not treat totals across unequal opportunities as equivalent. Duration may be an intervention effect; adjusting it away changes the question being answered.

## Participant and data requirements

Preserve the source's everyday/positive topic scope. Introducing relationship conflict or trauma changes the intervention. Optional voice also changes modality, model, and turn-taking; record modality, fix model/voice settings, and register it as a separate extension. Do not pool it silently with the text replication. Finalize individual consent, expectations of within-dyad sharing, withdrawal from joint transcripts, provider processing, quotation permissions, compensation, retention/deletion, and researcher access. Prepare an institution-approved distress/unsafe-interaction procedure. The app has pause/stop, but no crisis detection or response service.

Before recruitment, reconcile prompt/platform departures, approve the protocol, choose final instruments, freeze versions/settings, configure secure remote hosting and approved storage, train coders, and pilot from separate locations. Current implementation is a local technical prototype.
