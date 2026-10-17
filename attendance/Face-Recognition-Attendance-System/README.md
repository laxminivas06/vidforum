Face Recognition Attendance System
Using Xiaomi Mi Home 360 Camera
---
PROJECT STRUCTURE
```
attendance\_project/
    ├── register.py          ← Register student faces
    ├── attendance.py        ← Run live attendance
    ├── students/            ← Student photos (auto-created)
    ├── students\_data.json   ← Student ID + Name data
    └── attendance.xlsx      ← Auto-generated attendance sheet
```
---
SETUP
Install Libraries:
```
pip install opencv-python
pip install face-recognition
pip install openpyxl
pip install numpy
pip install Pillow
pip install pyautogui
pip install pygetwindow
```
---
HOW TO USE
Step 1 - Register Students:
```
python register.py
```
Enter Student ID (e.g. S001)
Enter Student Name
Press SPACE to capture face photo
Repeat for all students
Step 2 - Open BlueStacks:
Open BlueStacks
Open Xiaomi Home app
Make sure camera feed is visible
Step 3 - Run Attendance:
```
python attendance.py
```
System captures BlueStacks screen
Detects and recognizes faces
Marks attendance automatically
Press Q to stop and save
---
OUTPUT - attendance.xlsx
Student ID	Name	Date	Time	Status
S001	Student Name	2026-03-15	09:15 AM	Present
S002	Student Name	2026-03-15	--	Absent
---
NOTES
Keep BlueStacks open while running attendance.py
Each student is marked only once per day
New sheet created in Excel for each day
Green box = recognized student
Red box = unknown person
