# Balanced, meaning-driven carousel types

## Summary
Make carousel batches automatically mix Insightful and Quote pieces, while choosing the right structure for each topic. Informational or explanatory topics will become Insightful carousels; Quote carousels will be reserved for cohesive motivational, inspirational, or belief-challenging sequences.

The writing cards will stop displaying “Quote” or “Insightful” in their heading. Useful editing labels such as Title, Subtitle, Body, and CTA will remain.

## 1. Assign a type to each carousel topic

- Remove the single Quote/Insightful choice for an entire carousel batch.
- Assign `insightful` or `quote` to each selected carousel topic before hooks and slide copy are written.
- Keep each carousel batch approximately 50% Insightful and 50% Quote:
  - Even batches split equally.
  - Odd batches differ by no more than one, with the extra slot going to the type that best fits the topics.
- Preserve the assigned type with each topic through hook selection, writing, saving, reopening, production requests, and design rendering.
- Keep the existing subtype choice for a single Graphic batch; this request changes automatic balancing specifically for carousel batches.

## 2. Choose by meaning, not by shortness

Add explicit classification and writing rules:

- Use **Insightful** when the topic promises an explanation, diagnosis, process, reasons, recommendations, or a deeper answer. For example, “Why is my website not appearing in ChatGPT?” must be Insightful.
- Use **Quote** only for inspiration, motivation, a direct challenge, or a belief-changing angle that can stand as a sequence of quotable statements.
- Never turn a broad explanation into several short statements just to fit the Quote structure.
- When a topic is assigned Quote, angle the full carousel around one coherent challenge or belief shift. Each quote slide must advance the same thought rather than read as unrelated quotations.
- Retain the existing fixed slide counts, field structure, word limits, CTA fallback, and visual templates for both types.

## 3. Carry the per-topic type through generation

- Extend the topic data used by the writing sequence with its assigned carousel type.
- Generate cover hooks using each topic’s own type and limits instead of one batch-wide type.
- Generate each script using the selected topic’s type, including the correct six-slide or ten-slide structure.
- Ensure retries and normalization retain the assigned type rather than defaulting to Quote.
- Keep manually entered topics eligible for the same automatic balanced classification before hook generation.

## 4. Simplify visible labels

- Remove “Quote” and “Insightful” from the generated writing-card heading.
- Keep the normal format/count context and the functional field labels needed to edit structured copy.
- Do not add a visible type badge to topics, hooks, slides, previews, or designs.

## 5. Validation

Add focused tests that verify:

- A website visibility/explanation topic is classified as Insightful.
- Quote topics are framed as motivational, inspirational, or belief-challenging rather than mini explainers.
- Even carousel batches split 50/50 and odd batches differ by at most one.
- Each topic’s assigned type reaches hook and script generation unchanged.
- Mixed batches produce the correct six-slide Quote and ten-slide Insightful structures in the same run.
- The writing card heading does not expose Quote/Insightful, while multi-part field labels remain.

## Technical details

- Keep classification, balancing, and copy constraints in the shared design-template rules so topic selection, hook writing, script writing, persistence, and rendering cannot drift.
- Treat the AI classification as structured data, then deterministically validate and rebalance it in code before generation continues.
- Update the existing server-side writing requests to use the project’s shared Lovable AI response helper and strict structured output, preserving safe retry/error behavior.
