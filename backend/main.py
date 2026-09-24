"""
Talent Scooper — FastAPI backend.

Run it:
    cd backend
    uvicorn main:app --reload

Then open http://localhost:8000 in your browser.

This one server does two jobs:
  1. Serves the JSON API under /api/...
  2. Serves the frontend (the HTML/CSS/JS) at /
Serving both from the same server means the frontend can call the API with
plain relative URLs ("/api/interview-schedule") and there are no CORS problems.
Interactive API docs are auto-generated at http://localhost:8000/docs
"""

from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from database import get_connection

app = FastAPI(title="Talent Scooper API")

# CORS: only needed if you later host the frontend on a *different* domain than
# the backend. It's harmless to leave on while developing.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # tighten this to your real frontend domain before production
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"


# ============================================================================
# Request body shapes (Pydantic validates incoming JSON for us)
# ============================================================================

class AssignmentRequest(BaseModel):
    candidate_id: int
    interviewer_id: int
    slot_label: str
    stage: str | None = None


class OnboardingUpdate(BaseModel):
    field: str
    value: bool | str    # bool for checkboxes, str for the dropdown / date picker

ONBOARDING_CHECKBOX_FIELDS = {
    "offer_letter", "it_asset_allocated", "induction_scheduled",
    "bg_verified", "buddy_assigned",
}
ONBOARDING_TEXT_FIELDS = {"offer_reply", "joining_date"}
ONBOARDING_ALLOWED_FIELDS = ONBOARDING_CHECKBOX_FIELDS | ONBOARDING_TEXT_FIELDS


# ============================================================================
# Interview Schedule
# ============================================================================

@app.get("/api/interview-schedule")
def interview_schedule():
    """
    One row per in-pipeline candidate, joined to their most recent assignment
    (if any). 'aging_days' is computed from received_date, never stored.
    """
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT
            c.id                                   AS candidate_id,
            c.candidate_code                       AS code,
            c.name                                 AS name,
            c.role                                 AS role,
            CAST(julianday('now') - julianday(c.received_date) AS INTEGER) AS aging_days,
            COALESCE(a.stage, c.stage)             AS stage,
            COALESCE(iv.name, 'Unassigned')        AS interviewer,
            iv.id                                  AS interviewer_id,
            COALESCE(a.slot_status, 'open')        AS status
        FROM candidates c
        LEFT JOIN interview_assignments a
               ON a.id = (
                   SELECT id FROM interview_assignments
                   WHERE candidate_id = c.id
                   ORDER BY assigned_at DESC
                   LIMIT 1
               )
        LEFT JOIN interviewers iv ON iv.id = a.interviewer_id
        WHERE c.status IN ('new', 'processing', 'undecided')
        ORDER BY aging_days DESC
        LIMIT 50
        """
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ============================================================================
# Interviewers (for the Assign Interviewer modal)
# ============================================================================

@app.get("/api/interviewers")
def interviewers():
    """Active interviewers, each with their free slots and this-week load."""
    conn = get_connection()
    people = conn.execute(
        "SELECT id, name, email, department, seniority FROM interviewers WHERE active = 1 ORDER BY name"
    ).fetchall()

    result = []
    for p in people:
        slots = conn.execute(
            "SELECT slot_label FROM interviewer_slots WHERE interviewer_id = ? AND is_booked = 0",
            (p["id"],),
        ).fetchall()
        week_count = conn.execute(
            "SELECT COUNT(*) AS n FROM interview_assignments WHERE interviewer_id = ?",
            (p["id"],),
        ).fetchone()["n"]

        result.append({
            "id": p["id"],
            "name": p["name"],
            "email": p["email"],
            "department": p["department"],
            "seniority": p["seniority"],
            "week": week_count,
            "slots": [s["slot_label"] for s in slots],
        })
    conn.close()
    return result


# ============================================================================
# Create / confirm an assignment
# ============================================================================

@app.post("/api/assignments")
def create_assignment(req: AssignmentRequest):
    """
    Assign an interviewer + slot to a candidate and mark it confirmed.
    Called when the user clicks "Confirm Assignment" in the modal.
    """
    conn = get_connection()

    # Make sure the candidate and interviewer actually exist.
    cand = conn.execute("SELECT id FROM candidates WHERE id = ?", (req.candidate_id,)).fetchone()
    if cand is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Candidate not found")

    iv = conn.execute("SELECT id FROM interviewers WHERE id = ?", (req.interviewer_id,)).fetchone()
    if iv is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Interviewer not found")

    # Find the matching slot for this interviewer (by its human label).
    slot = conn.execute(
        "SELECT id FROM interviewer_slots WHERE interviewer_id = ? AND slot_label = ?",
        (req.interviewer_id, req.slot_label),
    ).fetchone()
    slot_id = slot["id"] if slot else None

    # Insert the assignment as confirmed.
    cur = conn.execute(
        """INSERT INTO interview_assignments
           (candidate_id, interviewer_id, slot_id, stage, slot_status)
           VALUES (?, ?, ?, ?, 'confirmed')""",
        (req.candidate_id, req.interviewer_id, slot_id, req.stage),
    )
    assignment_id = cur.lastrowid

    # Mark the slot booked so it's not offered again.
    if slot_id is not None:
        conn.execute("UPDATE interviewer_slots SET is_booked = 1 WHERE id = ?", (slot_id,))

    conn.commit()
    conn.close()
    return {"id": assignment_id, "status": "confirmed"}


# ============================================================================
# Candidates (Dashboard) — ready to wire up next
# ============================================================================

@app.get("/api/candidates")
def candidates(status: str | None = None):
    """
    Candidate list, optionally filtered by status (new/processing/hired/
    rejected/undecided). Powers the dashboard tabs.
    """
    conn = get_connection()
    query = """
        SELECT
            candidate_code, name, college, cgpa, passout_year,
            experience_years, role, status, reason,
            application_status, application_failure_reason,
            CAST(julianday('now') - julianday(received_date) AS INTEGER) AS aging_days,
            received_date
        FROM candidates
    """
    params = ()
    if status:
        query += " WHERE status = ?"
        params = (status,)
    query += " ORDER BY received_date DESC"

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ============================================================================
# Hired — post-hire onboarding checklist (its own table, its own columns)
# ============================================================================

@app.get("/api/hired")
def hired_candidates():
    """
    Hired candidates joined with their onboarding checklist. This tab has a
    completely different shape from the other dashboard tabs, so it gets its
    own endpoint rather than being squeezed into /api/candidates.
    """
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT
            c.id                    AS candidate_id,
            c.candidate_code        AS code,
            c.name                  AS name,
            c.role                  AS role,
            h.joining_date          AS joining_date,
            h.offer_letter          AS offer_letter,
            h.offer_reply           AS offer_reply,
            h.it_asset_allocated    AS it_asset_allocated,
            h.induction_scheduled   AS induction_scheduled,
            h.bg_verified           AS bg_verified,
            h.buddy_assigned        AS buddy_assigned
        FROM candidates c
        JOIN hiring_onboarding h ON h.candidate_id = c.id
        WHERE c.status = 'hired'
        ORDER BY h.joining_date ASC
        """
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.patch("/api/hired/{candidate_id}/onboarding")
def update_onboarding(candidate_id: int, req: OnboardingUpdate):
    """
    Update one onboarding field for a hired candidate — a checkbox toggle,
    the Offer Reply dropdown, or the Joining Date calendar picker.
    """
    if req.field not in ONBOARDING_ALLOWED_FIELDS:
        raise HTTPException(status_code=400, detail=f"Unknown field: {req.field}")

    conn = get_connection()
    row = conn.execute(
        "SELECT id FROM hiring_onboarding WHERE candidate_id = ?", (candidate_id,)
    ).fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="No onboarding record for this candidate")

    stored_value = int(req.value) if req.field in ONBOARDING_CHECKBOX_FIELDS else req.value

    # req.field is checked against the fixed allow-list above, so this is safe
    # from SQL injection despite the column name being interpolated.
    conn.execute(
        f"UPDATE hiring_onboarding SET {req.field} = ? WHERE candidate_id = ?",
        (stored_value, candidate_id),
    )
    conn.commit()
    conn.close()
    return {"candidate_id": candidate_id, "field": req.field, "value": req.value}


# ============================================================================
# Serve the frontend (must be LAST so it doesn't shadow the /api routes above)
# ============================================================================

app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
