# Source-matched measurement checklist

Recover exact questionnaires from Appendix D and coding rubrics from Appendix C of the [full-text paper](https://arxiv.org/html/2602.07508v1). Do not substitute the inactive solo CSV.

| Family | Timing | Verify before use |
|---|---|---|
| Relational motivation | Pre/post | Adapted items, autonomous/controlled grouping, anchors, aggregation |
| Relational need satisfaction | Pre/post | Items, reversals, overall/subscale scoring |
| Inclusion of Other in the Self | Pre/post | Pictorial choices, partner referent, scoring |
| Short self-esteem measure | Pre/post | Correct short form, reversals, total |
| Subjective vitality | Pre/post | State wording, item subset, total/mean |
| Short positive-affect measure | Pre/post | Exact subset, anchors, total |
| Chatbot need support | Post | Adaptation and need-specific scoring |
| Demographics/relationship characteristics | Baseline | Categories and data minimization |

Exact items are not reproduced here. Verify reuse terms, wording/scoring, and published-version consistency, then freeze survey ordering, IDs, and scoring before recruitment. Preserve raw items and missing values; never score missing as zero.

External survey linkage: `dyad_id`, `participant_id` (A/B), `timepoint`, `item_id`, `response`, `survey_version`, `timestamp_utc`. Use the room ID as dyad key and keep consent/identity linkage separately. The export's `surveys` array is a reserved empty field, not evidence that questionnaires were collected.

Recover exact disclosure/support levels, examples, and aggregation rules. Two trained coders should independently code a redacted subset and retain ratings before adjudication. Define phase boundaries, eligible turns, missing/skipped phases, reliability statistic, and reconciliation. Report reliability before consensus.

Only human partner statements count as enacted partner support; exclude chatbot responses and generated summaries. Keep phase and speaker IDs. Treat common disclosure and PS reflection phases separately. Word counts are not a replacement for depth coding. Suggested coding table: `dyad_id`, `phase`, `speaker`, `coder_id`, `dimension`, `rating`, `rubric_version`, `evidence_event_ids`. LLM coding is not implemented and would require separate validation.
