"""
Use Case Diagram Generator — SmartCare HMS (SRS v2.1)
Generates a single PNG showing all actors and their use cases.

Actors : Patient | Doctor | Administrator | System (automated)
UCs     : UC-01 through UC-18  (renumbered per v2.1 SRS)

Run:
    python generate_usecase_diagram.py
Output:
    SmartCare_UseCase_Diagram.png  (same folder as this script)
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Ellipse
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Palette (matches activity / sequence diagram scripts) ─────────────────────
BG          = "#F8FAFC"
TITLE_BG    = "#1E3A5F"
TITLE_FG    = "#FFFFFF"
SYS_BD      = "#2563EB"
SYS_BG      = "#EFF6FF"
SYS_LBL     = "#1E3A5F"
ACTOR_COL   = "#1E3A5F"
UC_BG       = "#DBEAFE"
UC_BD       = "#2563EB"
UC_FG       = "#1E3A5F"
LINE_COL    = "#334155"
FRAME_COL   = "#CBD5E1"
GROUP_COLS  = {
    "auth":    ("#DBEAFE", "#2563EB"),   # blue
    "appt":    ("#D1FAE5", "#059669"),   # green
    "clinic":  ("#FEF3C7", "#D97706"),   # amber
    "records": ("#EDE9FE", "#7C3AED"),   # purple
    "rx":      ("#FCE7F3", "#DB2777"),   # pink
    "billing": ("#FEF9C3", "#CA8A04"),   # yellow
    "notif":   ("#CCFBF1", "#0D9488"),   # teal
    "analytics":("#FEE2E2","#DC2626"),   # red
}

# ── Figure geometry ────────────────────────────────────────────────────────────
FIG_W  = 20.0
FIG_H  = 23.0
TITLE_H = 0.85

# System boundary
SYS_X0, SYS_X1 = 3.2, 16.8
SYS_Y0, SYS_Y1 = 1.2, 21.5

# Actor x positions (outside boundary)
ACT_L_X = 1.4   # left actors
ACT_R_X = 18.6  # right actors

# Use-case ellipse dimensions
UC_W = 2.5
UC_H = 0.55

# ── Use case definitions ───────────────────────────────────────────────────────
# Layout: 4 columns × 5 rows (rows 0-4), last row has 2 UCs only
# Cols x positions (centres inside system boundary)
COL_X = [4.8, 7.7, 10.6, 13.5]

# Rows y positions (top to bottom)
ROW_Y = [19.8, 17.6, 15.2, 12.8, 10.4, 8.0, 5.6]

use_cases = [
    # (uc_id, label, col, row, group)
    ("UC-01", "Register Account",                0, 0, "auth"),
    ("UC-02", "Login to System",                 1, 0, "auth"),
    ("UC-03", "Reset Password",                  2, 0, "auth"),
    ("UC-04", "Manage User\nAccounts & Profiles",3, 0, "auth"),

    ("UC-05", "Book Appointment",                0, 1, "appt"),
    ("UC-06", "Manage Appointment",              1, 1, "appt"),
    ("UC-16", "Manage Clinic Rooms",             2, 1, "clinic"),
    ("UC-17", "Reserve Clinic /\nSchedule Doctor",3,1, "clinic"),

    ("UC-07", "View Medical Records",            0, 2, "records"),
    ("UC-08", "Update Medical\nRecords",         1, 2, "records"),
    ("UC-09", "Issue Prescription",              2, 2, "rx"),
    ("UC-10", "View Prescription",               3, 2, "rx"),

    ("UC-11", "Generate Invoice",                0, 3, "billing"),
    ("UC-12", "Process Payment",                 1, 3, "billing"),
    ("UC-13", "Manage Billing\nRecords",         2, 3, "billing"),
    ("UC-18", "Manage Drug\nCatalogue",          3, 3, "rx"),

    ("UC-14", "Send Notification",               1, 4, "notif"),
    ("UC-15", "View Analytics\nDashboard",       2, 4, "analytics"),
]

# ── Actor definitions ──────────────────────────────────────────────────────────
# (name, x, y_centre, side)  side='left'|'right'
actors = [
    ("Patient",       ACT_L_X, 16.0, "left"),
    ("Doctor",        ACT_L_X,  9.5, "left"),
    ("Administrator", ACT_R_X, 14.5, "right"),
    ("System",        ACT_R_X,  7.0, "right"),
]

# ── Actor → UC connections ─────────────────────────────────────────────────────
# (actor_index, uc_id)
connections = [
    # Patient
    (0, "UC-01"), (0, "UC-02"), (0, "UC-03"),
    (0, "UC-05"), (0, "UC-07"), (0, "UC-10"), (0, "UC-12"),
    # Doctor
    (1, "UC-02"), (1, "UC-03"),
    (1, "UC-06"), (1, "UC-07"), (1, "UC-08"),
    (1, "UC-09"), (1, "UC-10"),
    (1, "UC-17"), (1, "UC-18"),
    # Administrator
    (2, "UC-02"), (2, "UC-03"), (2, "UC-04"),
    (2, "UC-05"), (2, "UC-06"),
    (2, "UC-13"), (2, "UC-14"), (2, "UC-15"),
    (2, "UC-16"), (2, "UC-17"), (2, "UC-18"),
    # System (automated)
    (3, "UC-08"),   # sends notification when record updated
    (3, "UC-11"), (3, "UC-14"),
]

# ── Group label positions ──────────────────────────────────────────────────────
group_labels = [
    ("Authentication & Account Management", 0,  0, "auth"),
    ("Appointment Management",              0,  1, "appt"),
    ("Clinic Room Management",              2,  1, "clinic"),
    ("Medical Records Management",          0,  2, "records"),
    ("Prescription Management",             2,  2, "rx"),
    ("Billing & Payment",                   0,  3, "billing"),
    ("Drug Catalogue",                      3,  3, "rx"),
    ("Notifications",                       1,  4, "notif"),
    ("Analytics & Reporting",               2,  4, "analytics"),
]


# ════════════════════════════════════════════════════════════════════════════
#  DRAWING HELPERS
# ════════════════════════════════════════════════════════════════════════════

def uc_centre(col, row):
    return COL_X[col], ROW_Y[row]


def draw_stick_figure(ax, x, y, name, side='left'):
    """Draw a UML stick-figure actor."""
    HEAD_R = 0.28
    # head
    head = plt.Circle((x, y + HEAD_R * 2 + 0.9), HEAD_R,
                       color=ACTOR_COL, zorder=5)
    ax.add_patch(head)
    # body
    ax.plot([x, x], [y + HEAD_R * 2 + 0.62, y + 0.62],
            color=ACTOR_COL, lw=1.8, zorder=5)
    # arms
    ax.plot([x - 0.35, x + 0.35], [y + 1.05, y + 1.05],
            color=ACTOR_COL, lw=1.8, zorder=5)
    # legs
    ax.plot([x, x - 0.35], [y + 0.62, y],
            color=ACTOR_COL, lw=1.8, zorder=5)
    ax.plot([x, x + 0.35], [y + 0.62, y],
            color=ACTOR_COL, lw=1.8, zorder=5)
    # name label
    ha = 'right' if side == 'left' else 'left'
    off = -0.15 if side == 'left' else 0.15
    ax.text(x + off, y + HEAD_R * 2 + 0.9 + HEAD_R + 0.12, name,
            ha='center', va='bottom', fontsize=9, fontweight='bold',
            color=ACTOR_COL, zorder=6)


def draw_uc_ellipse(ax, x, y, uc_id, label, group):
    """Draw a use-case ellipse with label."""
    bg, bd = GROUP_COLS.get(group, (UC_BG, UC_BD))
    ell = Ellipse((x, y), width=UC_W, height=UC_H * (1 + label.count('\n') * 0.55),
                  facecolor=bg, edgecolor=bd, linewidth=1.5, zorder=4)
    ax.add_patch(ell)
    # label — split on '\n'
    lines = label.split('\n')
    n = len(lines)
    for i, ln in enumerate(lines):
        dy = (i - (n - 1) / 2) * 0.18
        ax.text(x, y - dy, ln,
                ha='center', va='center', fontsize=7.5,
                color=UC_FG, zorder=5, fontweight='bold')
    # UC-id tag below ellipse
    ax.text(x, y - UC_H / 2 * (1 + label.count('\n') * 0.55) - 0.08,
            uc_id,
            ha='center', va='top', fontsize=7,
            color=bd, zorder=5, fontstyle='italic')
    return x, y


def draw_connection(ax, actor_x, actor_y_centre, uc_x, uc_y):
    """Draw line from actor mid-body to nearest edge of UC ellipse."""
    ax.plot([actor_x, uc_x], [actor_y_centre, uc_y],
            color=LINE_COL, lw=0.9, alpha=0.55, zorder=2,
            solid_capstyle='round')


# ════════════════════════════════════════════════════════════════════════════
#  MAIN DRAW
# ════════════════════════════════════════════════════════════════════════════

fig, ax = plt.subplots(figsize=(FIG_W, FIG_H))
ax.set_xlim(0, FIG_W)
ax.set_ylim(0, FIG_H)
ax.axis('off')
fig.patch.set_facecolor(BG)
ax.set_facecolor(BG)

# ── Outer frame ────────────────────────────────────────────────────────────
frame = FancyBboxPatch((0.15, 0.15), FIG_W - 0.3, FIG_H - TITLE_H - 0.15,
                        boxstyle="round,pad=0.05", linewidth=1.5,
                        edgecolor=FRAME_COL, facecolor="none", zorder=0)
ax.add_patch(frame)

# ── Title bar ──────────────────────────────────────────────────────────────
tb = FancyBboxPatch((0.15, FIG_H - TITLE_H - 0.15), FIG_W - 0.3, TITLE_H,
                     boxstyle="round,pad=0", linewidth=0,
                     facecolor=TITLE_BG, zorder=1)
ax.add_patch(tb)
ax.text(FIG_W / 2, FIG_H - 0.15 - TITLE_H / 2,
        "SmartCare HMS  ·  Use Case Diagram  (SRS v2.1)",
        ha='center', va='center', fontsize=14,
        fontweight='bold', color=TITLE_FG, zorder=2)

# ── System boundary ────────────────────────────────────────────────────────
sys_box = FancyBboxPatch((SYS_X0, SYS_Y0), SYS_X1 - SYS_X0, SYS_Y1 - SYS_Y0,
                          boxstyle="round,pad=0.05", linewidth=2,
                          edgecolor=SYS_BD, facecolor=SYS_BG, zorder=1)
ax.add_patch(sys_box)
# System boundary label (top centre inside)
ax.text((SYS_X0 + SYS_X1) / 2, SYS_Y1 - 0.28,
        "«system»  SmartCare Hospital Management System",
        ha='center', va='top', fontsize=10,
        fontweight='bold', color=SYS_LBL, zorder=3)

# ── Group background bands ─────────────────────────────────────────────────
# Draw faint horizontal bands per row group
row_groups = {
    0: ("auth",    0),
    1: ("appt",    1),   # auth row done by row 0
    2: ("records", 2),
    3: ("billing", 3),
    4: ("notif",   4),
}
for row_idx, (group, _) in row_groups.items():
    cy = ROW_Y[row_idx]
    bg, _ = GROUP_COLS.get(group, ("#F1F5F9", "#94A3B8"))
    band = FancyBboxPatch((SYS_X0 + 0.15, cy - 0.65),
                           SYS_X1 - SYS_X0 - 0.3, 1.25,
                           boxstyle="round,pad=0.08", linewidth=0,
                           facecolor=bg, alpha=0.45, zorder=2)
    ax.add_patch(band)

# Row 1 has a mixed group (appt + clinic) — colour already drawn via uc ellipses

# ── Build a lookup: uc_id → (cx, cy) ──────────────────────────────────────
uc_pos = {}
for uc_id, label, col, row, group in use_cases:
    cx, cy = uc_centre(col, row)
    uc_pos[uc_id] = (cx, cy)

# ── Draw connections first (behind everything) ─────────────────────────────
# Actor body centre y offsets (stick figure body ≈ y + 0.9 to y + 1.5)
actor_body_y = {
    0: actors[0][2] + 1.1,   # Patient
    1: actors[1][2] + 1.1,   # Doctor
    2: actors[2][2] + 1.1,   # Administrator
    3: actors[3][2] + 1.1,   # System
}

for actor_idx, uc_id in connections:
    ax_x = actors[actor_idx][1]
    ay   = actor_body_y[actor_idx]
    ux, uy = uc_pos[uc_id]
    draw_connection(ax, ax_x, ay, ux, uy)

# ── Draw use-case ellipses ─────────────────────────────────────────────────
for uc_id, label, col, row, group in use_cases:
    cx, cy = uc_centre(col, row)
    draw_uc_ellipse(ax, cx, cy, uc_id, label, group)

# ── Draw actors ────────────────────────────────────────────────────────────
for name, ax_x, ay, side in actors:
    draw_stick_figure(ax, ax_x, ay, name, side)

# ── Legend ─────────────────────────────────────────────────────────────────
legend_items = [
    ("Authentication",     "auth"),
    ("Appointments",       "appt"),
    ("Clinic Rooms",       "clinic"),
    ("Medical Records",    "records"),
    ("Prescriptions/Drugs","rx"),
    ("Billing",            "billing"),
    ("Notifications",      "notif"),
    ("Analytics",          "analytics"),
]
lx = SYS_X0 + 0.25
ly = SYS_Y0 + 0.2
for i, (lbl, grp) in enumerate(legend_items):
    bg, bd = GROUP_COLS[grp]
    rect = FancyBboxPatch((lx + i * 1.66, ly), 0.35, 0.28,
                           boxstyle="round,pad=0.03", linewidth=1,
                           edgecolor=bd, facecolor=bg, zorder=5)
    ax.add_patch(rect)
    ax.text(lx + i * 1.66 + 0.43, ly + 0.14, lbl,
            va='center', fontsize=6.8, color="#1E293B", zorder=6)

# ── Save ───────────────────────────────────────────────────────────────────
out = os.path.join(OUTPUT_DIR, "SmartCare_UseCase_Diagram.png")
fig.savefig(out, dpi=180, bbox_inches='tight',
            facecolor=BG, edgecolor='none')
plt.close(fig)
print(f"  Saved: {out}")