import { db } from '../src/config/database';
import crypto from 'crypto';

const uuidv4 = () => crypto.randomUUID();

const INSTITUTION_ID = '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f';
const CURRENT_ACADEMIC_YEAR_ID = 'b20be9c7-00f2-4600-a317-0236f44514c1'; // AY 2026-27 (CBSE)
const DEFAULT_DEPT_ID = '1a605f11-512f-4be7-b50b-691535fe7aa0';

// 70 Unique Indian Girls
const GIRL_PROFILES = [
  { first: 'Ananya', last: 'Reddy', parent: 'K. Mahender Reddy', rel: 'Father', prefix: '944010' },
  { first: 'Kavya', last: 'Sharma', parent: 'Dr. Anil Sharma', rel: 'Father', prefix: '944011' },
  { first: 'Diya', last: 'Rao', parent: 'Smt. Sunitha Rao', rel: 'Mother', prefix: '944012' },
  { first: 'Sneha', last: 'Patel', parent: 'Dinesh Patel', rel: 'Father', prefix: '944013' },
  { first: 'Pooja', last: 'Verma', parent: 'Suresh Verma', rel: 'Father', prefix: '944014' },
  { first: 'Riya', last: 'Nair', parent: 'Radhika Nair', rel: 'Mother', prefix: '944015' },
  { first: 'Shreya', last: 'Joshi', parent: 'Prashant Joshi', rel: 'Father', prefix: '944016' },
  { first: 'Tanvi', last: 'Gupta', parent: 'Rajesh Gupta', rel: 'Father', prefix: '944017' },
  { first: 'Ishita', last: 'Choudhury', parent: 'Arun Choudhury', rel: 'Father', prefix: '944018' },
  { first: 'Meera', last: 'Nambiar', parent: 'Sudha Nambiar', rel: 'Mother', prefix: '944019' },

  { first: 'Aaradhya', last: 'Kulkarni', parent: 'Ganesh Kulkarni', rel: 'Father', prefix: '944020' },
  { first: 'Divya', last: 'Menon', parent: 'Padma Menon', rel: 'Mother', prefix: '944021' },
  { first: 'Sahithi', last: 'Varma', parent: 'Sita Rama Varma', rel: 'Father', prefix: '944022' },
  { first: 'Keerthi', last: 'Goud', parent: 'Narsimha Goud', rel: 'Father', prefix: '944023' },
  { first: 'Bhavana', last: 'Chary', parent: 'Brahmaiah Chary', rel: 'Father', prefix: '944024' },
  { first: 'Manasa', last: 'Potluri', parent: 'Venkateswara Rao', rel: 'Father', prefix: '944025' },
  { first: 'Pratyusha', last: 'Bollineni', parent: 'Kishore Bollineni', rel: 'Father', prefix: '944026' },
  { first: 'Harini', last: 'Sastry', parent: 'Subrahmanya Sastry', rel: 'Father', prefix: '944027' },
  { first: 'Tejaswi', last: 'Kompella', parent: 'Ramakrishna Kompella', rel: 'Father', prefix: '944028' },
  { first: 'Sruthi', last: 'Dendukuri', parent: 'Balaram Dendukuri', rel: 'Father', prefix: '944029' },

  { first: 'Nandini', last: 'Bhat', parent: 'Muralidhar Bhat', rel: 'Father', prefix: '944030' },
  { first: 'Deepthi', last: 'Iyengar', parent: 'Lakshmi Iyengar', rel: 'Mother', prefix: '944031' },
  { first: 'Swathi', last: 'Pillai', parent: 'Chandran Pillai', rel: 'Father', prefix: '944032' },
  { first: 'Siri', last: 'Gundlapally', parent: 'Ramesh Gundlapally', rel: 'Father', prefix: '944033' },
  { first: 'Mounika', last: 'Alapati', parent: 'Satyanarayana Alapati', rel: 'Father', prefix: '944034' },
  { first: 'Yamini', last: 'Kamineni', parent: 'Chandra Sekhar Kamineni', rel: 'Father', prefix: '944035' },
  { first: 'Sravani', last: 'Jonnalagadda', parent: 'Phani Jonnalagadda', rel: 'Father', prefix: '944036' },
  { first: 'Navya', last: 'Devineni', parent: 'Babu Devineni', rel: 'Father', prefix: '944037' },
  { first: 'Akshara', last: 'Velagapudi', parent: 'Harish Velagapudi', rel: 'Father', prefix: '944038' },
  { first: 'Mythili', last: 'Penmetsa', parent: 'Kalyan Penmetsa', rel: 'Father', prefix: '944039' },

  { first: 'Sanjana', last: 'Yalamanchili', parent: 'Srinivas Yalamanchili', rel: 'Father', prefix: '944040' },
  { first: 'Alekhya', last: 'Nallapati', parent: 'Ravindra Nallapati', rel: 'Father', prefix: '944041' },
  { first: 'Hansika', last: 'Gadiraju', parent: 'Vijay Gadiraju', rel: 'Father', prefix: '944042' },
  { first: 'Vaishnavi', last: 'Cherukuri', parent: 'Madhavi Cherukuri', rel: 'Mother', prefix: '944043' },
  { first: 'Samhitha', last: 'Maganti', parent: 'Murali Maganti', rel: 'Father', prefix: '944044' },
  { first: 'Varshini', last: 'Kanumuri', parent: 'Surya Kanumuri', rel: 'Father', prefix: '944045' },
  { first: 'Pranavi', last: 'Sagi', parent: 'Anand Sagi', rel: 'Father', prefix: '944046' },
  { first: 'Lasya', last: 'Dantuluri', parent: 'Raghu Dantuluri', rel: 'Father', prefix: '944047' },
  { first: 'Lahari', last: 'Datla', parent: 'Bhanu Datla', rel: 'Father', prefix: '944048' },
  { first: 'Kriti', last: 'Bhupatiraju', parent: 'Gautam Bhupatiraju', rel: 'Father', prefix: '944049' },

  { first: 'Aditi', last: 'Alluri', parent: 'Venkata Alluri', rel: 'Father', prefix: '944050' },
  { first: 'Pavani', last: 'Uddaraju', parent: 'Sujatha Uddaraju', rel: 'Mother', prefix: '944051' },
  { first: 'Niharika', last: 'Penumatsa', parent: 'Naresh Penumatsa', rel: 'Father', prefix: '944052' },
  { first: 'Meghana', last: 'Indukuri', parent: 'Praveen Indukuri', rel: 'Father', prefix: '944053' },
  { first: 'Anusha', last: 'Kalidindi', parent: 'Satish Kalidindi', rel: 'Father', prefix: '944054' },
  { first: 'Harshitha', last: 'Gottumukkala', parent: 'Bapiraju Gottumukkala', rel: 'Father', prefix: '944055' },
  { first: 'Rohini', last: 'Rudraraju', parent: 'Kishore Rudraraju', rel: 'Father', prefix: '944056' },
  { first: 'Sreeja', last: 'Vegesna', parent: 'Sudhakar Vegesna', rel: 'Father', prefix: '944057' },
  { first: 'Thanmayi', last: 'Vatsavai', parent: 'Prabhakar Vatsavai', rel: 'Father', prefix: '944058' },
  { first: 'Charitha', last: 'Byrraju', parent: 'Ramalinga Byrraju', rel: 'Father', prefix: '944059' },

  { first: 'Rachana', last: 'Mantena', parent: 'Jagannadha Mantena', rel: 'Father', prefix: '944060' },
  { first: 'Preethi', last: 'Chintalapati', parent: 'Bhavani Chintalapati', rel: 'Mother', prefix: '944061' },
  { first: 'Chaitra', last: 'Nandyala', parent: 'Venkataramana Nandyala', rel: 'Father', prefix: '944062' },
  { first: 'Siri Chandana', last: 'Guntupalli', parent: 'Vamsi Guntupalli', rel: 'Father', prefix: '944063' },
  { first: 'Chinmayi', last: 'Sunkara', parent: 'Subba Rao Sunkara', rel: 'Father', prefix: '944064' },
  { first: 'Deepa', last: 'Ravipati', parent: 'Sambaiah Ravipati', rel: 'Father', prefix: '944065' },
  { first: 'Gayathri', last: 'Tatineni', parent: 'Venkat Tatineni', rel: 'Father', prefix: '944066' },
  { first: 'Hima Bindu', last: 'Kamineni', parent: 'Krishna Kamineni', rel: 'Father', prefix: '944067' },
  { first: 'Ishwarya', last: 'Gorantla', parent: 'Chowdary Gorantla', rel: 'Father', prefix: '944068' },
  { first: 'Jyothi', last: 'Chukkapalli', parent: 'Pullaiah Chukkapalli', rel: 'Father', prefix: '944069' },

  { first: 'Kalyani', last: 'Kaza', parent: 'Brahmaji Kaza', rel: 'Father', prefix: '944070' },
  { first: 'Lavanya', last: 'Pinnamaneni', parent: 'Syamala Pinnamaneni', rel: 'Mother', prefix: '944071' },
  { first: 'Madhuri', last: 'Jagarlamudi', parent: 'Gopal Jagarlamudi', rel: 'Father', prefix: '944072' },
  { first: 'Neha', last: 'Parvataneni', parent: 'Ravi Parvataneni', rel: 'Father', prefix: '944073' },
  { first: 'Pallavi', last: 'Rayapati', parent: 'Sambasiva Rayapati', rel: 'Father', prefix: '944074' },
  { first: 'Ramya', last: 'Kakarla', parent: 'Mallikarjuna Kakarla', rel: 'Father', prefix: '944075' },
  { first: 'Sai Pallavi', last: 'Kasaraneni', parent: 'Somaiah Kasaraneni', rel: 'Father', prefix: '944076' },
  { first: 'Taruni', last: 'Atluri', parent: 'Venugopal Atluri', rel: 'Father', prefix: '944077' },
  { first: 'Usha', last: 'Anne', parent: 'Sudheer Anne', rel: 'Father', prefix: '944078' },
  { first: 'Veda', last: 'Muppalla', parent: 'Prasad Muppalla', rel: 'Father', prefix: '944079' },
];

// 70 Unique Indian Boys
const BOY_PROFILES = [
  { first: 'Aarav', last: 'Sharma', parent: 'Mukesh Sharma', rel: 'Father', prefix: '944110' },
  { first: 'Rohan', last: 'Reddy', parent: 'G. Sudhakar Reddy', rel: 'Father', prefix: '944111' },
  { first: 'Aditya', last: 'Patel', parent: 'Bhavin Patel', rel: 'Father', prefix: '944112' },
  { first: 'Nikhil', last: 'Iyer', parent: 'Sundaram Iyer', rel: 'Father', prefix: '944113' },
  { first: 'Vikram', last: 'Verma', parent: 'Ashok Verma', rel: 'Father', prefix: '944114' },
  { first: 'Arjun', last: 'Nair', parent: 'Gopinath Nair', rel: 'Father', prefix: '944115' },
  { first: 'Sai', last: 'Joshi', parent: 'Sharad Joshi', rel: 'Father', prefix: '944116' },
  { first: 'Varun', last: 'Rao', parent: 'Prabhakar Rao', rel: 'Father', prefix: '944117' },
  { first: 'Karthik', last: 'Choudhury', parent: 'Debashis Choudhury', rel: 'Father', prefix: '944118' },
  { first: 'Rahul', last: 'Nambiar', parent: 'Unnikrishnan Nambiar', rel: 'Father', prefix: '944119' },

  { first: 'Pranav', last: 'Kulkarni', parent: 'Milind Kulkarni', rel: 'Father', prefix: '944120' },
  { first: 'Abhinav', last: 'Menon', parent: 'Ravindran Menon', rel: 'Father', prefix: '944121' },
  { first: 'Tarun', last: 'Varma', parent: 'Bhupathi Varma', rel: 'Father', prefix: '944122' },
  { first: 'Harsha', last: 'Goud', parent: 'Mallesh Goud', rel: 'Father', prefix: '944123' },
  { first: 'Siddharth', last: 'Chary', parent: 'Lingamurthy Chary', rel: 'Father', prefix: '944124' },
  { first: 'Akhil', last: 'Potluri', parent: 'Nageswara Rao Potluri', rel: 'Father', prefix: '944125' },
  { first: 'Vignesh', last: 'Bollineni', parent: 'Prasad Bollineni', rel: 'Father', prefix: '944126' },
  { first: 'Charan', last: 'Sastry', parent: 'Gopalakrishna Sastry', rel: 'Father', prefix: '944127' },
  { first: 'Kalyan', last: 'Kompella', parent: 'Viswanadham Kompella', rel: 'Father', prefix: '944128' },
  { first: 'Hemanth', last: 'Dendukuri', parent: 'Somaraju Dendukuri', rel: 'Father', prefix: '944129' },

  { first: 'Vivek', last: 'Bhat', parent: 'Ananth Bhat', rel: 'Father', prefix: '944130' },
  { first: 'Rishikesh', last: 'Iyengar', parent: 'Srinivasan Iyengar', rel: 'Father', prefix: '944131' },
  { first: 'Arvind', last: 'Pillai', parent: 'Narayana Pillai', rel: 'Father', prefix: '944132' },
  { first: 'Manas', last: 'Gundlapally', parent: 'Srihari Gundlapally', rel: 'Father', prefix: '944133' },
  { first: 'Sumanth', last: 'Alapati', parent: 'Hanumantha Rao Alapati', rel: 'Father', prefix: '944134' },
  { first: 'Sandeep', last: 'Kamineni', parent: 'Jagannadham Kamineni', rel: 'Father', prefix: '944135' },
  { first: 'Rakesh', last: 'Jonnalagadda', parent: 'Subba Rao Jonnalagadda', rel: 'Father', prefix: '944136' },
  { first: 'Teja', last: 'Devineni', parent: 'Appa Rao Devineni', rel: 'Father', prefix: '944137' },
  { first: 'Lokesh', last: 'Velagapudi', parent: 'Koteswara Rao Velagapudi', rel: 'Father', prefix: '944138' },
  { first: 'Madhav', last: 'Penmetsa', parent: 'Bangarraju Penmetsa', rel: 'Father', prefix: '944139' },

  { first: 'Nithin', last: 'Yalamanchili', parent: 'Ramanjaneyulu Yalamanchili', rel: 'Father', prefix: '944140' },
  { first: 'Pavan', last: 'Nallapati', parent: 'Chandramouli Nallapati', rel: 'Father', prefix: '944141' },
  { first: 'Chiranjeevi', last: 'Gadiraju', parent: 'Gopalaraju Gadiraju', rel: 'Father', prefix: '944142' },
  { first: 'Bharath', last: 'Cherukuri', parent: 'Sadasiva Rao Cherukuri', rel: 'Father', prefix: '944143' },
  { first: 'Gautam', last: 'Maganti', parent: 'Rammohan Maganti', rel: 'Father', prefix: '944144' },
  { first: 'Surya', last: 'Kanumuri', parent: 'Kanakaraju Kanumuri', rel: 'Father', prefix: '944145' },
  { first: 'Yashwanth', last: 'Sagi', parent: 'Satyanarayanaraju Sagi', rel: 'Father', prefix: '944146' },
  { first: 'Chetan', last: 'Dantuluri', parent: 'Ramaraju Dantuluri', rel: 'Father', prefix: '944147' },
  { first: 'Manoj', last: 'Datla', parent: 'Venkataraju Datla', rel: 'Father', prefix: '944148' },
  { first: 'Rajesh', last: 'Bhupatiraju', parent: 'Pattabhiramaraju Bhupatiraju', rel: 'Father', prefix: '944149' },

  { first: 'Vinay', last: 'Alluri', parent: 'Subbaraju Alluri', rel: 'Father', prefix: '944150' },
  { first: 'Anirudh', last: 'Uddaraju', parent: 'Krishnamraju Uddaraju', rel: 'Father', prefix: '944151' },
  { first: 'Santosh', last: 'Penumatsa', parent: 'Suryanarayanaraju Penumatsa', rel: 'Father', prefix: '944152' },
  { first: 'Kishore', last: 'Indukuri', parent: 'Jagapathiraju Indukuri', rel: 'Father', prefix: '944153' },
  { first: 'Naresh', last: 'Kalidindi', parent: 'Dharmaraju Kalidindi', rel: 'Father', prefix: '944154' },
  { first: 'Bhargav', last: 'Gottumukkala', parent: 'Viswanadharaju Gottumukkala', rel: 'Father', prefix: '944155' },
  { first: 'Ajay', last: 'Rudraraju', parent: 'Appalaraju Rudraraju', rel: 'Father', prefix: '944156' },
  { first: 'Dinesh', last: 'Vegesna', parent: 'Rudraraju Vegesna', rel: 'Father', prefix: '944157' },
  { first: 'Raghu', last: 'Vatsavai', parent: 'Harischandraraju Vatsavai', rel: 'Father', prefix: '944158' },
  { first: 'Prashanth', last: 'Byrraju', parent: 'Chitti Raju Byrraju', rel: 'Father', prefix: '944159' },

  { first: 'Naveen', last: 'Mantena', parent: 'Bhadradriraju Mantena', rel: 'Father', prefix: '944160' },
  { first: 'Rohit', last: 'Chintalapati', parent: 'Sriramaraju Chintalapati', rel: 'Father', prefix: '944161' },
  { first: 'Harish', last: 'Nandyala', parent: 'Ramabhadraiah Nandyala', rel: 'Father', prefix: '944162' },
  { first: 'Manikanta', last: 'Sunkara', parent: 'Tirupataiah Sunkara', rel: 'Father', prefix: '944163' },
  { first: 'Sharath', last: 'Ravipati', parent: 'Kotireddy Ravipati', rel: 'Father', prefix: '944164' },
  { first: 'Kiran', last: 'Tatineni', parent: 'Narasimha Rao Tatineni', rel: 'Father', prefix: '944165' },
  { first: 'Deepak', last: 'Gorantla', parent: 'Sivaramakrishna Gorantla', rel: 'Father', prefix: '944166' },
  { first: 'Mahesh', last: 'Chukkapalli', parent: 'Kasi Viswanadham Chukkapalli', rel: 'Father', prefix: '944167' },
  { first: 'Sudheer', last: 'Kaza', parent: 'Venkataratnam Kaza', rel: 'Father', prefix: '944168' },
  { first: 'Venkatesh', last: 'Pinnamaneni', parent: 'Balagangadhara Pinnamaneni', rel: 'Father', prefix: '944169' },

  { first: 'Jagadish', last: 'Jagarlamudi', parent: 'Durgaprasad Jagarlamudi', rel: 'Father', prefix: '944170' },
  { first: 'Srikanth', last: 'Parvataneni', parent: 'Seetharamaraju Parvataneni', rel: 'Father', prefix: '944171' },
  { first: 'Tarun Kumar', last: 'Rayapati', parent: 'Subrahmanyam Rayapati', rel: 'Father', prefix: '944172' },
  { first: 'Vijay', last: 'Kakarla', parent: 'Govardhana Rao Kakarla', rel: 'Father', prefix: '944173' },
  { first: 'Shashank', last: 'Kasaraneni', parent: 'Lakshminarayana Kasaraneni', rel: 'Father', prefix: '944174' },
  { first: 'Krishna', last: 'Atluri', parent: 'Chiranjeevi Rao Atluri', rel: 'Father', prefix: '944175' },
  { first: 'Madhu', last: 'Anne', parent: 'Nagendra Rao Anne', rel: 'Father', prefix: '944176' },
  { first: 'Sai Krishna', last: 'Potluri', parent: 'Chandra Mouli Potluri', rel: 'Father', prefix: '944177' },
  { first: 'Hemant', last: 'Varma', parent: 'Vijayarama Gajapathi Varma', rel: 'Father', prefix: '944178' },
  { first: 'Praveen', last: 'Reddy', parent: 'Chandra Reddy', rel: 'Father', prefix: '944179' },
];

async function seed() {
  console.log('================================================================');
  console.log('VID Platform: Grade & Section Complete Student & Guardian Seeder');
  console.log('================================================================\n');

  // 1. Normalize Grade-1 to Grade 1
  await db.query(`
    UPDATE classes 
    SET name = 'Grade 1' 
    WHERE institution_id = $1 AND name = 'Grade-1'
  `, [INSTITUTION_ID]);
  console.log(' Normalized Grade 1 naming.');

  // 2. Fetch or create classes Grade 1 to Grade 10
  const gradeDefs = [
    { name: 'Grade 1', seq: 1 },
    { name: 'Grade 2', seq: 2 },
    { name: 'Grade 3', seq: 3 },
    { name: 'Grade 4', seq: 4 },
    { name: 'Grade 5', seq: 5 },
    { name: 'Grade 6', seq: 6 },
    { name: 'Grade 7', seq: 7 },
    { name: 'Grade 8', seq: 8 },
    { name: 'Grade 9', seq: 9 },
    { name: 'Grade 10', seq: 10 },
  ];

  const classMap: Record<string, string> = {};

  for (const gd of gradeDefs) {
    const existing = await db.query(
      `SELECT id FROM classes WHERE institution_id = $1 AND name = $2`,
      [INSTITUTION_ID, gd.name]
    );

    if (existing.rows.length > 0) {
      classMap[gd.name] = existing.rows[0].id;
    } else {
      const newClassId = uuidv4();
      await db.query(`
        INSERT INTO classes (id, institution_id, academic_year_id, department_id, name, sequence_order, capacity, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [newClassId, INSTITUTION_ID, CURRENT_ACADEMIC_YEAR_ID, DEFAULT_DEPT_ID, gd.name, gd.seq, 80]);
      classMap[gd.name] = newClassId;
      console.log(` Created Class: ${gd.name} (${newClassId})`);
    }
  }

  // 3. Ensure Section A and Section B exist for every grade
  const sectionMap: Record<string, { secA: string; secB: string }> = {};

  for (const gd of gradeDefs) {
    const classId = classMap[gd.name];
    let secAId = '';
    let secBId = '';

    for (const secName of ['Section A', 'Section B']) {
      const existingSec = await db.query(
        `SELECT id FROM sections WHERE institution_id = $1 AND class_id = $2 AND name = $3`,
        [INSTITUTION_ID, classId, secName]
      );

      if (existingSec.rows.length > 0) {
        if (secName === 'Section A') secAId = existingSec.rows[0].id;
        else secBId = existingSec.rows[0].id;
      } else {
        const newSecId = uuidv4();
        await db.query(`
          INSERT INTO sections (id, institution_id, class_id, name, capacity, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [newSecId, INSTITUTION_ID, classId, secName, 40]);
        console.log(` Created Section: ${gd.name} - ${secName} (${newSecId})`);
        if (secName === 'Section A') secAId = newSecId;
        else secBId = newSecId;
      }
    }
    sectionMap[gd.name] = { secA: secAId, secB: secBId };
  }

  // 4. Target sections that need students seeded
  const targetSections = [
    { grade: 'Grade 2', sec: 'Section B', secId: sectionMap['Grade 2'].secB, gradeNum: 2 },
    { grade: 'Grade 3', sec: 'Section A', secId: sectionMap['Grade 3'].secA, gradeNum: 3 },
    { grade: 'Grade 3', sec: 'Section B', secId: sectionMap['Grade 3'].secB, gradeNum: 3 },
    { grade: 'Grade 4', sec: 'Section A', secId: sectionMap['Grade 4'].secA, gradeNum: 4 },
    { grade: 'Grade 4', sec: 'Section B', secId: sectionMap['Grade 4'].secB, gradeNum: 4 },
    { grade: 'Grade 5', sec: 'Section A', secId: sectionMap['Grade 5'].secA, gradeNum: 5 },
    { grade: 'Grade 5', sec: 'Section B', secId: sectionMap['Grade 5'].secB, gradeNum: 5 },
  ];

  // 5. Ensure Fee Group and Fee Structure exist
  let feeGroupId = '';
  const fgRes = await db.query(`SELECT id FROM fee_groups WHERE institution_id = $1 LIMIT 1`, [INSTITUTION_ID]);
  if (fgRes.rows.length > 0) {
    feeGroupId = fgRes.rows[0].id;
  } else {
    feeGroupId = uuidv4();
    await db.query(`INSERT INTO fee_groups (id, institution_id, name, created_at) VALUES ($1, $2, 'General Tuition & Operations', NOW())`, [feeGroupId, INSTITUTION_ID]);
  }

  let feeStructureId = '';
  const fsRes = await db.query(`SELECT id FROM fee_structures WHERE institution_id = $1 LIMIT 1`, [INSTITUTION_ID]);
  if (fsRes.rows.length > 0) {
    feeStructureId = fsRes.rows[0].id;
  } else {
    feeStructureId = uuidv4();
    await db.query(`
      INSERT INTO fee_structures (id, institution_id, fee_group_id, academic_year_id, name, created_at)
      VALUES ($1, $2, $3, $4, 'Standard Annual Tuition 2026-27', NOW())
    `, [feeStructureId, INSTITUTION_ID, feeGroupId, CURRENT_ACADEMIC_YEAR_ID]);
  }

  // 6. Get exam subjects for marks insertion
  const esRes = await db.query(`
    SELECT es.id, s.name as subject_name
    FROM exam_subjects es
    JOIN subjects s ON s.id = es.subject_id
    WHERE es.exam_id = 'a5142d36-43c3-4ddc-a391-eecd16af6f79'
  `);
  const mathExamSubjectId = esRes.rows.find(r => r.subject_name.toLowerCase().includes('math'))?.id || esRes.rows[0].id;
  const sciExamSubjectId = esRes.rows.find(r => r.subject_name.toLowerCase().includes('science'))?.id || esRes.rows[1].id;
  const engExamSubjectId = esRes.rows.find(r => r.subject_name.toLowerCase().includes('english'))?.id || esRes.rows[2].id;
  const sstExamSubjectId = esRes.rows.find(r => r.subject_name.toLowerCase().includes('social'))?.id || esRes.rows[3].id;

  // Prepare batch arrays
  const studentsToInsert: any[] = [];
  const guardiansToInsert: any[] = [];
  const studentGuardiansToInsert: any[] = [];
  const marksToInsert: any[] = [];
  const sessionsToInsert: any[] = [];
  const attendanceToInsert: any[] = [];
  const studentFeesToInsert: any[] = [];

  let globalStudentIndex = 0;
  let admSeq = 501;

  for (const target of targetSections) {
    console.log(`Preparing records for ${target.grade} - ${target.sec}...`);
    const classId = classMap[target.grade];

    // Check if section already has students
    const existingCountRes = await db.query(
      `SELECT count(*) FROM students WHERE institution_id = $1 AND current_section_id = $2`,
      [INSTITUTION_ID, target.secId]
    );
    const existingCount = parseInt(existingCountRes.rows[0].count, 10);
    if (existingCount >= 20) {
      console.log(` Section ${target.grade} - ${target.sec} already has ${existingCount} students. Skipping.`);
      continue;
    }

    // Attendance sessions (25 sessions per section)
    const sessionIds: string[] = [];
    for (let day = 1; day <= 25; day++) {
      const sessionId = uuidv4();
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const sessionDate = `2026-09-${dayStr}`;
      sessionsToInsert.push({
        id: sessionId,
        institution_id: INSTITUTION_ID,
        section_id: target.secId,
        session_date: sessionDate,
        period_number: 1,
      });
      sessionIds.push(sessionId);
    }

    // 10 Girls
    for (let g = 0; g < 10; g++) {
      const pIdx = (globalStudentIndex * 10 + g) % GIRL_PROFILES.length;
      const prof = GIRL_PROFILES[pIdx];
      const studentId = uuidv4();
      const guardianId = uuidv4();
      const admNum = `SIA-2026-${String(admSeq++).padStart(4, '0')}`;
      const rollNum = String(g + 1);
      const birthYear = 2026 - (target.gradeNum + 5);
      const month = String((g % 9) + 3).padStart(2, '0');
      const day = String(10 + (g % 15)).padStart(2, '0');
      const dob = `${birthYear}-${month}-${day}`;
      const phone = `+91${prof.prefix}${String(1000 + g).slice(-4)}`;
      const email = `parent.${admNum.toLowerCase()}@vidforum.edu`;

      studentsToInsert.push({
        id: studentId,
        institution_id: INSTITUTION_ID,
        admission_number: admNum,
        roll_number: rollNum,
        first_name: prof.first,
        last_name: prof.last,
        date_of_birth: dob,
        gender: 'female',
        current_class_id: classId,
        current_section_id: target.secId,
        status: 'active',
        blood_group: 'B+',
        nationality: 'Indian',
        mother_tongue: 'Telugu',
        religion: 'Hindu',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
        address_line1: 'Flat 402, Sri Sai Residency, Madhapur',
        emergency_contact: prof.parent,
        emergency_phone: phone,
      });

      guardiansToInsert.push({
        id: guardianId,
        institution_id: INSTITUTION_ID,
        full_name: prof.parent,
        relationship: prof.rel,
        phone: phone,
        email: email,
        preferred_language: 'te-IN',
        do_not_call: false,
      });

      studentGuardiansToInsert.push({
        student_id: studentId,
        guardian_id: guardianId,
        relationship: prof.rel,
        is_primary_contact: true,
      });

      marksToInsert.push(
        { id: uuidv4(), institution_id: INSTITUTION_ID, exam_subject_id: mathExamSubjectId, student_id: studentId, marks_obtained: 85 + (g % 14) },
        { id: uuidv4(), institution_id: INSTITUTION_ID, exam_subject_id: sciExamSubjectId, student_id: studentId, marks_obtained: 82 + (g % 16) },
        { id: uuidv4(), institution_id: INSTITUTION_ID, exam_subject_id: engExamSubjectId, student_id: studentId, marks_obtained: 88 + (g % 10) },
        { id: uuidv4(), institution_id: INSTITUTION_ID, exam_subject_id: sstExamSubjectId, student_id: studentId, marks_obtained: 80 + (g % 18) }
      );

      for (let sIdx = 0; sIdx < sessionIds.length; sIdx++) {
        const isPresent = sIdx !== 12;
        attendanceToInsert.push({
          id: uuidv4(),
          institution_id: INSTITUTION_ID,
          session_id: sessionIds[sIdx],
          student_id: studentId,
          status: isPresent ? 'present' : 'absent',
          source: 'manual',
          is_final: true,
          remarks: 'Daily Roll Call',
        });
      }

      studentFeesToInsert.push({
        id: uuidv4(),
        institution_id: INSTITUTION_ID,
        student_id: studentId,
        fee_structure_id: feeStructureId,
        academic_year_id: CURRENT_ACADEMIC_YEAR_ID,
        total_amount: 65000.00,
        balance_due: 15000.00,
      });
    }

    // 10 Boys
    for (let b = 0; b < 10; b++) {
      const pIdx = (globalStudentIndex * 10 + b) % BOY_PROFILES.length;
      const prof = BOY_PROFILES[pIdx];
      const studentId = uuidv4();
      const guardianId = uuidv4();
      const admNum = `SIA-2026-${String(admSeq++).padStart(4, '0')}`;
      const rollNum = String(b + 11);
      const birthYear = 2026 - (target.gradeNum + 5);
      const month = String((b % 9) + 3).padStart(2, '0');
      const day = String(10 + (b % 15)).padStart(2, '0');
      const dob = `${birthYear}-${month}-${day}`;
      const phone = `+91${prof.prefix}${String(2000 + b).slice(-4)}`;
      const email = `parent.${admNum.toLowerCase()}@vidforum.edu`;

      studentsToInsert.push({
        id: studentId,
        institution_id: INSTITUTION_ID,
        admission_number: admNum,
        roll_number: rollNum,
        first_name: prof.first,
        last_name: prof.last,
        date_of_birth: dob,
        gender: 'male',
        current_class_id: classId,
        current_section_id: target.secId,
        status: 'active',
        blood_group: 'O+',
        nationality: 'Indian',
        mother_tongue: 'Telugu',
        religion: 'Hindu',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
        address_line1: 'Plot 18, Kakatiya Hills, Jubilee Hills Road',
        emergency_contact: prof.parent,
        emergency_phone: phone,
      });

      guardiansToInsert.push({
        id: guardianId,
        institution_id: INSTITUTION_ID,
        full_name: prof.parent,
        relationship: prof.rel,
        phone: phone,
        email: email,
        preferred_language: 'te-IN',
        do_not_call: false,
      });

      studentGuardiansToInsert.push({
        student_id: studentId,
        guardian_id: guardianId,
        relationship: prof.rel,
        is_primary_contact: true,
      });

      marksToInsert.push(
        { id: uuidv4(), institution_id: INSTITUTION_ID, exam_subject_id: mathExamSubjectId, student_id: studentId, marks_obtained: 86 + (b % 14) },
        { id: uuidv4(), institution_id: INSTITUTION_ID, exam_subject_id: sciExamSubjectId, student_id: studentId, marks_obtained: 84 + (b % 15) },
        { id: uuidv4(), institution_id: INSTITUTION_ID, exam_subject_id: engExamSubjectId, student_id: studentId, marks_obtained: 87 + (b % 11) },
        { id: uuidv4(), institution_id: INSTITUTION_ID, exam_subject_id: sstExamSubjectId, student_id: studentId, marks_obtained: 82 + (b % 16) }
      );

      for (let sIdx = 0; sIdx < sessionIds.length; sIdx++) {
        const isPresent = sIdx !== 5 && sIdx !== 19;
        attendanceToInsert.push({
          id: uuidv4(),
          institution_id: INSTITUTION_ID,
          session_id: sessionIds[sIdx],
          student_id: studentId,
          status: isPresent ? 'present' : 'absent',
          source: 'manual',
          is_final: true,
          remarks: 'Daily Roll Call',
        });
      }

      studentFeesToInsert.push({
        id: uuidv4(),
        institution_id: INSTITUTION_ID,
        student_id: studentId,
        fee_structure_id: feeStructureId,
        academic_year_id: CURRENT_ACADEMIC_YEAR_ID,
        total_amount: 65000.00,
        balance_due: 15000.00,
      });
    }

    globalStudentIndex++;
  }

  // Helper for batch execution
  async function batchInsert(tableName: string, rows: any[], columns: string[], chunkSize = 100) {
    if (rows.length === 0) return;
    console.log(`Inserting ${rows.length} rows into ${tableName} (chunk size: ${chunkSize})...`);
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const valuesSql: string[] = [];
      const params: any[] = [];
      let pIdx = 1;

      for (const row of chunk) {
        const rowPlaceholders = columns.map(c => {
          params.push(row[c]);
          return `$${pIdx++}`;
        });
        valuesSql.push(`(${rowPlaceholders.join(', ')})`);
      }

      const sql = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES ${valuesSql.join(', ')}
        ON CONFLICT DO NOTHING
      `;
      await db.query(sql, params);
    }
  }

  console.log('\n--- Commencing Ultra-Fast Bulk Database Insertion ---');

  // 1. Sessions
  await batchInsert('attendance_sessions', sessionsToInsert, [
    'id', 'institution_id', 'section_id', 'session_date', 'period_number'
  ], 100);

  // 2. Students
  await batchInsert('students', studentsToInsert, [
    'id', 'institution_id', 'admission_number', 'roll_number', 'first_name', 'last_name',
    'date_of_birth', 'gender', 'current_class_id', 'current_section_id', 'status',
    'blood_group', 'nationality', 'mother_tongue', 'religion', 'city', 'state', 'pincode',
    'address_line1', 'emergency_contact', 'emergency_phone'
  ], 50);

  // 3. Guardians
  await batchInsert('guardians', guardiansToInsert, [
    'id', 'institution_id', 'full_name', 'relationship', 'phone', 'email', 'preferred_language', 'do_not_call'
  ], 50);

  // 4. Student Guardians
  await batchInsert('student_guardians', studentGuardiansToInsert, [
    'student_id', 'guardian_id', 'relationship', 'is_primary_contact'
  ], 100);

  // 5. Marks
  await batchInsert('marks', marksToInsert, [
    'id', 'institution_id', 'exam_subject_id', 'student_id', 'marks_obtained'
  ], 100);

  // 6. Attendance Records
  await batchInsert('attendance_records', attendanceToInsert, [
    'id', 'institution_id', 'session_id', 'student_id', 'status', 'source', 'is_final', 'remarks'
  ], 200);

  // 7. Student Fees
  await batchInsert('student_fees', studentFeesToInsert, [
    'id', 'institution_id', 'student_id', 'fee_structure_id', 'academic_year_id', 'total_amount', 'balance_due'
  ], 100);

  // 8. Add baseline fee for any remaining students
  const missingFeeStudents = await db.query(`
    SELECT s.id
    FROM students s
    LEFT JOIN student_fees sf ON sf.student_id = s.id
    WHERE s.institution_id = $1 AND sf.id IS NULL
  `, [INSTITUTION_ID]);

  if (missingFeeStudents.rows.length > 0) {
    console.log(`Adding fee records for ${missingFeeStudents.rows.length} remaining students...`);
    const remainingFees = missingFeeStudents.rows.map(st => ({
      id: uuidv4(),
      institution_id: INSTITUTION_ID,
      student_id: st.id,
      fee_structure_id: feeStructureId,
      academic_year_id: CURRENT_ACADEMIC_YEAR_ID,
      total_amount: 65000.00,
      balance_due: 15000.00,
    }));
    await batchInsert('student_fees', remainingFees, [
      'id', 'institution_id', 'student_id', 'fee_structure_id', 'academic_year_id', 'total_amount', 'balance_due'
    ], 100);
  }

  console.log('\n================================================================');
  console.log('Seeding Complete! Running Audit Verification...');
  console.log('================================================================\n');

  const finalAudit = await db.query(`
    SELECT 
      c.name as class_name, 
      s.name as section_name, 
      count(st.id) as total_students,
      count(st.id) filter (where st.gender = 'female') as girls,
      count(st.id) filter (where st.gender = 'male') as boys,
      count(g.id) filter (where g.phone IS NOT NULL AND g.phone != '') as guardians_with_phone
    FROM classes c
    JOIN sections s ON s.class_id = c.id
    LEFT JOIN students st ON st.current_section_id = s.id
    LEFT JOIN student_guardians sg ON sg.student_id = st.id
    LEFT JOIN guardians g ON g.id = sg.guardian_id
    WHERE c.institution_id = $1
    GROUP BY c.name, s.name, c.sequence_order
    ORDER BY c.sequence_order, s.name
  `, [INSTITUTION_ID]);

  console.table(finalAudit.rows);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
