import { ApiError } from "../utils/ApiError.js";

export const validateSchema = (schema) => (req, res, next) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body || {});
    }
    if (schema.query) {
      req.query = schema.query.parse(req.query || {});
    }
    if (schema.params) {
      req.params = schema.params.parse(req.params || {});
    }
    next();
  } catch (error) {
    const errorDetails = error.errors
      ? error.errors.map((err) => `${err.path.join(".")}: ${err.message}`)
      : [error.message];
    next(new ApiError(400, "Validation failed", errorDetails));
  }
};
