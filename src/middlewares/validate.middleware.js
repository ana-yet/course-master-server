import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    // Create a readable error message from the first error
    const message = errors.length > 0 ? errors[0].message : "Validation failed";

    next(new ApiError(400, message, errors));
  }
};
