// ============================================================================
// API helper
// The frontend is served by the same FastAPI server as the API, so we can use
// relative URLs ("/api/...") — no host to hardcode, no CORS issues.
// ============================================================================

const API = {
  async get(path) {
    const res = await fetch(`/api${path}`);
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(`/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json();
  },
  async patch(path, body) {
    const res = await fetch(`/api${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
    return res.json();
  },
};

// ============================================================================
// MOCK DATA — still used by Dashboard / Question Banks / Candidate detail.
// Interview Schedule below is wired to the real API instead.
// Wire these up the same way (fetch from /api/candidates etc.) when ready.
// ============================================================================

const interviewers = [
  { id: 1, name: "Dinesh Anbarasan", initials: "DA", email: "dinesh.a@neuleap.ai", week: 3, slots: ["Today 3:00 PM", "Tomorrow 2:00 PM", "Thursday 11:00 AM"] },
  { id: 2, name: "Devansh Thakkar", initials: "DT", email: "devansh.t@neuleap.ai", week: 5, slots: ["Today 2:00 PM", "Tomorrow 5:00 PM", "Tomorrow 6:00 PM"] },
  { id: 3, name: "Sandeep Varma", initials: "SV", email: "sandeep.v@neuleap.ai", week: 1, slots: ["Tomorrow 10:00 AM", "Tomorrow 2:00 PM", "Friday 6:00 PM"] },
  { id: 4, name: "Abishekraswanth KR", initials: "AK", email: "abishek.kr@neuleap.ai", week: 2, slots: ["Today 4:00 PM", "Friday 9:00 AM"] },
];

// Tab definitions — labels + the "status" value each tab filters by.
// The actual rows come from the real database now (see dashboardData below).
const dashboardTabDefs = {
  new: { label: "New Candidates" },
  processing: { label: "Processing" },
  hired: { label: "Hired" },
  rejected: { label: "Rejected" },
  undecided: { label: "Undecided" },
};

function makeCandidates(count, extra) {
  const names = ["Priya Sharma", "Rohan Mehta", "Ananya Iyer", "Karan Verma", "Sara Khan", "Vikram Rao", "Meera Nair", "Arjun Das", "Divya Pillai", "Farhan Ali"];
  const colleges = ["IIT Bombay", "BITS Pilani", "NIT Trichy", "VJTI Mumbai", "DY Patil"];
  const rows = [];
  for (let i = 0; i < count; i++) {
    const name = names[i % names.length];
    rows.push({
      id: `${name}-${i}`,
      name,
      aging: `${(i % 5) + 1}d`,
      received: `${(i % 27) + 1} August 2026`,
      experience: `${(i % 4) + 1}.5 y`,
      college: colleges[i % colleges.length],
      ...extra,
    });
  }
  return rows;
}

const interviewScheduleRows = [
  { id: "is-1", name: "Priya Sharma", aging: "2d", role: "Data Engineer", stage: "Round 1", interviewer: "Dinesh Anbarasan", status: "open" },
  { id: "is-2", name: "Rohan Mehta", aging: "1d", role: "Gen AI", stage: "Round 2", interviewer: "Abishekraswanth KR", status: "open" },
  { id: "is-3", name: "Ananya Iyer", aging: "3d", role: "Data Engineer", stage: "Final Round", interviewer: "Sandeep Varma", status: "busy" },
  { id: "is-4", name: "Karan Verma", aging: "4h", role: "Data Engineer", stage: "Round 1", interviewer: "Devansh Thakkar", status: "tentative" },
  { id: "is-5", name: "Sara Khan", aging: "2d", role: "Data Engineer", stage: "Round 1", interviewer: "Dinesh Anbarasan", status: "open" },
  { id: "is-6", name: "Vikram Rao", aging: "5d", role: "Data Engineer", stage: "Round 2", interviewer: "Abishekraswanth KR", status: "busy" },
  { id: "is-7", name: "Meera Nair", aging: "1d", role: "Gen AI", stage: "Round 1", interviewer: "Dinesh Anbarasan", status: "open" },
  { id: "is-8", name: "Arjun Das", aging: "6h", role: "Data Engineer", stage: "Final Round", interviewer: "Sandeep Varma", status: "confirmed" },
  { id: "is-9", name: "Divya Pillai", aging: "2d", role: "UX Designer", stage: "Round 2", interviewer: "Devansh Thakkar", status: "open" },
  { id: "is-10", name: "Farhan Ali", aging: "3d", role: "Gen AI", stage: "Round 1", interviewer: "Dinesh Anbarasan", status: "tentative" },
];

const questionBankRows = interviewScheduleRows.map((r, i) => ({
  id: "qb-" + r.id,
  name: r.name,
  role: r.role,
  stage: r.stage,
  interviewer: r.interviewer,
  assigned: i === 2,
}));

const historyByCandidate = {
  default: [
    { title: "Screening", tag: "Gen AI", status: "completed", interviewer: "Dinesh Anbarasan", date: "13 June 2026", note: "Good candidate, strong Gen AI knowledge." },
    { title: "Round 1", tag: "Gen AI", status: "completed", interviewer: "Sampath Shetty", date: "18 June 2026", note: "Solid problem-solving; needs more depth on system design." },
    { title: "Round 2", tag: "Gen AI", status: "pending", interviewer: "Not assigned", date: "24 June 2026", note: null },
  ],
};

// The "Update" dropdown on the candidate detail page. A round is disabled
// (greyed out) once the candidate's round history shows it as completed —
// you can't move a candidate backward into a round they've already passed.
const MOVE_ROUND_OPTIONS = [
  { label: "Move to Screening Round", disabled: (h) => h.some((r) => r.title === "Screening" && r.status === "completed") },
  { label: "Move to Round 1", disabled: (h) => h.some((r) => r.title === "Round 1" && r.status === "completed") },
  { label: "Move to Round 2", disabled: () => false },
  { label: "Move to Final Round", disabled: () => false },
  { label: "Move to Final Round (In-office)", disabled: () => false },
  { label: "Directly Hire", disabled: () => false },
];

function icon(name, extraClass) {
  return `<span class="material-symbols-outlined${extraClass ? " " + extraClass : ""}">${name}</span>`;
}

// ============================================================================
// Router state
// ============================================================================

let state = {
  view: "dashboard",
  dashboardTab: "new",
  sort: { key: null, dir: 1 },
  search: "",
  candidateId: null,
};

const content = document.getElementById("content");
const pageTitle = document.getElementById("pageTitle");
const searchInput = document.getElementById("searchInput");

function navigate(view, params) {
  state.view = view;
  state.search = "";
  searchInput.value = "";
  if (view !== "dashboard") {
    // Leaving the dashboard — reset the tab indicator's remembered position
    // so returning later doesn't animate in from a stale spot.
    lastIndicatorRect = null;
  }
  if (params) Object.assign(state, params);
  render();
}

function render() {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("nav-item--active", btn.dataset.view === state.view);
  });

  if (state.view === "dashboard") {
    pageTitle.textContent = "Dashboard";
    renderDashboard();
  } else if (state.view === "question-banks") {
    pageTitle.textContent = "Question Banks";
    renderQuestionBanks();
  } else if (state.view === "interview-schedule") {
    pageTitle.textContent = "Interview Schedule";
    renderInterviewSchedule();
  } else if (state.view === "token-usage") {
    pageTitle.textContent = "Token Usage";
    renderTokenUsage();
  } else if (state.view === "candidate-detail") {
    pageTitle.textContent = state.candidateId || "Candidate";
    renderCandidateDetail(state.candidateId);
  }
}

// ============================================================================
// Sort + filter helpers
// ============================================================================

function applySort(rows, key) {
  if (!key) return rows;
  const sorted = [...rows].sort((a, b) => {
    const av = a[key], bv = b[key];
    return String(av).localeCompare(String(bv), undefined, { numeric: true });
  });
  return state.sort.dir === 1 ? sorted : sorted.reverse();
}

function applySearch(rows) {
  if (!state.search) return rows;
  const q = state.search.toLowerCase();
  return rows.filter((r) => r.name.toLowerCase().includes(q));
}

function sortIcon(key) {
  if (state.sort.key !== key) return icon("unfold_more", "sort-icon-glyph");
  return state.sort.dir === 1 ? icon("arrow_upward", "sort-icon-glyph") : icon("arrow_downward", "sort-icon-glyph");
}

function onSortClick(key) {
  if (state.sort.key === key) {
    state.sort.dir *= -1;
  } else {
    state.sort = { key, dir: 1 };
  }
  render();
}

function initials(name) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

// Formats a "YYYY-MM-DD HH:MM:SS" timestamp from the API into something
// readable, down to the second, e.g. "22 Sep 2026, 3:11:56 PM".
function formatTimestamp(raw) {
  if (!raw) return "\u2013";
  const [datePart, timePart] = raw.split(" ");
  const [y, m, d] = datePart.split("-").map(Number);
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let timeStr = "";
  if (timePart) {
    let [hh, mm, ss] = timePart.split(":").map(Number);
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12 || 12;
    timeStr = `, ${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")} ${ampm}`;
  }
  return `${d} ${monthNames[m - 1]} ${y}${timeStr}`;
}

// Wires the "candidate name" link inside a table body to open their detail
// page — deliberately NOT the whole row, per design: only the name is a link.
function wireNameLinks(bodySelector) {
  document.querySelectorAll(`${bodySelector} .name-link`).forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      state.previousView = state.view;
      navigate("candidate-detail", { candidateId: el.dataset.name });
    });
  });
}

// ============================================================================
// Dashboard view
// ============================================================================

// Cache of ALL candidates fetched from the API (every status). We filter by
// tab client-side rather than refetching per tab — 500 rows is small enough
// to hold in memory, and it means tab counts are always accurate together.
let dashboardData = null;

function renderDashboard() {
  if (dashboardData === null) {
    content.innerHTML = `<div class="empty-state" style="padding-top:60px;">Loading candidates\u2026</div>`;
    loadDashboard();
    return;
  }
  if (state.dashboardTab === "hired") {
    if (hiredData === null) {
      drawDashboardTabs(); // show tabs immediately, table area loads under it
      loadHired();
      return;
    }
    drawHiredTable();
    return;
  }
  drawDashboardTable();
}

async function loadDashboard() {
  try {
    dashboardData = await API.get("/candidates");
    if (state.view === "dashboard") render();
  } catch (err) {
    content.innerHTML = `
      <div class="empty-state" style="padding-top:60px;">
        Couldn't load candidates.<br />
        Is the backend running? (${err.message})
      </div>`;
  }
}

// Renders just the tab bar (used as a shared header for both the normal
// table and the Hired table, which has a totally different column set).
function drawDashboardTabs() {
  const tabKeys = Object.keys(dashboardTabDefs);
  content.innerHTML = `
    <div class="tabs" id="dashTabs">
      ${tabKeys.map(k => {
        const count = dashboardData.filter((c) => c.status === k).length;
        return `
        <button class="tab ${k === state.dashboardTab ? "tab--active" : ""}" data-tab="${k}">
          ${dashboardTabDefs[k].label} (${count})
        </button>
      `;
      }).join("")}
      <span class="tabs__spacer"></span>
      <button class="btn-pipeline" id="runPipelineBtn">${icon("play_arrow")} Run Pipeline</button>
      <span class="tabs__indicator" id="tabsIndicator"></span>
    </div>
    <div class="tabs-panel" id="dashPanel">
      <div class="empty-state">Loading\u2026</div>
    </div>
  `;
  wireDashboardTabButtons();
  animateTabsIndicator();
}

function wireDashboardTabButtons() {
  document.querySelectorAll("#dashTabs .tab[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.dashboardTab = btn.dataset.tab;
      state.sort = { key: null, dir: 1 };
      render();
    });
  });
  const pipelineBtn = document.getElementById("runPipelineBtn");
  if (pipelineBtn) {
    pipelineBtn.addEventListener("click", () => {
      alert("Pipeline started (placeholder — wire this up to your real pipeline endpoint).");
    });
  }
}

// Does this row's received_date fall in the date picker's selected month/year?
function matchesDateFilter(receivedDate) {
  if (!receivedDate) return false;
  const [y, m] = receivedDate.split(" ")[0].split("-").map(Number);
  return y === selectedYear && m === months.indexOf(selectedMonth) + 1;
}

function drawDashboardTable() {
  // Status = the tab itself, applied first; then the date picker; then search/sort.
  let rows = dashboardData.filter((c) => c.status === state.dashboardTab);
  rows = rows.filter((c) => matchesDateFilter(c.received_date));
  rows = applySort(rows, state.sort.key);
  rows = applySearch(rows);

  const isNewTab = state.dashboardTab === "new";

  content.innerHTML = `
    <div class="tabs" id="dashTabs">
      ${Object.keys(dashboardTabDefs).map(k => {
        const count = dashboardData.filter((c) => c.status === k).length;
        return `
        <button class="tab ${k === state.dashboardTab ? "tab--active" : ""}" data-tab="${k}">
          ${dashboardTabDefs[k].label} (${count})
        </button>
      `;
      }).join("")}
      <span class="tabs__spacer"></span>
      <button class="btn-pipeline" id="runPipelineBtn">${icon("play_arrow")} Run Pipeline</button>
      <span class="tabs__indicator" id="tabsIndicator"></span>
    </div>

    <div class="tabs-panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th class="sortable" data-sort="aging_days">Aging <span class="sort-icon">${sortIcon("aging_days")}</span></th>
              <th class="sortable" data-sort="received_date">Received <span class="sort-icon">${sortIcon("received_date")}</span></th>
              <th>Experience</th>
              <th>College</th>
              ${isNewTab
                ? `<th>Status</th><th>Reason</th>`
                : `<th>View History</th>`
              }
            </tr>
          </thead>
          <tbody id="dashBody">
            ${rows.map(r => `
              <tr data-id="${r.candidate_code}">
                <td><div class="cell-name"><div class="row-avatar">${initials(r.name)}</div><button class="name-link" data-name="${r.name}">${r.name}</button></div></td>
                <td class="text-muted">${r.aging_days}d</td>
                <td class="text-muted">${formatTimestamp(r.received_date)}</td>
                <td class="text-muted">${r.experience_years === 0 ? "Fresher" : r.experience_years + " y"}</td>
                <td class="text-muted">${r.college}</td>
                ${isNewTab
                  ? `<td><span class="status-pill status-pill--${r.application_status}">${r.application_status === "success" ? "Success" : "Failed"}</span></td>
                     <td class="text-muted">${r.application_failure_reason || "\u2013"}</td>`
                  : `<td><button class="link-underline" data-history="${r.name}">View History</button></td>`
                }
              </tr>
            `).join("") || `<tr><td colspan="${isNewTab ? 7 : 6}"><div class="empty-state">No candidates match your search or the selected month.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  wireDashboardTabButtons();
  wireSortableHeaders();
  wireNameLinks("#dashBody");
  document.querySelectorAll("#dashBody [data-history]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openHistoryOverlay(btn.dataset.history);
    });
  });
  animateTabsIndicator();
}

// Tracks the indicator's last on-screen position so the next render can
// animate from there (FLIP technique) even though the tab bar's DOM is
// rebuilt from scratch on every render.
let lastIndicatorRect = null;

function animateTabsIndicator() {
  const tabsEl = document.getElementById("dashTabs");
  const indicator = document.getElementById("tabsIndicator");
  const activeTab = tabsEl ? tabsEl.querySelector(".tab--active") : null;
  if (!tabsEl || !indicator || !activeTab) return;

  const containerRect = tabsEl.getBoundingClientRect();
  const activeRect = activeTab.getBoundingClientRect();
  const newLeft = activeRect.left - containerRect.left;
  const newWidth = activeRect.width;

  if (lastIndicatorRect) {
    // Snap to the previous position first, with no transition...
    indicator.style.transition = "none";
    indicator.style.left = lastIndicatorRect.left + "px";
    indicator.style.width = lastIndicatorRect.width + "px";
    indicator.offsetWidth; // force reflow
    // ...then animate from there to the new tab's position.
    indicator.style.transition = "";
    indicator.style.left = newLeft + "px";
    indicator.style.width = newWidth + "px";
  } else {
    // First time the dashboard is shown — place it directly, no animation.
    indicator.style.transition = "none";
    indicator.style.left = newLeft + "px";
    indicator.style.width = newWidth + "px";
    indicator.offsetWidth;
    indicator.style.transition = "";
  }

  lastIndicatorRect = { left: newLeft, width: newWidth };
}

// ============================================================================
// Hired tab — its own columns, its own endpoint (see /api/hired)
// ============================================================================

let hiredData = null;

async function loadHired() {
  try {
    hiredData = await API.get("/hired");
    if (state.view === "dashboard" && state.dashboardTab === "hired") drawHiredTable();
  } catch (err) {
    const panel = document.getElementById("dashPanel");
    if (panel) {
      panel.innerHTML = `<div class="empty-state">Couldn't load hired candidates. (${err.message})</div>`;
    }
  }
}

function formatDatePretty(iso) {
  if (!iso) return "\u2013";
  const [y, m, d] = iso.split("-").map(Number);
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${d} ${monthNames[m - 1]} ${y}`;
}

function drawHiredTable() {
  let rows = applySearch(hiredData);

  content.innerHTML = `
    <div class="tabs" id="dashTabs">
      ${Object.keys(dashboardTabDefs).map(k => {
        const count = dashboardData.filter((c) => c.status === k).length;
        return `
        <button class="tab ${k === state.dashboardTab ? "tab--active" : ""}" data-tab="${k}">
          ${dashboardTabDefs[k].label} (${count})
        </button>
      `;
      }).join("")}
      <span class="tabs__spacer"></span>
      <button class="btn-pipeline" id="runPipelineBtn">${icon("play_arrow")} Run Pipeline</button>
      <span class="tabs__indicator" id="tabsIndicator"></span>
    </div>

    <div class="tabs-panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Joining Date</th>
              <th>History</th>
              <th class="cell-center">Offer Letter</th>
              <th>Offer Reply</th>
              <th class="cell-center">IT Asset Allocated</th>
              <th class="cell-center">Induction Scheduled</th>
              <th class="cell-center">BG Verified</th>
              <th class="cell-center">Buddy Assigned</th>
            </tr>
          </thead>
          <tbody id="hiredBody">
            ${rows.map(r => {
              const accepted = r.offer_reply === "Accepted";
              const checkbox = (field, checked) => `
                <input type="checkbox" class="onboard-checkbox" data-onboard="${r.candidate_id}" data-field="${field}" ${checked ? "checked" : ""} />
              `;
              return `
              <tr data-id="${r.candidate_id}">
                <td><div class="cell-name"><div class="row-avatar">${initials(r.name)}</div><button class="name-link" data-name="${r.name}">${r.name}</button></div></td>
                <td class="text-muted">${r.role}</td>
                <td class="text-muted">
                  <label class="onboard-date">
                    ${icon("calendar_today")} ${formatDatePretty(r.joining_date)}
                    <input type="date" data-onboard="${r.candidate_id}" data-field="joining_date" value="${r.joining_date || ""}" />
                  </label>
                </td>
                <td><button class="link-underline" data-history="${r.name}">${icon("calendar_today")} View History</button></td>
                <td class="cell-center">${checkbox("offer_letter", r.offer_letter)}</td>
                <td>
                  <select class="onboard-select" data-onboard="${r.candidate_id}" data-field="offer_reply">
                    ${["Accepted", "Rejected", "No Response"].map(opt =>
                      `<option value="${opt}" ${r.offer_reply === opt ? "selected" : ""}>${opt}</option>`
                    ).join("")}
                  </select>
                </td>
                <td class="cell-center">${accepted ? checkbox("it_asset_allocated", r.it_asset_allocated) : `<span class="onboard-dash">\u2013</span>`}</td>
                <td class="cell-center">${accepted ? checkbox("induction_scheduled", r.induction_scheduled) : `<span class="onboard-dash">\u2013</span>`}</td>
                <td class="cell-center">${accepted ? checkbox("bg_verified", r.bg_verified) : `<span class="onboard-dash">\u2013</span>`}</td>
                <td class="cell-center">${accepted ? checkbox("buddy_assigned", r.buddy_assigned) : `<span class="onboard-dash">\u2013</span>`}</td>
              </tr>
            `;
            }).join("") || `<tr><td colspan="10"><div class="empty-state">No hired candidates match your search.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  wireDashboardTabButtons();
  wireNameLinks("#hiredBody");
  animateTabsIndicator();

  document.querySelectorAll("#hiredBody [data-history]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openHistoryOverlay(btn.dataset.history);
    });
  });

  // Checkboxes — toggle immediately, PATCH in the background.
  document.querySelectorAll('#hiredBody input[type="checkbox"][data-onboard]').forEach((cb) => {
    cb.addEventListener("change", () => saveOnboardingField(cb.dataset.onboard, cb.dataset.field, cb.checked));
  });

  // Offer Reply dropdown — changes which columns show checkboxes vs "–", so redraw.
  document.querySelectorAll('#hiredBody select[data-onboard]').forEach((sel) => {
    sel.addEventListener("change", async () => {
      await saveOnboardingField(sel.dataset.onboard, sel.dataset.field, sel.value);
      const rec = hiredData.find((h) => String(h.candidate_id) === sel.dataset.onboard);
      if (rec) rec.offer_reply = sel.value;
      drawHiredTable();
    });
  });

  // Joining date picker — native browser date input, hidden but clickable via the label.
  document.querySelectorAll('#hiredBody input[type="date"][data-onboard]').forEach((input) => {
    input.addEventListener("change", async () => {
      await saveOnboardingField(input.dataset.onboard, input.dataset.field, input.value);
      const rec = hiredData.find((h) => String(h.candidate_id) === input.dataset.onboard);
      if (rec) rec.joining_date = input.value;
      drawHiredTable();
    });
  });
}

async function saveOnboardingField(candidateId, field, value) {
  try {
    await API.patch(`/hired/${candidateId}/onboarding`, { field, value });
  } catch (err) {
    alert("Couldn't save that change: " + err.message);
  }
}

// ============================================================================
// Interview Schedule view
// ============================================================================

// Cache of the rows fetched from the API, so sorting/searching don't refetch.
let interviewScheduleData = null;

// Entry point from the router. If we don't have data yet, show a loading state
// and fetch it; once loaded (or on sort/search) we render from the cache.
function renderInterviewSchedule() {
  if (interviewScheduleData === null) {
    content.innerHTML = `<div class="empty-state" style="padding-top:60px;">Loading interview schedule\u2026</div>`;
    loadInterviewSchedule();
    return;
  }
  drawInterviewScheduleTable();
}

async function loadInterviewSchedule() {
  try {
    interviewScheduleData = await API.get("/interview-schedule");
    // only redraw if the user is still on this view
    if (state.view === "interview-schedule") drawInterviewScheduleTable();
  } catch (err) {
    content.innerHTML = `
      <div class="empty-state" style="padding-top:60px;">
        Couldn't load the interview schedule.<br />
        Is the backend running? (${err.message})
      </div>`;
  }
}

function drawInterviewScheduleTable() {
  let rows = applySort(interviewScheduleData, state.sort.key);
  rows = applySearch(rows);

  const statusLabel = { open: "Open", busy: "Busy", tentative: "Tentative", confirmed: "Confirmed" };

  content.innerHTML = `
    <div style="padding-top:20px;"></div>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th class="sortable" data-sort="aging_days">Aging <span class="sort-icon">${sortIcon("aging_days")}</span></th>
            <th>Role</th>
            <th>Stage</th>
            <th>Suggested Interviewer</th>
            <th class="cell-center">Slot Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="isBody">
          ${rows.map(r => {
            const isReassign = r.status === "busy" || r.status === "confirmed";
            return `
            <tr data-id="${r.candidate_id}">
              <td><div class="cell-name"><div class="row-avatar">${initials(r.name)}</div><button class="name-link" data-name="${r.name}">${r.name}</button></div></td>
              <td class="text-muted">${r.aging_days}d</td>
              <td class="text-muted">${r.role}</td>
              <td class="text-muted">${r.stage}</td>
              <td class="text-muted">${r.interviewer}</td>
              <td class="cell-center"><span class="status-pill status-pill--${r.status}">${statusLabel[r.status] || r.status}</span></td>
              <td>
                <div class="split-btn split-btn--${isReassign ? "reassign" : "assign"}">
                  <button class="split-btn__main" data-quick-assign="${r.candidate_id}">${isReassign ? "Reassign" : "Assign"}</button>
                  <span class="split-btn__divider"></span>
                  <button class="split-btn__arrow" data-open-dialog="${r.candidate_id}">${icon("expand_more")}</button>
                </div>
              </td>
            </tr>
          `;
          }).join("") || `<tr><td colspan="7"><div class="empty-state">No candidates match your search.</div></td></tr>`}
        </tbody>
      </table>
    </div>
  `;

  wireSortableHeaders();

  // Chevron: always opens the full dialog for manual interviewer/slot pick.
  document.querySelectorAll("[data-open-dialog]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const row = interviewScheduleData.find((r) => String(r.candidate_id) === btn.dataset.openDialog);
      openAssignOverlay(row);
    });
  });

  // Main label: quick-assign straight to the suggested interviewer's next
  // free slot. Falls back to opening the dialog if there's no suggested
  // interviewer, or they have no free slots left.
  document.querySelectorAll("[data-quick-assign]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const row = interviewScheduleData.find((r) => String(r.candidate_id) === btn.dataset.quickAssign);
      await quickAssignSuggested(row, btn);
    });
  });

  wireNameLinks("#isBody");
}

async function quickAssignSuggested(row, buttonEl) {
  if (!row.interviewer_id) {
    // No suggested interviewer on this row — nothing to quick-assign to.
    openAssignOverlay(row);
    return;
  }

  buttonEl.disabled = true;
  const originalText = buttonEl.textContent;
  buttonEl.textContent = "Assigning\u2026";

  try {
    const people = await API.get("/interviewers");
    const suggested = people.find((p) => p.id === row.interviewer_id);
    if (!suggested || suggested.slots.length === 0) {
      // Suggested interviewer has no free slots — fall back to manual picking.
      openAssignOverlay(row);
      return;
    }
    await API.post("/assignments", {
      candidate_id: row.candidate_id,
      interviewer_id: suggested.id,
      slot_label: suggested.slots[0],
      stage: row.stage,
    });
    interviewScheduleData = null;
    render();
  } catch (err) {
    alert("Couldn't assign the suggested interviewer: " + err.message);
    buttonEl.disabled = false;
    buttonEl.textContent = originalText;
  }
}

// ============================================================================
// Question Banks view
// ============================================================================

function renderQuestionBanks() {
  let rows = applySearch(questionBankRows);

  content.innerHTML = `
    <div class="content-header">
      <button class="btn-upload" id="uploadBankBtn">Upload Question Bank ${icon("upload")}</button>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Stage</th>
            <th>Interviewer</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="qbBody">
          ${rows.map(r => `
            <tr data-id="${r.id}">
              <td><div class="cell-name"><div class="row-avatar">${initials(r.name)}</div><button class="name-link" data-name="${r.name}">${r.name}</button></div></td>
              <td class="text-muted">${r.role}</td>
              <td class="text-muted">${r.stage}</td>
              <td class="text-muted">${r.interviewer}</td>
              <td>
                <button
                  class="btn-table-action ${r.assigned ? "btn-table-action--assigned" : "btn-table-action--assign"}"
                  data-bank="${r.id}"
                  aria-pressed="${r.assigned}"
                >${r.assigned ? "Assigned" : "Assign Bank"}</button>
              </td>
            </tr>
          `).join("") || `<tr><td colspan="5"><div class="empty-state">No candidates match your search.</div></td></tr>`}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("uploadBankBtn").addEventListener("click", () => {
    alert("Hook this up to a real file input + upload endpoint once the backend exists.");
  });

  document.querySelectorAll("[data-bank]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const row = questionBankRows.find((r) => r.id === btn.dataset.bank);
      row.assigned = !row.assigned;
      renderQuestionBanks();
    });
  });

  wireNameLinks("#qbBody");
}

// ============================================================================
// Token Usage view (placeholder — no Figma frame was available for this yet)
// ============================================================================

function renderTokenUsage() {
  content.innerHTML = `
    <div class="empty-state" style="padding-top:80px;">
      No Figma frame for Token Usage was available to match yet.<br />
      Swap this placeholder out once that screen is designed.
    </div>
  `;
}

// ============================================================================
// Candidate detail view
// ============================================================================

function renderCandidateDetail(name) {
  const history = historyByCandidate[name] || historyByCandidate.default;

  content.innerHTML = `
    <div class="candidate-page">
      <button class="back-link" id="backBtn">${icon("arrow_back")} Back</button>

      <div class="candidate-header">
        <div class="candidate-header__left">
          <div class="candidate-header__avatar">${initials(name)}</div>
          <div>
            <div class="candidate-header__name">${name} <span class="candidate-header__id">C${1000 + (name.length * 7 % 900)}</span></div>
            <div class="candidate-header__meta">
              <span>${icon("mail")} ${name.toLowerCase().replace(/\s+/g, ".")}@email.com</span>
              <span>${icon("call")} +91 98765 43210</span>
              <span>${icon("location_on")} Bangalore</span>
            </div>
          </div>
        </div>
        <div class="candidate-header__actions">
          <button class="btn-outline">View Resume ${icon("open_in_new")}</button>
          <button class="btn-solid" id="updateBtn">${icon("bolt")} Update</button>
          <div class="update-menu" id="updateMenu" hidden>
            ${MOVE_ROUND_OPTIONS.map((opt, i) => `
              <button class="update-menu__item" data-move-index="${i}" ${opt.disabled(history) ? "disabled" : ""}>${opt.label}</button>
            `).join("")}
          </div>
        </div>
      </div>

      <div class="accordion" id="accSummary">
        <button class="accordion__header">${icon("chat_bubble")} One Line Summary ${icon("expand_more", "chevron")}</button>
        <div class="accordion__body">
          Early-career AI Engineer with hands-on experience in LLM systems, RAG, and scalable AI application development.
        </div>
      </div>

      <div class="accordion accordion--open" id="accAnalysis">
        <button class="accordion__header">${icon("fact_check")} Analysis Report ${icon("expand_more", "chevron")}</button>
        <div class="accordion__body">
          <div class="analysis-item">
            <div class="analysis-item__num">1</div>
            <div>
              <div class="analysis-item__title">Fresher or Experienced</div>
              <div class="analysis-item__text">The candidate is experienced, with qualifying roles totaling over 9 months of professional experience.</div>
            </div>
          </div>
          <div class="analysis-item">
            <div class="analysis-item__num">2</div>
            <div>
              <div class="analysis-item__title">Graduation &amp; Window</div>
              <div class="analysis-item__text">Highest completed undergraduate degree finished in 2019. Currently pursuing a BS in Data Science (2022&ndash;current).</div>
            </div>
          </div>
          <div class="analysis-item">
            <div class="analysis-item__num">3</div>
            <div>
              <div class="analysis-item__title">Company Projects</div>
              <div class="analysis-item__text">Built an image similarity search system and a RAG-based LLM application, demonstrating hands-on GenAI and deployment skills.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="accordion" id="accHistory">
        <button class="accordion__header">${icon("history")} Round History ${icon("expand_more", "chevron")}</button>
        <div class="accordion__body" hidden>
          ${history.map(h => `
            <div class="history-mini">
              <strong>${h.title} &middot; ${h.tag}</strong>
              <span class="status-pill status-pill--${h.status}">${h.status === "completed" ? "Completed" : "Pending"}</span>
            </div>
          `).join("")}
          <button class="link-more" id="openFullHistory">View full round history &rarr;</button>
        </div>
      </div>

      <div class="accordion" id="accEducation">
        <button class="accordion__header">${icon("school")} Education ${icon("expand_more", "chevron")}</button>
        <div class="accordion__body" hidden>
          <div class="info-row"><div><span class="info-row__label">College</span>D.Y. Patil Agriculture &amp; Technical University, Kolhapur</div></div>
          <div class="info-row"><div><span class="info-row__label">Highest Degree</span>Bachelor's</div></div>
          <div class="info-row"><div><span class="info-row__label">CGPA</span>8.3</div></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("backBtn").addEventListener("click", () => {
    navigate(state.previousView || "dashboard");
  });

  document.querySelectorAll(".accordion__header").forEach((header) => {
    header.addEventListener("click", () => {
      const acc = header.parentElement;
      const body = acc.querySelector(".accordion__body");
      const isOpen = acc.classList.toggle("accordion--open");
      body.hidden = !isOpen;
    });
  });

  const openHistory = () => openHistoryOverlay(name);
  const fullHistoryBtn = document.getElementById("openFullHistory");
  if (fullHistoryBtn) fullHistoryBtn.addEventListener("click", openHistory);

  // "Update" dropdown — move the candidate to a further interview round.
  // Each enabled option is linked to the Interview Schedule page.
  const updateBtn = document.getElementById("updateBtn");
  const updateMenu = document.getElementById("updateMenu");
  updateBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    updateMenu.hidden = !updateMenu.hidden;
  });
  updateMenu.querySelectorAll(".update-menu__item:not(:disabled)").forEach((item) => {
    item.addEventListener("click", () => {
      updateMenu.hidden = true;
      navigate("interview-schedule");
    });
  });
}

function wireSortableHeaders() {
  document.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => onSortClick(th.dataset.sort));
  });
}

// ============================================================================
// Assign Interviewer overlay
// ============================================================================

const assignOverlay = document.getElementById("assignOverlay");
const assignList = document.getElementById("assignList");
const assignSubtitle = document.getElementById("assignSubtitle");
const confirmBtn = document.getElementById("confirmBtn");

let selectedInterviewerId = null;
let selectedSlot = null;
let currentAssignCandidateId = null;
let currentAssignStage = null;

async function openAssignOverlay(row) {
  assignSubtitle.textContent = `${row.name} \u00b7 ${row.role} \u00b7 ${row.stage}`;
  currentAssignCandidateId = row.candidate_id;
  currentAssignStage = row.stage;
  selectedInterviewerId = null;
  selectedSlot = null;
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Confirm Assignment";

  assignList.innerHTML = `<div class="empty-state">Loading interviewers\u2026</div>`;
  assignOverlay.hidden = false;

  let people;
  try {
    people = await API.get("/interviewers");
  } catch (err) {
    assignList.innerHTML = `<div class="empty-state">Couldn't load interviewers. (${err.message})</div>`;
    return;
  }

  // only show interviewers who actually have a free slot to offer
  const withSlots = people.filter((p) => p.slots.length > 0);

  assignList.innerHTML = withSlots.map((p) => `
    <div class="interviewer-card">
      <div class="interviewer-card__top">
        <div class="interviewer-card__avatar">${initials(p.name)}</div>
        <span class="interviewer-card__name">${p.name}</span>
        <span class="interviewer-card__meta">This week: ${p.week} interviews</span>
      </div>
      <div class="interviewer-card__slots">
        ${p.slots.map((slot) => `<button class="slot-chip" data-person="${p.id}" data-slot="${slot}" aria-pressed="false">${slot}</button>`).join("")}
      </div>
    </div>
  `).join("") || `<div class="empty-state">No interviewers have free slots right now.</div>`;

  assignList.querySelectorAll(".slot-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      assignList.querySelectorAll(".slot-chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", "true");
      selectedInterviewerId = Number(chip.dataset.person);
      selectedSlot = chip.dataset.slot;
      const person = withSlots.find((p) => p.id === selectedInterviewerId);
      confirmBtn.disabled = false;
      confirmBtn.textContent = `Confirm Assignment \u00b7 ${person.name}, ${selectedSlot}`;
    });
  });
}

document.getElementById("closeAssignOverlay").addEventListener("click", () => (assignOverlay.hidden = true));
assignOverlay.addEventListener("click", (e) => { if (e.target === assignOverlay) assignOverlay.hidden = true; });

confirmBtn.addEventListener("click", async () => {
  if (!selectedInterviewerId || !selectedSlot) return;
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Saving\u2026";
  try {
    await API.post("/assignments", {
      candidate_id: currentAssignCandidateId,
      interviewer_id: selectedInterviewerId,
      slot_label: selectedSlot,
      stage: currentAssignStage,
    });
    assignOverlay.hidden = true;
    // Re-fetch the schedule so the row shows its new confirmed status.
    interviewScheduleData = null;
    render();
  } catch (err) {
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Confirm Assignment";
    alert("Couldn't save the assignment: " + err.message);
  }
});

// ============================================================================
// Round History overlay
// ============================================================================

const historyOverlay = document.getElementById("historyOverlay");
const historyList = document.getElementById("historyList");

function openHistoryOverlay(name) {
  const history = historyByCandidate[name] || historyByCandidate.default;
  historyList.innerHTML = history.map((h) => `
    <div class="history-round">
      <div class="history-round__top">
        <span class="history-round__title">${h.title} &middot; ${h.tag}</span>
        <span class="history-round__spacer"></span>
        <span class="status-pill status-pill--${h.status}">${h.status === "completed" ? "Completed" : "Pending"}</span>
      </div>
      <div class="history-round__meta">
        <span>${icon("person")} ${h.interviewer}</span>
        <span>${icon("calendar_today")} ${h.date}</span>
      </div>
      ${h.note ? `<div class="history-round__note">${icon("chat_bubble")} ${h.note}</div>` : ""}
    </div>
  `).join("");
  historyOverlay.hidden = false;
}

document.getElementById("closeHistoryOverlay").addEventListener("click", () => (historyOverlay.hidden = true));
historyOverlay.addEventListener("click", (e) => { if (e.target === historyOverlay) historyOverlay.hidden = true; });

// ============================================================================
// Sidebar navigation
// ============================================================================

document.getElementById("sidebarNav").addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-item");
  if (btn) navigate(btn.dataset.view);
});

document.getElementById("signOutBtn").addEventListener("click", () => {
  if (confirm("Sign out of Talent Scooper?")) {
    alert("Signed out (placeholder — wire this up to your real auth flow).");
  }
});

// ============================================================================
// Search (filters whichever table is currently shown)
// ============================================================================

searchInput.addEventListener("input", (e) => {
  state.search = e.target.value;
  render();
  // re-focus + restore cursor since render() rebuilds the DOM, but the search
  // input itself lives outside #content so it's never destroyed
});

// ============================================================================
// Date picker dropdown
// ============================================================================

const dateChipBtn = document.getElementById("dateChipBtn");
const datePicker = document.getElementById("datePicker");
const dateChipLabel = document.getElementById("dateChipLabel");
const yearCol = document.getElementById("yearCol");
const monthCol = document.getElementById("monthCol");

const years = [2024, 2025, 2026, 2027];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// Default to the current month/year so the Dashboard's date filter actually
// matches the freshly-seeded data (which is dated within the last 30 days).
const today = new Date();
let selectedYear = today.getFullYear();
let selectedMonth = months[today.getMonth()];

function renderDatePicker() {
  yearCol.innerHTML = years.map(y => `
    <button class="date-picker__item ${y === selectedYear ? "date-picker__item--selected" : ""}" data-year="${y}">${y}</button>
  `).join("");
  monthCol.innerHTML = months.map(m => `
    <button class="date-picker__item ${m === selectedMonth ? "date-picker__item--selected" : ""}" data-month="${m}">${m}</button>
  `).join("");

  yearCol.querySelectorAll("[data-year]").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedYear = Number(btn.dataset.year);
      updateDateChip();
      renderDatePicker();
      if (state.view === "dashboard") render(); // re-filter the table by the new month/year
    });
  });
  monthCol.querySelectorAll("[data-month]").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedMonth = btn.dataset.month;
      updateDateChip();
      renderDatePicker();
      if (state.view === "dashboard") render();
    });
  });
}

function updateDateChip() {
  dateChipLabel.textContent = `${selectedMonth} ${selectedYear}`;
}

dateChipBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  datePicker.hidden = !datePicker.hidden;
  if (!datePicker.hidden) renderDatePicker();
});

document.addEventListener("click", (e) => {
  if (!datePicker.hidden && !datePicker.contains(e.target) && e.target !== dateChipBtn) {
    datePicker.hidden = true;
  }
});

// ============================================================================
// Notifications dropdown
// ============================================================================

const notifBtn = document.getElementById("notifBtn");
const notifPanel = document.getElementById("notifPanel");

notifBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  notifPanel.hidden = !notifPanel.hidden;
});

document.addEventListener("click", (e) => {
  if (!notifPanel.hidden && !notifPanel.contains(e.target) && e.target !== notifBtn) {
    notifPanel.hidden = true;
  }
});

// Close the candidate-detail "Update" menu on an outside click. Queried
// fresh each time (rather than cached at load time) since the candidate
// detail page — and this menu with it — is rebuilt every time it's visited.
document.addEventListener("click", (e) => {
  const updateMenu = document.getElementById("updateMenu");
  const updateBtn = document.getElementById("updateBtn");
  if (updateMenu && !updateMenu.hidden && !updateMenu.contains(e.target) && e.target !== updateBtn) {
    updateMenu.hidden = true;
  }
});

// ============================================================================
// Theme toggle
// ============================================================================

const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  const isLight = document.body.getAttribute("data-theme") === "light";
  if (isLight) {
    document.body.removeAttribute("data-theme");
    themeToggle.innerHTML = icon("light_mode");
  } else {
    document.body.setAttribute("data-theme", "light");
    themeToggle.innerHTML = icon("dark_mode");
  }
});

// ============================================================================
// Refresh button (placeholder)
// ============================================================================

document.getElementById("refreshBtn").addEventListener("click", () => {
  // Drop cached API data so the current view refetches fresh from the server.
  interviewScheduleData = null;
  dashboardData = null;
  hiredData = null;
  render();
});

// ============================================================================
// Init
// ============================================================================

updateDateChip(); // reflect the real current month/year, not the HTML's placeholder
render();
