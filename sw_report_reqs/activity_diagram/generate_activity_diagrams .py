"""
Activity Diagram Generator — SmartCare HMS (SRS v2.1)
Generates one PNG per use case using matplotlib.

Changes from v2.0:
  • FR numbering updated throughout to match SRS v2.1 sequential scheme.
  • UC-03 Reset Password now covers BOTH paths:
      – Change via current password (logged-in user)
      – Forgot-password email-reset flow
  • UC-05 / UC-06 FR references updated: FR-06/FR-07/FR-08
  • UC-04 now references FR-05 (Extended Profile Management)
  • Minor label polish throughout.

Run:
    python generate_activity_diagrams.py
Output:
    UC-01_Register_Account.png … UC-18_Manage_Drug_Catalogue.png
    (same folder as this script)
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe
import numpy as np
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Palette ──────────────────────────────────────────────────────────────────
BG          = "#F8FAFC"
TITLE_BG    = "#1E3A5F"
TITLE_FG    = "#FFFFFF"
ACTION_BG   = "#DBEAFE"
ACTION_BD   = "#2563EB"
ACTION_FG   = "#1E3A5F"
DECISION_BG = "#FEF9C3"
DECISION_BD = "#CA8A04"
DECISION_FG = "#713F12"
FORK_COL    = "#334155"
ARROW_COL   = "#334155"
START_COL   = "#1E3A5F"
END_COL     = "#1E3A5F"
NOTE_BG     = "#F0FDF4"
NOTE_BD     = "#16A34A"
NOTE_FG     = "#14532D"
SWIMLANE_COLORS = ["#EFF6FF", "#F0FDF4", "#FFF7ED", "#FAF5FF", "#FFF1F2"]
SWIMLANE_BD     = "#CBD5E1"
LANE_LABEL_COL  = "#475569"
GUARD_COL       = "#6B7280"

# ── Layout constants ─────────────────────────────────────────────────────────
NODE_W      = 3.0
NODE_H      = 0.52
DEC_SIZE    = 0.55
ROW_H       = 1.0
BRANCH_SEP  = 3.6
COL_X       = 0.0
ARROW_FS    = 7.5
NODE_FS     = 8.5
TITLE_FS    = 11


# ════════════════════════════════════════════════════════════════════════════
#  LOW-LEVEL DRAWING HELPERS
# ════════════════════════════════════════════════════════════════════════════

def _action(ax, x, y, label, color=ACTION_BG, border=ACTION_BD, fg=ACTION_FG,
            w=NODE_W, h=NODE_H, fs=NODE_FS, bold=False):
    bx = FancyBboxPatch((x - w/2, y - h/2), w, h,
                         boxstyle="round,pad=0.07", linewidth=1.4,
                         edgecolor=border, facecolor=color, zorder=3)
    ax.add_patch(bx)
    ax.text(x, y, label, ha='center', va='center', fontsize=fs,
            color=fg, zorder=4, fontweight='bold' if bold else 'normal',
            wrap=False)
    return y - h/2


def _diamond(ax, x, y, label):
    s = DEC_SIZE
    diamond = plt.Polygon(
        [[x, y+s], [x+s*1.6, y], [x, y-s], [x-s*1.6, y]],
        closed=True, facecolor=DECISION_BG, edgecolor=DECISION_BD,
        linewidth=1.4, zorder=3)
    ax.add_patch(diamond)
    ax.text(x, y, label, ha='center', va='center', fontsize=7.5,
            color=DECISION_FG, zorder=4, fontweight='bold')
    return y - s


def _start(ax, x, y, r=0.18):
    circle = plt.Circle((x, y), r, color=START_COL, zorder=4)
    ax.add_patch(circle)
    return y - r


def _end(ax, x, y, r=0.18):
    outer = plt.Circle((x, y), r+0.07, color=END_COL, zorder=4)
    inner = plt.Circle((x, y), r,      color='white', zorder=5)
    core  = plt.Circle((x, y), r-0.04, color=END_COL, zorder=6)
    for p in (outer, inner, core):
        ax.add_patch(p)
    return y - r - 0.07


def _fork(ax, x, y, width=2.4):
    rect = FancyBboxPatch((x - width/2, y - 0.09), width, 0.18,
                           boxstyle="square,pad=0", linewidth=0,
                           facecolor=FORK_COL, zorder=3)
    ax.add_patch(rect)
    return y - 0.09


def _arrow(ax, x1, y1, x2, y2, label='', color=ARROW_COL, style='->', lw=1.3):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color,
                                lw=lw, connectionstyle='arc3,rad=0'))
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx + 0.12, my, label, fontsize=ARROW_FS, color=GUARD_COL,
                fontstyle='italic', va='center')


def _horiz_arrow(ax, x1, y, x2, color=ARROW_COL, label='', label_above=True, style='->'):
    ax.annotate('', xy=(x2, y), xytext=(x1, y),
                arrowprops=dict(arrowstyle=style, color=color, lw=1.3))
    if label:
        mx = (x1+x2)/2
        dy = 0.12 if label_above else -0.12
        ax.text(mx, y+dy, label, fontsize=ARROW_FS, color=GUARD_COL,
                ha='center', fontstyle='italic')


def _note(ax, x, y, text, anchor='right'):
    nw, nh = 2.5, 0.4
    nx = x + 0.2 if anchor == 'right' else x - nw - 0.2
    bx = FancyBboxPatch((nx, y - nh/2), nw, nh,
                         boxstyle="round,pad=0.05", linewidth=1,
                         edgecolor=NOTE_BD, facecolor=NOTE_BG, zorder=4)
    ax.add_patch(bx)
    ax.text(nx + nw/2, y, text, ha='center', va='center',
            fontsize=7, color=NOTE_FG, zorder=5)


def _divider(ax, y, xmin, xmax, label=''):
    ax.plot([xmin, xmax], [y, y], color='#CBD5E1', lw=0.9, linestyle=':', zorder=2)
    if label:
        ax.text((xmin+xmax)/2, y+0.1, label, ha='center', fontsize=7.5,
                color='#64748B', fontstyle='italic')


# ════════════════════════════════════════════════════════════════════════════
#  HIGH-LEVEL DIAGRAM BUILDER
# ════════════════════════════════════════════════════════════════════════════

class DiagramBuilder:
    """
    Build an activity diagram by appending nodes.

    Node types: start, end, action, decision, fork, join, note, divider
    """

    def __init__(self, title, uc_id, filename,
                 fig_w=10, top_pad=1.5, bottom_pad=0.8, x=COL_X):
        self.title      = title
        self.uc_id      = uc_id
        self.filename   = filename
        self.fig_w      = fig_w
        self.x          = x
        self.top_pad    = top_pad
        self.bottom_pad = bottom_pad
        self.nodes      = []
        self._y         = 0.0

    # ── append helpers ───────────────────────────────────────────────────────
    def start(self):
        self._y -= 0.25
        self.nodes.append(('start', self.x, self._y, {}))
        self._y -= 0.25 + ROW_H * 0.45

    def action(self, label, color=ACTION_BG, border=ACTION_BD, fg=ACTION_FG,
               x_offset=0, w=NODE_W, note='', note_side='right'):
        cx = self.x + x_offset
        self.nodes.append(('action', cx, self._y,
                            {'label': label, 'color': color,
                             'border': border, 'fg': fg,
                             'w': w, 'note': note, 'note_side': note_side}))
        self._y -= ROW_H * 0.9

    def decision(self, label, yes_label='Yes', no_label='No',
                 yes_branch=None, no_branch=None, merge_label=''):
        self.nodes.append(('decision', self.x, self._y,
                            {'label': label,
                             'yes_label': yes_label, 'no_label': no_label,
                             'yes_branch': yes_branch or [],
                             'no_branch':  no_branch  or [],
                             'merge_label': merge_label}))
        branch_len = max(len(yes_branch or []), len(no_branch or []))
        self._y -= (branch_len + 2) * ROW_H * 0.9

    def fork(self, label='', parallel_branches=None):
        self.nodes.append(('fork', self.x, self._y,
                            {'label': label,
                             'branches': parallel_branches or []}))
        branch_len = max((len(b) for b in (parallel_branches or [[]])), default=1)
        self._y -= (branch_len + 1.5) * ROW_H * 0.9

    def join(self, label=''):
        self.nodes.append(('join', self.x, self._y, {'label': label}))
        self._y -= ROW_H * 0.7

    def divider(self, label=''):
        self.nodes.append(('divider', self.x, self._y, {'label': label}))
        self._y -= ROW_H * 0.5

    def end(self):
        self._y -= 0.1
        self.nodes.append(('end', self.x, self._y, {}))

    # ── render ───────────────────────────────────────────────────────────────
    def save(self):
        total_h = abs(self._y) + self.top_pad + self.bottom_pad + 0.5
        fig, ax = plt.subplots(figsize=(self.fig_w, total_h))

        shift = self.top_pad + abs(self._y) + 0.3

        ax.set_xlim(-self.fig_w/2, self.fig_w/2)
        ax.set_ylim(0, total_h)
        ax.axis('off')
        fig.patch.set_facecolor(BG)
        ax.set_facecolor(BG)

        # outer frame
        frame = FancyBboxPatch((-self.fig_w/2 + 0.1, 0.1),
                                self.fig_w - 0.2, total_h - 0.2,
                                boxstyle="round,pad=0.05", linewidth=1.5,
                                edgecolor="#CBD5E1", facecolor="none", zorder=0)
        ax.add_patch(frame)

        # title bar
        th = 0.7
        tb = FancyBboxPatch((-self.fig_w/2 + 0.1, total_h - th - 0.1),
                             self.fig_w - 0.2, th,
                             boxstyle="round,pad=0", linewidth=0,
                             facecolor=TITLE_BG, zorder=1)
        ax.add_patch(tb)
        ax.text(0, total_h - 0.1 - th/2,
                f"{self.uc_id}  ·  {self.title}",
                ha='center', va='center', fontsize=TITLE_FS,
                fontweight='bold', color=TITLE_FG, zorder=2)

        # draw nodes
        prev_cx, prev_cy_bot = self.x, shift
        first = True

        for i, (ntype, cx, raw_y, meta) in enumerate(self.nodes):
            cy = raw_y + shift

            if ntype == 'divider':
                _divider(ax, cy, -self.fig_w/2 + 0.3, self.fig_w/2 - 0.3,
                         meta.get('label', ''))
                prev_cy_bot = cy
                continue

            if not first:
                top_y = cy + (0.18 if ntype == 'start' else
                               DEC_SIZE if ntype == 'decision' else
                               NODE_H/2 if ntype in ('action',) else
                               0.09 if ntype in ('fork', 'join') else 0.25)
                if abs(prev_cx - cx) < 0.01:
                    _arrow(ax, prev_cx, prev_cy_bot, cx, top_y)
                else:
                    ax.plot([prev_cx, cx], [prev_cy_bot, top_y],
                            color=ARROW_COL, lw=1.3)
            first = False

            if ntype == 'start':
                bot = _start(ax, cx, cy)
                prev_cy_bot = bot; prev_cx = cx

            elif ntype == 'end':
                _end(ax, cx, cy)
                prev_cy_bot = cy; prev_cx = cx

            elif ntype == 'action':
                bot = _action(ax, cx, cy, meta['label'],
                              color=meta['color'], border=meta['border'],
                              fg=meta['fg'], w=meta['w'])
                if meta.get('note'):
                    _note(ax, cx + meta['w']/2, cy, meta['note'],
                          anchor=meta.get('note_side', 'right'))
                prev_cy_bot = bot; prev_cx = cx

            elif ntype == 'decision':
                _diamond(ax, cx, cy, meta['label'])

                yes_b = meta['yes_branch']
                no_b  = meta['no_branch']
                sep   = BRANCH_SEP / 2
                yes_x = cx - sep
                no_x  = cx + sep

                _horiz_arrow(ax, cx - DEC_SIZE*1.6, cy, yes_x,
                             label=meta['yes_label'], label_above=True, style='-')
                _horiz_arrow(ax, cx + DEC_SIZE*1.6, cy, no_x,
                             label=meta['no_label'], label_above=True, style='-')

                branch_rows   = max(len(yes_b), len(no_b))
                branch_start_y = cy - DEC_SIZE - ROW_H * 0.5

                for bx_coord, branch in [(yes_x, yes_b), (no_x, no_b)]:
                    by = branch_start_y
                    for idx2, b_label in enumerate(branch):
                        _action(ax, bx_coord, by, b_label, w=NODE_W * 0.85)
                        if idx2 == 0:
                            _arrow(ax, bx_coord, cy, bx_coord, by + NODE_H/2)
                        by -= ROW_H * 0.9

                merge_y = branch_start_y - branch_rows * ROW_H * 0.9
                last_yes_y = (branch_start_y - (len(yes_b)-1)*ROW_H*0.9 - NODE_H/2
                              if yes_b else cy - DEC_SIZE)
                last_no_y  = (branch_start_y - (len(no_b) -1)*ROW_H*0.9 - NODE_H/2
                              if no_b  else cy - DEC_SIZE)
                ax.plot([yes_x, yes_x, cx], [last_yes_y, merge_y, merge_y],
                        color=ARROW_COL, lw=1.3)
                ax.plot([no_x,  no_x,  cx], [last_no_y,  merge_y, merge_y],
                        color=ARROW_COL, lw=1.3)
                ax.annotate('', xy=(cx, merge_y - 0.18), xytext=(cx, merge_y),
                            arrowprops=dict(arrowstyle='->', color=ARROW_COL, lw=1.3))

                prev_cy_bot = merge_y - 0.18; prev_cx = cx

            elif ntype == 'fork':
                _fork(ax, cx, cy, width=min(self.fig_w - 1, 5.5))
                bot_y = cy - 0.09

                branches    = meta['branches']
                n           = len(branches)
                if n == 0:
                    prev_cy_bot = bot_y; prev_cx = cx; continue

                total_span  = min(self.fig_w - 1.5, (n-1) * 2.8)
                bxs         = [cx - total_span/2 + k * (total_span/max(n-1,1))
                               for k in range(n)]

                branch_len     = max(len(b) for b in branches)
                branch_start_y = cy - 0.09 - ROW_H * 0.55

                for bx_c, branch in zip(bxs, branches):
                    _arrow(ax, bx_c, bot_y, bx_c, branch_start_y + NODE_H/2)
                    by = branch_start_y
                    for b_label in branch:
                        _action(ax, bx_c, by, b_label, w=NODE_W * 0.85)
                        if by < branch_start_y:
                            _arrow(ax, bx_c, by + NODE_H, bx_c, by + NODE_H/2 + 0.25)
                        by -= ROW_H * 0.9

                join_y = branch_start_y - branch_len * ROW_H * 0.9
                for bx_c, branch in zip(bxs, branches):
                    last_y = (branch_start_y - (len(branch)-1)*ROW_H*0.9 - NODE_H/2
                              if branch else bot_y)
                    ax.plot([bx_c, bx_c, cx], [last_y, join_y+0.09, join_y+0.09],
                            color=ARROW_COL, lw=1.3)

                _fork(ax, cx, join_y, width=min(self.fig_w - 1, 5.5))
                if meta.get('label'):
                    ax.text(cx, join_y - 0.25, meta['label'],
                            ha='center', fontsize=7.5, color=GUARD_COL,
                            fontstyle='italic')
                ax.annotate('', xy=(cx, join_y - 0.09 - 0.2),
                            xytext=(cx, join_y - 0.09),
                            arrowprops=dict(arrowstyle='->', color=ARROW_COL, lw=1.3))
                prev_cy_bot = join_y - 0.09 - 0.2; prev_cx = cx

            elif ntype == 'join':
                _fork(ax, cx, cy)
                if meta.get('label'):
                    ax.text(cx + 0.2, cy, meta['label'],
                            fontsize=7.5, color=GUARD_COL, va='center')
                prev_cy_bot = cy - 0.09; prev_cx = cx

        plt.tight_layout(pad=0)
        out = os.path.join(OUTPUT_DIR, self.filename)
        fig.savefig(out, dpi=180, bbox_inches='tight',
                    facecolor=BG, edgecolor='none')
        plt.close(fig)
        print(f"  Saved: {self.filename}")


# ════════════════════════════════════════════════════════════════════════════
#  USE CASE ACTIVITY DIAGRAMS   (SRS v2.1 — corrected FR numbering)
# ════════════════════════════════════════════════════════════════════════════

def uc01():
    """UC-01 Register Account  [FR-01]"""
    d = DiagramBuilder("Register Account", "UC-01", "UC-01_Register_Account.png")
    d.start()
    d.action("Open registration page")
    d.action("Fill: name, email, password, role (Patient)")
    d.action("Optionally enter phone number")
    d.decision("All required fields valid?",
               yes_label="Yes", no_label="No",
               yes_branch=["Submit registration form"],
               no_branch=["Show validation errors"])
    d.action("Server hashes password (bcrypt)")
    d.action("INSERT INTO app_user")
    d.action("INSERT INTO patient profile")
    d.action("Return 201 Created + userId")
    d.action("Redirect to login page")
    d.end()
    d.save()


def uc02():
    """UC-02 Login to System  [FR-02]"""
    d = DiagramBuilder("Login to System", "UC-02", "UC-02_Login.png")
    d.start()
    d.action("Open login page")
    d.action("Enter email & password")
    d.action("POST /api/auth/login")
    d.decision("User found?",
               yes_label="Yes", no_label="No",
               yes_branch=["Compare password with bcrypt hash"],
               no_branch=["Return 401 Unauthorised"])
    d.decision("Password matches?",
               yes_label="Yes", no_label="No",
               yes_branch=["Generate JWT token"],
               no_branch=["Return 401 Invalid credentials"])
    d.action("Return JWT to browser")
    d.action("Store token in localStorage")
    d.action("Redirect to role-specific dashboard")
    d.end()
    d.save()


def uc03():
    """UC-03 Reset Password  [FR-03]
    Covers two paths per SRS v2.1:
      Path A — change via current password (logged-in user)
      Path B — forgot password via email link
    """
    d = DiagramBuilder("Reset Password", "UC-03", "UC-03_Reset_Password.png", fig_w=11)
    d.start()
    d.decision("Reset method?",
               yes_label="Change password\n(logged in)",
               no_label="Forgot password\n(email link)",
               yes_branch=["Enter current password\n& new password",
                            "POST /api/auth/change-password",
                            "Verify current password (bcrypt)",
                            "Hash & UPDATE app_user",
                            "Return 200 OK — success"],
               no_branch=["Enter registered email",
                           "POST /api/auth/forgot-password",
                           "Generate reset token & store",
                           "Send reset-link email",
                           "User clicks link → enters new pwd",
                           "POST /api/auth/reset-password",
                           "Validate token (not expired)",
                           "Hash & UPDATE app_user"])
    d.action("Redirect to login — success message")
    d.end()
    d.save()


def uc04():
    """UC-04 Manage User Accounts & Profiles  [FR-04, FR-05]"""
    d = DiagramBuilder("Manage User Accounts & Profiles", "UC-04",
                       "UC-04_Manage_User_Accounts.png", fig_w=11)
    d.start()
    d.action("Admin navigates to User Management")
    d.action("GET /api/admin/users — fetch user list")
    d.decision("Action?",
               yes_label="Create", no_label="Edit / Deactivate",
               yes_branch=["Fill name, email, role,\nphone, extended profile fields",
                            "POST /api/users",
                            "INSERT app_user + profile table"],
               no_branch=["Select existing user",
                           "Update phone, DOB, specialty…\n(FR-05: Admin-only fields)",
                           "PUT /api/users/{id}"])
    d.action("Server validates & persists changes")
    d.action("Return 201 / 200 OK")
    d.action("UI refreshes user list — success toast")
    d.end()
    d.save()


def uc05():
    """UC-05 Book Appointment  [FR-06, FR-08]"""
    d = DiagramBuilder("Book Appointment", "UC-05", "UC-05_Book_Appointment.png")
    d.start()
    d.action("Patient opens Appointments page")
    d.action("Search by doctor name / specialty / date")
    d.action("GET /api/doctors — fetch available doctors")
    d.action("Browse results & select slot")
    d.decision("Date/time in the future?",
               yes_label="Yes", no_label="No",
               yes_branch=["POST /api/appointments\n{doctorId, date, time}",
                            "INSERT INTO appointment"],
               no_branch=["Show error:\n'Past date not allowed'"])
    d.action("Schedule 24-hour reminder (FR-08)")
    d.action("Return 201 Created + appointmentId")
    d.action("Show booking confirmation to patient")
    d.end()
    d.save()


def uc06():
    """UC-06 Manage Appointment  [FR-07, FR-08]"""
    d = DiagramBuilder("Manage Appointment", "UC-06",
                       "UC-06_Manage_Appointment.png", fig_w=11)
    d.start()
    d.action("Doctor / Admin opens Appointments view")
    d.action("GET /api/appointments (filtered by role)")
    d.action("Select appointment to manage")
    d.decision("Action chosen?",
               yes_label="Confirm", no_label="Reschedule / Cancel",
               yes_branch=["PUT status = CONFIRMED"],
               no_branch=["Enter new date/time\nor set CANCELLED",
                           "PUT /api/appointments/{id}"])
    d.action("UPDATE appointment in database")
    d.action("Send status-change notification to patient (FR-08)")
    d.action("Return 200 OK — view refreshed")
    d.end()
    d.save()


def uc07():
    """UC-07 View Medical Records  [FR-12]"""
    d = DiagramBuilder("View Medical Records", "UC-07",
                       "UC-07_View_Medical_Records.png")
    d.start()
    d.action("User navigates to Medical Records")
    d.action("GET /api/medical-records?patientId=")
    d.decision("Requester authorised? (RBAC)",
               yes_label="Yes", no_label="No",
               yes_branch=["SELECT records from DB"],
               no_branch=["Return 403 Forbidden"])
    d.action("Return record list to browser")
    d.action("User selects a specific record")
    d.action("GET /api/medical-records/{id}")
    d.action("Fetch full record + linked prescriptions")
    d.action("Display detail view / download option")
    d.end()
    d.save()


def uc08():
    """UC-08 Update Medical Records  [FR-11]"""
    d = DiagramBuilder("Update Medical Records", "UC-08",
                       "UC-08_Update_Medical_Records.png")
    d.start()
    d.action("Doctor opens patient profile")
    d.action("Click 'Add / Edit Record'")
    d.action("Enter diagnosis, clinical notes")
    d.decision("Link to appointment?",
               yes_label="Yes", no_label="No",
               yes_branch=["Attach appointmentId"],
               no_branch=["Walk-in / emergency record\n(no appointmentId)"])
    d.action("POST /api/medical-records")
    d.action("INSERT INTO medicalrecord")
    d.action("Return 201 Created + recordId")
    d.decision("Attach document / lab report?",
               yes_label="Yes", no_label="No",
               yes_branch=["Upload file",
                            "POST /api/medical-records/{id}/documents",
                            "Store document reference in DB"],
               no_branch=["Skip"])
    d.action("Record saved — success toast")
    d.end()
    d.save()


def uc09():
    """UC-09 Issue Prescription  [FR-13, FR-14]"""
    d = DiagramBuilder("Issue Prescription", "UC-09",
                       "UC-09_Issue_Prescription.png")
    d.start()
    d.action("Doctor opens prescription form for patient visit")
    d.action("GET /api/drugs — load drug catalogue (FR-15)")
    d.action("Search & select drug from catalogue")
    d.action("Enter dosage, frequency, duration")
    d.decision("Add another drug?",
               yes_label="Yes", no_label="No",
               yes_branch=["Add drug line to list"],
               no_branch=["Review prescription lines"])
    d.action("Submit prescription")
    d.action("POST /api/prescriptions {recordId, drugs:[...]}")
    d.action("INSERT INTO prescription (header)")
    d.action("INSERT INTO prescription_details (per drug line)")
    d.action("Notify patient: new prescription issued (FR-18)")
    d.action("Return 201 Created + prescriptionId")
    d.end()
    d.save()


def uc10():
    """UC-10 View Prescription  [FR-14]"""
    d = DiagramBuilder("View Prescription", "UC-10",
                       "UC-10_View_Prescription.png")
    d.start()
    d.action("Patient navigates to My Prescriptions")
    d.action("GET /api/prescriptions?patientId=")
    d.action("Verify patient owns these records")
    d.action("SELECT prescription + drug lines from DB")
    d.action("Display active / past prescriptions")
    d.decision("Download PDF?",
               yes_label="Yes", no_label="No",
               yes_branch=["GET /api/prescriptions/{id}/download",
                            "Server renders PDF",
                            "Browser downloads file"],
               no_branch=["View on screen"])
    d.end()
    d.save()


def uc11():
    """UC-11 Generate Invoice  [FR-16]"""
    d = DiagramBuilder("Generate Invoice", "UC-11",
                       "UC-11_Generate_Invoice.png")
    d.start()
    d.action("Appointment status set to COMPLETED")
    d.decision("Invoice already exists?",
               yes_label="Yes — skip", no_label="No — proceed",
               yes_branch=["No action (idempotent)"],
               no_branch=["Calculate billing amount",
                           "INSERT INTO invoice\n{appointmentId, amount, PENDING}"])
    d.action("Invoice record persisted in DB")
    d.action("Patient notified of new invoice (FR-18)")
    d.end()
    d.save()


def uc12():
    """UC-12 Process Payment  [FR-17]"""
    d = DiagramBuilder("Process Payment", "UC-12",
                       "UC-12_Process_Payment.png")
    d.start()
    d.action("Patient opens Billing History")
    d.action("GET /api/invoices?patientId= — list invoices")
    d.action("Select pending invoice → click Pay")
    d.action("Choose method: card / digital wallet")
    d.action("POST /api/payments {invoiceId, method, amount}")
    d.action("Charge via Payment Gateway")
    d.decision("Payment authorised?",
               yes_label="Yes", no_label="No",
               yes_branch=["INSERT INTO payment",
                            "UPDATE invoice SET status = PAID",
                            "Generate PDF receipt"],
               no_branch=["Return 402 Payment failed",
                           "Show error to patient"])
    d.action("Return PDF receipt — download / display")
    d.end()
    d.save()


def uc13():
    """UC-13 Manage Billing Records  [FR-16]"""
    d = DiagramBuilder("Manage Billing Records", "UC-13",
                       "UC-13_Manage_Billing_Records.png")
    d.start()
    d.action("Admin opens Billing module")
    d.action("GET /api/admin/invoices — fetch all invoices")
    d.action("Display billing table")
    d.decision("Action?",
               yes_label="View detail", no_label="Refund",
               yes_branch=["Open invoice detail"],
               no_branch=["Select PAID invoice",
                           "POST /api/admin/refunds {invoiceId}",
                           "UPDATE invoice SET status = REFUNDED"])
    d.action("UI refreshes — success feedback")
    d.end()
    d.save()


def uc14():
    """UC-14 Send Notification  [FR-18]"""
    d = DiagramBuilder("Send / Configure Notification", "UC-14",
                       "UC-14_Send_Configure_Notification.png", fig_w=11)
    d.start()
    d.decision("Trigger type?",
               yes_label="System event", no_label="User config",
               yes_branch=["Event fires (appointment,\nprescription, billing)",
                            "Check user notification prefs",
                            "INSERT INTO notification",
                            "Send email if channel enabled"],
               no_branch=["User opens Notification Settings",
                           "GET /api/notification-preferences",
                           "Toggle channel / event-type",
                           "PUT /api/notification-preferences\n(UPSERT, unique constraint)"])
    d.action("Preferences / notification persisted")
    d.action("User sees confirmation / notification delivered")
    d.end()
    d.save()


def uc15():
    """UC-15 View Analytics Dashboard  [FR-19]"""
    d = DiagramBuilder("View Analytics Dashboard", "UC-15",
                       "UC-15_View_Analytics_Dashboard.png")
    d.start()
    d.action("Admin navigates to Analytics")
    d.action("GET /api/analytics/kpis")
    d.action("DB aggregates: appointments, revenue,\npatients, doctor utilisation")
    d.action("Return KPIs — render charts & graphs")
    d.decision("Export report?",
               yes_label="Yes", no_label="No",
               yes_branch=["Choose format: PDF / Excel",
                            "GET /api/reports?format=",
                            "Validate role = ADMIN",
                            "Generate & stream file"],
               no_branch=["Browse dashboard only"])
    d.action("Browser downloads report / stays on dashboard")
    d.end()
    d.save()


def uc16():
    """UC-16 Manage Clinic Rooms  [FR-09]"""
    d = DiagramBuilder("Manage Clinic Rooms", "UC-16",
                       "UC-16_Manage_Clinic_Rooms.png")
    d.start()
    d.action("Admin opens Clinic Management page")
    d.action("GET /api/clinics — load room list")
    d.decision("Action?",
               yes_label="Create room", no_label="Edit / Deactivate",
               yes_branch=["Enter room name & type\n(Outpatient/Emergency/ICU)",
                            "POST /api/clinics",
                            "INSERT INTO clinic"],
               no_branch=["Select existing room",
                           "Modify type or active flag",
                           "PUT /api/clinics/{id}",
                           "UPDATE clinic"])
    d.action("Return 201 / 200 OK")
    d.action("Clinic list refreshed in UI")
    d.end()
    d.save()


def uc17():
    """UC-17 Reserve Clinic / Schedule Doctor  [FR-10]"""
    d = DiagramBuilder("Reserve Clinic / Schedule Doctor", "UC-17",
                       "UC-17_Reserve_Clinic_Schedule_Doctor.png", fig_w=11)
    d.start()
    d.action("Doctor / Admin opens Scheduling page")
    d.action("GET /api/clinics + GET /api/doctors")
    d.action("Select: doctor, clinic room, date, start & end time")
    d.decision("End time > Start time?",
               yes_label="Yes", no_label="No",
               yes_branch=["POST /api/clinic-reservations"],
               no_branch=["Show validation error"])
    d.decision("DB EXCLUDE constraint satisfied?\n(no room or doctor overlap)",
               yes_label="No conflict", no_label="Conflict detected",
               yes_branch=["INSERT INTO clinic_reservation",
                            "Return 201 Created"],
               no_branch=["Return 409 Conflict",
                           "Show conflict message to user"])
    d.action("Reservation confirmed — schedule updated")
    d.end()
    d.save()


def uc18():
    """UC-18 Manage Drug Catalogue  [FR-15]"""
    d = DiagramBuilder("Manage Drug Catalogue", "UC-18",
                       "UC-18_Manage_Drug_Catalogue.png")
    d.start()
    d.action("Admin opens Drug Catalogue page")
    d.action("GET /api/drugs — load drug list")
    d.decision("Action?",
               yes_label="Add drug", no_label="Edit / Remove",
               yes_branch=["Enter drug name & active ingredients",
                            "POST /api/drugs",
                            "Validate role = ADMIN",
                            "INSERT INTO drug"],
               no_branch=["Select drug from list",
                           "PUT /api/drugs/{id}  OR\nDELETE /api/drugs/{id}",
                           "UPDATE / DELETE in DB"])
    d.action("Return 201 / 200 OK")
    d.action("Drug catalogue updated in UI")
    d.end()
    d.save()


# ════════════════════════════════════════════════════════════════════════════
#  MAIN
# ════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    all_fns = [uc01, uc02, uc03, uc04, uc05, uc06, uc07, uc08, uc09,
               uc10, uc11, uc12, uc13, uc14, uc15, uc16, uc17, uc18]
    print(f"Generating {len(all_fns)} activity diagrams …\n")
    for fn in all_fns:
        fn()
    print(f"\nDone — all PNGs saved in: {OUTPUT_DIR}")