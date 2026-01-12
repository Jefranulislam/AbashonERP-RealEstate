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
}

const vendorsData: VendorData[] = [
  {
    vendorName: "M/s Aziz Trading",
    personName: "Abdul Aziz",
    accountNumber: "0071450122140",
    accountName: "MD. Abdul Aziz",
    phoneNumber: "",
    address: "aec",
    routingNumber: "95151485",
    bankCode: "95",
    accountType: "ACCOUNT",
    bankName: "EASTERN BANK PLC.",
  },
  {
    vendorName: "Brothers Enterprise",
    personName: "AGGREGATE Suppliers",
    accountNumber: "20506510100002809",
    accountName: "BROTHERS ENTERPRISE",
    phoneNumber: "01817720003",
    address: "aec",
    routingNumber: "125155801",
    bankCode: "125",
    accountType: "ACCOUNT",
    bankName: "ISLAMI BANK BANGLDESH PLC.",
  },
  {
    vendorName: "Brothers Enterprise",
    personName: "Alauddin aggregate Suppliers",
    accountNumber: "1291580019806",
    accountName: "MOHAMMAD MAHADI HASAN",
    phoneNumber: "01817720003",
    address: "aec",
    routingNumber: "90151480",
    bankCode: "90",
    accountType: "ACCOUNT",
    bankName: "DUTCH-BANGLA BANK PLC.",
  },
  {
    vendorName: "Jamal",
    personName: "Bricks Suppliers MD. JAMAL UDDIN",
    accountNumber: "1033201000038868",
    accountName: "MD. JAMAL UDDIN",
    phoneNumber: "01814360090",
    address: "aec",
    routingNumber: "245156498",
    bankCode: "245",
    accountType: "ACCOUNT",
    bankName: "UNITED COMMERCIAL BANK PLC.",
  },
  {
    vendorName: "Hassan Md Al Fahad",
    personName: "Hassan Md Al Fahad",
    accountNumber: "20504230200761011",
    accountName: "Hassan Md Al Fahad",
    phoneNumber: "",
    address: "aec",
    routingNumber: "125752262",
    bankCode: "125",
    accountType: "ACCOUNT",
    bankName: "ISLAMI BANK BANGLDESH PLC.",
  },
  {
    vendorName: "Manga Enterprise",
    personName: "Manha Enterprise Sand",
    accountNumber: "3868901018198",
    accountName: "MS Manha Enterprise",
    phoneNumber: "01821199699",
    address: "aec",
    routingNumber: "175191510",
    bankCode: "175",
    accountType: "ACCOUNT",
    bankName: "PUBALI BANK PLC.",
  },
  {
    vendorName: "Rotary Pilling",
    personName: "Piling Selim Uddin",
    accountNumber: "1107101825157001",
    accountName: "Md Selim Uddin",
    phoneNumber: "01818625249",
    address: "aec",
    routingNumber: "60154154",
    bankCode: "60",
    accountType: "ACCOUNT",
    bankName: "BRAC BANK PLC",
  },
  {
    vendorName: "Rafique Enterprise",
    personName: "RAFIQUE Enterprise MOSQUE Supplier",
    accountNumber: "3494901003980",
    accountName: "RAFIQUE ENTERPRISE",
    phoneNumber: "",
    address: "aec",
    routingNumber: "175300851",
    bankCode: "175",
    accountType: "ACCOUNT",
    bankName: "PUBALI BANK PLC.",
  },
  {
    vendorName: "SS Trading",
    personName: "SS Trading Stone",
    accountNumber: "0011360000424",
    accountName: "SS TRADING",
    phoneNumber: "01625980072",
    address: "aec",
    routingNumber: "95150136",
    bankCode: "95",
    accountType: "ACCOUNT",
    bankName: "EASTERN BANK PLC.",
  },
  {
    vendorName: "Daudkandi",
    personName: "Sylhet Sand Daudkandi",
    accountNumber: "2261510088447",
    accountName: "Md Minar Hossain",
    phoneNumber: "",
    address: "aec",
    routingNumber: "90192115",
    bankCode: "90",
    accountType: "ACCOUNT",
    bankName: "DUTCH-BANGLA BANK PLC.",
  },
  {
    vendorName: "Ujjal Mia",
    personName: "Ujjal Mia Sand",
    accountNumber: "3868901016194",
    accountName: "UJJAL MIA",
    phoneNumber: "01674944042",
    address: "aec",
    routingNumber: "175191510",
    bankCode: "175",
    accountType: "ACCOUNT",
    bankName: "PUBALI BANK PLC.",
  },
];

async function seedVendors() {
  console.log("🌱 Starting vendor seeding...");

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const vendor of vendorsData) {
      try {
        const description = `Contact: ${vendor.personName}${vendor.bankCode ? ` | Bank Code: ${vendor.bankCode}` : ""}${vendor.accountType ? ` | Account Type: ${vendor.accountType}` : ""}`;

        const result = await sql`
          INSERT INTO vendors (
            vendor_name,
            mailing_address,
            phone,
            email,
            description,
            bank_name,
            bank_account_number,
            bank_account_name,
            bank_routing_number,
            is_active
          ) VALUES (
            ${vendor.vendorName},
            ${vendor.address || null},
            ${vendor.phoneNumber || null},
            ${null},
            ${description},
            ${vendor.bankName || null},
            ${vendor.accountNumber || null},
            ${vendor.accountName || null},
            ${vendor.routingNumber || null},
            ${true}
          )
          RETURNING id, vendor_name
        `;

        console.log(`✅ Inserted: ${vendor.vendorName} (ID: ${result[0].id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error inserting ${vendor.vendorName}:`, error);
        errorCount++;
      }
    }

    console.log("\n📊 Seeding Summary:");
    console.log(`   ✅ Successfully inserted: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📝 Total: ${vendorsData.length}`);
  } catch (error) {
    console.error("❌ Fatal error during seeding:", error);
    throw error;
  }
}

// Run the seeding function
seedVendors()
  .then(() => {
    console.log("\n✨ Vendor seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Vendor seeding failed:", error);
    process.exit(1);
  });
