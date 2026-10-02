import { db } from '../../config/database';

export interface FeeCategoryData {
  id: string;
  institutionId: string;
  name: string;
  createdAt: string;
}

export interface FeeGroupData {
  id: string;
  institutionId: string;
  name: string;
  createdAt: string;
}

export interface FeeStructureItemData {
  id: string;
  feeStructureId: string;
  feeCategoryId: string;
  categoryName?: string;
  amount: number;
}

export interface FeeStructureData {
  id: string;
  institutionId: string;
  feeGroupId: string;
  academicYearId: string;
  classId?: string | null;
  name: string;
  createdAt: string;
  feeGroupName?: string;
  academicYearName?: string;
  className?: string;
  items?: FeeStructureItemData[];
  totalAmount?: number;
}

export interface StudentFeeData {
  id: string;
  institutionId: string;
  studentId: string;
  feeStructureId: string;
  academicYearId: string;
  totalAmount: number;
  balanceDue: number;
  createdAt: string;
  studentName?: string;
  admissionNumber?: string;
  className?: string;
  sectionName?: string;
  feeStructureName?: string;
  status?: 'PAID' | 'PARTIAL' | 'PENDING';
}

export interface InvoiceData {
  id: string;
  institutionId: string;
  studentFeeId: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  dueDate?: string | null;
  issuedAt: string;
  studentId?: string;
  studentName?: string;
  admissionNumber?: string;
  items?: any[];
  payments?: any[];
}

export interface PaymentData {
  id: string;
  institutionId: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  method: string;
  status: string;
  receivedBy?: string | null;
  paidAt: string;
  receiptNumber?: string;
  studentName?: string;
  invoiceNumber?: string;
}

export class FinanceRepository {
  // ================= FEE CATEGORIES & GROUPS =================
  async listFeeCategories(institutionId: string): Promise<FeeCategoryData[]> {
    const res = await db.query(
      `SELECT id, institution_id as "institutionId", name, created_at as "createdAt"
       FROM fee_categories
       WHERE institution_id = $1
       ORDER BY name ASC`,
      [institutionId]
    );
    return res.rows;
  }

  async createFeeCategory(institutionId: string, name: string): Promise<FeeCategoryData> {
    const res = await db.query(
      `INSERT INTO fee_categories (institution_id, name)
       VALUES ($1, $2)
       RETURNING id, institution_id as "institutionId", name, created_at as "createdAt"`,
      [institutionId, name.trim()]
    );
    return res.rows[0];
  }

  async listFeeGroups(institutionId: string): Promise<FeeGroupData[]> {
    const res = await db.query(
      `SELECT id, institution_id as "institutionId", name, created_at as "createdAt"
       FROM fee_groups
       WHERE institution_id = $1
       ORDER BY name ASC`,
      [institutionId]
    );
    return res.rows;
  }

  async createFeeGroup(institutionId: string, name: string): Promise<FeeGroupData> {
    const res = await db.query(
      `INSERT INTO fee_groups (institution_id, name)
       VALUES ($1, $2)
       RETURNING id, institution_id as "institutionId", name, created_at as "createdAt"`,
      [institutionId, name.trim()]
    );
    return res.rows[0];
  }

  // ================= FEE STRUCTURES & ITEMS =================
  async listFeeStructures(institutionId: string, filters?: { academicYearId?: string; classId?: string; feeGroupId?: string }): Promise<FeeStructureData[]> {
    let query = `
      SELECT fs.id, fs.institution_id as "institutionId", fs.fee_group_id as "feeGroupId",
             fs.academic_year_id as "academicYearId", fs.class_id as "classId", fs.name,
             fs.created_at as "createdAt",
             fg.name as "feeGroupName",
             ay.name as "academicYearName",
             c.name as "className",
             COALESCE(sum(fsi.amount), 0) as "totalAmount"
      FROM fee_structures fs
      JOIN fee_groups fg ON fg.id = fs.fee_group_id
      JOIN academic_years ay ON ay.id = fs.academic_year_id
      LEFT JOIN classes c ON c.id = fs.class_id
      LEFT JOIN fee_structure_items fsi ON fsi.fee_structure_id = fs.id
      WHERE fs.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (filters?.academicYearId) {
      params.push(filters.academicYearId);
      query += ` AND fs.academic_year_id = $${params.length}`;
    }
    if (filters?.classId) {
      params.push(filters.classId);
      query += ` AND fs.class_id = $${params.length}`;
    }
    if (filters?.feeGroupId) {
      params.push(filters.feeGroupId);
      query += ` AND fs.fee_group_id = $${params.length}`;
    }

    query += ' GROUP BY fs.id, fg.name, ay.name, c.name ORDER BY fs.created_at DESC';
    const res = await db.query(query, params);
    return res.rows.map((row) => ({
      ...row,
      totalAmount: parseFloat(row.totalAmount || '0'),
    }));
  }

  async getFeeStructureById(institutionId: string, id: string): Promise<FeeStructureData | null> {
    const headerRes = await db.query(
      `SELECT fs.id, fs.institution_id as "institutionId", fs.fee_group_id as "feeGroupId",
              fs.academic_year_id as "academicYearId", fs.class_id as "classId", fs.name,
              fs.created_at as "createdAt",
              fg.name as "feeGroupName",
              ay.name as "academicYearName",
              c.name as "className"
       FROM fee_structures fs
       JOIN fee_groups fg ON fg.id = fs.fee_group_id
       JOIN academic_years ay ON ay.id = fs.academic_year_id
       LEFT JOIN classes c ON c.id = fs.class_id
       WHERE fs.institution_id = $1 AND fs.id = $2`,
      [institutionId, id]
    );
    if (headerRes.rows.length === 0) return null;

    const itemsRes = await db.query(
      `SELECT fsi.id, fsi.fee_structure_id as "feeStructureId", fsi.fee_category_id as "feeCategoryId",
              fc.name as "categoryName", fsi.amount::float as amount
       FROM fee_structure_items fsi
       JOIN fee_categories fc ON fc.id = fsi.fee_category_id
       WHERE fsi.fee_structure_id = $1
       ORDER BY fc.name ASC`,
      [id]
    );

    const totalAmount = itemsRes.rows.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    return {
      ...headerRes.rows[0],
      items: itemsRes.rows,
      totalAmount,
    };
  }

  async createFeeStructure(institutionId: string, data: {
    name: string;
    feeGroupId: string;
    academicYearId: string;
    classId?: string | null;
    items: Array<{ feeCategoryId: string; amount: number }>;
  }): Promise<FeeStructureData> {
    return await db.transaction(async (client) => {
      const headerRes = await client.query(
        `INSERT INTO fee_structures (institution_id, fee_group_id, academic_year_id, class_id, name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, institution_id as "institutionId", fee_group_id as "feeGroupId",
                   academic_year_id as "academicYearId", class_id as "classId", name, created_at as "createdAt"`,
        [institutionId, data.feeGroupId, data.academicYearId, data.classId || null, data.name.trim()]
      );
      const structure = headerRes.rows[0];

      let total = 0;
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await client.query(
            `INSERT INTO fee_structure_items (fee_structure_id, fee_category_id, amount)
             VALUES ($1, $2, $3)`,
            [structure.id, item.feeCategoryId, item.amount]
          );
          total += Number(item.amount);
        }
      }

      return {
        ...structure,
        totalAmount: total,
      };
    });
  }

  // ================= DISCOUNTS & SCHOLARSHIPS =================
  async listDiscounts(institutionId: string) {
    const res = await db.query(
      `SELECT id, institution_id as "institutionId", name, discount_type as "discountType",
              value::float, created_at as "createdAt"
       FROM discounts
       WHERE institution_id = $1
       ORDER BY name ASC`,
      [institutionId]
    );
    return res.rows;
  }

  async createDiscount(institutionId: string, data: { name: string; discountType: string; value: number }) {
    const res = await db.query(
      `INSERT INTO discounts (institution_id, name, discount_type, value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, institution_id as "institutionId", name, discount_type as "discountType",
                 value::float, created_at as "createdAt"`,
      [institutionId, data.name.trim(), data.discountType, data.value]
    );
    return res.rows[0];
  }

  async listScholarships(institutionId: string) {
    const res = await db.query(
      `SELECT id, institution_id as "institutionId", name, sponsor, value::float, created_at as "createdAt"
       FROM scholarships
       WHERE institution_id = $1
       ORDER BY name ASC`,
      [institutionId]
    );
    return res.rows;
  }

  async createScholarship(institutionId: string, data: { name: string; sponsor?: string; value: number }) {
    const res = await db.query(
      `INSERT INTO scholarships (institution_id, name, sponsor, value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, institution_id as "institutionId", name, sponsor, value::float, created_at as "createdAt"`,
      [institutionId, data.name.trim(), data.sponsor || null, data.value]
    );
    return res.rows[0];
  }

  // ================= STUDENT FEES ASSIGNMENT & LEDGER =================
  async assignFeeToStudent(institutionId: string, data: {
    studentId: string;
    feeStructureId: string;
    academicYearId: string;
    discountId?: string | null;
    scholarshipId?: string | null;
    approvedBy?: string | null;
    dueDate?: string | null;
  }) {
    return await db.transaction(async (client) => {
      // 1. Fetch fee structure details and items
      const structure = await this.getFeeStructureById(institutionId, data.feeStructureId);
      if (!structure) throw new Error('Fee structure not found');

      let grossAmount = structure.totalAmount || 0;
      let discountAmount = 0;

      // 2. Check discount or scholarship if provided
      if (data.discountId) {
        const discRes = await client.query('SELECT discount_type, value FROM discounts WHERE id = $1 AND institution_id = $2', [data.discountId, institutionId]);
        if (discRes.rows.length > 0) {
          const disc = discRes.rows[0];
          if (disc.discount_type === 'percentage') {
            discountAmount = (grossAmount * parseFloat(disc.value)) / 100;
          } else {
            discountAmount = parseFloat(disc.value);
          }
          await client.query(
            `INSERT INTO student_discounts (student_id, discount_id, academic_year_id, approved_by)
             VALUES ($1, $2, $3, $4)`,
            [data.studentId, data.discountId, data.academicYearId, data.approvedBy || null]
          );
        }
      } else if (data.scholarshipId) {
        const scholRes = await client.query('SELECT value FROM scholarships WHERE id = $1 AND institution_id = $2', [data.scholarshipId, institutionId]);
        if (scholRes.rows.length > 0) {
          discountAmount = parseFloat(scholRes.rows[0].value);
          await client.query(
            `INSERT INTO student_discounts (student_id, scholarship_id, academic_year_id, approved_by)
             VALUES ($1, $2, $3, $4)`,
            [data.studentId, data.scholarshipId, data.academicYearId, data.approvedBy || null]
          );
        }
      }

      const netAmount = Math.max(0, grossAmount - discountAmount);

      // 3. Create student_fees assignment
      const feeRes = await client.query(
        `INSERT INTO student_fees (institution_id, student_id, fee_structure_id, academic_year_id, total_amount, balance_due)
         VALUES ($1, $2, $3, $4, $5, $5)
         ON CONFLICT (student_id, fee_structure_id, academic_year_id) DO UPDATE SET total_amount = EXCLUDED.total_amount, balance_due = EXCLUDED.balance_due
         RETURNING id, institution_id as "institutionId", student_id as "studentId", fee_structure_id as "feeStructureId",
                   academic_year_id as "academicYearId", total_amount::float as "totalAmount", balance_due::float as "balanceDue",
                   created_at as "createdAt"`,
        [institutionId, data.studentId, data.feeStructureId, data.academicYearId, netAmount]
      );
      const studentFee = feeRes.rows[0];

      // 4. Create initial invoice (Section 9.10: Fee Assignment -> Invoice)
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const invRes = await client.query(
        `INSERT INTO invoices (institution_id, student_fee_id, invoice_number, total_amount, status, due_date)
         VALUES ($1, $2, $3, $4, 'pending', $5)
         RETURNING id, institution_id as "institutionId", student_fee_id as "studentFeeId",
                   invoice_number as "invoiceNumber", total_amount::float as "totalAmount",
                   status, due_date as "dueDate", issued_at as "issuedAt"`,
        [institutionId, studentFee.id, invoiceNumber, netAmount, data.dueDate || null]
      );
      const invoice = invRes.rows[0];

      // 5. Populate invoice_items
      if (structure.items && structure.items.length > 0) {
        for (const it of structure.items) {
          await client.query(
            `INSERT INTO invoice_items (invoice_id, fee_category_id, amount)
             VALUES ($1, $2, $3)`,
            [invoice.id, it.feeCategoryId, it.amount]
          );
        }
      }

      return {
        studentFee,
        invoice,
        grossAmount,
        discountAmount,
        netAmount,
      };
    });
  }

  async listStudentFees(institutionId: string, filters?: { studentId?: string; academicYearId?: string; classId?: string; sectionId?: string; status?: string }): Promise<StudentFeeData[]> {
    let query = `
      SELECT sf.id, sf.institution_id as "institutionId", sf.student_id as "studentId",
             sf.fee_structure_id as "feeStructureId", sf.academic_year_id as "academicYearId",
             sf.total_amount::float as "totalAmount", sf.balance_due::float as "balanceDue",
             sf.created_at as "createdAt",
             (s.first_name || ' ' || s.last_name) as "studentName",
             s.admission_number as "admissionNumber",
             c.name as "className",
             sec.name as "sectionName",
             fs.name as "feeStructureName",
             CASE 
               WHEN sf.balance_due = 0 THEN 'PAID'
               WHEN sf.balance_due < sf.total_amount THEN 'PARTIAL'
               ELSE 'PENDING'
             END as status
      FROM student_fees sf
      JOIN students s ON s.id = sf.student_id
      LEFT JOIN classes c ON c.id = s.current_class_id
      LEFT JOIN sections sec ON sec.id = s.current_section_id
      JOIN fee_structures fs ON fs.id = sf.fee_structure_id
      WHERE sf.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (filters?.studentId) {
      params.push(filters.studentId);
      query += ` AND sf.student_id = $${params.length}`;
    }
    if (filters?.academicYearId) {
      params.push(filters.academicYearId);
      query += ` AND sf.academic_year_id = $${params.length}`;
    }
    if (filters?.classId) {
      params.push(filters.classId);
      query += ` AND s.current_class_id = $${params.length}`;
    }
    if (filters?.sectionId) {
      params.push(filters.sectionId);
      query += ` AND s.current_section_id = $${params.length}`;
    }
    if (filters?.status) {
      if (filters.status.toUpperCase() === 'PAID') query += ` AND sf.balance_due = 0`;
      else if (filters.status.toUpperCase() === 'PARTIAL') query += ` AND sf.balance_due > 0 AND sf.balance_due < sf.total_amount`;
      else if (filters.status.toUpperCase() === 'PENDING') query += ` AND sf.balance_due = sf.total_amount`;
    }

    query += ' ORDER BY sf.created_at DESC';
    const res = await db.query(query, params);
    return res.rows;
  }

  async getStudentFeeLedger(institutionId: string, studentId: string) {
    const fees = await this.listStudentFees(institutionId, { studentId });
    const invoices = await this.listInvoices(institutionId, { studentId });
    const payments = await this.listPayments(institutionId, { studentId });

    const totalAssigned = fees.reduce((sum, f) => sum + f.totalAmount, 0);
    const totalBalance = fees.reduce((sum, f) => sum + f.balanceDue, 0);
    const totalPaid = payments.filter((p) => p.status === 'success').reduce((sum, p) => sum + p.amount, 0);

    return {
      studentId,
      summary: {
        totalAssigned,
        totalPaid,
        totalBalance,
      },
      fees,
      invoices,
      payments,
    };
  }

  // ================= INVOICES =================
  async listInvoices(institutionId: string, filters?: { studentId?: string; status?: string; studentFeeId?: string }): Promise<InvoiceData[]> {
    let query = `
      SELECT i.id, i.institution_id as "institutionId", i.student_fee_id as "studentFeeId",
             i.invoice_number as "invoiceNumber", i.total_amount::float as "totalAmount",
             i.status, i.due_date as "dueDate", i.issued_at as "issuedAt",
             sf.student_id as "studentId",
             (s.first_name || ' ' || s.last_name) as "studentName",
             s.admission_number as "admissionNumber"
      FROM invoices i
      JOIN student_fees sf ON sf.id = i.student_fee_id
      JOIN students s ON s.id = sf.student_id
      WHERE i.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (filters?.studentId) {
      params.push(filters.studentId);
      query += ` AND sf.student_id = $${params.length}`;
    }
    if (filters?.studentFeeId) {
      params.push(filters.studentFeeId);
      query += ` AND i.student_fee_id = $${params.length}`;
    }
    if (filters?.status) {
      params.push(filters.status.toLowerCase());
      query += ` AND i.status = $${params.length}::invoice_status`;
    }

    query += ' ORDER BY i.issued_at DESC';
    const res = await db.query(query, params);
    return res.rows;
  }

  async getInvoiceById(institutionId: string, id: string): Promise<InvoiceData | null> {
    const invRes = await db.query(
      `SELECT i.id, i.institution_id as "institutionId", i.student_fee_id as "studentFeeId",
              i.invoice_number as "invoiceNumber", i.total_amount::float as "totalAmount",
              i.status, i.due_date as "dueDate", i.issued_at as "issuedAt",
              sf.student_id as "studentId", sf.balance_due::float as "balanceDue",
              (s.first_name || ' ' || s.last_name) as "studentName",
              s.admission_number as "admissionNumber"
       FROM invoices i
       JOIN student_fees sf ON sf.id = i.student_fee_id
       JOIN students s ON s.id = sf.student_id
       WHERE i.institution_id = $1 AND i.id = $2`,
      [institutionId, id]
    );
    if (invRes.rows.length === 0) return null;

    const invoice = invRes.rows[0];

    const itemsRes = await db.query(
      `SELECT ii.id, ii.fee_category_id as "feeCategoryId", fc.name as "categoryName", ii.amount::float as amount
       FROM invoice_items ii
       JOIN fee_categories fc ON fc.id = ii.fee_category_id
       WHERE ii.invoice_id = $1`,
      [id]
    );

    const paymentsRes = await this.listPayments(institutionId, { invoiceId: id });

    return {
      ...invoice,
      items: itemsRes.rows,
      payments: paymentsRes,
    };
  }

  // ================= PAYMENTS & RECEIPTS =================
  async recordPayment(institutionId: string, data: {
    invoiceId: string;
    studentId: string;
    amount: number;
    method: string;
    receivedBy?: string | null;
    receiptNumber?: string;
  }): Promise<PaymentData> {
    const receiptNum = data.receiptNumber || `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const methodClean = (data.method || 'cash').toLowerCase();

    return await db.transaction(async (client) => {
      // 1. Validate invoice belongs to this tenant and get student_fee_id
      const invRes = await client.query(
        `SELECT i.id, i.student_fee_id, sf.balance_due::float, sf.total_amount::float, i.status
         FROM invoices i
         JOIN student_fees sf ON sf.id = i.student_fee_id
         WHERE i.institution_id = $1 AND i.id = $2`,
        [institutionId, data.invoiceId]
      );

      if (invRes.rows.length === 0) {
        throw new Error('Invoice not found for this institution');
      }

      const inv = invRes.rows[0];
      if (inv.balance_due <= 0) {
        throw new Error('Invoice is already fully paid');
      }
      if (data.amount <= 0) {
        throw new Error('Payment amount must be greater than zero');
      }
      if (data.amount > inv.balance_due) {
        throw new Error(`Payment amount (${data.amount}) exceeds remaining balance due (${inv.balance_due})`);
      }

      // 2. Insert into payments
      const payRes = await client.query(
        `INSERT INTO payments (institution_id, invoice_id, student_id, amount, method, status, received_by)
         VALUES ($1, $2, $3, $4, $5::payment_method, 'success', $6)
         RETURNING id, institution_id as "institutionId", invoice_id as "invoiceId",
                   student_id as "studentId", amount::float, method, status,
                   received_by as "receivedBy", paid_at as "paidAt"`,
        [institutionId, data.invoiceId, data.studentId, data.amount, methodClean, data.receivedBy || null]
      );
      const payment = payRes.rows[0];

      // 3. Insert into receipts
      await client.query(
        `INSERT INTO receipts (institution_id, payment_id, receipt_number)
         VALUES ($1, $2, $3)`,
        [institutionId, payment.id, receiptNum]
      );

      // 4. Update student_fees balance
      const newBalance = Math.max(0, inv.balance_due - data.amount);
      await client.query(
        `UPDATE student_fees SET balance_due = $1 WHERE id = $2`,
        [newBalance, inv.student_fee_id]
      );

      // 5. Update invoice status
      const newStatus = newBalance === 0 ? 'paid' : 'partially_paid';
      await client.query(
        `UPDATE invoices SET status = $1::invoice_status WHERE id = $2`,
        [newStatus, data.invoiceId]
      );

      // 6. If admissions fee was pending for this student, mark admission_fee_status = 'paid' (Decision D6)
      await client.query(
        `UPDATE admissions SET admission_fee_status = 'paid'
         WHERE id = (SELECT admission_id FROM students WHERE id = $1)
           AND admission_fee_status = 'pending'`,
        [data.studentId]
      );

      return {
        ...payment,
        receiptNumber: receiptNum,
      };
    });
  }

  async listPayments(institutionId: string, filters?: { studentId?: string; invoiceId?: string; method?: string; status?: string }): Promise<PaymentData[]> {
    let query = `
      SELECT p.id, p.institution_id as "institutionId", p.invoice_id as "invoiceId",
             p.student_id as "studentId", p.amount::float, p.method, p.status,
             p.received_by as "receivedBy", p.paid_at as "paidAt",
             r.receipt_number as "receiptNumber",
             (s.first_name || ' ' || s.last_name) as "studentName",
             i.invoice_number as "invoiceNumber"
      FROM payments p
      JOIN invoices i ON i.id = p.invoice_id
      JOIN students s ON s.id = p.student_id
      LEFT JOIN receipts r ON r.payment_id = p.id
      WHERE p.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (filters?.studentId) {
      params.push(filters.studentId);
      query += ` AND p.student_id = $${params.length}`;
    }
    if (filters?.invoiceId) {
      params.push(filters.invoiceId);
      query += ` AND p.invoice_id = $${params.length}`;
    }
    if (filters?.method) {
      params.push(filters.method.toLowerCase());
      query += ` AND p.method = $${params.length}::payment_method`;
    }
    if (filters?.status) {
      params.push(filters.status.toLowerCase());
      query += ` AND p.status = $${params.length}::payment_status`;
    }

    query += ' ORDER BY p.paid_at DESC';
    const res = await db.query(query, params);
    return res.rows;
  }

  async getReceiptByPaymentId(institutionId: string, paymentId: string) {
    const res = await db.query(
      `SELECT r.id, r.payment_id as "paymentId", r.receipt_number as "receiptNumber",
              r.created_at as "createdAt",
              p.amount::float as amount, p.method, p.paid_at as "paidAt",
              i.invoice_number as "invoiceNumber",
              (s.first_name || ' ' || s.last_name) as "studentName",
              s.admission_number as "admissionNumber"
       FROM receipts r
       JOIN payments p ON p.id = r.payment_id
       JOIN invoices i ON i.id = p.invoice_id
       JOIN students s ON s.id = p.student_id
       WHERE p.institution_id = $1 AND p.id = $2`,
      [institutionId, paymentId]
    );
    return res.rows[0] || null;
  }

  // ================= WEBHOOK IDEMPOTENCY & GATEWAY FAILURES =================
  async isWebhookEventProcessed(gatewayName: string, eventId: string): Promise<boolean> {
    const res = await db.query(
      `SELECT id FROM payment_webhook_events WHERE gateway_name = $1 AND event_id = $2`,
      [gatewayName, eventId]
    );
    return res.rows.length > 0;
  }

  async recordWebhookEvent(institutionId: string | null, data: {
    gatewayName: string;
    eventId: string;
    eventType: string;
    payload: any;
    status: string;
  }) {
    const res = await db.query(
      `INSERT INTO payment_webhook_events (institution_id, gateway_name, event_id, event_type, payload, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (gateway_name, event_id) DO NOTHING
       RETURNING id`,
      [institutionId, data.gatewayName, data.eventId, data.eventType, JSON.stringify(data.payload), data.status]
    );
    return res.rows[0] || null;
  }

  async recordFailedGatewayPayment(institutionId: string, data: {
    invoiceId: string;
    studentId: string;
    amount: number;
    method: string;
    gatewayName: string;
    gatewayReference: string;
    gatewayResponse: any;
  }) {
    return await db.transaction(async (client) => {
      const payRes = await client.query(
        `INSERT INTO payments (institution_id, invoice_id, student_id, amount, method, status)
         VALUES ($1, $2, $3, $4, $5::payment_method, 'failed')
         RETURNING id`,
        [institutionId, data.invoiceId, data.studentId, data.amount, (data.method || 'online_gateway').toLowerCase()]
      );
      const paymentId = payRes.rows[0].id;

      await client.query(
        `INSERT INTO payment_gateway_transactions (payment_id, gateway_name, gateway_reference, gateway_response)
         VALUES ($1, $2, $3, $4)`,
        [paymentId, data.gatewayName, data.gatewayReference, JSON.stringify(data.gatewayResponse)]
      );

      return { paymentId, status: 'failed' };
    });
  }

  // ================= REFUNDS =================
  async processRefund(institutionId: string, data: {
    paymentId: string;
    amount: number;
    reason: string;
    approvedBy?: string | null;
  }) {
    return await db.transaction(async (client) => {
      // 1. Fetch payment details
      const payRes = await client.query(
        `SELECT p.id, p.invoice_id, p.amount::float, p.status, i.student_fee_id, sf.balance_due::float
         FROM payments p
         JOIN invoices i ON i.id = p.invoice_id
         JOIN student_fees sf ON sf.id = i.student_fee_id
         WHERE p.institution_id = $1 AND p.id = $2`,
        [institutionId, data.paymentId]
      );

      if (payRes.rows.length === 0) throw new Error('Payment not found');
      const pay = payRes.rows[0];

      if (pay.status !== 'success') throw new Error('Cannot refund non-successful payment');
      if (data.amount <= 0 || data.amount > pay.amount) {
        throw new Error(`Refund amount must be between 0 and paid amount (${pay.amount})`);
      }

      // 2. Insert into refunds
      const refRes = await client.query(
        `INSERT INTO refunds (institution_id, payment_id, amount, reason, approved_by, processed_at)
         VALUES ($1, $2, $3, $4, $5, now())
         RETURNING id, payment_id as "paymentId", amount::float, reason, approved_by as "approvedBy", processed_at as "processedAt"`,
        [institutionId, data.paymentId, data.amount, data.reason, data.approvedBy || null]
      );

      // 3. Mark payment status as refunded (or partial)
      await client.query(`UPDATE payments SET status = 'refunded' WHERE id = $1`, [data.paymentId]);

      // 4. Adjust balance due back up
      const restoredBalance = pay.balance_due + data.amount;
      await client.query(`UPDATE student_fees SET balance_due = $1 WHERE id = $2`, [restoredBalance, pay.student_fee_id]);
      await client.query(`UPDATE invoices SET status = 'partially_paid' WHERE id = $1`, [pay.invoice_id]);

      return refRes.rows[0];
    });
  }

  // ================= SUMMARY =================
  async getSummary(institutionId: string) {
    const res = await db.query(
      `SELECT 
         COALESCE(sum(total_amount), 0)::float as "totalReceivable",
         COALESCE(sum(total_amount - balance_due), 0)::float as "totalCollected",
         COALESCE(sum(balance_due), 0)::float as "totalPending",
         count(*) filter (where balance_due = 0)::int as "fullyPaidCount",
         count(*) filter (where balance_due > 0)::int as "pendingCount"
       FROM student_fees
       WHERE institution_id = $1`,
      [institutionId]
    );
    return res.rows[0];
  }

  // ================= SCOPED FEES (Rule 9 & Rule 10) =================
  async getScopedFees(institutionId: string, user: { id: string; role: string }) {
    const roleUpper = (user.role || '').toUpperCase();

    if (roleUpper === 'STUDENT') {
      const studentRes = await db.query(
        `SELECT id FROM students WHERE institution_id = $1 AND (user_id = $2 OR id = $2) LIMIT 1`,
        [institutionId, user.id]
      );
      if (studentRes.rows.length === 0) return { fees: [], invoices: [], payments: [] };
      return this.getStudentFeeLedger(institutionId, studentRes.rows[0].id);
    }

    if (roleUpper === 'PARENT') {
      const childrenRes = await db.query(
        `SELECT s.id, (s.first_name || ' ' || s.last_name) as "studentName", s.admission_number as "admissionNumber"
         FROM students s
         JOIN student_parents sp ON sp.student_id = s.id
         JOIN parents p ON p.id = sp.parent_id
         WHERE s.institution_id = $1 AND p.profile_id = $2`,
        [institutionId, user.id]
      );

      const childrenLedgers = [];
      for (const child of childrenRes.rows) {
        const ledger = await this.getStudentFeeLedger(institutionId, child.id);
        childrenLedgers.push({
          child,
          ...ledger,
        });
      }
      return { children: childrenLedgers };
    }

    if (roleUpper === 'TEACHER' || roleUpper === 'FACULTY') {
      throw new Error('RESOURCE_ACCESS_DENIED: Faculty does not have access to institutional finance data');
    }

    // Admin / Finance Team -> summary + all records
    const summary = await this.getSummary(institutionId);
    const fees = await this.listStudentFees(institutionId);
    return { summary, fees };
  }
}

export const financeRepository = new FinanceRepository();
