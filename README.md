# Talent Scooper — full-stack app

A FastAPI backend serving a JSON API + the frontend, backed by the SQLite dev
database.

```
talent-scooper-app/
├── backend/
│   ├── main.py            FastAPI app (API + serves the frontend)
│   ├── database.py        DB connection helper
│   ├── talent_scooper.db  the SQLite dev database
│   └── requirements.txt   Python dependencies
└── frontend/
    ├── index.html
    ├── styles.css
    └── app.js             Interview Schedule is wired to the real API
```

## Running it

You need Python 3.10+ installed.

```bash
cd backend

# 1. (recommended) create an isolated environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. install dependencies
pip install -r requirements.txt

# 3. start the server
uvicorn main:app --reload
```

Then open **http://localhost:8000** in your browser.

- The app loads at `/`
- The JSON API is under `/api/...`
- Interactive API docs (auto-generated) are at **http://localhost:8000/docs** —
  you can try every endpoint there without the frontend.

`--reload` restarts the server automatically whenever you edit a backend file.

## What's wired to the real database

**Interview Schedule** is fully live:
- The table loads from `GET /api/interview-schedule`
- "Assign" / "Reassign" opens the modal, which loads real interviewers from
  `GET /api/interviewers`
- "Confirm Assignment" sends `POST /api/assignments`, which writes to the
  database and marks the slot confirmed
- The refresh button (top bar) refetches from the server

**Still on mock data** (wire these up next, the same way):
- Dashboard → use `GET /api/candidates?status=new` (endpoint already exists)
- Question Banks
- Candidate detail / Round History

## The endpoints

| Method | Path | What it does |
|--------|------|--------------|
| GET | `/api/interview-schedule` | in-pipeline candidates + their latest assignment |
| GET | `/api/interviewers` | active interviewers with free slots + weekly load |
| POST | `/api/assignments` | assign interviewer + slot, mark confirmed |
| GET | `/api/candidates?status=` | candidate list for the dashboard tabs |

## Swapping in the real database later

Change `backend/database.py` to point at the real database. If the real one is
Postgres/MySQL rather than SQLite, also adjust the date math in `main.py` — the
"aging" calculation uses SQLite's `julianday(...)`; Postgres would use
`CURRENT_DATE - received_date` instead. The API shapes stay the same, so the
frontend doesn't change.

## Resetting the dev data

The database lives at `backend/talent_scooper.db`. To regenerate it fresh (e.g.
after test assignments pile up), re-run the seed script from the database folder
and copy the result back into `backend/`.
