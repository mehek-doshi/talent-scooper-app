-- ============================================================================
-- Talent Scooper — development database schema
-- SQLite. Matches the shapes the frontend (app.js) already expects.
-- Swap this for the real database once the project is approved.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- --- Candidates -------------------------------------------------------------
CREATE TABLE candidates (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_code    TEXT    NOT NULL UNIQUE,          -- e.g. "C1034"
    name              TEXT    NOT NULL,
    email             TEXT    NOT NULL,
    phone             TEXT,
    location          TEXT,
    college           TEXT,
    highest_degree    TEXT,
    cgpa              REAL,
    passout_year      INTEGER,
    experience_years  REAL,                             -- 0 = fresher
    role              TEXT,                             -- Data Engineer / Gen AI / UX Designer
    stage             TEXT,                             -- Screening / Round 1 / Round 2 / Final Round
    status            TEXT,                             -- new / processing / hired / rejected / undecided
    reason            TEXT,                             -- rejection/other reason, or NULL
    resume_url        TEXT,
    received_date     TEXT    NOT NULL,                 -- full timestamp, down to the second: "YYYY-MM-DD HH:MM:SS"
    application_status   TEXT DEFAULT 'success',         -- success / failed — did the application come through okay?
    application_failure_reason TEXT,                     -- e.g. "No resume attached", NULL if application_status = 'success'
    created_at        TEXT    DEFAULT (datetime('now'))
    -- "aging" is NOT stored: it is derived at query time as (today - received_date).
    -- Storing it would make every row stale the next day.
    --
    -- application_status/application_failure_reason are ONLY meaningful for the
    -- "New Candidates" dashboard tab (status = 'new') — they describe whether the
    -- application submission itself succeeded, separate from the hiring pipeline
    -- "status" column above. Other tabs never show this.
);

-- --- Interviewers -----------------------------------------------------------
CREATE TABLE interviewers (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    department    TEXT,
    seniority     TEXT,          -- e.g. "L2 Tech"
    active        INTEGER DEFAULT 1
);

-- --- Interviewer available time slots ---------------------------------------
CREATE TABLE interviewer_slots (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    interviewer_id  INTEGER NOT NULL REFERENCES interviewers(id) ON DELETE CASCADE,
    slot_datetime   TEXT NOT NULL,     -- ISO datetime of the slot
    slot_label      TEXT NOT NULL,     -- human label e.g. "Today 3:00 PM"
    is_booked       INTEGER DEFAULT 0
);

-- --- Interview assignments (candidate <-> interviewer <-> slot) --------------
CREATE TABLE interview_assignments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id    INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    interviewer_id  INTEGER REFERENCES interviewers(id) ON DELETE SET NULL,
    slot_id         INTEGER REFERENCES interviewer_slots(id) ON DELETE SET NULL,
    stage           TEXT,
    slot_status     TEXT NOT NULL DEFAULT 'open',   -- open / busy / tentative / confirmed
    assigned_at     TEXT DEFAULT (datetime('now'))
);

-- --- Round history (one row per interview round a candidate went through) ----
CREATE TABLE interview_rounds (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id    INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    round_title     TEXT NOT NULL,     -- Screening / Round 1 / Round 2 / Final Round
    tag             TEXT,              -- role tag e.g. "Gen AI"
    interviewer_name TEXT,             -- denormalized: who ran it (or "Not assigned")
    round_date      TEXT,
    status          TEXT,              -- completed / pending
    note            TEXT
);

-- --- Question banks assigned to candidates ----------------------------------
CREATE TABLE question_bank_assignments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id    INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    assigned        INTEGER DEFAULT 0,
    assigned_at     TEXT
);

-- --- Post-hire onboarding checklist (only exists for hired candidates) ------
CREATE TABLE hiring_onboarding (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id        INTEGER NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
    joining_date        TEXT,               -- ISO date
    offer_letter        INTEGER DEFAULT 0,  -- checkbox: sent?
    offer_reply         TEXT,               -- 'Accepted' / 'Rejected' / 'No Response'
    it_asset_allocated  INTEGER DEFAULT 0,  -- checkbox — only meaningful if offer_reply = 'Accepted'
    induction_scheduled INTEGER DEFAULT 0,  -- checkbox — only meaningful if offer_reply = 'Accepted'
    bg_verified         INTEGER DEFAULT 0,  -- checkbox — only meaningful if offer_reply = 'Accepted'
    buddy_assigned      INTEGER DEFAULT 0   -- checkbox — only meaningful if offer_reply = 'Accepted'
);

-- Helpful indexes for the queries the app runs most
CREATE INDEX idx_candidates_status   ON candidates(status);
CREATE INDEX idx_candidates_received ON candidates(received_date);
CREATE INDEX idx_slots_interviewer   ON interviewer_slots(interviewer_id);
CREATE INDEX idx_assign_candidate    ON interview_assignments(candidate_id);
CREATE INDEX idx_rounds_candidate    ON interview_rounds(candidate_id);
