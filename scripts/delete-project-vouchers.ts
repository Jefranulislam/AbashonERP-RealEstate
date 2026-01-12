// Load environment variables FIRST before any other imports
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env" });
}

// Now import db after env is loaded
import { sql } from "../lib/db";

async function deleteProjectVouchers() {
  console.log("🗑️  Starting voucher deletion...");

  try {
    // Get project ID
    const projects = await sql`SELECT id, project_name FROM projects`;
    console.log("Available projects:", projects);
    
    const project = await sql`SELECT id FROM projects WHERE project_name ILIKE '%Heaven%' LIMIT 1`;
    if (project.length === 0) {
      console.log("❌ Project not found.");
      process.exit(1);
    }
    const projectId = project[0].id;
    console.log(`📋 Project ID: ${projectId}`);

    // Count existing vouchers
    const count = await sql`SELECT COUNT(*) as count FROM vouchers WHERE project_id = ${projectId}`;
    const voucherCount = Number(count[0].count);
    console.log(`📊 Found ${voucherCount} vouchers to delete`);

    if (voucherCount === 0) {
      console.log("✅ No vouchers to delete");
      process.exit(0);
    }

    // Delete vouchers
    const result = await sql`DELETE FROM vouchers WHERE project_id = ${projectId}`;
    console.log(`✅ Deleted ${voucherCount} vouchers successfully`);

  } catch (error) {
    console.error("❌ Error deleting vouchers:", error);
    throw error;
  }
}

deleteProjectVouchers()
  .then(() => {
    console.log("\n✨ Voucher deletion completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Voucher deletion failed:", error);
    process.exit(1);
  });
