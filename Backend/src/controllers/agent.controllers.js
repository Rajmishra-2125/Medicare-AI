import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Doctor } from "../models/doctor.models.js";
import { Slot } from "../models/slots.models.js";
import { Appointment } from "../models/appointment.models.js";
import { ChatSession } from "../models/chatSession.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import redisClient, { connectRedis } from "../config/redis.js";
import { geminiService } from "../services/gemini.service.js";
import { generateAppointmentId } from "../utils/idGenerators.js";

// Ensure Redis is connected
connectRedis();

// Helper to parse "HH:MM AM/PM" to minutes from midnight for chronological sorting
const parseTimeToMinutes = (timeStr) => {
  try {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(/\s+/);
    if (parts.length < 2) return 0;
    const time = parts[0];
    const modifier = parts[1].toUpperCase();
    let [hours, minutes] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  } catch (error) {
    console.error("Time Parse Error inside parseTimeToMinutes:", error);
    return 0;
  }
};

// ============================================================================
// 1. Tool Implementations (The logic the AI can trigger)
// ============================================================================

const searchDoctors = async ({ specialty, location, name }) => {
  try {
    const cacheKey =
      `search_doctors:${specialty || "any"}_${location || "any"}_${name || "any"}`.toLowerCase();

    if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const query = {};
    if (specialty) query.specialization = { $regex: specialty, $options: "i" };
    if (location) query.clinicAddress = { $regex: location, $options: "i" };
    if (name) {
      const sanitizedName = name.replace(/^Dr\.?\s*/i, "").trim();
      query.doctor = { $regex: sanitizedName, $options: "i" };
    }

    const doctors = await Doctor.find(query)
      .limit(5)
      .select("doctor specialization consultationFee rating experience");

    const result =
      doctors.length === 0
        ? {
            success: false,
            message: "No doctors found matching those criteria.",
          }
        : { success: true, doctors };

    if (redisClient.isOpen) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(result)); // Cache for 1 hr
    }

    return result;
  } catch (error) {
    return { success: false, message: "Failed to search doctors database." };
  }
};

const getAvailableSlots = async ({ doctorName, dateStr }) => {
  try {
    if (!doctorName)
      return { success: false, message: "Doctor name was not provided." };

    const parseTimeToHoursMinutes = (timeStr) => {
      if (!timeStr) return { hours: 0, minutes: 0 };
      const parts = timeStr.trim().split(/\s+/);
      if (parts.length < 2) return { hours: 0, minutes: 0 };
      const time = parts[0];
      const modifier = parts[1].toUpperCase();
      let [hours, minutes] = time.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) return { hours: 0, minutes: 0 };

      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      return { hours, minutes };
    };

    // Check Cache First
    const cacheKey = `slots:${doctorName}_${dateStr || "any"}`.toLowerCase();
    if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const cachedResult = JSON.parse(cached);
        if (cachedResult.success && Array.isArray(cachedResult.slots)) {
          const now = new Date();
          cachedResult.slots = cachedResult.slots.filter((s) => {
            const [y, m, d] = s.date.split("-");
            const startTimeStr = s.time.split("-")[0].trim();

            const { hours, minutes } = parseTimeToHoursMinutes(startTimeStr);
            const pad = (num) => String(num).padStart(2, "0");
            const isoString = `${y}-${pad(m)}-${pad(d)}T${pad(hours)}:${pad(minutes)}:00+05:30`;
            const slotDateTime = new Date(isoString);
            return slotDateTime.getTime() > now.getTime() + 10 * 60 * 1000;
          });

          if (cachedResult.slots.length > 0) {
            return cachedResult;
          }
        } else if (!cachedResult.success) {
          return cachedResult;
        }
      }
    }

    // The DB often stores names without 'Dr.', but the user or LLM adds it in queries
    const sanitizedName = doctorName.replace(/^Dr\.?\s*/i, "").trim();

    // Fuzzy search doctor by name first
    const doctor = await Doctor.findOne({
      doctor: { $regex: sanitizedName, $options: "i" },
    });
    if (!doctor)
      return {
        success: false,
        message: `Could not find a doctor named ${doctorName}.`,
      };

    const query = { doctorId: doctor._id, status: "AVAILABLE" };

    // If date is provided, filter by it strictly using App's UTC architecture
    if (dateStr && typeof dateStr === "string" && dateStr.includes("-")) {
      try {
        const [y, m, d] = dateStr.split("T")[0].split("-");
        const targetDate = new Date(
          Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d))
        );

        // Target exact day boundaries using pure UTC
        const nextDay = new Date(
          Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d) + 1)
        );
        query.date = { $gte: targetDate, $lt: nextDay };
      } catch (e) {
        // Fallback to today UTC if parsing fails
        const today = new Date();
        const localUTC = new Date(
          Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
        );
        query.date = { $gte: localUTC };
      }
    } else {
      // Don't show slots from passed dates (Zeroed to today UTC)
      const today = new Date();
      const localUTC = new Date(
        Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
      );
      query.date = { $gte: localUTC };
    }

    // Fetch matching slots (up to 100 to keep it efficient)
    const rawSlots = await Slot.find(query).limit(100).lean();

    // Sort slots chronologically in JS to prevent alphabetical sort bugs and filter out past slots for today
    const slots = [...rawSlots]
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB;

        const timeA = parseTimeToMinutes(a.startTime);
        const timeB = parseTimeToMinutes(b.startTime);
        return timeA - timeB;
      })
      .filter((s) => {
        // Construct the exact slot date and start time in Asia/Kolkata timezone
        const year = s.date.getUTCFullYear();
        const month = s.date.getUTCMonth(); // 0-indexed
        const date = s.date.getUTCDate();

        const { hours, minutes } = parseTimeToHoursMinutes(s.startTime);
        const pad = (num) => String(num).padStart(2, "0");
        const isoString = `${year}-${pad(month + 1)}-${pad(date)}T${pad(hours)}:${pad(minutes)}:00+05:30`;
        const slotDateTime = new Date(isoString);

        const now = new Date();
        // Return true only if slot time is in the future (with 10 minutes buffer)
        return slotDateTime.getTime() > now.getTime() + 10 * 60 * 1000;
      });

    if (slots.length === 0) {
      return {
        success: false,
        message: `No available slots found for Dr. ${doctor.doctor}.`,
      };
    }

    const result = {
      success: true,
      doctor: doctor.doctor,
      slots: slots.map((s) => ({
        date: s.date.toISOString().split("T")[0], // Extract pure YYYY-MM-DD
        time: `${s.startTime} - ${s.endTime}`,
        fee: doctor.consultationFee,
      })),
    };

    // Cache the successful slots response for 5 minutes
    if (redisClient.isOpen) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
    }

    return result;
  } catch (error) {
    return { success: false, message: "Error retrieving slots." };
  }
};

const bookAppointment = async (
  patientId,
  { doctorName, date, time, reason, meetingType }
) => {
  try {
    const sanitizedName = doctorName.replace(/^Dr\.?\s*/i, "").trim();
    const doctor = await Doctor.findOne({
      doctor: { $regex: sanitizedName, $options: "i" },
    });
    if (!doctor)
      return {
        success: false,
        message: `Could not find a doctor named ${doctorName}.`,
      };

    if (!date || !time) {
      return {
        success: false,
        message:
          "You must provide both the exact date (YYYY-MM-DD) and the time to book an appointment.",
      };
    }

    // Isolate the start time for fuzzy regex matching (e.g. "09:00 AM - 09:30 AM" -> "09:00 AM")
    const startTimeMatch = time.split("-")[0].trim();

    // Parse target date boundaries using UTC
    const [y, m, d] = date.split("-");
    const targetDate = new Date(
      Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d))
    );
    const nextDay = new Date(
      Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d) + 1)
    );

    // Verify and book slot atomically
    const slot = await Slot.findOneAndUpdate(
      {
        doctorId: doctor._id,
        date: { $gte: targetDate, $lt: nextDay },
        startTime: { $regex: startTimeMatch, $options: "i" },
        status: "AVAILABLE",
      },
      {
        status: "BOOKED",
        bookedBy: patientId,
      },
      { new: true }
    );

    if (!slot) {
      return {
        success: false,
        message:
          "The requested slot is either not available or has already been booked.",
      };
    }

    // Generate proper Appointment ID
    const appointmentId = await generateAppointmentId();

    // Create appointment
    const newApt = await Appointment.create({
      appointmentId,
      patientId,
      doctorId: doctor._id,
      slotId: slot._id,
      slotNumber: slot.slotNumber,
      date: slot.date,
      timeSlots: `${slot.startTime}-${slot.endTime}`,
      reason: reason || "General Consultation via AI Assistant",
      status: "PENDING",
      consultationFee: doctor.consultationFee,
      meetingType: meetingType || "IN_PERSON",
    });

    // Invalidate Cache
    if (redisClient.isOpen) {
      const cacheKeyWithDate = `slots:${doctorName}_${date}`.toLowerCase();
      const cacheKeyWithoutDate = `slots:${doctorName}_any`.toLowerCase();
      await redisClient.del(cacheKeyWithDate);
      await redisClient.del(cacheKeyWithoutDate);
    }

    return {
      success: true,
      message: `Appointment slot successfully reserved with Dr. ${doctor.doctor} on ${slot.date.toLocaleDateString()} at ${slot.startTime}. Appointment Number: ${newApt.appointmentId}. Please tell the patient their slot is reserved for 15 minutes. You MUST give them this exact relative markdown payment link to complete their payment: [Complete Payment](/patient/payment/${newApt._id}). Do NOT modify this link, do NOT replace the ID, and do NOT construct any other payment URL.`,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.message || "Failed to book appointment due to a system error.",
    };
  }
};

// ============================================================================
// 2. Gemini Tool Declarations
// ============================================================================

const systemTools = [
  {
    functionDeclarations: [
      {
        name: "search_doctors",
        description:
          "Search for doctors in the hospital based on medical specialty, location, or name.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            specialty: {
              type: SchemaType.STRING,
              description:
                "Medical specialty, e.g., 'Cardiologist', 'Dermatologist'",
            },
            location: {
              type: SchemaType.STRING,
              description: "City or specific location",
            },
            name: {
              type: SchemaType.STRING,
              description:
                "Name of the doctor, e.g., 'Raj Mishra', 'Dr. Smith'",
            },
          },
        },
      },
      {
        name: "get_available_slots",
        description:
          "Get available appointment timings for a specific doctor. Ensure doctorName matches exact full name returned from search_doctors.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            doctorName: {
              type: SchemaType.STRING,
              description: "The name of the doctor",
            },
            dateStr: {
              type: SchemaType.STRING,
              description: "Optional ISO date string YYYY-MM-DD",
            },
          },
          required: ["doctorName"],
        },
      },
      {
        name: "book_appointment",
        description:
          "Physically lock and book the appointment slot in the database for the user.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            doctorName: { type: SchemaType.STRING },
            date: {
              type: SchemaType.STRING,
              description:
                "The exact calendar date of the requested slot returned by get_available_slots (YYYY-MM-DD)",
            },
            time: {
              type: SchemaType.STRING,
              description:
                "The exact time of the slot returned by get_available_slots (e.g. 09:00 AM - 09:30 AM)",
            },
            reason: {
              type: SchemaType.STRING,
              description:
                "Patient's description of their symptoms or reason for visit",
            },
            meetingType: {
              type: SchemaType.STRING,
              description:
                "The user's preferred meeting type: 'ONLINE' for Video Call or 'IN_PERSON' for traditional clinic visits",
            },
          },
          required: ["doctorName", "date", "time", "reason", "meetingType"],
        },
      },
    ],
  },
];

// ============================================================================
// 3. Main Chat Interface Controller
// ============================================================================

export const handleAgentChat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const patientId = req.user._id;

  // Sanitize message: strip HTML tags
  const sanitizedMessage = message
    ? message.replace(/<[^>]*>/g, "").trim()
    : "";
  if (!sanitizedMessage) {
    throw new ApiError(400, "Message content is required");
  }

  if (geminiService.keys.length === 0) {
    throw new ApiError(
      500,
      "GEMINI_API_KEYS are missing from the environment variables."
    );
  }

  // Load chat session from MongoDB
  let chatSessionObj = await ChatSession.findOne({ patientId });
  if (!chatSessionObj) {
    chatSessionObj = await ChatSession.create({ patientId, history: [] });
  }

  const currentDate = new Date();
  const readableDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const isoDate = currentDate.toISOString().split("T")[0];

  // Set headers for SSE streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    await geminiService.executeWithRotation(async (genAI) => {
      // Define the base model prompt configuring its persona and safety disclaimers
      const model = genAI.getGenerativeModel({
        model: geminiService.modelName,
        systemInstruction: `You are MediBot, an AI appointment assistant for our hospital portal.
CRITICAL CONTEXT: Today is ${readableDate} (YYYY-MM-DD: ${isoDate}). When a user requests slots for 'today', 'tomorrow', or any relative day, you MUST mathematically calculate the correct YYYY-MM-DD date using this real-time calendar and explicitly pass it as the "dateStr" parameter to get_available_slots!


PERSONA: Compassionate, concise, and professional. Never mention internal tool names or IDs to patients.

STRICT RULES FOR TOOL USE:
1. search_doctors → Pass only the bare name (no "Dr." prefix) e.g. "Raj Mishra" not "Dr.Raj".
2. get_available_slots → Use the EXACT full doctor name returned from search_doctors result (e.g., "Dr. Raj Mishra"). Show only five slots when user ask for other slot for that day then show all the slots.
3. book_appointment → ALWAYS ask the patient for their preferred meeting type (Online Video Call vs. In-Person Visit) and confirm the exact date and time with the patient before booking. You must pass the exact "date" and "time" strings returned by get_available_slots, and pass the selected "meetingType" ('ONLINE' for Video Call, 'IN_PERSON' for In-Person visit) into this tool!
4. location → NEVER ask the user for a location or city. We operate a single-location hospital. Ignore location parameters.
5. emergency: say I am an AI assistant, not a medical doctor. For life-threatening emergencies, please contact your local emergency services immediately.

CONVERSATION FLOW:
- If user mentions a doctor name → call search_doctors first.
- If user asks for timings/slots → call get_available_slots.
- Before booking → summarize slot details and ask "Shall I reserve this appointment?".
- After booking → share the reference ID, wish them well, and you MUST output the EXACT relative markdown payment link returned by the book_appointment tool (which is in the format [Complete Payment](/patient/payment/<object_id>)). CRITICAL: You must NEVER construct your own payment link, never use example.com, and never replace the object ID with the 6-digit reference number. Output the relative link exactly as returned by the tool! Warn them that the slot is only reserved for 15 minutes until they pay.

FALLBACKS:
- If no doctor found → DO NOT ask the user about spelling or uppercase/lowercase. The database is already case-insensitive. Simply state the doctor is not on staff and offer to show alternative doctors matching their specialty!
- If no slots found → apologize and suggest trying a different date.
- Never make up doctor names, slots, or fees.
- Never tell fees in $, use ₹. consultationFee coming from database is in ₹.`,
        tools: systemTools,
      });

      // Start chat session with persistent history
      const chat = model.startChat({
        history: chatSessionObj.history || [],
      });

      let currentInput = sanitizedMessage;
      let round = 0;
      const maxRounds = 5;

      while (round < maxRounds) {
        const responseStream = await chat.sendMessageStream(currentInput);
        let isToolCall = false;

        for await (const chunk of responseStream.stream) {
          if (chunk.functionCalls && chunk.functionCalls.length > 0) {
            isToolCall = true;
          }

          try {
            const text = chunk.text();
            if (text && text.trim() !== "") {
              // Write text chunk directly to client in SSE format
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          } catch (e) {
            // Skip if no text chunk
          }
        }

        const finalResponse = await responseStream.response;
        const calls = finalResponse.functionCalls();

        if (calls && calls.length > 0) {
          // Resolve functions
          const functionResponses = await Promise.all(
            calls.map(async (call) => {
              let functionData = null;

              if (call.name === "search_doctors") {
                functionData = await searchDoctors(call.args);
              } else if (call.name === "get_available_slots") {
                functionData = await getAvailableSlots(call.args);
              } else if (call.name === "book_appointment") {
                functionData = await bookAppointment(patientId, call.args);
              }

              return {
                functionResponse: {
                  name: call.name,
                  response: functionData || {
                    error: "Unknown internal resolution failure.",
                  },
                },
              };
            })
          );

          currentInput = functionResponses;
          round++;
        } else {
          // Final response text completed, break function calling round loop
          break;
        }
      }

      // Securely sanitize, filter, and cap chat history to last 20 messages, excluding function call/response parts
      const rawHistory = await chat.getHistory();
      const cleanedHistory = rawHistory
        .filter((msg) => {
          if (msg.role !== "user" && msg.role !== "model") return false;
          if (!msg.parts || msg.parts.length === 0) return false;
          const hasFunctionParts = msg.parts.some(
            (part) => part.functionCall || part.functionResponse
          );
          return !hasFunctionParts;
        })
        .slice(-20); // Keep last 20 messages (10 turns)

      chatSessionObj.history = cleanedHistory;
      await chatSessionObj.save();
    });
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("LLM Engine Fault:", error.message);
    res.write(
      `data: ${JSON.stringify({ error: "Sorry! We are facing high traffic. Please continue with manual method." })}\n\n`
    );
    res.end();
  }
});

// Load patient chat history
export const getChatHistory = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const session = await ChatSession.findOne({ patientId });

  let uiHistory = [];
  if (session && session.history) {
    uiHistory = session.history
      .filter((msg) => msg.role === "user" || msg.role === "model")
      .map((msg) => ({
        role: msg.role === "model" ? "assistant" : "user",
        text: msg.parts.map((p) => p.text || "").join(""),
      }))
      .filter((msg) => msg.text && msg.text.trim() !== "");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, uiHistory, "Chat history loaded."));
});

// Clear patient chat history
export const clearChatHistory = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  await ChatSession.deleteOne({ patientId });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Chat history cleared."));
});
