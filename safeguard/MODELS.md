# Safeguard Models Reference

## Llama Guard 4 (Meta)

**Model**: `meta-llama/Llama-Guard-4-12B`
**Architecture**: 12B dense (pruned from Llama 4 Scout), natively multimodal
**License**: Llama community license
**Default Taxonomy**: MLCommons AI Safety (14 categories) — customizable via prompt

### API Format

Llama Guard uses a **single user message** containing the full taxonomy + conversation. There is no system message.

```json
{
  "model": "meta-llama/llama-guard-4-12b",
  "messages": [
    {
      "role": "user",
      "content": "Task: Check if there is unsafe content in 'User' messages in conversations according to our safety policy with the below categories.\n\n<BEGIN UNSAFE CONTENT CATEGORIES>\nS1: Violent Crimes. ...\n...\nS14: Code Interpreter Abuse. ...\n<END UNSAFE CONTENT CATEGORIES>\n\n<BEGIN CONVERSATION>\nUser: [content to classify]\n<END CONVERSATION>\n\nProvide your safety assessment for ONLY THE LAST User message:\n - First line must read 'safe' or 'unsafe'.\n - If unsafe, a second line must include a comma-separated list of violated categories."
    }
  ]
}
```

### Output Format

**Plain text**, not JSON:
```
safe
```
or:
```
unsafe
S1,S9
```

- Line 1: `safe` or `unsafe`
- Line 2 (if unsafe): comma-separated category codes (e.g., `S1`, `S9`, `S10`)

### Categories (MLCommons Taxonomy)

| ID  | Name                      | Description |
|-----|---------------------------|-------------|
| S1  | Violent Crimes            | Unlawful violence toward people (terrorism, genocide, murder, hate crimes, child abuse, assault, battery, kidnapping) and animals |
| S2  | Non-Violent Crimes        | Labor trafficking, fraud, scams, theft, arson, vandalism, drug crimes, weapons crimes, cyber crimes |
| S3  | Sex-Related Crimes        | Sex trafficking, sexual assault, sexual harassment, prostitution |
| S4  | Child Sexual Exploitation | Content that depicts sexual abuse of children, including CSAM or solicitation |
| S5  | Defamation                | Verifiably false statements likely to injure a living person's reputation |
| S6  | Specialized Advice        | Dangerous financial, medical, or legal advice without proper disclaimers |
| S7  | Privacy                   | Sensitive, nonpublic personal information that could identify an individual |
| S8  | Intellectual Property      | Violations of third-party intellectual property rights |
| S9  | Indiscriminate Weapons    | Chemical, biological, radiological, nuclear, or high-yield explosive weapons |
| S10 | Hate                      | Demean or dehumanize people based on race, ethnicity, disability, religion, caste, sexual orientation, gender identity, or serious disease |
| S11 | Suicide & Self-Harm       | Content that enables, encourages, or depicts suicide, self-injury, or disordered eating |
| S12 | Sexual Content            | Erotica or explicit sexual content |
| S13 | Elections                 | Factually incorrect information about electoral systems, candidates, or voting |
| S14 | Code Interpreter Abuse    | Denial of service, container escapes, privilege escalation exploits via code execution |

### Custom Taxonomies

The categories in the prompt template (`<BEGIN UNSAFE CONTENT CATEGORIES>...`) are a **template variable** — you can replace them with your own. The model was instruction-fine-tuned to adapt to different taxonomies at inference time via zero-shot/few-shot prompting.

Example custom taxonomy for an enterprise use case:
```
<BEGIN UNSAFE CONTENT CATEGORIES>
E1: Workplace Harassment. Bullying, intimidation, or hostile language targeting colleagues.
E2: Confidential Information. Company trade secrets, internal financials, or unreleased product details.
E3: Legal Risk. Content that could expose the company to lawsuits or regulatory action.
<END UNSAFE CONTENT CATEGORIES>
```

Categories must follow the `ID: Name. Description` format. The model will reference your custom IDs in its response (e.g., `unsafe\nE2`).

### Key Characteristics

- **Customizable taxonomy** — default is MLCommons S1-S14, but you can define your own categories in the prompt
- **Prompt + response classification** — can classify user inputs (before LLM responds) or LLM outputs (after generation)
- **Multimodal** — supports text + images (single or multiple)
- **Multilingual** — English + French, German, Hindi, Italian, Portuguese, Spanish, Thai

---

## gpt-oss-safeguard (OpenAI)

**Models**: `openai/gpt-oss-safeguard-20b` and `openai/gpt-oss-safeguard-120b`
**Released**: October 28, 2025
**License**: Apache 2.0 (open-weight)
**Developed with**: Discord, SafetyKit, ROOST

### API Format

Uses standard chat completion format with **system message** (your policy) + **user message** (content to classify):

```json
{
  "model": "openai/gpt-oss-safeguard-20b",
  "messages": [
    { "role": "system", "content": "<your policy prompt>" },
    { "role": "user", "content": "<content to classify>" }
  ]
}
```

### Policy Structure (in system message)

Optimal policy length: **400-600 tokens** (up to ~10,000 supported). Four-section format:

1. **Instructions** — what the model must do, response format
2. **Definitions** — key terms and context
3. **Criteria** — distinguish violations from non-violations
4. **Examples** — 4-6 concrete borderline cases with labels

### Output Format Options

**Binary (simplest)**:
```
0
```
Just `0` (safe) or `1` (violation).

**Policy-referencing JSON**:
```json
{"violation": 1, "policy_category": "H2.f"}
```

**With rationale (recommended)**:
```json
{
  "violation": 1,
  "policy_category": "H2.f",
  "rule_ids": ["H2.d", "H2.f"],
  "confidence": "high",
  "rationale": "Content compares a protected class to animals, which is dehumanizing."
}
```

The output format is determined by instructions in your policy prompt. The recommended format (with rationale) maximizes the model's reasoning capabilities.

### Reasoning Effort

Control via system message: `Reasoning: low`, `Reasoning: medium` (default), or `Reasoning: high`.

### Key Characteristics

- **Custom policies** — you define your own safety rules, not limited to a fixed taxonomy
- **Reasoning model** — provides explanations and policy citations for its decisions
- **Policy-driven** — change the policy text to change classification behavior, no retraining needed
- **Suited for Trust & Safety workflows** — automated triage, edge case escalation
- **Two sizes** — 20B (faster, lighter) and 120B (more capable)

### Running Locally

```bash
# Ollama
ollama run gpt-oss-safeguard:20b

# vLLM
vllm serve openai/gpt-oss-safeguard-120b

# LM Studio
# Download from lmstudio.ai/models/gpt-oss-safeguard
```

---

## Key Differences

| Aspect | Llama Guard 4 | gpt-oss-safeguard |
|--------|---------------|-------------------|
| Taxonomy | Structured categories (`ID: Name. Description`), default MLCommons S1-S14 | Free-form policy (Definitions → Criteria → Examples) |
| Input format | Single `user` message with taxonomy + conversation | `system` (policy) + `user` (content) |
| Output format | Plain text: `safe`/`unsafe` + category codes | JSON with violation, rationale, confidence |
| Reasoning | No rationale — just verdict + categories | Full reasoning with policy citations |
| Customization | Swap category list in prompt (structured format) | Complete — write any policy you want |
| Multimodal | Yes (text + images) | Text only |
| Best for | Standard safety classification, known hazard categories | Custom moderation rules, nuanced edge cases, T&S workflows |

---

## Sources

- [Llama Guard 4 Model Card](https://huggingface.co/meta-llama/Llama-Guard-4-12B)
- [Llama Guard 4 Prompt Formats](https://www.llama.com/docs/model-cards-and-prompt-formats/llama-guard-4/)
- [gpt-oss-safeguard User Guide](https://developers.openai.com/cookbook/articles/gpt-oss-safeguard-guide)
- [Introducing gpt-oss-safeguard](https://openai.com/index/introducing-gpt-oss-safeguard/)
- [Safeguarding Large Language Models: A Survey (arXiv 2406.02622)](https://arxiv.org/abs/2406.02622)
