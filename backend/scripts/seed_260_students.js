/**
 * seed_260_students.js
 * Inserts 20 complete student records per section for each of the 13 sections
 * in Narayana e-Techno School / SIA (institution_id: 18b3b9a6-0791-47f4-bbd0-bf7c0221e18f).
 * Total: 260 students with authentic Indian names, unique dates of birth, unique Aadhaar,
 * unique phone numbers, and full demographic & academic details.
 */

const crypto = require('crypto');
const { db } = require('../dist/config/database');

const INSTITUTION_ID = '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f';
const ACADEMIC_YEAR_ID = 'b20be9c7-00f2-4600-a317-0236f44514c1'; // AY 2026-27 (CBSE)

// Pool of 140 authentic Indian male first names
const MALE_NAMES = [
  'Aarav', 'Advik', 'Reyansh', 'Vihaan', 'Arjun', 'Sai', 'Ishaan', 'Vivaan', 'Shaurya', 'Atharv',
  'Karthik', 'Rohan', 'Rithvik', 'Varun', 'Aditya', 'Dhruv', 'Pranav', 'Anirudh', 'Siddharth', 'Yash',
  'Tanush', 'Harsha', 'Nikhil', 'Tejas', 'Aakash', 'Rahul', 'Abhinav', 'Samarth', 'Devansh', 'Chetan',
  'Sanjay', 'Vikram', 'Manoj', 'Naveen', 'Madhav', 'Rishi', 'Gautam', 'Tarun', 'Akhil', 'Kalyan',
  'Chaitanya', 'Bharat', 'Chirag', 'Darshan', 'Eashan', 'Girish', 'Hemanth', 'Jayant', 'Keshav', 'Lokesh',
  'Manish', 'Nihar', 'Omkar', 'Parth', 'Raghav', 'Sandeep', 'Tushar', 'Uday', 'Vimal', 'Yogesh',
  'Bhuvan', 'Devesh', 'Gagan', 'Harshil', 'Jatin', 'Kovidh', 'Mohit', 'Naman', 'Prateek', 'Rishabh',
  'Sachin', 'Tanay', 'Utkarsh', 'Vidit', 'Yuvan', 'Ansh', 'Ayush', 'Chinmay', 'Deepesh', 'Hardik',
  'Kunal', 'Mayank', 'Nakul', 'Palash', 'Rajat', 'Samar', 'Trishul', 'Vedant', 'Yashwant', 'Ashish',
  'Bhargav', 'Charan', 'Dinesh', 'Eshwar', 'Ganesh', 'Hari', 'Jagadish', 'Kiran', 'Lalit', 'Mahesh',
  'Naresh', 'Pavan', 'Rajesh', 'Satish', 'Trilok', 'Umesh', 'Venkat', 'Vamsi', 'Srikar', 'Abhishek',
  'Balaji', 'Chandan', 'Deepak', 'Eeshan', 'Hemant', 'Jagannath', 'Kaushik', 'Laxman', 'Mukund', 'Nishant',
  'Pranay', 'Rohit', 'Suraj', 'Tanuj', 'Vijay', 'Vishal', 'Vivek', 'Yashas', 'Zeeshan', 'Aman',
  'Bhavik', 'Chiranth', 'Divyansh', 'Hritik', 'Kabir', 'Manav', 'Nimesh', 'Ronav', 'Shlok', 'Suhas',
  'Tejan', 'Vardhan', 'Veer', 'Viraj', 'Aatish', 'Brijesh', 'Daksh', 'Hriday', 'Kairav', 'Madhavan'
];

// Pool of 140 authentic Indian female first names
const FEMALE_NAMES = [
  'Ananya', 'Diya', 'Priya', 'Tanvi', 'Kavya', 'Aditi', 'Meera', 'Shreya', 'Neha', 'Riya',
  'Isha', 'Sneha', 'Pooja', 'Anika', 'Avani', 'Divya', 'Harshita', 'Ishita', 'Keerthi', 'Lavanya',
  'Navya', 'Pallavi', 'Ritu', 'Samiksha', 'Trisha', 'Vaidehi', 'Yamini', 'Aastha', 'Bhavana', 'Charvi',
  'Deepika', 'Gayathri', 'Hamsa', 'Jahnvi', 'Kriti', 'Lipi', 'Maya', 'Nandini', 'Ojasvi', 'Pavithra',
  'Radha', 'Saanvi', 'Tanya', 'Urvashi', 'Varsha', 'Yashika', 'Zara', 'Akshara', 'Bhoomi', 'Chetana',
  'Dhriti', 'Esha', 'Fatima', 'Gauri', 'Hansika', 'Indu', 'Jivika', 'Kalyani', 'Lekha', 'Mahika',
  'Nisha', 'Prisha', 'Rashmi', 'Sanjana', 'Tanuja', 'Upasana', 'Vandana', 'Yuktha', 'Aadhya', 'Bindu',
  'Chaitali', 'Diksha', 'Harini', 'Ira', 'Jyothi', 'Kirti', 'Mansi', 'Nidhi', 'Parvati', 'Rupal',
  'Shravya', 'Tara', 'Uma', 'Veda', 'Yasmin', 'Ahana', 'Chhavi', 'Devika', 'Hina', 'Jaspreet',
  'Malini', 'Navami', 'Padmini', 'Reet', 'Sharanya', 'Tejaswi', 'Vaanya', 'Vidhi', 'Zoya', 'Aparna',
  'Bhavya', 'Charulata', 'Damini', 'Ekta', 'Gargi', 'Hemlata', 'Jayanti', 'Kanika', 'Leela', 'Madhuri',
  'Nayana', 'Prachi', 'Rachana', 'Sarita', 'Trupti', 'Urmila', 'Vasanthi', 'Yamuna', 'Anokhi', 'Bhumika',
  'Chitra', 'Darshana', 'Gunjan', 'Indira', 'Kamini', 'Lalita', 'Manisha', 'Nirupama', 'Payal', 'Ragini',
  'Sharmila', 'Tulsi', 'Vaishali', 'Anita', 'Deepa', 'Geetha', 'Hema', 'Jyotsna', 'Kalpana', 'Kaveri'
];

// Pool of 100 authentic Indian surnames across regions
const SURNAMES = [
  'Reddy', 'Sharma', 'Verma', 'Rao', 'Patel', 'Joshi', 'Kulkarni', 'Nair', 'Pillai', 'Deshmukh',
  'Agarwal', 'Chatterjee', 'Mukherjee', 'Banerjee', 'Gupta', 'Singh', 'Yadav', 'Chauhan', 'Mehta', 'Shah',
  'Kumar', 'Mishra', 'Pandey', 'Tiwari', 'Shukla', 'Jha', 'Tripathi', 'Saxena', 'Srivastava', 'Bhat',
  'Iyer', 'Iyengar', 'Menon', 'Nambiar', 'Varma', 'Warrier', 'Namboothiri', 'Shetty', 'Hegde', 'Pai',
  'Kamath', 'Prabhu', 'Shenoy', 'Naik', 'Patil', 'Shinde', 'Gaikwad', 'More', 'Pawar', 'Kadam',
  'Chavan', 'Jadhav', 'Bhosale', 'Salunke', 'Thorat', 'Goud', 'Chary', 'Mudiraj', 'Padmashali', 'Kuruba',
  'Munnuru', 'Komati', 'Velama', 'Kamma', 'Kapu', 'Raju', 'Vaddera', 'Boya', 'Nayak', 'Nayudu',
  'Dutta', 'Sen', 'Bose', 'Ghosh', 'Das', 'Roy', 'Sarkar', 'Biswas', 'Majumdar', 'Ganguly',
  'Choudhury', 'Mahajan', 'Khatri', 'Sethi', 'Grover', 'Kapoor', 'Malhotra', 'Khanna', 'Chopra', 'Anand',
  'Bhasin', 'Suri', 'Bedi', 'Seth', 'Sood', 'Sehgal', 'Tandon', 'Kohli', 'Mittal', 'Bansal'
];

// Father first names for realistic guardian generation
const FATHER_FIRST_NAMES = [
  'Ramesh', 'Suresh', 'Anil', 'Sunil', 'Venkat', 'Rajesh', 'Mahesh', 'Dinesh', 'Satish', 'Prakash',
  'Srinivas', 'Ravinder', 'Naveen', 'Sudhir', 'Ashok', 'Kishore', 'Venkatesh', 'Chandra', 'Mohan', 'Kalyan'
];

// Mother first names for realistic guardian generation
const MOTHER_FIRST_NAMES = [
  'Lakshmi', 'Sunita', 'Radha', 'Kavita', 'Sujatha', 'Padma', 'Manjula', 'Usha', 'Saritha', 'Geetha',
  'Shailaja', 'Rekha', 'Madhavi', 'Vanaja', 'Bharathi', 'Anuradha', 'Sita', 'Shanti', 'Vandana', 'Asha'
];

const BLOOD_GROUPS = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'];
const MOTHER_TONGUES = ['Telugu', 'Hindi', 'Tamil', 'Kannada', 'Marathi', 'Malayalam', 'Bengali', 'Gujarati'];
const RELIGIONS = ['Hinduism', 'Islam', 'Christianity', 'Sikhism', 'Jainism'];
const CASTES = ['General', 'OBC', 'SC', 'ST'];

const PREVIOUS_SCHOOLS = [
  'Delhi Public School, Hyderabad',
  'Chirec International School, Kondapur',
  'Oakridge International School, Gachibowli',
  'Meridian School, Madhapur',
  'Silver Oaks International School, Miyapur',
  'DAV Public School, Safilguda',
  'Kendriya Vidyalaya, Picket',
  'Bharatiya Vidya Bhavan Public School, Jubilee Hills',
  'Hyderabad Public School, Begumpet',
  'Johnson Grammar School, Habsiguda'
];

const LOCALITIES = [
  { area: 'Madhapur', landmark: 'Near Cyber Towers', pincode: '500081' },
  { area: 'Gachibowli', landmark: 'Financial District, Opp. Wipro Circle', pincode: '500032' },
  { area: 'Kondapur', landmark: 'Raghavendra Colony, Near Botanical Garden', pincode: '500084' },
  { area: 'Kukatpally', landmark: 'KPHB Colony Phase 3, Near Forum Mall', pincode: '500072' },
  { area: 'Banjara Hills', landmark: 'Road No. 12, Near Care Hospital', pincode: '500034' },
  { area: 'Miyapur', landmark: 'Allwyn Colony, Near Miyapur Metro', pincode: '500049' },
  { area: 'Jubilee Hills', landmark: 'Road No. 36, Near Peddamma Temple', pincode: '500033' },
  { area: 'Nizampet', landmark: 'Village Road, Near Vertex Pleasant', pincode: '500090' },
  { area: 'Chandanagar', landmark: 'Tara Nagar, Near Railway Station', pincode: '500050' },
  { area: 'Hitec City', landmark: 'Silicon Valley, Near Inorbit Mall', pincode: '500081' }
];

// Helper: Grade to realistic birth year mapping
function getBirthYearForGrade(gradeName) {
  const norm = gradeName.toLowerCase();
  if (norm.includes('10')) return 2011;
  if (norm.includes('9')) return 2012;
  if (norm.includes('8')) return 2013;
  if (norm.includes('7')) return 2014;
  if (norm.includes('6')) return 2015;
  if (norm.includes('2')) return 2019;
  if (norm.includes('1')) return 2020;
  return 2014;
}

// Generate unique date of birth for student k within that grade year
function generateUniqueDob(birthYear, studentIndexInGrade) {
  // studentIndexInGrade: 0..39
  // month: 1..12
  // day: 1..23 (guaranteed valid for all months including February)
  const month = 1 + (studentIndexInGrade % 12);
  const cycle = Math.floor(studentIndexInGrade / 12);
  const day = 1 + cycle * 6 + ((studentIndexInGrade * 3) % 5);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${birthYear}-${mm}-${dd}`;
}

async function run() {
  console.log('--- STARTING 260 STUDENT SEEDING ---');
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // 1. Update classes capacity to 80 so views and checks remain clean and positive
    console.log('1. Setting class capacity to 80 for all classes in institution...');
    await client.query(
      `UPDATE classes SET capacity = 80 WHERE institution_id = $1`,
      [INSTITUTION_ID]
    );

    // 2. Fetch all sections
    const secRes = await client.query(
      `SELECT c.id as class_id, c.name as class_name, sec.id as section_id, sec.name as section_name
       FROM sections sec
       JOIN classes c ON c.id = sec.class_id
       WHERE sec.institution_id = $1
       ORDER BY c.name, sec.name`,
      [INSTITUTION_ID]
    );

    const sections = secRes.rows;
    console.log(`Found ${sections.length} sections across classes.`);

    let globalStudentCounter = 201; // Start admission numbers at SIA-2026-0201
    let maleNameIdx = 0;
    let femaleNameIdx = 0;
    let surnameIdx = 0;

    // Track total inserted
    let totalStudentsInserted = 0;
    let totalGuardiansInserted = 0;
    let totalAcademicHistoryInserted = 0;

    // Track student index per grade for DOB uniqueness
    const gradeStudentCount = {};

    for (const sec of sections) {
      const classId = sec.class_id;
      const className = sec.class_name;
      const sectionId = sec.section_id;
      const sectionName = sec.section_name;

      gradeStudentCount[className] = gradeStudentCount[className] || 0;
      const birthYear = getBirthYearForGrade(className);

      // Determine existing max roll number in this section
      const existingRolls = await client.query(
        `SELECT roll_number FROM students WHERE current_section_id = $1 AND roll_number IS NOT NULL`,
        [sectionId]
      );

      let maxRollNum = 0;
      let rollPrefix = '';

      // Standard prefix e.g. Grade 10 Section A -> "10-A-"
      const gradeNumMatch = className.match(/\d+/);
      const gradeDigit = gradeNumMatch ? gradeNumMatch[0].padStart(2, '0') : '01';
      const secLetter = sectionName.replace(/[^A-Za-z]/g, '').slice(-1).toUpperCase() || 'A';
      rollPrefix = `${gradeDigit}-${secLetter}-`;

      for (const r of existingRolls.rows) {
        if (r.roll_number) {
          const m = r.roll_number.match(/(\d+)$/);
          if (m) {
            const val = parseInt(m[1], 10);
            if (val > maxRollNum) maxRollNum = val;
          }
        }
      }

      console.log(`\nSeeding Section: ${className} - ${sectionName} | Current Max Roll: ${maxRollNum} | Prefix: ${rollPrefix}`);

      // Insert 20 students for this section
      for (let s = 1; s <= 20; s++) {
        const studentId = crypto.randomUUID();
        const guardianId = crypto.randomUUID();
        const historyId = crypto.randomUUID();

        const admnNumber = `SIA-2026-${String(globalStudentCounter).padStart(4, '0')}`;
        const rollNumVal = maxRollNum + s;
        const rollNumberStr = `${rollPrefix}${String(rollNumVal).padStart(2, '0')}`;

        // Alternate gender: 10 males, 10 females per section
        const isMale = (s % 2 === 1);
        const gender = isMale ? 'male' : 'female';
        const firstName = isMale ? MALE_NAMES[maleNameIdx % MALE_NAMES.length] : FEMALE_NAMES[femaleNameIdx % FEMALE_NAMES.length];
        if (isMale) maleNameIdx++; else femaleNameIdx++;

        const lastName = SURNAMES[surnameIdx % SURNAMES.length];
        surnameIdx++;

        // Date of birth
        const gradeIdx = gradeStudentCount[className]++;
        const dob = generateUniqueDob(birthYear, gradeIdx);

        // Demographic attributes
        const bloodGroup = BLOOD_GROUPS[(globalStudentCounter * 3) % BLOOD_GROUPS.length];
        const motherTongue = MOTHER_TONGUES[(globalStudentCounter * 5) % MOTHER_TONGUES.length];
        const religion = RELIGIONS[(globalStudentCounter * 7) % RELIGIONS.length];
        const caste = CASTES[(globalStudentCounter * 2) % CASTES.length];
        const prevSchool = PREVIOUS_SCHOOLS[(globalStudentCounter * 4) % PREVIOUS_SCHOOLS.length];

        // Address & Locality
        const loc = LOCALITIES[(globalStudentCounter) % LOCALITIES.length];
        const flatNo = 101 + ((globalStudentCounter * 17) % 800);
        const addressLine1 = `Flat ${flatNo}, Sri Sai Balaji Residency, ${loc.landmark}`;
        const addressLine2 = `${loc.area}, Greater Hyderabad`;
        const city = 'Hyderabad';
        const state = 'Telangana';
        const pincode = loc.pincode;

        // Guardian details
        const isFather = ((globalStudentCounter % 3) !== 0);
        const guardianRel = isFather ? 'Father' : 'Mother';
        const guardianFirst = isFather
          ? FATHER_FIRST_NAMES[(globalStudentCounter) % FATHER_FIRST_NAMES.length]
          : MOTHER_FIRST_NAMES[(globalStudentCounter) % MOTHER_FIRST_NAMES.length];
        const guardianFullName = `${guardianFirst} ${lastName}`;
        const guardianPhone = `+91 98480${String(globalStudentCounter).padStart(5, '0')}`;
        const guardianEmail = `parent.sia2026${String(globalStudentCounter).padStart(4, '0')}@gmail.com`;

        // Emergency details
        const emergencyContact = guardianFullName;
        const emergencyPhone = guardianPhone;

        // Aadhaar: 12-digit formatted unique Aadhaar
        const aadhaarPart1 = '5489';
        const aadhaarPart2 = '3120';
        const aadhaarPart3 = String(globalStudentCounter).padStart(4, '0');
        const aadhaarNumber = `${aadhaarPart1} ${aadhaarPart2} ${aadhaarPart3}`;

        // Insert Student
        await client.query(
          `INSERT INTO students (
             id, institution_id, admission_number, first_name, last_name,
             date_of_birth, gender, current_class_id, current_section_id,
             status, roll_number, blood_group, nationality, mother_tongue,
             religion, caste, previous_school, address_line1, address_line2,
             city, state, pincode, emergency_contact, emergency_phone,
             aadhaar_number, notes, created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4, $5,
             $6, $7, $8, $9,
             'active', $10, $11, 'Indian', $12,
             $13, $14, $15, $16, $17,
             $18, $19, $20, $21, $22,
             $23, 'Enrolled for Academic Year 2026-27', NOW(), NOW()
           )`,
          [
            studentId, INSTITUTION_ID, admnNumber, firstName, lastName,
            dob, gender, classId, sectionId,
            rollNumberStr, bloodGroup, motherTongue,
            religion, caste, prevSchool, addressLine1, addressLine2,
            city, state, pincode, emergencyContact, emergencyPhone,
            aadhaarNumber
          ]
        );
        totalStudentsInserted++;

        // Insert Guardian
        await client.query(
          `INSERT INTO guardians (
             id, institution_id, full_name, relationship, phone, email, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [guardianId, INSTITUTION_ID, guardianFullName, guardianRel, guardianPhone, guardianEmail]
        );
        totalGuardiansInserted++;

        // Insert Student Guardian Link
        await client.query(
          `INSERT INTO student_guardians (
             student_id, guardian_id, relationship, is_primary_contact
           ) VALUES ($1, $2, $3, true)`,
          [studentId, guardianId, guardianRel]
        );

        // Insert Student Academic History
        await client.query(
          `INSERT INTO student_academic_history (
             id, institution_id, student_id, academic_year_id, class_id, section_id,
             roll_number, effective_from, effective_to, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, '2026-06-01', NULL, NOW())`,
          [historyId, INSTITUTION_ID, studentId, ACADEMIC_YEAR_ID, classId, sectionId, rollNumberStr]
        );
        totalAcademicHistoryInserted++;

        globalStudentCounter++;
      }
    }

    await client.query('COMMIT');

    console.log('\n--- SEEDING COMPLETED SUCCESSFULLY ---');
    console.log(`✓ Total Students Inserted: ${totalStudentsInserted}`);
    console.log(`✓ Total Guardians Inserted: ${totalGuardiansInserted}`);
    console.log(`✓ Total Academic Histories Inserted: ${totalAcademicHistoryInserted}`);
    console.log(`✓ Admission Number Range: SIA-2026-0201 to SIA-2026-0460`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('FAILED TO SEED STUDENTS:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

run().then(() => process.exit(0));
