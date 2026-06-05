import { AuditLog } from "../models/auditLog.models.js";

/**
 * Creates an immutable HIPAA-compliant audit log entry in the database.
 *
 * @param {Object} req - Express request object (to extract IP, user agent, performer info)
 * @param {Object} logData - Log entry details
 * @param {string} logData.action - Action name (e.g. READ_PHI, WRITE_PHI, AUTH_LOGIN)
 * @param {string} logData.resourceType - Type of resource (e.g. MEDICAL_RECORD, APPOINTMENT)
 * @param {string} [logData.resourceId] - ID of the resource
 * @param {string} [logData.patientId] - Target patient User ID
 * @param {string} [logData.status] - SUCCESS or FAILED
 * @param {string} [logData.details] - Extra details
 */
export const logAudit = async (req, logData) => {
  try {
    const ipAddress =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "0.0.0.0";
    const userAgent = req.headers["user-agent"] || "";

    const performedBy = req.user?._id;
    const performedByRole = req.user?.role || "SYSTEM";

    const logEntry = {
      action: logData.action,
      performedBy,
      performedByRole,
      patientId: logData.patientId || null,
      resourceType: logData.resourceType,
      resourceId: logData.resourceId || null,
      status: logData.status || "SUCCESS",
      details: logData.details || "",
      ipAddress,
      userAgent,
    };

    // If performedBy is not set (e.g. anonymous/system), we can set a fallback system ID if available
    if (!logEntry.performedBy) {
      // Create a temporary placeholder object id to represent SYSTEM
      // or default it to an admin's account. For anonymized logs we can map to a specific system user.
      return; // Skip if no user is authenticated and it's not a SYSTEM event, or support custom system logs
    }

    await AuditLog.create(logEntry);
  } catch (error) {
    console.error("❌ HIPAA Audit Logging Error:", error.message);
  }
};
