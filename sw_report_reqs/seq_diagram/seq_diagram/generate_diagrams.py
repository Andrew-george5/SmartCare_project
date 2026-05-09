import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Colour palette ──────────────────────────────────────────────────────────
C_BG        = "#F8FAFC"
C_TITLE_BG  = "#1E3A5F"
C_TITLE_FG  = "#FFFFFF"
C_ACTOR_BG  = "#2563EB"
C_ACTOR_FG  = "#FFFFFF"
C_LIFE     = "#94A3B8"
C_ACT_BOX  = "#DBEAFE"
C_ACT_BORD = "#2563EB"
C_MSG_SYNC = "#1E3A5F"
C_MSG_RET  = "#64748B"
C_MSG_SELF = "#7C3AED"
C_NOTE_BG  = "#FEF9C3"
C_NOTE_BD  = "#CA8A04"
C_STEP_FG  = "#6B7280"
C_FRAME_BD = "#CBD5E1"


def draw_sequence(title, uc_id, actors, steps, filename,
                  fig_w=16, row_h=0.72, top_pad=2.2, bottom_pad=0.8):
    """
    actors : list of str
    steps  : list of dicts with keys:
        type   : 'msg' | 'ret' | 'self' | 'note' | 'divider'
        frm    : actor index (msg/ret/self)
        to     : actor index (msg/ret)
        label  : message text
        text   : note text  (type='note')
        actor  : actor index note is anchored to (type='note')
    """
    n_actors = len(actors)
    n_steps  = len(steps)
    fig_h    = top_pad + n_steps * row_h + bottom_pad

    fig, ax = plt.subplots(figsize=(fig_w, fig_h))
    ax.set_xlim(0, fig_w)
    ax.set_ylim(0, fig_h)
    ax.axis('off')
    fig.patch.set_facecolor(C_BG)
    ax.set_facecolor(C_BG)

    # ── outer frame ──
    frame = mpatches.FancyBboxPatch(
        (0.15, 0.15), fig_w - 0.3, fig_h - 0.3,
        boxstyle="round,pad=0.05", linewidth=1.5,
        edgecolor=C_FRAME_BD, facecolor="none", zorder=0)
    ax.add_patch(frame)

    # ── title bar ──
    title_h = 0.75
    title_bg = mpatches.FancyBboxPatch(
        (0.15, fig_h - title_h - 0.15), fig_w - 0.3, title_h,
        boxstyle="round,pad=0.0", linewidth=0,
        facecolor=C_TITLE_BG, zorder=1)
    ax.add_patch(title_bg)
    ax.text(fig_w / 2, fig_h - 0.15 - title_h / 2,
            f"{uc_id}  ·  {title}",
            ha='center', va='center', fontsize=12, fontweight='bold',
            color=C_TITLE_FG, zorder=2)

    # ── actor positions ──
    margin = 1.2
    span   = fig_w - 2 * margin
    if n_actors == 1:
        xs = [fig_w / 2]
    else:
        xs = [margin + i * span / (n_actors - 1) for i in range(n_actors)]

    actor_box_w = min(span / n_actors * 0.75, 2.1)
    actor_box_h = 0.52
    actor_y_top = fig_h - title_h - 0.15 - 0.25  # top of actor boxes

    # ── lifeline bottom ──
    life_top    = actor_y_top - actor_box_h
    life_bottom = bottom_pad - 0.1

    # draw lifelines
    for x in xs:
        ax.plot([x, x], [life_top, life_bottom],
                color=C_LIFE, linewidth=1.1, linestyle='--', zorder=1)

    # draw actor boxes (top)
    for i, (x, name) in enumerate(zip(xs, actors)):
        bx = mpatches.FancyBboxPatch(
            (x - actor_box_w / 2, actor_y_top - actor_box_h),
            actor_box_w, actor_box_h,
            boxstyle="round,pad=0.06", linewidth=1.5,
            edgecolor=C_ACTOR_BG, facecolor=C_ACTOR_BG, zorder=3)
        ax.add_patch(bx)
        ax.text(x, actor_y_top - actor_box_h / 2, name,
                ha='center', va='center', fontsize=8.5, fontweight='bold',
                color=C_ACTOR_FG, zorder=4, wrap=False)

    # draw actor boxes (bottom mirror)
    for i, (x, name) in enumerate(zip(xs, actors)):
        bx = mpatches.FancyBboxPatch(
            (x - actor_box_w / 2, life_bottom - actor_box_h),
            actor_box_w, actor_box_h,
            boxstyle="round,pad=0.06", linewidth=1.5,
            edgecolor=C_ACTOR_BG, facecolor=C_ACTOR_BG, zorder=3)
        ax.add_patch(bx)
        ax.text(x, life_bottom - actor_box_h / 2, name,
                ha='center', va='center', fontsize=8.5, fontweight='bold',
                color=C_ACTOR_FG, zorder=4)

    # ── message rows ──
    first_msg_y = life_top - 0.35
    active = {i: False for i in range(n_actors)}
    act_box_w = 0.18

    def row_y(step_idx):
        return first_msg_y - step_idx * row_h

    step_idx = 0
    for step in steps:
        y = row_y(step_idx)

        if step['type'] == 'divider':
            ax.plot([margin * 0.5, fig_w - margin * 0.5], [y, y],
                    color=C_FRAME_BD, linewidth=0.8, linestyle=':', zorder=2)
            ax.text(fig_w / 2, y + 0.13, step.get('label', ''),
                    ha='center', va='bottom', fontsize=7.5, color=C_MSG_RET,
                    fontstyle='italic', zorder=2)
            step_idx += 1
            continue

        if step['type'] == 'note':
            ax_note = xs[step['actor']]
            note_w  = 2.6
            note_h  = 0.42
            nx = ax_note + 0.25
            if nx + note_w > fig_w - 0.3:
                nx = ax_note - note_w - 0.25
            nb = mpatches.FancyBboxPatch(
                (nx, y - note_h / 2), note_w, note_h,
                boxstyle="round,pad=0.05", linewidth=1,
                edgecolor=C_NOTE_BD, facecolor=C_NOTE_BG, zorder=4)
            ax.add_patch(nb)
            ax.text(nx + note_w / 2, y, step['text'],
                    ha='center', va='center', fontsize=7, color='#713F12',
                    zorder=5)
            step_idx += 1
            continue

        frm = step['frm']
        x1  = xs[frm]

        if step['type'] == 'self':
            loop_off = 0.55
            ax.annotate('', xy=(x1 + loop_off, y - row_h * 0.38),
                        xytext=(x1, y),
                        arrowprops=dict(
                            arrowstyle='->', color=C_MSG_SELF,
                            connectionstyle='arc3,rad=-0.4', lw=1.3))
            ax.plot([x1, x1 + loop_off], [y, y],
                    color=C_MSG_SELF, lw=1.3)
            ax.plot([x1 + loop_off, x1 + loop_off],
                    [y, y - row_h * 0.38],
                    color=C_MSG_SELF, lw=1.3)
            ax.text(x1 + loop_off + 0.12, y - row_h * 0.19,
                    step['label'], va='center', fontsize=8,
                    color=C_MSG_SELF, zorder=4)
            step_idx += 1
            continue

        to  = step['to']
        x2  = xs[to]
        is_ret = step['type'] == 'ret'
        color  = C_MSG_RET if is_ret else C_MSG_SYNC
        ls     = '--' if is_ret else '-'
        lw     = 1.2 if is_ret else 1.5

        # activation box on sender
        if not is_ret and not active[frm]:
            active[frm] = True
        if is_ret:
            active[frm] = False

        # draw arrow
        dx = x2 - x1
        head = 0.13
        if abs(dx) > 0.01:
            ax.annotate('',
                        xy=(x2 - (head if dx > 0 else -head) * 0.3, y),
                        xytext=(x1, y),
                        arrowprops=dict(
                            arrowstyle=f'->, head_width=0.22, head_length={head}',
                            color=color, lw=lw,
                            linestyle=ls,
                            connectionstyle='arc3,rad=0'))

        # label
        mid_x = (x1 + x2) / 2
        prefix = f"{step_idx + 1}. " if not is_ret else ""
        label_y_off = 0.11
        ax.text(mid_x, y + label_y_off, prefix + step['label'],
                ha='center', va='bottom', fontsize=8,
                color=color, zorder=4,
                fontweight='bold' if not is_ret else 'normal',
                fontstyle='italic' if is_ret else 'normal')

        step_idx += 1

    # ── step numbers on left margin ──
    for i in range(n_steps):
        step = steps[i]
        if step['type'] in ('msg', 'ret', 'self'):
            ax.text(0.32, row_y(i), str(i + 1),
                    ha='center', va='center', fontsize=6.5,
                    color=C_STEP_FG, zorder=2)

    plt.tight_layout(pad=0)
    out = os.path.join(OUTPUT_DIR, filename)
    fig.savefig(out, dpi=180, bbox_inches='tight',
                facecolor=C_BG, edgecolor='none')
    plt.close(fig)
    print(f"  Saved: {filename}")


# ════════════════════════════════════════════════════════════════════════════
#  USE CASE DEFINITIONS
# ════════════════════════════════════════════════════════════════════════════

diagrams = []

# ── UC-01 Register Account ───────────────────────────────────────────────────
diagrams.append(dict(
    title="Register Account", uc_id="UC-01",
    actors=["Patient / Doctor", "Browser", "API Server", "Database"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Open registration page"),
        dict(type='ret', frm=1, to=0, label="Registration form"),
        dict(type='msg', frm=0, to=1, label="Submit name, email, password, role, phone (opt.)"),
        dict(type='msg', frm=1, to=2, label="POST /api/auth/register"),
        dict(type='self', frm=2, to=2, label="Validate input fields"),
        dict(type='msg', frm=2, to=3, label="INSERT INTO app_user (bcrypt password)"),
        dict(type='ret', frm=3, to=2, label="userId created"),
        dict(type='msg', frm=2, to=3, label="INSERT INTO patient / doctor profile"),
        dict(type='ret', frm=3, to=2, label="Profile record created"),
        dict(type='ret', frm=2, to=1, label="201 Created + userId"),
        dict(type='ret', frm=1, to=0, label="Redirect to login / success message"),
    ],
    filename="UC-01_Register_Account.png"
))

# ── UC-02 Login ──────────────────────────────────────────────────────────────
diagrams.append(dict(
    title="Login to System", uc_id="UC-02",
    actors=["User", "Browser", "API Server", "Database"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Navigate to login page"),
        dict(type='ret', frm=1, to=0, label="Login form"),
        dict(type='msg', frm=0, to=1, label="Enter email & password"),
        dict(type='msg', frm=1, to=2, label="POST /api/auth/login"),
        dict(type='msg', frm=2, to=3, label="SELECT user WHERE email = ?"),
        dict(type='ret', frm=3, to=2, label="User record"),
        dict(type='self', frm=2, to=2, label="bcrypt.compare(password, hash)"),
        dict(type='self', frm=2, to=2, label="Generate JWT token"),
        dict(type='ret', frm=2, to=1, label="200 OK + JWT"),
        dict(type='self', frm=1, to=1, label="Store token in localStorage"),
        dict(type='ret', frm=1, to=0, label="Redirect to role dashboard"),
    ],
    filename="UC-02_Login.png"
))

# ── UC-03 Reset Password ─────────────────────────────────────────────────────
diagrams.append(dict(
    title="Reset Password", uc_id="UC-03",
    actors=["User", "Browser", "API Server", "Database", "Email Service"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Click 'Forgot Password'"),
        dict(type='ret', frm=1, to=0, label="Enter email form"),
        dict(type='msg', frm=0, to=1, label="Submit email address"),
        dict(type='msg', frm=1, to=2, label="POST /api/auth/forgot-password"),
        dict(type='msg', frm=2, to=3, label="SELECT user WHERE email = ?"),
        dict(type='ret', frm=3, to=2, label="User found"),
        dict(type='self', frm=2, to=2, label="Generate reset token & expiry"),
        dict(type='msg', frm=2, to=3, label="STORE reset token (hashed)"),
        dict(type='msg', frm=2, to=4, label="Send password-reset email"),
        dict(type='ret', frm=2, to=1, label="200 OK – check your email"),
        dict(type='ret', frm=1, to=0, label="Confirmation message shown"),
        dict(type='divider', label="User clicks link in email"),
        dict(type='msg', frm=0, to=1, label="Open reset link from email"),
        dict(type='msg', frm=1, to=2, label="POST /api/auth/reset-password  {token, newPassword}"),
        dict(type='msg', frm=2, to=3, label="Validate token; UPDATE password (bcrypt)"),
        dict(type='ret', frm=3, to=2, label="Updated"),
        dict(type='ret', frm=2, to=1, label="200 OK"),
        dict(type='ret', frm=1, to=0, label="Password reset success – redirect to login"),
    ],
    filename="UC-03_Reset_Password.png"
))

# ── UC-04 Manage User Accounts & Profiles ────────────────────────────────────
diagrams.append(dict(
    title="Manage User Accounts & Profiles", uc_id="UC-04",
    actors=["Admin", "Browser", "API Server", "Database"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Navigate to Users management page"),
        dict(type='msg', frm=1, to=2, label="GET /api/admin/users"),
        dict(type='msg', frm=2, to=3, label="SELECT * FROM app_user"),
        dict(type='ret', frm=3, to=2, label="User list"),
        dict(type='ret', frm=2, to=1, label="200 OK + user list"),
        dict(type='ret', frm=1, to=0, label="Render user table"),
        dict(type='divider', label="Create new account"),
        dict(type='msg', frm=0, to=1, label="Fill form: name, email, role, phone, profile fields"),
        dict(type='msg', frm=1, to=2, label="POST /api/users  {name, email, role, phoneNumber, ...}"),
        dict(type='msg', frm=2, to=3, label="INSERT INTO app_user (bcrypt pwd, phoneNumber)"),
        dict(type='msg', frm=2, to=3, label="INSERT INTO patient / doctor profile"),
        dict(type='ret', frm=3, to=2, label="Records created"),
        dict(type='ret', frm=2, to=1, label="201 Created + userId"),
        dict(type='ret', frm=1, to=0, label="Success toast; list refreshed"),
        dict(type='divider', label="Edit existing account"),
        dict(type='msg', frm=0, to=1, label="Edit phone / profile fields; submit"),
        dict(type='msg', frm=1, to=2, label="PUT /api/users/{id}  {phoneNumber, ...}"),
        dict(type='msg', frm=2, to=3, label="UPDATE app_user SET phoneNumber = ?"),
        dict(type='msg', frm=2, to=3, label="UPDATE patient / doctor SET specialty, dob, …"),
        dict(type='ret', frm=3, to=2, label="Updated"),
        dict(type='ret', frm=2, to=1, label="200 OK"),
        dict(type='ret', frm=1, to=0, label="Success toast"),
    ],
    filename="UC-04_Manage_User_Accounts.png"
))

# ── UC-05 Book Appointment ───────────────────────────────────────────────────
diagrams.append(dict(
    title="Book Appointment", uc_id="UC-05",
    actors=["Patient", "Browser", "API Server", "Database", "Notification Svc"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Search doctors by name / specialty / date"),
        dict(type='msg', frm=1, to=2, label="GET /api/doctors?search=&specialty="),
        dict(type='msg', frm=2, to=3, label="SELECT doctors"),
        dict(type='ret', frm=3, to=2, label="Doctor list"),
        dict(type='ret', frm=2, to=1, label="200 OK + doctors"),
        dict(type='ret', frm=1, to=0, label="Show available slots"),
        dict(type='msg', frm=0, to=1, label="Select slot & confirm booking"),
        dict(type='msg', frm=1, to=2, label="POST /api/appointments  {doctorId, date, time}"),
        dict(type='self', frm=2, to=2, label="Validate: date must be future"),
        dict(type='msg', frm=2, to=3, label="INSERT INTO appointment"),
        dict(type='ret', frm=3, to=2, label="appointmentId"),
        dict(type='msg', frm=2, to=4, label="Schedule 24 h reminder notification"),
        dict(type='ret', frm=4, to=2, label="Scheduled"),
        dict(type='ret', frm=2, to=1, label="201 Created + appointmentId"),
        dict(type='ret', frm=1, to=0, label="Booking confirmed"),
    ],
    filename="UC-05_Book_Appointment.png"
))

# ── UC-06 Manage Appointment ─────────────────────────────────────────────────
diagrams.append(dict(
    title="Manage Appointment", uc_id="UC-06",
    actors=["Doctor / Admin", "Browser", "API Server", "Database", "Notification Svc"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Open Appointments view"),
        dict(type='msg', frm=1, to=2, label="GET /api/appointments"),
        dict(type='msg', frm=2, to=3, label="SELECT appointments (by doctorId / all)"),
        dict(type='ret', frm=3, to=2, label="Appointment list"),
        dict(type='ret', frm=2, to=1, label="200 OK + appointments"),
        dict(type='ret', frm=1, to=0, label="Show schedule"),
        dict(type='divider', label="Confirm / Reschedule / Cancel"),
        dict(type='msg', frm=0, to=1, label="Select appointment → change status or new time"),
        dict(type='msg', frm=1, to=2, label="PUT /api/appointments/{id}  {status / newDate}"),
        dict(type='msg', frm=2, to=3, label="UPDATE appointment"),
        dict(type='ret', frm=3, to=2, label="Updated"),
        dict(type='msg', frm=2, to=4, label="Send status-change notification to patient"),
        dict(type='ret', frm=4, to=2, label="Sent"),
        dict(type='ret', frm=2, to=1, label="200 OK"),
        dict(type='ret', frm=1, to=0, label="View updated"),
    ],
    filename="UC-06_Manage_Appointment.png"
))

# ── UC-07 View Medical Records ───────────────────────────────────────────────
diagrams.append(dict(
    title="View Medical Records", uc_id="UC-07",
    actors=["Doctor / Patient", "Browser", "API Server", "Database"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Navigate to Medical Records"),
        dict(type='msg', frm=1, to=2, label="GET /api/medical-records?patientId="),
        dict(type='self', frm=2, to=2, label="Verify requester is authorised (RBAC)"),
        dict(type='msg', frm=2, to=3, label="SELECT medicalrecord WHERE patientId = ?"),
        dict(type='ret', frm=3, to=2, label="Record list"),
        dict(type='ret', frm=2, to=1, label="200 OK + records"),
        dict(type='ret', frm=1, to=0, label="Display records & lab reports"),
        dict(type='divider', label="Patient accesses own records only"),
        dict(type='msg', frm=0, to=1, label="Click on a specific record"),
        dict(type='msg', frm=1, to=2, label="GET /api/medical-records/{id}"),
        dict(type='msg', frm=2, to=3, label="SELECT record + linked prescriptions"),
        dict(type='ret', frm=3, to=2, label="Full record detail"),
        dict(type='ret', frm=2, to=1, label="200 OK + record detail"),
        dict(type='ret', frm=1, to=0, label="Show detailed view / download option"),
    ],
    filename="UC-07_View_Medical_Records.png"
))

# ── UC-08 Update Medical Records ─────────────────────────────────────────────
diagrams.append(dict(
    title="Update Medical Records", uc_id="UC-08",
    actors=["Doctor", "Browser", "API Server", "Database"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Open patient profile → Add / Edit Record"),
        dict(type='msg', frm=0, to=1, label="Enter diagnosis, notes; attach document (opt.)"),
        dict(type='msg', frm=1, to=2, label="POST /api/medical-records  {patientId, notes, appointmentId?}"),
        dict(type='self', frm=2, to=2, label="Validate: doctor authorised for patient"),
        dict(type='msg', frm=2, to=3, label="INSERT INTO medicalrecord"),
        dict(type='ret', frm=3, to=2, label="recordId"),
        dict(type='ret', frm=2, to=1, label="201 Created + recordId"),
        dict(type='ret', frm=1, to=0, label="Success toast; record appears in list"),
        dict(type='divider', label="Upload document / lab report"),
        dict(type='msg', frm=0, to=1, label="Attach file to record"),
        dict(type='msg', frm=1, to=2, label="POST /api/medical-records/{id}/documents"),
        dict(type='msg', frm=2, to=3, label="Store document reference"),
        dict(type='ret', frm=3, to=2, label="documentId"),
        dict(type='ret', frm=2, to=1, label="201 Created"),
        dict(type='ret', frm=1, to=0, label="Document attached"),
    ],
    filename="UC-08_Update_Medical_Records.png"
))

# ── UC-09 Issue Prescription ─────────────────────────────────────────────────
diagrams.append(dict(
    title="Issue Prescription", uc_id="UC-09",
    actors=["Doctor", "Browser", "API Server", "Database", "Notification Svc"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Open prescription form for patient visit"),
        dict(type='msg', frm=1, to=2, label="GET /api/drugs  (catalogue)"),
        dict(type='msg', frm=2, to=3, label="SELECT * FROM drug"),
        dict(type='ret', frm=3, to=2, label="Drug list"),
        dict(type='ret', frm=2, to=1, label="200 OK + drug catalogue"),
        dict(type='ret', frm=1, to=0, label="Show drug search / selector"),
        dict(type='msg', frm=0, to=1, label="Add drug lines: drug, dosage, frequency, duration"),
        dict(type='msg', frm=0, to=1, label="Submit prescription"),
        dict(type='msg', frm=1, to=2, label="POST /api/prescriptions  {recordId, drugs:[...]}"),
        dict(type='msg', frm=2, to=3, label="INSERT INTO prescription (header)"),
        dict(type='msg', frm=2, to=3, label="INSERT INTO prescription_details (per drug line)"),
        dict(type='ret', frm=3, to=2, label="prescriptionId"),
        dict(type='msg', frm=2, to=4, label="Notify patient: new prescription issued"),
        dict(type='ret', frm=4, to=2, label="Sent"),
        dict(type='ret', frm=2, to=1, label="201 Created + prescriptionId"),
        dict(type='ret', frm=1, to=0, label="Prescription saved successfully"),
    ],
    filename="UC-09_Issue_Prescription.png"
))

# ── UC-10 View Prescription ──────────────────────────────────────────────────
diagrams.append(dict(
    title="View Prescription", uc_id="UC-10",
    actors=["Patient", "Browser", "API Server", "Database"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Navigate to My Prescriptions"),
        dict(type='msg', frm=1, to=2, label="GET /api/prescriptions?patientId="),
        dict(type='self', frm=2, to=2, label="Verify requester owns records"),
        dict(type='msg', frm=2, to=3, label="SELECT prescription + prescription_details + drug"),
        dict(type='ret', frm=3, to=2, label="Prescription list (with drug lines)"),
        dict(type='ret', frm=2, to=1, label="200 OK + prescriptions"),
        dict(type='ret', frm=1, to=0, label="Display active / past prescriptions"),
        dict(type='msg', frm=0, to=1, label="Click Download"),
        dict(type='msg', frm=1, to=2, label="GET /api/prescriptions/{id}/download"),
        dict(type='self', frm=2, to=2, label="Render PDF (server-side)"),
        dict(type='ret', frm=2, to=1, label="PDF binary stream"),
        dict(type='ret', frm=1, to=0, label="Browser downloads PDF"),
    ],
    filename="UC-10_View_Prescription.png"
))

# ── UC-11 Generate Invoice ───────────────────────────────────────────────────
diagrams.append(dict(
    title="Generate Invoice", uc_id="UC-11",
    actors=["System", "API Server", "Database"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Appointment status → COMPLETED"),
        dict(type='msg', frm=1, to=2, label="SELECT appointment WHERE status = COMPLETED AND no invoice"),
        dict(type='ret', frm=2, to=1, label="Eligible appointments"),
        dict(type='self', frm=1, to=1, label="Calculate billing amount"),
        dict(type='msg', frm=1, to=2, label="INSERT INTO invoice {appointmentId, amount, status=PENDING}"),
        dict(type='ret', frm=2, to=1, label="invoiceId"),
        dict(type='ret', frm=1, to=0, label="Invoice generated successfully"),
        dict(type='note', actor=2, text="Only COMPLETED appointments\nmay have an invoice"),
    ],
    filename="UC-11_Generate_Invoice.png"
))

# ── UC-12 Process Payment ────────────────────────────────────────────────────
diagrams.append(dict(
    title="Process Payment", uc_id="UC-12",
    actors=["Patient", "Browser", "API Server", "Payment Gateway", "Database"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Navigate to Billing History"),
        dict(type='msg', frm=1, to=2, label="GET /api/invoices?patientId="),
        dict(type='msg', frm=2, to=4, label="SELECT invoices WHERE patientId = ?"),
        dict(type='ret', frm=4, to=2, label="Invoices"),
        dict(type='ret', frm=2, to=1, label="200 OK + invoices"),
        dict(type='ret', frm=1, to=0, label="Show pending invoices"),
        dict(type='msg', frm=0, to=1, label="Click Pay → choose card / digital wallet"),
        dict(type='msg', frm=1, to=2, label="POST /api/payments  {invoiceId, method, amount}"),
        dict(type='msg', frm=2, to=3, label="Charge card / wallet"),
        dict(type='ret', frm=3, to=2, label="Payment authorised + transactionId"),
        dict(type='msg', frm=2, to=4, label="INSERT INTO payment; UPDATE invoice SET status=PAID"),
        dict(type='ret', frm=4, to=2, label="Saved"),
        dict(type='self', frm=2, to=2, label="Render PDF receipt"),
        dict(type='ret', frm=2, to=1, label="200 OK + PDF receipt"),
        dict(type='ret', frm=1, to=0, label="Download receipt / show confirmation"),
    ],
    filename="UC-12_Process_Payment.png"
))

# ── UC-13 Manage Billing Records ─────────────────────────────────────────────
diagrams.append(dict(
    title="Manage Billing Records", uc_id="UC-13",
    actors=["Admin", "Browser", "API Server", "Database"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Open Billing module"),
        dict(type='msg', frm=1, to=2, label="GET /api/admin/invoices"),
        dict(type='msg', frm=2, to=3, label="SELECT invoice JOIN payment"),
        dict(type='ret', frm=3, to=2, label="All invoices + payment status"),
        dict(type='ret', frm=2, to=1, label="200 OK + billing records"),
        dict(type='ret', frm=1, to=0, label="Display billing table"),
        dict(type='divider', label="Process refund"),
        dict(type='msg', frm=0, to=1, label="Select invoice → Initiate Refund"),
        dict(type='msg', frm=1, to=2, label="POST /api/admin/refunds  {invoiceId}"),
        dict(type='self', frm=2, to=2, label="Validate invoice is PAID"),
        dict(type='msg', frm=2, to=3, label="UPDATE invoice SET status=REFUNDED"),
        dict(type='ret', frm=3, to=2, label="Updated"),
        dict(type='ret', frm=2, to=1, label="200 OK"),
        dict(type='ret', frm=1, to=0, label="Refund processed"),
    ],
    filename="UC-13_Manage_Billing_Records.png"
))

# ── UC-14 Send / Configure Notification ──────────────────────────────────────
diagrams.append(dict(
    title="Send / Configure Notification", uc_id="UC-14",
    actors=["System / User", "Browser", "API Server", "Database", "Email Svc"],
    steps=[
        dict(type='divider', label="Automated notification (system-triggered)"),
        dict(type='msg', frm=0, to=2, label="Trigger event (appointment, prescription, billing)"),
        dict(type='msg', frm=2, to=3, label="SELECT notificationpreference WHERE userId=?"),
        dict(type='ret', frm=3, to=2, label="Channels & event types"),
        dict(type='msg', frm=2, to=3, label="INSERT INTO notification"),
        dict(type='msg', frm=2, to=4, label="Send email (if email channel enabled)"),
        dict(type='ret', frm=4, to=2, label="Delivered"),
        dict(type='divider', label="User configures preferences"),
        dict(type='msg', frm=0, to=1, label="Open Notification Settings"),
        dict(type='msg', frm=1, to=2, label="GET /api/notification-preferences"),
        dict(type='ret', frm=2, to=1, label="Current preferences"),
        dict(type='ret', frm=1, to=0, label="Render preference toggles"),
        dict(type='msg', frm=0, to=1, label="Toggle channel / event type → Save"),
        dict(type='msg', frm=1, to=2, label="PUT /api/notification-preferences"),
        dict(type='msg', frm=2, to=3, label="UPSERT notificationpreference (unique constraint)"),
        dict(type='ret', frm=3, to=2, label="Saved"),
        dict(type='ret', frm=2, to=1, label="200 OK"),
        dict(type='ret', frm=1, to=0, label="Preferences updated"),
    ],
    filename="UC-14_Send_Configure_Notification.png"
))

# ── UC-15 View Analytics Dashboard ──────────────────────────────────────────
diagrams.append(dict(
    title="View Analytics Dashboard", uc_id="UC-15",
    actors=["Admin", "Browser", "API Server", "Database"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Navigate to Analytics"),
        dict(type='msg', frm=1, to=2, label="GET /api/analytics/kpis"),
        dict(type='msg', frm=2, to=3, label="Aggregate: appointments, revenue, patients, utilisation"),
        dict(type='ret', frm=3, to=2, label="KPI data"),
        dict(type='ret', frm=2, to=1, label="200 OK + KPIs"),
        dict(type='ret', frm=1, to=0, label="Render dashboard charts"),
        dict(type='divider', label="Export report"),
        dict(type='msg', frm=0, to=1, label="Click Export (PDF / Excel)"),
        dict(type='msg', frm=1, to=2, label="GET /api/reports?format=pdf"),
        dict(type='self', frm=2, to=2, label="Validate role = ADMIN"),
        dict(type='msg', frm=2, to=3, label="SELECT report data"),
        dict(type='ret', frm=3, to=2, label="Raw data"),
        dict(type='self', frm=2, to=2, label="Generate PDF / Excel file"),
        dict(type='ret', frm=2, to=1, label="File stream"),
        dict(type='ret', frm=1, to=0, label="Browser downloads report"),
    ],
    filename="UC-15_View_Analytics_Dashboard.png"
))

# ── UC-16 Manage Clinic Rooms ────────────────────────────────────────────────
diagrams.append(dict(
    title="Manage Clinic Rooms", uc_id="UC-16",
    actors=["Admin", "Browser", "API Server", "Database"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Open Clinic Management page"),
        dict(type='msg', frm=1, to=2, label="GET /api/clinics"),
        dict(type='msg', frm=2, to=3, label="SELECT * FROM clinic"),
        dict(type='ret', frm=3, to=2, label="Clinic list"),
        dict(type='ret', frm=2, to=1, label="200 OK + clinics"),
        dict(type='ret', frm=1, to=0, label="Display clinic rooms"),
        dict(type='divider', label="Create clinic room"),
        dict(type='msg', frm=0, to=1, label="Fill: room name, type (Outpatient/Emergency/ICU)"),
        dict(type='msg', frm=1, to=2, label="POST /api/clinics  {name, type}"),
        dict(type='msg', frm=2, to=3, label="INSERT INTO clinic"),
        dict(type='ret', frm=3, to=2, label="clinicId"),
        dict(type='ret', frm=2, to=1, label="201 Created"),
        dict(type='ret', frm=1, to=0, label="Room added to list"),
        dict(type='divider', label="Edit / Deactivate"),
        dict(type='msg', frm=0, to=1, label="Select room → Edit type or deactivate"),
        dict(type='msg', frm=1, to=2, label="PUT /api/clinics/{id}"),
        dict(type='msg', frm=2, to=3, label="UPDATE clinic"),
        dict(type='ret', frm=3, to=2, label="Updated"),
        dict(type='ret', frm=2, to=1, label="200 OK"),
        dict(type='ret', frm=1, to=0, label="View refreshed"),
    ],
    filename="UC-16_Manage_Clinic_Rooms.png"
))

# ── UC-17 Reserve Clinic / Schedule Doctor ───────────────────────────────────
diagrams.append(dict(
    title="Reserve Clinic / Schedule Doctor", uc_id="UC-17",
    actors=["Doctor / Admin", "Browser", "API Server", "Database"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Open Doctor Schedule page"),
        dict(type='msg', frm=1, to=2, label="GET /api/clinics  +  GET /api/doctors"),
        dict(type='msg', frm=2, to=3, label="SELECT clinics; SELECT doctors"),
        dict(type='ret', frm=3, to=2, label="Clinic & doctor lists"),
        dict(type='ret', frm=2, to=1, label="200 OK + data"),
        dict(type='ret', frm=1, to=0, label="Show scheduling form"),
        dict(type='msg', frm=0, to=1, label="Select: doctor, clinic, date, start time, end time"),
        dict(type='msg', frm=1, to=2, label="POST /api/clinic-reservations  {doctorId, clinicId, date, start, end}"),
        dict(type='self', frm=2, to=2, label="Validate: end > start"),
        dict(type='msg', frm=2, to=3, label="INSERT INTO clinic_reservation (EXCLUDE constraint check)"),
        dict(type='note', actor=3, text="DB EXCLUDE constraint:\nno overlapping room/doctor slots"),
        dict(type='ret', frm=3, to=2, label="reservationId  OR  conflict error"),
        dict(type='ret', frm=2, to=1, label="201 Created  OR  409 Conflict"),
        dict(type='ret', frm=1, to=0, label="Success / conflict message shown"),
    ],
    filename="UC-17_Reserve_Clinic_Schedule_Doctor.png"
))

# ── UC-18 Manage Drug Catalogue ──────────────────────────────────────────────
diagrams.append(dict(
    title="Manage Drug Catalogue", uc_id="UC-18",
    actors=["Admin", "Browser", "API Server", "Database"],
    steps=[
        dict(type='msg', frm=0, to=1, label="Open Drug Catalogue page"),
        dict(type='msg', frm=1, to=2, label="GET /api/drugs"),
        dict(type='msg', frm=2, to=3, label="SELECT * FROM drug"),
        dict(type='ret', frm=3, to=2, label="Drug list"),
        dict(type='ret', frm=2, to=1, label="200 OK + drugs"),
        dict(type='ret', frm=1, to=0, label="Display drug table"),
        dict(type='divider', label="Add new drug"),
        dict(type='msg', frm=0, to=1, label="Enter drug name, active ingredients"),
        dict(type='msg', frm=1, to=2, label="POST /api/drugs  {name, activeIngredients}"),
        dict(type='self', frm=2, to=2, label="Validate role = ADMIN"),
        dict(type='msg', frm=2, to=3, label="INSERT INTO drug"),
        dict(type='ret', frm=3, to=2, label="drugId"),
        dict(type='ret', frm=2, to=1, label="201 Created"),
        dict(type='ret', frm=1, to=0, label="Drug added to catalogue"),
        dict(type='divider', label="Edit / Remove drug"),
        dict(type='msg', frm=0, to=1, label="Select drug → Edit or Delete"),
        dict(type='msg', frm=1, to=2, label="PUT /api/drugs/{id}  OR  DELETE /api/drugs/{id}"),
        dict(type='msg', frm=2, to=3, label="UPDATE drug  OR  DELETE drug"),
        dict(type='ret', frm=3, to=2, label="Done"),
        dict(type='ret', frm=2, to=1, label="200 OK"),
        dict(type='ret', frm=1, to=0, label="Catalogue updated"),
    ],
    filename="UC-18_Manage_Drug_Catalogue.png"
))


# ════════════════════════════════════════════════════════════════════════════
#  RUN ALL
# ════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print(f"Generating {len(diagrams)} sequence diagrams …\n")
    for d in diagrams:
        draw_sequence(
            title=d['title'],
            uc_id=d['uc_id'],
            actors=d['actors'],
            steps=d['steps'],
            filename=d['filename'],
        )
    print(f"\nDone — all PNGs saved in: {OUTPUT_DIR}")
