import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    performedByRole: {
      type: String,
      enum: ["PATIENT", "DOCTOR", "ADMIN", "SYSTEM"],
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      required: true,
      index: true,
    },
    details: {
      type: String,
      maxlength: [2000, "Details cannot exceed 2000 characters"],
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: "timestamp", updatedAt: false }, // HIPAA logs must be immutable (no updates)
  }
);

// Block any updates or deletions to audit logs to ensure immutable HIPAA logs
auditLogSchema.pre("save", function (next) {
  if (!this.isNew) {
    return next(
      new Error(
        "HIPAA Compliance: Audit logs are immutable and cannot be updated."
      )
    );
  }
  next();
});

auditLogSchema.pre(
  [
    "updateOne",
    "findByIdAndUpdate",
    "findOneAndUpdate",
    "updateMany",
    "remove",
    "deleteOne",
    "deleteMany",
  ],
  function (next) {
    next(
      new Error(
        "HIPAA Compliance: Audit logs are immutable and cannot be modified or deleted."
      )
    );
  }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
