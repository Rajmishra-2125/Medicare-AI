/**
 * Validates that all critical environment variables are present at startup.
 * Exits the process immediately (exit code 1) with clear diagnostic logs if any are missing.
 */
export const validateEnvironment = () => {
  const criticalKeys = [
    "MONGODB_URI",
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
    "CORS_ORIGIN",
    "CASHFREE_APP_ID",
    "CASHFREE_SECRET_KEY"
  ];

  const missing = [];
  
  criticalKeys.forEach(key => {
    if (!process.env[key] || process.env[key].trim() === "") {
      missing.push(key);
    }
  });

  // Check for at least one Gemini API key: either the list variable or key 1
  const geminiKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY_1;
  if (!geminiKeys || geminiKeys.trim() === "") {
    missing.push("GEMINI_API_KEYS (or GEMINI_API_KEY_1)");
  }

  if (missing.length > 0) {
    console.error("\n========================================================");
    console.error("❌  CRITICAL SERVER CONFIGURATION ERROR: MISSING ENV KEYS");
    console.error("========================================================");
    console.error("The server cannot boot because the following environment");
    console.error("variables are missing or empty:\n");
    
    missing.forEach(key => {
      console.error(`   👉  ${key}`);
    });
    
    console.error("\nPlease check your .env file or local orchestration secrets.");
    console.error("Server is shutting down immediately to prevent runtime faults.");
    console.error("========================================================\n");
    
    process.exit(1);
  } else {
    console.log("⭐ Environment variables validated successfully.");
  }
};
