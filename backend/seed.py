"""
Seed the Talent Scooper development database with a large, realistic fake
dataset. Run:  python seed.py
Produces:  talent_scooper.db  (SQLite)

Everything here is invented test data. Swap this database for the real one
once the project is approved.
"""

import sqlite3
import random
from datetime import date, datetime, timedelta
import os

random.seed(42)  # reproducible: re-running gives the same data

HERE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(HERE, "talent_scooper.db")
SCHEMA_PATH = os.path.join(HERE, "schema.sql")

# ----------------------------------------------------------------------------
# Name / value pools (Indian-context names to match the app's existing data)
# ----------------------------------------------------------------------------

FIRST_NAMES = [
    "Priya", "Rohan", "Ananya", "Karan", "Sara", "Vikram", "Meera", "Arjun",
    "Divya", "Farhan", "Aditya", "Sneha", "Rahul", "Ishaan", "Neha", "Aisha",
    "Devansh", "Sandeep", "Pooja", "Nikhil", "Riya", "Kabir", "Tanvi", "Yash",
    "Kavya", "Manish", "Sakshi", "Harsh", "Anjali", "Rehan", "Simran", "Aryan",
    "Nisha", "Varun", "Deepika", "Siddharth", "Aditi", "Raj", "Shreya", "Om",
    "Fatima", "Zara", "Imran", "Lakshmi", "Gaurav", "Ritika", "Abhishek",
    "Sanya", "Dhruv", "Naina",
]

LAST_NAMES = [
    "Sharma", "Mehta", "Iyer", "Verma", "Khan", "Rao", "Nair", "Das", "Pillai",
    "Ali", "Gupta", "Reddy", "Shaikh", "Bhatia", "Kapoor", "Menon", "Joshi",
    "Chopra", "Sethi", "Nanda", "Anbarasan", "Thakkar", "Varma", "Shetty",
    "Deshmukh", "Kulkarni", "Patel", "Singh", "Bose", "Ghosh", "Malhotra",
    "Agarwal", "Chauhan", "Trivedi", "Naidu", "Pandey", "Saxena", "Dubey",
]

COLLEGES = [
    "IIT Bombay", "IIT Delhi", "IIT Madras", "BITS Pilani", "NIT Trichy",
    "NIT Surathkal", "VJTI Mumbai", "COEP Pune", "DY Patil University",
    "VIT Vellore", "Manipal Institute of Technology", "SRM University",
    "IIIT Hyderabad", "Delhi Technological University", "PES University",
    "Amity University", "Christ University", "Symbiosis Institute of Technology",
]

DEGREES = ["Bachelor's", "Master's", "B.Tech", "M.Tech", "B.Sc", "MCA"]

LOCATIONS = [
    "Bangalore", "Mumbai", "Pune", "Hyderabad", "Delhi", "Chennai", "Kolkata",
    "Ahmedabad", "Noida", "Gurgaon", "Jaipur", "Kochi", "Indore", "Remote",
]

ROLES = ["Data Engineer", "Gen AI", "UX Designer", "Backend Engineer",
         "Frontend Engineer", "ML Engineer"]

STAGES = ["Screening", "Round 1", "Round 2", "Final Round"]

STATUSES = ["new", "processing", "hired", "rejected", "undecided"]

REJECT_REASONS = [
    "Experience mismatch", "Failed technical round", "Salary expectations",
    "Notice period too long", "Communication gap", "Culture fit concern",
]

# Why an application submission itself failed (separate from rejection reasons
# above — this is about the submission, not the candidate).
APPLICATION_FAILURE_REASONS = [
    "No resume attached",
    "Duplicate/repeated application",
    "Incomplete application form",
    "Unsupported file format",
]

OFFER_REPLIES = ["Accepted", "Accepted", "Accepted", "Rejected", "No Response"]

ROUND_NOTES = [
    "Good candidate, strong Gen AI knowledge.",
    "Solid problem-solving; needs more depth on system design.",
    "Clear communicator, good fundamentals.",
    "Struggled with scalability questions.",
    "Strong hands-on coding, weaker on theory.",
    "Excellent domain knowledge, confident answers.",
    "Average performance, borderline pass.",
    "Great cultural fit, technically adequate.",
]

SLOT_LABELS = [
    "Today 10:00 AM", "Today 11:30 AM", "Today 2:00 PM", "Today 3:00 PM",
    "Today 4:30 PM", "Tomorrow 9:30 AM", "Tomorrow 11:00 AM",
    "Tomorrow 2:00 PM", "Tomorrow 5:00 PM", "Tomorrow 6:00 PM",
    "Thursday 11:00 AM", "Friday 9:00 AM", "Friday 6:00 PM",
]

SLOT_STATUSES = ["open", "busy", "tentative", "confirmed"]

# ----------------------------------------------------------------------------
# Config: how big the dataset is
# ----------------------------------------------------------------------------

N_CANDIDATES = 500
N_INTERVIEWERS = 40

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------

def full_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def email_for(name, domain="gmail.com"):
    slug = name.lower().replace(" ", ".")
    return f"{slug}{random.randint(1, 99)}@{domain}"

def phone():
    return "+91 " + "".join(str(random.randint(0, 9)) for _ in range(5)) + " " + \
           "".join(str(random.randint(0, 9)) for _ in range(5))

def recent_date(max_days_ago):
    d = date.today() - timedelta(days=random.randint(0, max_days_ago))
    return d.isoformat()

def future_date(max_days_ahead):
    d = date.today() + timedelta(days=random.randint(1, max_days_ahead))
    return d.isoformat()

def recent_timestamp(max_days_ago):
    """Full timestamp down to the second — SQLite's date functions read this
    format natively (space separator, not 'T')."""
    dt = datetime.now() - timedelta(
        days=random.randint(0, max_days_ago),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
        seconds=random.randint(0, 59),
    )
    return dt.strftime("%Y-%m-%d %H:%M:%S")

# ----------------------------------------------------------------------------
# Build the database
# ----------------------------------------------------------------------------

def main():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    conn.executescript(open(SCHEMA_PATH).read())
    cur = conn.cursor()

    # --- Interviewers -------------------------------------------------------
    interviewer_ids = []
    for _ in range(N_INTERVIEWERS):
        name = full_name()
        cur.execute(
            "INSERT INTO interviewers (name, email, department, seniority, active) "
            "VALUES (?, ?, ?, ?, 1)",
            (name, email_for(name, "neuleap.ai"), random.choice(ROLES),
             random.choice(["L1", "L2 Tech", "L3 Senior", "Lead"])),
        )
        interviewer_ids.append(cur.lastrowid)

    # --- Interviewer slots (3-6 each) ---------------------------------------
    for iv_id in interviewer_ids:
        for label in random.sample(SLOT_LABELS, random.randint(3, 6)):
            # crude datetime just for realism; label is what the UI shows
            dt = datetime.now() + timedelta(days=random.randint(0, 4),
                                            hours=random.randint(0, 8))
            cur.execute(
                "INSERT INTO interviewer_slots (interviewer_id, slot_datetime, slot_label, is_booked) "
                "VALUES (?, ?, ?, ?)",
                (iv_id, dt.isoformat(timespec="minutes"), label,
                 random.choice([0, 0, 0, 1])),
            )

    # --- Candidates ---------------------------------------------------------
    candidate_ids = []
    for i in range(N_CANDIDATES):
        name = full_name()
        status = random.choices(
            STATUSES, weights=[16, 25, 2, 25, 32], k=1
        )[0]  # roughly matches the dashboard tab counts in the design
        role = random.choice(ROLES)
        experience = random.choice([0, 0, 1.0, 1.5, 2.0, 2.5, 3.0, 4.5, 6.0])
        reason = random.choice(REJECT_REASONS) if status == "rejected" else None

        # Application submission status — only meaningful for "new" candidates,
        # but we set it for every row since any application could have failed.
        # About 1 in 8 fail to submit cleanly.
        if random.random() < 0.125:
            application_status = "failed"
            application_failure_reason = random.choice(APPLICATION_FAILURE_REASONS)
        else:
            application_status = "success"
            application_failure_reason = None

        cur.execute(
            """INSERT INTO candidates
               (candidate_code, name, email, phone, location, college,
                highest_degree, cgpa, passout_year, experience_years, role,
                stage, status, reason, resume_url, received_date,
                application_status, application_failure_reason)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                f"C{1000 + i}",
                name,
                email_for(name),
                phone(),
                random.choice(LOCATIONS),
                random.choice(COLLEGES),
                random.choice(DEGREES),
                round(random.uniform(6.0, 9.8), 1),
                random.randint(2018, 2026),
                experience,
                role,
                random.choice(STAGES),
                status,
                reason,
                f"https://resumes.example.com/{1000 + i}.pdf",
                recent_timestamp(30),
                application_status,
                application_failure_reason,
            ),
        )
        candidate_ids.append((cur.lastrowid, role, status))

    # --- Interview assignments + round history for a subset -----------------
    for cand_id, role, cand_status in candidate_ids:
        # assignment (roughly for candidates in the pipeline)
        if random.random() < 0.6:
            iv_id = random.choice(interviewer_ids)
            cur.execute(
                "SELECT id FROM interviewer_slots WHERE interviewer_id = ? LIMIT 1",
                (iv_id,),
            )
            row = cur.fetchone()
            slot_id = row[0] if row else None
            cur.execute(
                "INSERT INTO interview_assignments "
                "(candidate_id, interviewer_id, slot_id, stage, slot_status) "
                "VALUES (?, ?, ?, ?, ?)",
                (cand_id, iv_id, slot_id, random.choice(STAGES),
                 random.choice(SLOT_STATUSES)),
            )

        # round history (1-3 rounds)
        n_rounds = random.randint(1, 3)
        for r in range(n_rounds):
            is_last_pending = (r == n_rounds - 1 and random.random() < 0.4)
            cur.execute(
                "INSERT INTO interview_rounds "
                "(candidate_id, round_title, tag, interviewer_name, round_date, status, note) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    cand_id,
                    STAGES[r] if r < len(STAGES) else f"Round {r+1}",
                    role,
                    "Not assigned" if is_last_pending else full_name(),
                    recent_date(60),
                    "pending" if is_last_pending else "completed",
                    None if is_last_pending else random.choice(ROUND_NOTES),
                ),
            )

        # question bank assignment
        cur.execute(
            "INSERT INTO question_bank_assignments (candidate_id, assigned, assigned_at) "
            "VALUES (?, ?, ?)",
            (cand_id, random.choice([0, 0, 1]),
             datetime.now().isoformat(timespec="minutes")),
        )

        # post-hire onboarding checklist — only for hired candidates
        if cand_status == "hired":
            offer_reply = random.choice(OFFER_REPLIES)
            accepted = offer_reply == "Accepted"
            cur.execute(
                """INSERT INTO hiring_onboarding
                   (candidate_id, joining_date, offer_letter, offer_reply,
                    it_asset_allocated, induction_scheduled, bg_verified, buddy_assigned)
                   VALUES (?, ?, 1, ?, ?, ?, ?, ?)""",
                (
                    cand_id,
                    future_date(45),  # a joining date a few weeks out
                    offer_reply,
                    int(accepted and random.random() < 0.8),
                    int(accepted and random.random() < 0.8),
                    int(accepted and random.random() < 0.8),
                    int(accepted and random.random() < 0.8),
                ),
            )

    conn.commit()

    # --- Print a quick summary ----------------------------------------------
    def count(table):
        return cur.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]

    print("Database created:", DB_PATH)
    print("  candidates:              ", count("candidates"))
    print("  interviewers:            ", count("interviewers"))
    print("  interviewer_slots:       ", count("interviewer_slots"))
    print("  interview_assignments:   ", count("interview_assignments"))
    print("  interview_rounds:        ", count("interview_rounds"))
    print("  question_bank_assignments:", count("question_bank_assignments"))
    print("  hiring_onboarding:        ", count("hiring_onboarding"))
    print("  applications failed:      ", cur.execute(
        "SELECT COUNT(*) FROM candidates WHERE application_status = 'failed'"
    ).fetchone()[0])
    print()
    print("  candidates by status:")
    for row in cur.execute(
        "SELECT status, COUNT(*) FROM candidates GROUP BY status ORDER BY COUNT(*) DESC"
    ):
        print(f"    {row[0]:12} {row[1]}")

    conn.close()


if __name__ == "__main__":
    main()
