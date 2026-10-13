# Teacher-Subject Assignment & Search Workflow

## 1. Overview & Architectural Rationale

In K-12 and collegiate educational institutions, **curriculum is defined at the Grade level, but teaching is delivered at the Section level**.

### The Multi-Section Allocation Challenge
- A grade (e.g., *Grade 10*) has a uniform prescribed curriculum: Mathematics, Science, Social Studies, English, and Second Language.
- However, *Grade 10* operates across multiple physical classroom cohorts: **Section A**, **Section B**, and **Section C**.
- Each section requires dedicated faculty assignments:
  - **Grade 10 Section A** is taught Mathematics by **Dr. Rajesh Sharma (EMP-012)**.
  - **Grade 10 Section B** is taught Mathematics by **Ms. Priya Patel (EMP-038)**.
  - **Grade 10 Section C** is taught Mathematics by **Mr. David John (EMP-055)**.

To solve this without duplicating subject catalogues or cluttering the interface, the **Academics & Curriculum** workspace implements **Section-Scoped Subject Allocations**.

---

## 2. User Experience & Interaction Flow

```mermaid
flowchart TD
    A[Navigate to Academics Workspace] --> B[Select Academic Year & Grade]
    B --> C[Click Section Card (e.g. Section A)]
    C --> D[Active Section Subjects Displayed]
    D --> E{Subject Assigned?}
    E -- No --> F[Click '+ Assign Teacher']
    E -- Yes --> G[View Teacher Card: Name, ID, Dept, Phone, Email]
    G --> H[Click 'Change' or 'Remove']
    F --> I[Open Assign Teacher Modal]
    H -- Change --> I
    H -- Remove --> J[Confirm & Delete Allocation]
    I --> K[System filters pool to Subject Specialists]
    K --> L[Search across Name, User ID, Mobile, Email, Dept, Qualification]
    L --> M[Click 'Assign Teacher']
    M --> N[Atomic DB Upsert & Cache Invalidation]
    N --> D
```

### Step 1: Grade & Section Selection
1. The administrator navigates to `/academics` (**Classes or Grades** tab).
2. The left panel lists all Grades in the operational Academic Year (e.g., Grade 1 to Grade 10).
3. Selecting a Grade displays its active Classroom Sections in an interactive card grid.
4. Clicking any section card (e.g., **Section A**) sets it as the **Active Selected Section**:
   - The card displays an active blue border and a `✓ Selected` badge.
   - A real-time allocation badge displays progress (e.g., `4 / 5 Assigned`).

### Step 2: Compact Subject Cards & Status-Determined Search Button
Directly beneath the section cards, the system renders the **Subject Faculty Allocations** card scoped specifically to that section:
- **Compact Subject Layout**: Each subject card displays its Title, Code, Credits, Periods/Wk, and Type badge in a sleek, non-intrusive container.
- **Search & Assign Button beside Subject Name**:
  - **Not Assigned**: Displays a subtle neutral search button (`Assign Teacher`) with a search icon directly beside the subject title.
  - **Assigned**: Dynamically switches to the **primary green color** (`bg-green-500/10 border-green-500/30 text-green-700`) displaying the teacher's initials avatar, Full Name, and search icon (`🔍`), accompanied by an inline unassign (`🗑️`) action.
  - Clicking either button instantly opens the **Command Palette Quick Search Overlay**.

---

## 3. Quick Search Overlay (Ctrl+K Command Palette Style)

Clicking the assign/search button activates a lightweight, focused search overlay modeled after the global **Ctrl+K Command Palette**:
1. **Backdrop Blur (`backdrop-blur-sm bg-black/60`)**: Dims and blurs background clutter, drawing complete focus to search and assignment.
2. **Instant Search Input**: Auto-focused search input with subject context pill and `Esc` shortcut badge.
3. **Smart Qualification Ranking**:
   - Analyzes normalized tokens for the target subject (e.g. *English Language & Literature* matches *English* and *Literature* in profiles).
   - Qualified specialists are ranked **at the very top** with a green `Specialist` chip.
   - All other school faculty follow underneath, allowing administrators to pick an interdisciplinary or substitute teacher without hitting dead-ends.
4. **Instant Keyboard Navigation**:
   - `↑` / `↓` Arrow keys navigate the results list.
   - `↵ Enter` immediately assigns the selected faculty member.
   - `esc` dismisses the overlay.
5. **Zero UI Bloat**: Stripped of verbose banners, multi-line instructions, and heavy empty-state graphics.

---

## 4. Universal Multi-Attribute Search Engine

The modal features an instant, universal search bar that searches across all teacher attributes imported or added via the **Staff & HRMS** workspace.

### Searchable Attributes:
| Attribute | Example Input | Match Logic |
| :--- | :--- | :--- |
| **Full Name** | `Rajesh Sharma` | Case-insensitive substring match |
| **Employee ID / Code** | `EMP-2024-042` | Case-insensitive substring match |
| **User ID** | `rajesh.sharma` | Case-insensitive substring match |
| **Mobile / Phone** | `9845012345` or `+91 98450` | Punctuation-normalized digit matching |
| **Email Address** | `rajesh@vid.edu` | Case-insensitive email match |
| **Designation** | `Senior Lecturer` | Departmental title search |
| **Department** | `Science & Math` | Department match |
| **Academic Qualification** | `M.Sc, B.Ed` | Degree / qualification search |
| **University / Alma Mater** | `Delhi University` | Institution search |
| **Teaching Experience** | `8 Years` | Experience search |
| **Employment Status** | `ACTIVE` | Operational status search |

### Strict Data Privacy Rule (House Address Exclusion)
> **Data Privacy Policy**: In compliance with staff privacy standards, **Personal Residential / House Address is strictly excluded** from search indexing. Entering an address keyword will not return staff profiles, and home addresses are never rendered in search result cards.

---

## 5. Technical Implementation & Data Schema

### 5.1 Database Schema (`faculty_assignments`)
Faculty assignments are stored in the relational PostgreSQL database:

```sql
CREATE TABLE faculty_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_section_subject_assignment UNIQUE (institution_id, section_id, subject_id)
);
```

### 5.2 Atomic Replacement Logic
When an administrator assigns or reassigns a teacher:
1. The backend automatically runs an atomic delete-and-insert for that `(section_id, subject_id)`:
   ```sql
   DELETE FROM faculty_assignments
   WHERE institution_id = $1 AND section_id = $2 AND subject_id = $3;

   INSERT INTO faculty_assignments (institution_id, staff_id, section_id, subject_id, academic_year_id)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING *;
   ```
2. Any previous teacher is cleanly replaced without duplicate constraints or orphaned records.

### 5.3 React Query Cache Invalidation
Upon successful assignment or removal:
- `academics-allocations`: Refetches real-time allocations.
- `faculty-roster`: Refreshes teacher workload tallies.
- `academics-hierarchy`: Synchronizes section occupancy and curriculum status.

---

## 6. UI Compliance Rules
- **No Bottom Keybinding Strips**: Modals and form dialogs do not render shortcut badges or keyboard combination strips (`Alt+S`, `Ctrl+Enter`, etc.).
- **Zero LocalStorage for Domain Data**: All allocation queries and mutations interact directly with the Cloud PostgreSQL master database.
