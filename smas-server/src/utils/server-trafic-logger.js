class ServerTrafficLogger {
    /**
     * @param {number} limit - Max number of logs to keep in memory.
     */
    constructor(limit = 100) {
      this.limit = limit;
      this.logs = [];
    }
  
    /**
     * Log a server interaction
     * @param {Object} req - The request object (express-like)
     * @param {Object} res - The response data/metadata
     * @param {number} duration - Request timeout/duration in ms
     */
    log(req, res, duration) {
      if (this.logs.length >= this.limit) {
        this.logs.shift();
      }
  
      const logEntry = {
        timestamp: new Date().toISOString(),
        // Request Info
        path: req.path || req.url,
        method: req.method,
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        device: req.headers['user-agent'],
        
        // Response Info
        statusCode: res.statusCode || res.code,
        responseData: res.data || null, // Be careful with large JSON payloads
        
        // Performance
        duration: `${duration}ms`,
        isTimeout: duration > (req.timeoutLimit || 5000),
        
        // Metadata
        importance: this._getImportance(res.statusCode)
      };
  
      this.logs.push(logEntry);
    }
  
    /**
     * Internal logic to tag "important" info (e.g., 4xx or 5xx errors)
     */
    _getImportance(code) {
      if (code >= 500) return 'CRITICAL';
      if (code >= 400) return 'WARNING';
      return 'INFO';
    }
  
    getAll() {
      return this.logs;
    }
  
    clear() {
      this.logs = [];
    }
  }
  
  module.exports = { ServerTrafficLogger };