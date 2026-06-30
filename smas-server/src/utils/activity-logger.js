class ActivityLogger {
    constructor(limit = 20) {
      this.limit = limit;
      this.logs = [];
    }
  
    /**
     * Add a new log entry
     * @param {string} heading - Short title of the log
     * @param {string} body - Detailed description of the activity
     */
    add(heading, body) {
      if (this.logs.length >= this.limit) {
        this.logs.shift(); // remove oldest
      }
      this.logs.push({
        heading,
        body,
        time: new Date().toISOString() // formatted timestamp
      });
    }
  
    /**
     * Get all logs
     * @returns {Array} - Array of log objects
     */
    getAll() {
      return this.logs;
    }
  }
  
  module.exports = { ActivityLogger };