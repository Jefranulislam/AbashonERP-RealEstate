import { sql } from '../lib/db'
import * as fs from 'fs'
import * as path from 'path'

async function runMigration() {
  console.log('🚀 Starting Sales Module Enhancement Migration...')
  
  try {
    // 1. ENHANCE PRODUCTS TABLE
    console.log('📦 Enhancing products table...')
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_type VARCHAR(50)`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS floor_no VARCHAR(20)`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_no VARCHAR(50)`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS size_sqft DECIMAL(10, 2)`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS facing VARCHAR(50)`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS bedrooms INTEGER`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS bathrooms INTEGER`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS base_price DECIMAL(15, 2)`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS price_per_sqft DECIMAL(10, 2)`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'available'`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT`
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls TEXT`
    console.log('✅ Products table enhanced')

    // 2. ENHANCE SALES TABLE
    console.log('📦 Enhancing sales table...')
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_no VARCHAR(50)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_type VARCHAR(30) DEFAULT 'booking'`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_status VARCHAR(30) DEFAULT 'booked'`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS base_price DECIMAL(15, 2)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15, 2) DEFAULT 0`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5, 2) DEFAULT 0`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS net_price DECIMAL(15, 2)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS booking_amount DECIMAL(15, 2)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS down_payment DECIMAL(15, 2)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS total_paid DECIMAL(15, 2) DEFAULT 0`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(15, 2)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_plan VARCHAR(50)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS installment_count INTEGER`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS installment_amount DECIMAL(15, 2)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS booking_date DATE`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS agreement_date DATE`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS expected_handover_date DATE`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS actual_handover_date DATE`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS agreement_no VARCHAR(50)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS notes TEXT`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS terms_conditions TEXT`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS nominee_name VARCHAR(255)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS nominee_phone VARCHAR(20)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS nominee_relation VARCHAR(50)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS nominee_nid VARCHAR(50)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS reference_by VARCHAR(255)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(15, 2)`
    await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT false`
    console.log('✅ Sales table enhanced')

    // 3. CREATE PAYMENT SCHEDULES TABLE
    console.log('📦 Creating sale_payment_schedules table...')
    await sql`
      CREATE TABLE IF NOT EXISTS sale_payment_schedules (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        schedule_type VARCHAR(30) NOT NULL,
        installment_no INTEGER,
        description VARCHAR(255),
        due_date DATE NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        paid_amount DECIMAL(15, 2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✅ sale_payment_schedules table created')

    // 4. CREATE SALE PAYMENTS TABLE
    console.log('📦 Creating sale_payments table...')
    await sql`
      CREATE TABLE IF NOT EXISTS sale_payments (
        id SERIAL PRIMARY KEY,
        receipt_no VARCHAR(50) UNIQUE NOT NULL,
        sale_id INTEGER REFERENCES sales(id),
        customer_id INTEGER REFERENCES customers(id),
        schedule_id INTEGER REFERENCES sale_payment_schedules(id),
        payment_date DATE NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        payment_method VARCHAR(30) NOT NULL,
        bank_cash_id INTEGER REFERENCES bank_cash_accounts(id),
        cheque_number VARCHAR(50),
        cheque_date DATE,
        cheque_bank VARCHAR(255),
        transaction_reference VARCHAR(100),
        status VARCHAR(20) DEFAULT 'received',
        voucher_id INTEGER REFERENCES vouchers(id),
        remarks TEXT,
        received_by INTEGER REFERENCES employees(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✅ sale_payments table created')

    // 5. CREATE SALE DOCUMENTS TABLE
    console.log('📦 Creating sale_documents table...')
    await sql`
      CREATE TABLE IF NOT EXISTS sale_documents (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL,
        document_name VARCHAR(255),
        document_url TEXT,
        uploaded_by INTEGER REFERENCES employees(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✅ sale_documents table created')

    // 6. CREATE SALE ACTIVITIES TABLE
    console.log('📦 Creating sale_activities table...')
    await sql`
      CREATE TABLE IF NOT EXISTS sale_activities (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        description TEXT,
        old_value TEXT,
        new_value TEXT,
        performed_by INTEGER REFERENCES employees(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✅ sale_activities table created')

    // 7. CREATE NOTIFICATION LOGS TABLE
    console.log('📦 Creating notification_logs table...')
    await sql`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id SERIAL PRIMARY KEY,
        notification_type VARCHAR(30) NOT NULL,
        recipient_type VARCHAR(30),
        recipient_id INTEGER,
        recipient_phone VARCHAR(20),
        recipient_email VARCHAR(255),
        template_name VARCHAR(100),
        subject VARCHAR(255),
        message TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        error_message TEXT,
        reference_type VARCHAR(50),
        reference_id INTEGER,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✅ notification_logs table created')

    // 8. CREATE SMS TEMPLATES TABLE
    console.log('📦 Creating sms_templates table...')
    await sql`
      CREATE TABLE IF NOT EXISTS sms_templates (
        id SERIAL PRIMARY KEY,
        template_name VARCHAR(100) UNIQUE NOT NULL,
        template_type VARCHAR(50) NOT NULL,
        message_template TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Insert default SMS templates
    await sql`
      INSERT INTO sms_templates (template_name, template_type, message_template) VALUES
      ('Booking Confirmation', 'booking_confirmation', 
       'Dear {{customer_name}}, Your booking for {{unit_name}} at {{project_name}} is confirmed. Booking No: {{sale_no}}. Total: {{net_price}}. Thank you for choosing us!')
      ON CONFLICT (template_name) DO NOTHING
    `
    await sql`
      INSERT INTO sms_templates (template_name, template_type, message_template) VALUES
      ('Payment Received', 'payment_received', 
       'Dear {{customer_name}}, We received {{amount}} for {{unit_name}}. Receipt: {{receipt_no}}. Outstanding: {{outstanding}}. Thank you!')
      ON CONFLICT (template_name) DO NOTHING
    `
    await sql`
      INSERT INTO sms_templates (template_name, template_type, message_template) VALUES
      ('Payment Reminder', 'payment_reminder', 
       'Dear {{customer_name}}, Reminder: Payment of {{amount}} for {{unit_name}} is due on {{due_date}}. Please pay on time. Thank you!')
      ON CONFLICT (template_name) DO NOTHING
    `
    await sql`
      INSERT INTO sms_templates (template_name, template_type, message_template) VALUES
      ('Payment Overdue', 'payment_overdue', 
       'Dear {{customer_name}}, Your payment of {{amount}} for {{unit_name}} is overdue since {{due_date}}. Please pay immediately to avoid penalty.')
      ON CONFLICT (template_name) DO NOTHING
    `
    await sql`
      INSERT INTO sms_templates (template_name, template_type, message_template) VALUES
      ('Handover Notice', 'handover_notice', 
       'Dear {{customer_name}}, Congratulations! Your {{unit_name}} at {{project_name}} is ready for handover. Please contact us to schedule.')
      ON CONFLICT (template_name) DO NOTHING
    `
    console.log('✅ sms_templates table created with default templates')

    // 9. ADD SETTINGS COLUMNS
    console.log('📦 Enhancing settings table...')
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS sale_prefix VARCHAR(20) DEFAULT 'SALE'`
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS receipt_prefix VARCHAR(20) DEFAULT 'RCP'`
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS sms_api_key TEXT`
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS sms_sender_id VARCHAR(20)`
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false`
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT false`
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_host VARCHAR(255)`
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_port INTEGER`
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_user VARCHAR(255)`
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_password TEXT`
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS auto_create_voucher BOOLEAN DEFAULT true`
    await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS payment_reminder_days INTEGER DEFAULT 3`
    console.log('✅ Settings table enhanced')

    // 10. CREATE INDEXES
    console.log('📦 Creating indexes...')
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_sale_no ON sales(sale_no)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(sale_status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_booking_date ON sales(booking_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sale_payments_receipt_no ON sale_payments(receipt_no)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sale_payments_sale_id ON sale_payments(sale_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sale_schedules_due_date ON sale_payment_schedules(due_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sale_schedules_status ON sale_payment_schedules(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status)`
    console.log('✅ Indexes created')

    // 11. CREATE HELPER FUNCTIONS
    console.log('📦 Creating helper functions...')
    
    // Generate Sale No Function
    await sql`
      CREATE OR REPLACE FUNCTION generate_sale_no()
      RETURNS TEXT AS $$
      DECLARE
        prefix TEXT;
        next_num INTEGER;
        sale_no TEXT;
      BEGIN
        SELECT COALESCE(sale_prefix, 'SALE') INTO prefix FROM settings LIMIT 1;
        SELECT COALESCE(MAX(CAST(SUBSTRING(sale_no FROM '[0-9]+$') AS INTEGER)), 0) + 1 INTO next_num FROM sales WHERE sale_no IS NOT NULL;
        sale_no := prefix || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(next_num::TEXT, 4, '0');
        RETURN sale_no;
      END;
      $$ LANGUAGE plpgsql
    `

    // Generate Receipt No Function
    await sql`
      CREATE OR REPLACE FUNCTION generate_receipt_no()
      RETURNS TEXT AS $$
      DECLARE
        prefix TEXT;
        next_num INTEGER;
        receipt_no TEXT;
      BEGIN
        SELECT COALESCE(receipt_prefix, 'RCP') INTO prefix FROM settings LIMIT 1;
        SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_no FROM '[0-9]+$') AS INTEGER)), 0) + 1 INTO next_num FROM sale_payments WHERE receipt_no IS NOT NULL;
        receipt_no := prefix || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(next_num::TEXT, 4, '0');
        RETURN receipt_no;
      END;
      $$ LANGUAGE plpgsql
    `
    console.log('✅ Helper functions created')

    console.log('')
    console.log('🎉 Migration completed successfully!')
    console.log('')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

runMigration()
  .then(() => {
    console.log('Migration script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })
