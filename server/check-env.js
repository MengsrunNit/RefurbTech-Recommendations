import { config as dotenvConfig } from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the same directory as this script
dotenvConfig({ path: path.join(__dirname, '.env'), override: true });

console.log("\n🔍 Checking Server Environment...\n");

const checks = [
    { name: "OPENAI_API_KEY", value: process.env.OPENAI_API_KEY, required: true },
    { name: "MONGODB_URI", value: process.env.MONGODB_URI, required: true },
    { name: "PORT", value: process.env.PORT, required: false, default: "3000" },
    { name: "NODE_ENV", value: process.env.NODE_ENV, required: false, default: "development" }
];

let hasError = false;

checks.forEach(check => {
    const exists = !!check.value;
    const status = exists ? "✅ Set" : (check.required ? "❌ MISSING" : "⚠️  Not set (using default)");
    
    console.log(`${check.name.padEnd(20)}: ${status}`);
    
    if (exists && check.name === "OPENAI_API_KEY") {
        if (check.value.startsWith("sk-")) {
            console.log(`   (Format looks correct: starts with sk-...)`);
        } else {
            console.log(`   (⚠️  Warning: Key format looks unusual)`);
        }
    }

    if (check.required && !exists) {
        hasError = true;
    }
});

console.log("\n---------------------------------------------------");
if (hasError) {
    console.log("❌ CRITICAL: Missing required environment variables.");
    console.log("   Please create a .env file in the 'server/' directory.");
    console.log("   You can copy .env.example to .env and fill in the values.");
    process.exit(1);
} else {
    console.log("✅ Environment looks good! You can start the server.");
    process.exit(0);
}
