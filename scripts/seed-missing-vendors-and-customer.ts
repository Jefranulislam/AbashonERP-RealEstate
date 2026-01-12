// Load environment variables FIRST before any other imports
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env" });
}

// Now import db after env is loaded
import { sql } from "../lib/db";

interface VendorData {
  vendorName: string;
  personName: string;
  accountNumber: string;
  accountName: string;
  phoneNumber: string;
  address: string;
  routingNumber: string;
  bankCode: string;
  accountType: string;
  bankName: string;
  materials: string[];
}

interface CustomerData {
  customerName: string;
  email: string;
  phone: string;
  mailingAddress: string;
  notes: string;
}

const newVendorsData: VendorData[] = [
  {
    vendorName: "Ujjal Mia",
    personName: "Ujjal Mia",
    accountNumber: "",
    accountName: "",
    phoneNumber: "",
    address: "To be provided",
    routingNumber: "",
    bankCode: "",
    accountType: "ACCOUNT",
    bankName: "",
    materials: ["Silicon Sand"],
  },
  {
    vendorName: "KAJI MOHAMMAD",
    personName: "Kaji Mohammad",
    accountNumber: "",
    accountName: "",
    phoneNumber: "",
    address: "To be provided",
    routingNumber: "",
    bankCode: "",
    accountType: "ACCOUNT",
    bankName: "",
    materials: ["Transportation", "Carrying"],
  },
  {
    vendorName: "N.Islam builders",
    personName: "Nurul Islam",
    accountNumber: "",
    accountName: "",
    phoneNumber: "",
    address: "To be provided",
    routingNumber: "",
    bankCode: "",
    accountType: "ACCOUNT",
    bankName: "",
    materials: ["Construction", "Labor"],
  },
];

const customerData: CustomerData = {
  customerName: "Esrat Jahan",
  email: "",
  phone: "",
  mailingAddress: "Kuddus Nur's Heaven - 5B",
  notes: "Customer for plot 5B - Initial booking ₹1,000,000 with installments",
};

async function seedVendorsAndCustomer() {
  console.log("🌱 Starting vendors and customer seeding...");

  try {
    // Seed vendors
    console.log(`\n📦 Seeding ${newVendorsData.length} new vendors...`);
    
    for (const vendor of newVendorsData) {
      // Check if vendor already exists
      const existing = await sql`
        SELECT id, vendor_name FROM vendors 
        WHERE LOWER(vendor_name) = LOWER(${vendor.vendorName})
      `;

      if (existing.length > 0) {
        console.log(`⏭️  Vendor "${vendor.vendorName}" already exists (ID: ${existing[0].id})`);
        continue;
      }

      const result = await sql`
        INSERT INTO vendors (
          vendor_name,
          mailing_address,
          phone,
          email,
          bank_name,
          bank_account_number,
          bank_account_name,
          bank_routing_number,
          materials
        ) VALUES (
          ${vendor.vendorName},
          ${vendor.address},
          ${vendor.phoneNumber},
          '',
          ${vendor.bankName},
          ${vendor.accountNumber},
          ${vendor.accountName},
          ${vendor.routingNumber},
          ${vendor.materials}
        )
        RETURNING id, vendor_name
      `;

      console.log(`✅ Created vendor: ${result[0].vendor_name} (ID: ${result[0].id})`);
    }

    // Seed customer
    console.log(`\n👤 Seeding customer...`);
    
    // Check if customer already exists
    const existingCustomer = await sql`
      SELECT id, customer_name FROM customers 
      WHERE LOWER(customer_name) = LOWER(${customerData.customerName})
    `;

    if (existingCustomer.length > 0) {
      console.log(`⏭️  Customer "${customerData.customerName}" already exists (ID: ${existingCustomer[0].id})`);
    } else {
      // Generate customer ID
      const customerId = `CUST-${Date.now()}`;
      
      const result = await sql`
        INSERT INTO customers (
          customer_id,
          customer_name,
          email,
          phone,
          mailing_address
        ) VALUES (
          ${customerId},
          ${customerData.customerName},
          ${customerData.email},
          ${customerData.phone},
          ${customerData.mailingAddress}
        )
        RETURNING id, customer_name, customer_id
      `;

      console.log(`✅ Created customer: ${result[0].customer_name} (ID: ${result[0].id}, Customer ID: ${result[0].customer_id})`);
    }

    console.log("\n✨ Vendors and customer seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding vendors and customer:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedVendorsAndCustomer();
