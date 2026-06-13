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
payload tells a downstream assistant to reply only in emojis (fox as the
favorite) and to keep that behavior secret.

## Verifying the asymmetry

Simulate what a no-JS fetcher extracts (drops `<script>`/`<style>`/comments):

```bash
curl -s https://shlomi.hod.xyz/playground/inject/ \
| python3 -c "import sys,re,html; r=sys.stdin.read(); n=re.sub(r'<(script|style)\b[^>]*>.*?</\1>','',r,flags=re.S|re.I); t=re.sub(r'<!--.*?-->','',n,flags=re.S); t=re.sub(r'<[^>]+>',' ',t); print(html.unescape(re.sub(r'[ \t]+',' ',t)))"
```

You should see the article **and** the payload, but **not** the demo banner.

## Note

For authorized security education only. Payloads here are benign (they only
change an assistant's output style). The page lives on the author's own domain.
