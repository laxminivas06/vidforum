import os
import sys
import json
import urllib.request
import cv2

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

STUDENTS_FOLDER = "students"
DATA_FILE = "students_data.json"
os.makedirs(STUDENTS_FOLDER, exist_ok=True)

STUDENTS = [
    {
        "id": "10-A-01",
        "name": "Abhinav Bollineni",
        "email": "abhinav.b@school.edu",
        "class": "Grade 10",
        "section": "Section A",
        "photo_url": "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
        "id": "10-A-02",
        "name": "Siri Gundlapally",
        "email": "siri.g@school.edu",
        "class": "Grade 10",
        "section": "Section A",
        "photo_url": "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
        "id": "10-A-03",
        "name": "Rohan Varma",
        "email": "rohan.v@school.edu",
        "class": "Grade 10",
        "section": "Section A",
        "photo_url": "https://randomuser.me/api/portraits/men/46.jpg"
    },
    {
        "id": "10-A-04",
        "name": "Ananya Reddy",
        "email": "ananya.r@school.edu",
        "class": "Grade 10",
        "section": "Section A",
        "photo_url": "https://randomuser.me/api/portraits/women/68.jpg"
    },
    {
        "id": "10-A-05",
        "name": "Karthik Kumar",
        "email": "karthik.k@school.edu",
        "class": "Grade 10",
        "section": "Section A",
        "photo_url": "https://randomuser.me/api/portraits/men/75.jpg"
    },
    {
        "id": "10-B-01",
        "name": "Diya Sharma",
        "email": "diya.s@school.edu",
        "class": "Grade 10",
        "section": "Section B",
        "photo_url": "https://randomuser.me/api/portraits/women/22.jpg"
    },
    {
        "id": "10-B-02",
        "name": "Aditya Rao",
        "email": "aditya.r@school.edu",
        "class": "Grade 10",
        "section": "Section B",
        "photo_url": "https://randomuser.me/api/portraits/men/86.jpg"
    },
    {
        "id": "10-B-03",
        "name": "Tanvi Goud",
        "email": "tanvi.g@school.edu",
        "class": "Grade 10",
        "section": "Section B",
        "photo_url": "https://randomuser.me/api/portraits/women/90.jpg"
    },
    {
        "id": "09-A-01",
        "name": "Pranav Kandula",
        "email": "pranav.k@school.edu",
        "class": "Grade 9",
        "section": "Section A",
        "photo_url": "https://randomuser.me/api/portraits/men/29.jpg"
    },
    {
        "id": "09-A-02",
        "name": "Sahil Khan",
        "email": "sahil.k@school.edu",
        "class": "Grade 9",
        "section": "Section A",
        "photo_url": "https://randomuser.me/api/portraits/men/52.jpg"
    }
]

def main():
    print("==================================================")
    print("   SETTING UP 10 PROTOTYPE STUDENTS & FACES       ")
    print("==================================================")
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    students_data = {}
    
    for s in STUDENTS:
        photo_filename = f"{s['id']}.jpg"
        photo_path = os.path.join(STUDENTS_FOLDER, photo_filename)
        
        print(f"\n[+] Processing {s['name']} ({s['id']})...")
        try:
            req = urllib.request.Request(s['photo_url'], headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp, open(photo_path, 'wb') as f:
                f.write(resp.read())
            
            # Verify image with cv2
            img = cv2.imread(photo_path)
            if img is not None:
                h, w = img.shape[:2]
                print(f"    ✓ Photo saved ({w}x{h} px): {photo_path}")
            else:
                print(f"    ⚠️ Warning: Failed to read photo for {s['id']}")
        except Exception as e:
            print(f"    ⚠️ Download error for {s['id']}: {e}")
            
        students_data[s['id']] = {
            "name": s["name"],
            "email": s["email"],
            "class": s["class"],
            "section": s["section"],
            "photo": f"{STUDENTS_FOLDER}/{photo_filename}"
        }
        
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(students_data, f, indent=4)
        
    print(f"\n✅ Successfully registered {len(students_data)} students into {DATA_FILE}!")
    print(f"✅ Stored {len(os.listdir(STUDENTS_FOLDER))} student portrait photos in {STUDENTS_FOLDER}/")

if __name__ == "__main__":
    main()
