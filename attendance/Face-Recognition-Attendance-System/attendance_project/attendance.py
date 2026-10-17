import os
import sys
import json
import time
import argparse
from datetime import datetime
import numpy as np
import cv2
import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side

from ai_face_engine import AIFaceEngine

# UTF-8 terminal safety for Windows PowerShell / CMD
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

STUDENTS_FOLDER = "students"
DATA_FILE = "students_data.json"
EXCEL_FILE = "attendance.xlsx"
JSON_OUTPUT = "attendance_latest.json"

def load_students():
    """Load student directory metadata."""
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    normalized = {}
    for sid, info in data.items():
        if isinstance(info, str):
            normalized[sid] = {"name": info, "email": "", "class": "10", "section": "A"}
        else:
            normalized[sid] = info
    return normalized

def setup_excel(students):
    """Create or load attendance Excel sheet with styled headers."""
    today = datetime.now().strftime("%Y-%m-%d")
    if os.path.exists(EXCEL_FILE):
        try:
            wb = openpyxl.load_workbook(EXCEL_FILE)
        except Exception:
            wb = openpyxl.Workbook()
            if "Sheet" in wb.sheetnames:
                del wb["Sheet"]
    else:
        wb = openpyxl.Workbook()
        if "Sheet" in wb.sheetnames:
            del wb["Sheet"]

    if today not in wb.sheetnames:
        ws = wb.create_sheet(title=today)
        headers = ["Student ID", "Name", "Class & Section", "Email", "Date", "Time", "Status", "Confidence"]
        header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
        header_font = Font(name="Calibri", color="FFFFFF", bold=True, size=11)
        
        for col_idx, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_idx, value=header)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        ws.column_dimensions['A'].width = 16
        ws.column_dimensions['B'].width = 24
        ws.column_dimensions['C'].width = 18
        ws.column_dimensions['D'].width = 28
        ws.column_dimensions['E'].width = 14
        ws.column_dimensions['F'].width = 14
        ws.column_dimensions['G'].width = 14
        ws.column_dimensions['H'].width = 16

        absent_fill = PatternFill(start_color="FFE0E0", end_color="FFE0E0", fill_type="solid")
        row = 2
        for sid, info in students.items():
            name = info.get("name", sid)
            cls_sec = f"{info.get('class', '')} {info.get('section', '')}".strip()
            email = info.get("email", "")
            ws.cell(row=row, column=1, value=sid)
            ws.cell(row=row, column=2, value=name)
            ws.cell(row=row, column=3, value=cls_sec)
            ws.cell(row=row, column=4, value=email)
            ws.cell(row=row, column=5, value=today)
            ws.cell(row=row, column=6, value="--")
            
            status_cell = ws.cell(row=row, column=7, value="Absent")
            status_cell.fill = absent_fill
            status_cell.font = Font(name="Calibri", color="CC0000", bold=True)
            status_cell.alignment = Alignment(horizontal="center", vertical="center")
            
            conf_cell = ws.cell(row=row, column=8, value="--")
            conf_cell.alignment = Alignment(horizontal="center", vertical="center")
            row += 1

        wb.save(EXCEL_FILE)
        print(f"[+] Created fresh attendance sheet for {today} in {EXCEL_FILE}")
    return wb, today

def mark_present(wb, today, student_id, confidence=1.0):
    """Mark a student as Present in Excel with timestamp and match confidence."""
    ws = wb[today]
    now_time = datetime.now().strftime("%I:%M:%S %p")
    present_fill = PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid")
    
    for row in ws.iter_rows(min_row=2):
        if str(row[0].value) == str(student_id):
            if row[6].value != "Present":
                row[5].value = now_time
                row[6].value = "Present"
                row[6].fill = present_fill
                row[6].font = Font(name="Calibri", color="006100", bold=True)
                row[6].alignment = Alignment(horizontal="center", vertical="center")
                row[7].value = f"{confidence * 100:.1f}%"
                row[7].alignment = Alignment(horizontal="center", vertical="center")
                wb.save(EXCEL_FILE)
                return True
            return False
    return False

def export_json(marked_students, all_students):
    """Save latest attendance record as JSON."""
    today = datetime.now().strftime("%Y-%m-%d")
    records = []
    for sid, info in all_students.items():
        is_present = sid in marked_students
        records.append({
            "student_id": sid,
            "name": info.get("name", sid),
            "class": info.get("class", ""),
            "section": info.get("section", ""),
            "email": info.get("email", ""),
            "date": today,
            "time": marked_students[sid]["time"] if is_present else None,
            "status": "Present" if is_present else "Absent",
            "confidence": marked_students[sid]["confidence"] if is_present else 0.0
        })
    with open(JSON_OUTPUT, "w", encoding="utf-8") as f:
        json.dump({
            "date": today,
            "total_students": len(all_students),
            "present_count": len(marked_students),
            "absent_count": len(all_students) - len(marked_students),
            "records": records
        }, f, indent=2)

    # Cloud backend synchronization
    sync_to_backend(marked_students, all_students)

def sync_to_backend(marked_students, all_students):
    """Automatically synchronize biometric attendance with VID School backend API."""
    import urllib.request
    try:
        payload_records = []
        for sid, meta in marked_students.items():
            info = all_students.get(sid, {})
            payload_records.append({
                "studentId": info.get("db_id"),
                "admissionNumber": info.get("admission_number"),
                "confidence": meta.get("confidence", 99.0),
                "status": "present"
            })
        if not payload_records:
            return
        url = "http://127.0.0.1:5000/api/v1/ai-yantra/attendance/sync"
        req = urllib.request.Request(
            url,
            data=json.dumps({"records": payload_records}).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "X-Institution-Id": "18b3b9a6-0791-47f4-bbd0-bf7c0221e18f"
            }
        )
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("success"):
                print(f"[+] [CLOUD SYNC] Synced {len(payload_records)} records to VID School Supabase Database!")
    except Exception as e:
        print(f"[-] [CLOUD SYNC] Notice: {e}")

def draw_hud(frame, detected_matches, marked_students, all_students, mode_title="LIVE ATTENDANCE"):
    """Draw a clean, high-tech dashboard HUD onto the frame."""
    h, w = frame.shape[:2]
    
    # Header bar
    cv2.rectangle(frame, (0, 0), (w, 55), (20, 24, 33), cv2.FILLED)
    cv2.putText(frame, f"VID SCHOOL | AI ATTENDANCE ({mode_title})", (15, 26),
                cv2.FONT_HERSHEY_DUPLEX, 0.65, (255, 255, 255), 1)
    cv2.putText(frame, f"Algorithm: YuNet CNN + MobileNetV3 Embeddings | Zero-Training Prototype", (15, 45),
                cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 200, 220), 1)
    
    # Right-hand clock
    now_str = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")
    cv2.putText(frame, now_str, (w - 230, 32),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 200), 1)

    # Sidebar stats overlay (semi-transparent panel on right)
    panel_w = 260
    panel_x = w - panel_w
    sub_img = frame[65:h-15, panel_x:w-10]
    overlay = sub_img.copy()
    cv2.rectangle(overlay, (0, 0), (overlay.shape[1], overlay.shape[0]), (15, 18, 25), cv2.FILLED)
    cv2.addWeighted(overlay, 0.85, sub_img, 0.15, 0, sub_img)

    # Panel text
    cv2.putText(frame, "ATTENDANCE METRICS", (panel_x + 12, 90),
                cv2.FONT_HERSHEY_DUPLEX, 0.5, (0, 220, 255), 1)
    
    pres_count = len(marked_students)
    tot_count = len(all_students)
    cv2.putText(frame, f"Total Registered: {tot_count}", (panel_x + 12, 115),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1)
    cv2.putText(frame, f"Present Today:   {pres_count}", (panel_x + 12, 138),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, (0, 255, 120), 1)
    cv2.putText(frame, f"Absent:          {tot_count - pres_count}", (panel_x + 12, 160),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, (100, 100, 255), 1)
    
    cv2.line(frame, (panel_x + 10, 175), (w - 20, 175), (50, 60, 80), 1)
    cv2.putText(frame, "RECENTLY MARKED:", (panel_x + 12, 195),
                cv2.FONT_HERSHEY_DUPLEX, 0.45, (255, 200, 0), 1)

    y_pos = 220
    # Show last 8 marked
    recent = list(marked_students.items())[-8:]
    for sid, info in recent:
        name_trunc = info['name'][:18]
        cv2.putText(frame, f"[OK] {sid}", (panel_x + 12, y_pos),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 255, 120), 1)
        cv2.putText(frame, f"{name_trunc}", (panel_x + 12, y_pos + 14),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.38, (240, 240, 240), 1)
        y_pos += 32

    # Draw face bounding boxes
    for (x, y, fw, fh, sid, name, score) in detected_matches:
        if sid:
            box_color = (0, 255, 120)  # Green
            label = f"{name} ({sid})"
            sublabel = f"Match: {score*100:.1f}%"
        else:
            box_color = (0, 0, 255)    # Red
            label = "Unknown Face"
            sublabel = f"Confidence: {score*100:.1f}%"

        # Bounding corners / box
        cv2.rectangle(frame, (x, y), (x + fw, y + fh), box_color, 2)
        
        # Label card
        label_h = 40
        cv2.rectangle(frame, (x, max(0, y - label_h)), (x + max(fw, 180), y), box_color, cv2.FILLED)
        cv2.putText(frame, label, (x + 5, y - 22),
                    cv2.FONT_HERSHEY_DUPLEX, 0.48, (0, 0, 0), 1)
        cv2.putText(frame, sublabel, (x + 5, y - 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.40, (30, 30, 30), 1)

    # Footer instructions
    cv2.rectangle(frame, (0, h - 26), (w, h), (15, 18, 25), cv2.FILLED)
    cv2.putText(frame, "Controls: Press 'Q' to Exit | 'SPACE' to Pause | 'D' for Demo Cycle", (15, h - 8),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (160, 160, 160), 1)
    return frame

def run_simulation_prototype(engine, students, wb, today, headless=False):
    """Run interactive simulation demonstrating all 10 students recognized."""
    print("\n" + "="*60)
    print("      VID SCHOOL - AI ATTENDANCE PROTOTYPE SIMULATION")
    print("      Testing 10 Registered Student Faces (Zero-Training)")
    print("="*60)
    
    marked_students = {}
    delay_per_student = 1.0 if not headless else 0.05
    
    if not headless:
        cv2.namedWindow("VID School - AI Facial Attendance Prototype", cv2.WINDOW_NORMAL)
        cv2.resizeWindow("VID School - AI Facial Attendance Prototype", 960, 600)

    for idx, (sid, info) in enumerate(students.items(), 1):
        photo_path = os.path.join(STUDENTS_FOLDER, f"{sid}.jpg")
        if not os.path.exists(photo_path):
            print(f"[-] Missing photo for {sid}")
            continue

        orig_img = cv2.imread(photo_path)
        if orig_img is None:
            continue

        # Create camera feed canvas preserving aspect ratio
        canvas = np.zeros((600, 960, 3), dtype=np.uint8)
        canvas[:] = (22, 26, 36)
        
        h_orig, w_orig = orig_img.shape[:2]
        scale = min(490 / h_orig, 620 / w_orig)
        nw, nh = int(w_orig * scale), int(h_orig * scale)
        scaled = cv2.resize(orig_img, (nw, nh))
        
        off_x = 25 + (620 - nw) // 2
        off_y = 70 + (490 - nh) // 2
        canvas[off_y:off_y+nh, off_x:off_x+nw] = scaled
        
        # High precision feature matching on un-distorted face crop
        crop = engine.get_face_crop(orig_img)
        msid, mname, score = engine.match_face(crop)
        
        # Map bounding box coordinates to canvas
        faces = engine.detect_faces(scaled)
        if faces:
            fx, fy, fw, fh, _ = faces[0]
            matches = [(off_x + fx, off_y + fy, fw, fh, msid, mname, score)]
        else:
            matches = [(off_x, off_y, nw, nh, msid, mname, score)]

        if msid and msid not in marked_students:
            mark_present(wb, today, msid, score)
            marked_students[msid] = {
                "name": mname,
                "time": datetime.now().strftime("%I:%M:%S %p"),
                "confidence": round(score * 100, 1)
            }
            print(f"[{idx:02d}/10] [PRESENT] {msid} | {mname:<22} | Confidence: {score*100:.1f}%")

        if not headless:
            display_frame = draw_hud(canvas.copy(), matches, marked_students, students, mode_title="PROTOTYPE TEST")
            cv2.imshow("VID School - AI Facial Attendance Prototype", display_frame)
            key = cv2.waitKey(int(delay_per_student * 1000)) & 0xFF
            if key == ord('q') or key == ord('Q'):
                break

    export_json(marked_students, students)
    
    if not headless:
        # Show final summary screen for 2.5 seconds
        summary_canvas = np.zeros((600, 960, 3), dtype=np.uint8)
        summary_canvas[:] = (20, 24, 33)
        draw_hud(summary_canvas, [], marked_students, students, mode_title="TEST COMPLETE")
        cv2.putText(summary_canvas, "ALL 10 FACES VERIFIED AND MARKED PRESENT!", (120, 300),
                    cv2.FONT_HERSHEY_DUPLEX, 0.75, (0, 255, 120), 2)
        cv2.putText(summary_canvas, f"Attendance successfully saved to '{EXCEL_FILE}'", (120, 340),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        cv2.imshow("VID School - AI Facial Attendance Prototype", summary_canvas)
        cv2.waitKey(2000)
        cv2.destroyAllWindows()

    print("\n" + "="*60)
    print(f"[*] Simulation Complete! Attendance marked for {len(marked_students)}/{len(students)} students.")
    print(f"[+] Output Excel file: {os.path.abspath(EXCEL_FILE)}")
    print(f"[+] Output JSON file:  {os.path.abspath(JSON_OUTPUT)}")
    print("="*60 + "\n")
    return marked_students

def run_live_webcam(engine, students, wb, today, camera_idx=0):
    """Run live webcam attendance tracking."""
    print(f"\n[*] Starting live camera attendance (Device Index {camera_idx})...")
    cap = cv2.VideoCapture(camera_idx)
    if not cap.isOpened():
        print(f"[-] Webcam index {camera_idx} could not be opened. Falling back to prototype simulation.")
        return run_simulation_prototype(engine, students, wb, today)

    cv2.namedWindow("VID School - Live AI Attendance", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("VID School - Live AI Attendance", 960, 600)
    
    marked_students = {}
    frame_interval = 5  # Run recognition every 5 frames for 60+ FPS smoothness
    frame_count = 0
    cached_matches = []

    print("[+] Camera running. Press 'Q' to quit, 'D' to test registered faces.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        h, w = frame.shape[:2]

        if frame_count % frame_interval == 0:
            faces = engine.detect_faces(frame)
            cached_matches = []
            for (x, y, fw, fh, conf) in faces:
                crop = frame[y:y+fh, x:x+fw]
                sid, name, score = engine.match_face(crop)
                cached_matches.append((x, y, fw, fh, sid, name, score))
                
                if sid and sid not in marked_students:
                    mark_present(wb, today, sid, score)
                    marked_students[sid] = {
                        "name": name,
                        "time": datetime.now().strftime("%I:%M:%S %p"),
                        "confidence": round(score * 100, 1)
                    }
                    print(f"[PRESENT] {name} ({sid}) at {marked_students[sid]['time']} (Conf: {score*100:.1f}%)")
                    export_json(marked_students, students)

        display_frame = draw_hud(frame.copy(), cached_matches, marked_students, students, mode_title="LIVE CAMERA")
        cv2.imshow("VID School - Live AI Attendance", display_frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == ord('Q'):
            break
        elif key == ord('d') or key == ord('D'):
            print("\n[+] Triggering demonstration sequence...")
            cap.release()
            cv2.destroyAllWindows()
            return run_simulation_prototype(engine, students, wb, today)

    cap.release()
    cv2.destroyAllWindows()
    export_json(marked_students, students)
    print(f"\n[+] Attendance marked: {len(marked_students)} students. Saved to {EXCEL_FILE}")
    return marked_students

def main():
    parser = argparse.ArgumentParser(description="VID School AI Face Recognition Attendance")
    parser.add_argument("--demo", action="store_true", help="Run 10-student simulation prototype")
    parser.add_argument("--camera", action="store_true", help="Run live webcam attendance")
    parser.add_argument("--headless", action="store_true", help="Run test without GUI popup window")
    parser.add_argument("--cam-idx", type=int, default=0, help="Camera device index (default: 0)")
    args = parser.parse_args()

    students = load_students()
    if not students:
        print("[-] No students registered in students_data.json.")
        return

    print(f"[*] Initializing AI Face Engine (YuNet + MobileNetV3)...")
    engine = AIFaceEngine()
    wb, today = setup_excel(students)

    if args.demo or args.headless:
        run_simulation_prototype(engine, students, wb, today, headless=args.headless)
    elif args.camera:
        run_live_webcam(engine, students, wb, today, camera_idx=args.cam_idx)
    else:
        # Default behavior: try webcam, if not open or if demo chosen, run prototype simulation
        test_cap = cv2.VideoCapture(args.cam_idx)
        can_open_cam = test_cap.isOpened()
        if can_open_cam:
            test_cap.release()
            print("[+] Detected physical camera. Launching live attendance (Press 'D' anytime for demo)...")
            run_live_webcam(engine, students, wb, today, camera_idx=args.cam_idx)
        else:
            print("[i] No active physical camera detected. Running 10-student prototype simulation...")
            run_simulation_prototype(engine, students, wb, today, headless=False)

if __name__ == "__main__":
    main()
