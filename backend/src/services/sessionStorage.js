// Shared in-memory session storage for upload and analysis endpoints
// In production, this should be replaced with Redis or database storage

// Session timeout for Vercel deployment (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

class SessionStorage {
  constructor() {
    this.sessions = new Map();
    
    // Auto-cleanup old sessions for memory management in serverless
    setInterval(() => {
      this.clearExpiredSessions(0.5); // Clear sessions older than 30 minutes
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  createSession(sessionId, data) {
    this.sessions.set(sessionId, {
      data,
      timestamp: new Date().toISOString(),
      analyses: {}
    });
    console.log(`📝 Session created: ${sessionId}`);
    return sessionId;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  hasSession(sessionId) {
    return this.sessions.has(sessionId);
  }

  updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      return session;
    }
    return null;
  }

  deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  getAllSessionIds() {
    return Array.from(this.sessions.keys());
  }

  getSessionCount() {
    return this.sessions.size;
  }

  clearExpiredSessions(maxAgeHours = 24) {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    let deleted = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (new Date(session.timestamp) < cutoffTime) {
        this.sessions.delete(sessionId);
        deleted++;
      }
    }

    if (deleted > 0) {
      console.log(`🧹 Cleaned up ${deleted} expired sessions`);
    }

    return deleted;
  }
}

// Export singleton instance
module.exports = new SessionStorage();
