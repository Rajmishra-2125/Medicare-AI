import { Router } from "express";
import rateLimit from "express-rate-limit";
import { handleAgentChat, getChatHistory, clearChatHistory } from "../controllers/agent.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { isPatient } from "../middlewares/isPatient.js";

const router = Router();

// Strict rate limiter for AI Agent to protect LLM quotas
const agentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 chat requests per windowMs
  message: {
    statusCode: 429,
    success: false,
    message:
      "You have reached the chat limit. Please wait a moment before sending more messages.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Secure the agent route so only authenticated patients can use it
router.route("/chat").post(verifyJWT, isPatient, agentLimiter, handleAgentChat);

// History management routes
router.route("/history")
  .get(verifyJWT, isPatient, getChatHistory)
  .delete(verifyJWT, isPatient, clearChatHistory);

export default router;
