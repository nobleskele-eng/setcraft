# SetCraft coaching knowledge

These files are the knowledge Gemini may retrieve while answering. This is the practical SetCraft “training” layer: Gemini’s model weights are not changed.

Before uploading a document:

1. Remove athlete names, dates of birth, contact details, medical records and unnecessary information about minors.
2. Confirm SetCraft has permission to use the material.
3. Have a qualified coach review the content.
4. Change its metadata line to `review_status: approved` and add the reviewer and review date.
5. Run `npm run ai:setup-rag -- --write-env`.

Files marked `approved_sample` are conservative SetCraft starter rules. Replace or expand them with your own approved coaching philosophy. Files marked `draft` are skipped automatically.

Keep changing facts—records, qualifying standards, AQUA points, conversions and the race library—in deterministic SetCraft data, not in these documents.

## Expanded baseline

The included baseline has 25 uploadable documents across the six knowledge areas. Run:

```powershell
npm run ai:audit-knowledge
npm run ai:setup-rag -- --write-env --prune
```

Do not paste raw books, paid articles, SwimSwam stories, Instagram posts, YouTube transcripts, or private athlete files into these folders. Add original or licensed summaries with source links, review them, and approve them deliberately.

Use `npm run ai:generate-coverage` to regenerate the 9,600 synthetic scenario cases used to plan broader evaluation coverage. Those cases live in `ai/datasets/`; they do not change Gemini's model weights.
