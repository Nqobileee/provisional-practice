# VID Provisional Practice — Quiz

A light‑theme, glowy‑blue practice quiz built from the provided VID provisional
licence material (`VID.pdf` for questions/answers, `null (1).pdf` for diagrams).

## Features
- **400 questions** extracted and verified from the source, with the correct answer for each.
- **16 sets of 25 questions** (matches the source's test structure).
- **8‑minute countdown** per set. When it reaches `00:00` the quiz stops automatically
  and the score is shown. The timer pill turns amber under 2 min and red under 30 s.
- **Answers revealed only at the end of the session** — submit (or run out of time) to see
  your score, then open **Review Answers** to see every question with the correct answer,
  your choice, and the diagram.
- **47 diagrams** (road signs + intersection layouts) matched to their questions from the
  screenshot PDF. Image‑based questions without an available diagram show a clear note.
- **Floating navigation bar** with live set + timer status.

## Run it
Just open `index.html` in a browser (data is embedded in `data.js`, so no server is needed).
Or serve the folder:
```
python -m http.server 8731 --directory quiz
```

## Files
| File | Purpose |
|------|---------|
| `index.html` | App shell (home / quiz / results views) |
| `styles.css` | Light theme, glowy‑blue accents, floating nav |
| `app.js` | Quiz logic: sets, timer, scoring, review |
| `data.js` | Embedded question bank (`window.QUIZ_DATA`) |
| `questions.json` | Same data as a plain JSON export |
| `img/` | Matched diagram/sign images |

## Notes on the data
- Questions and answers were parsed from the `VID.pdf` table using column geometry and
  validated (400 questions, 400 correct answers; the few questions with 2 or 4 options are
  faithful to the source).
- Diagrams come from a single captured session in `null (1).pdf`, so they cover 47 of the
  image‑based questions. The rest keep their exact wording with a "diagram not available" note.
