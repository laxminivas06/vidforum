import os
import sys
import json
import shutil
import cv2

from ai_face_engine import AIFaceEngine

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

STUDENTS_FOLDER = "students"
DATA_FILE = "students_data.json"
os.makedirs(STUDENTS_FOLDER, exist_ok=True)

def load_students():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            raw = json.load(f)
        normalized = {}
        for sid, data in raw.items():
            if isinstance(data, str):
                normalized[sid] = {"name": data, "email": "", "class": "10", "section": "A"}
            else:
                normalized[sid] = data
        return normalized
    return {}

def save_students(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

def register_from_camera(engine, student_id, student_name, student_email, student_class, student_section):
    print(f"\n[*] Opening camera for {student_name} ({student_id})...")
    print("Press [SPACE] to capture photo | [Q] to cancel")

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[-] Error: Could not open camera device!")
        return False

    captured_frame = None
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        display = frame.copy()
        faces = engine.detect_faces(frame)
        
        if faces:
            x, y, w, h, conf = faces[0]
            cv2.rectangle(display, (x, y), (x+w, y+h), (0, 255, 120), 2)
            cv2.putText(display, f"Face Detected ({conf*100:.0f}%)", (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 120), 1)

        cv2.putText(display, f"{student_name} ({student_id})", (15, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(display, "SPACE = Capture | Q = Cancel", (15, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 220, 255), 1)
        cv2.imshow("Register Student Face", display)

        key = cv2.waitKey(1) & 0xFF
        if key == ord(' '):
            if faces:
                captured_frame = frame
                print("[+] Face confirmed and captured!")
                break
            else:
                print("[!] No face detected in frame. Please face the camera and try again.")
        elif key == ord('q') or key == ord('Q'):
            print("[-] Registration cancelled.")
            break

    cap.release()
    cv2.destroyAllWindows()

    if captured_frame is not None:
        photo_path = os.path.join(STUDENTS_FOLDER, f"{student_id}.jpg")
        cv2.imwrite(photo_path, captured_frame)
        return True
    return False

def register_from_image_file(engine, student_id, file_path):
    if not os.path.exists(file_path):
        print(f"[-] Image file not found: {file_path}")
        return False
        
    img = cv2.imread(file_path)
    if img is None:
        print(f"[-] Failed to read image file: {file_path}")
        return False
        
    faces = engine.detect_faces(img)
    if not faces:
        print("[!] Warning: YuNet did not detect a clear frontal face in this photo.")
        proceed = input("Do you still want to use this photo? (y/n): ").strip().lower()
        if proceed != 'y':
            return False
            
    photo_path = os.path.join(STUDENTS_FOLDER, f"{student_id}.jpg")
    shutil.copyfile(file_path, photo_path)
    print(f"[+] Photo copied to {photo_path}")
    return True

def register_student(engine):
    students = load_students()
    print("\n" + "="*45)
    print("        STUDENT FACE REGISTRATION")
    print("="*45)
    student_id = input("Student ID (e.g. 10-A-06): ").strip()
    if not student_id:
        print("[-] Student ID cannot be empty.")
        return
        
    if student_id in students:
        print(f"[-] Student ID '{student_id}' is already registered as '{students[student_id]['name']}'!")
        return

    student_name = input("Student Full Name: ").strip()
    student_email = input("Student Email: ").strip()
    student_class = input("Class (e.g. Grade 10): ").strip() or "Grade 10"
    student_section = input("Section (e.g. Section A): ").strip() or "Section A"

    print("\nSelect Photo Source:")
    print("1. Capture live via Webcam")
    print("2. Import existing Image File (.jpg/.png)")
    choice = input("Enter choice (1/2): ").strip()

    success = False
    if choice == "1":
        success = register_from_camera(engine, student_id, student_name, student_email, student_class, student_section)
    elif choice == "2":
        path = input("Enter image file path: ").strip().strip('"')
        success = register_from_image_file(engine, student_id, path)
    else:
        print("[-] Invalid choice.")
        return

    if success:
        students[student_id] = {
            "name": student_name,
            "email": student_email,
            "class": student_class,
            "section": student_section,
            "photo": f"students/{student_id}.jpg"
        }
        save_students(students)
        # Reload engine cache
        engine.load_registered_students()
        print(f"\n[OK] Successfully registered {student_name} ({student_id})!")

def list_students():
    students = load_students()
    if not students:
        print("\n[-] No students registered yet.")
        return
    print("\n" + "="*70)
    print(f"{'ID':<10} {'Name':<22} {'Class':<12} {'Email':<25}")
    print("="*70)
    for sid, data in students.items():
        name = data.get('name', sid)
        cls_sec = f"{data.get('class', '')} {data.get('section', '')}".strip()
        email = data.get('email', '')
        print(f"{sid:<10} {name:<22} {cls_sec:<12} {email:<25}")
    print("="*70)
    print(f"Total: {len(students)} registered students.")

def delete_student():
    students = load_students()
    list_students()
    sid = input("\nEnter Student ID to delete: ").strip()
    if sid in students:
        name = students[sid].get("name", sid)
        del students[sid]
        save_students(students)
        photo = os.path.join(STUDENTS_FOLDER, f"{sid}.jpg")
        if os.path.exists(photo):
            os.remove(photo)
        print(f"[OK] Student {name} ({sid}) removed from system.")
    else:
        print("[-] Student ID not found.")

def main():
    engine = AIFaceEngine()
    while True:
        print("\n===== REGISTRATION MENU =====")
        print("1. Register new student")
        print("2. List all students")
        print("3. Delete a student")
        print("4. Exit")
        choice = input("Choose option (1-4): ").strip()
        if choice == "1":
            register_student(engine)
        elif choice == "2":
            list_students()
        elif choice == "3":
            delete_student()
        elif choice == "4":
            break
        else:
            print("Invalid choice.")

if __name__ == "__main__":
    main()