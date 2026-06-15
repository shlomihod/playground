# Universal jailbreak demo

A teaching aid for the concept of a **universal jailbreak**: one fixed string,
appended to almost any harmful request, that breaks alignment **across requests
and across models**, with no per-prompt tuning.

The worked instance is the GCG-style **adversarial suffix** from Zou et al.
(2023), [*Universal and Transferable Adversarial Attacks on Aligned Language
Models*](https://arxiv.org/abs/2307.15043) — but the suffix is just one instance
of the idea (many-shot jailbreaking is another).

## Three panels

1. **The trick** — the prompt is shown as `request + suffix`: the request changes,
   the suffix is one fixed string reused everywhere. Toggle it on/off and cycle
   through concrete requests to see the same string flip refusal → compliance.
2. **The matrix** — concrete harmful requests (rows) × the paper's transfer-target
   models (columns). One toggle applies the single suffix and the grid flips
   green → red. Each column's success rate is the transfer ASR from Zou et al.,
   **Table 2** (GCG Ensemble): GPT-3.5 **86.6%**, PaLM-2 **66.0%**, Claude-1
   **47.9%**, GPT-4 **46.9%**, Claude-2 **2.1%**. The suffix was optimized
   white-box on **Vicuna & Guanaco**, then transferred to these closed models;
   the individual request cells are illustrative. Claude-2 resisted; Claude-1 did
   not — transfer is broad, not total.
3. **Found automatically** — a simulated greedy-coordinate search: fake tokens
   swap while `P("Sure, here…")` climbs; optimized over many requests × models at
   once, which is why the result transfers.

## Responsible framing

Built for authorized AI-safety **teaching**. The harmful **requests** are
concrete (the kind found in public safety benchmarks), but everything else is
**simulated**: no model is called, the suffix is **fake gibberish** (not a working
string), the **per-column rates are the paper's measured transfer ASRs** (Table 2)
while the individual request cells are illustrative, and every harmful **output**
is **withheld**.

Self-contained static page — no build, no dependencies, no network calls. Theme
(light/dark) is inlined and shares the `playground-theme` key with the other
demos. Listed on the hub and indexable, like the other main demos.
