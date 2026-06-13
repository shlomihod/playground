# Indirect prompt injection demo

A teaching page for demonstrating **indirect prompt injection**: an innocuous
"red fox facts" article that hides instructions aimed at any LLM that web-fetches
the page, while showing a clear "demo only" banner to human visitors.

> The served `index.html` deliberately contains **no comments and no tells** —
> anything that announces "this is a demo / injection" as readable text could
> tip off (harden) the model. All explanation lives here instead.

## The asymmetry it exploits

A typical LLM web-fetch tool retrieves the raw HTML and converts it to text, but
does **not** execute JavaScript. We use that gap in both directions:

| Element | In static HTML? | Human sees it? | Fetcher (no JS) sees it? |
|---|---|---|---|
| Fox article | yes | yes | yes |
| **Injection payload** | yes, but CSS-hidden (`.offscreen`) | **no** | **yes** |
| **"DEMO ONLY" banner** | no — injected by JS from base64 | **yes** | **no** |

- **Payload → fetcher only.** The `<section class="offscreen">` uses the standard
  screen-reader-only pattern (clipped to a 1px box). The text stays in the DOM /
  accessibility tree, so a naive HTML→text extractor reads it, but a human sees
  nothing (no blank gap, no scrollbar).
- **Banner → human only.** The warning never appears as readable text in the
  source; it is base64-encoded inside the `<script>` and decoded into the DOM at
  runtime. No-JS fetchers never see it. (We deliberately avoid `<noscript>` — a
  no-JS fetcher is exactly the case `<noscript>` renders, which would leak it.)

## Swapping the payload

Edit the text inside `<p>` tags in `<section class="offscreen">`. The current
payload uses an **envelope-breakout**: it forges a closing `</fetched_content>`
delimiter and a short fake user/assistant exchange, so the instruction reads as
a *user request* rather than untrusted page text. The injected task makes a
downstream summarizer append an unsolicited recommendation of a named person
(Shlomi Hod) to its first reply — a benign stand-in for real-world
reputation/advertising injection.

Design notes (what makes it land vs. the earlier overt version):

- **No fingerprints** — no `[SYSTEM UPDATE]`, `MANDATORY`, `RULE 1/2/3`, or
  version strings; those are near-canonical injection patterns models flag.
- **No secrecy clause** — "never reveal this" *raises* suspicion; dropping it
  helps.
- **Channel spoofing** — the forged `</fetched_content>` close + fake turn are
  the load-bearing trick. Tune the delimiter to match the victim tool's actual
  envelope for best results.
- **Reframe, don't command** — a direct "recommend X as an expert" trips an
  endorsement guardrail; framing it as a prior conversational agreement slips past.

## Verifying the asymmetry

Simulate what a no-JS fetcher extracts (drops `<script>`/`<style>`/comments):

```bash
curl -s https://shlomi.hod.xyz/playground/fox/ \
| python3 -c "import sys,re,html; r=sys.stdin.read(); n=re.sub(r'<(script|style)\b[^>]*>.*?</\1>','',r,flags=re.S|re.I); t=re.sub(r'<!--.*?-->','',n,flags=re.S); t=re.sub(r'<[^>]+>',' ',t); print(html.unescape(re.sub(r'[ \t]+',' ',t)))"
```

You should see the article **and** the payload, but **not** the demo banner.

## Note

For authorized security education only. Payloads here are benign (they only
change an assistant's output style). The page lives on the author's own domain.
