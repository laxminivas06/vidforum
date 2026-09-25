import { db } from '../../config/database';

export class FinanceRepository {
  async findFeeRecordsByInstitution(institutionId: string) {
    const query = `
      SELECT 
        sf.id,
        s.id as "studentId",
        (s.first_name || ' ' || s.last_name) as "studentName",
        s.admission_number as "rollNumber",
        (c.name || '-' || sec.name) as "gradeSection",
        COALESCE(i.invoice_number, 'INV-2026-PENDING') as "invoiceNumber",
        ay.name as term,
        sf.total_amount as "totalAmount",
        (sf.total_amount - sf.balance_due) as "paidAmount",
        sf.balance_due as "balanceAmount",
        COALESCE(to_char(i.due_date, 'YYYY-MM-DD'), '2026-10-15') as "dueDate",
        CASE 
          WHEN sf.balance_due = 0 THEN 'PAID'
          WHEN sf.balance_due < sf.total_amount THEN 'PARTIAL'
          ELSE 'PENDING'
        END as status
      FROM student_fees sf
      JOIN students s ON s.id = sf.student_id
      JOIN classes c ON c.id = s.current_class_id
      JOIN sections sec ON sec.id = s.current_section_id
      JOIN academic_years ay ON ay.id = sf.academic_year_id
      LEFT JOIN invoices i ON i.student_fee_id = sf.id
      WHERE sf.institution_id = $1
      ORDER BY sf.created_at DESC
    `;
    const res = await db.query(query, [institutionId]);
    return res.rows;
  }

  async recordPayment(
    invoiceId: string,
    studentId: string,
    amount: number,
    method: string,
    receivedBy: string,
    receiptNumber: string
  ) {
    const res = await db.query(
      'SELECT record_payment($1, $2, $3, $4::payment_method, $5, $6) as payment_id',
      [invoiceId, studentId, amount, method.toLowerCase(), receivedBy, receiptNumber]
    );
    return res.rows[0]?.payment_id;
  }

  async getSummary(institutionId: string) {
    const res = await db.query(
      `SELECT 
         COALESCE(sum(total_amount), 0) as "totalReceivable",
         COALESCE(sum(total_amount - balance_due), 0) as "totalCollected",
         COALESCE(sum(balance_due), 0) as "totalPending",
         count(*) filter (where balance_due = 0) as "fullyPaidCount",
         count(*) filter (where balance_due > 0) as "pendingCount"
       FROM student_fees
       WHERE institution_id = $1`,
      [institutionId]
    );
    return res.rows[0];
  }
}

export const financeRepository = new FinanceRepository();
