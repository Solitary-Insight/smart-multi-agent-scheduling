 class RescheduleError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = "RescheduleError";
    this.code = code;
    this.details = details;
  }
}
 const ERROR_CODES = {
  SLOT_NOT_FOUND: "SLOT_NOT_FOUND",
  INVALID_TEACHER: "INVALID_TEACHER",
  RESCHEDULE_NOT_FOUND: "RESCHEDULE_NOT_FOUND",
  DB_ERROR: "DB_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
};


module.exports={ERROR_CODES,RescheduleError}