import test from 'node:test';
import assert from 'node:assert/strict';
import { declinesQuestion } from '../conversation.mjs';
import { readFile } from 'node:fs/promises';
test('natural topic-change phrases are distinguished from ordinary disclosures', () => {
  for (const text of ["I don't want to answer that", 'I do not want to discuss this', "I'd rather not answer", 'Can we change the subject?', 'Let’s talk about something else', 'Please skip this', 'I prefer not to share', 'Next question']) assert.equal(declinesQuestion(text), true, text);
  for (const text of ['I enjoyed a walk', "I don't want to miss my show", 'I feel tired today']) assert.equal(declinesQuestion(text), false, text);
});
test('phase buttons and redundant voice instruction have been removed', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /id="(?:ready|skip)"/);
  assert.doesNotMatch(app, /Type a message, or send with an empty box/);
});
