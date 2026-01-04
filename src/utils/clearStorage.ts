/**
 * Utility to clear all application data
 * Used when participants start fresh sessions
 */
export const clearAllData = () => {
  // Clear localStorage
  const keysToKeep = ['pendingParticipantId', 'pendingAiEnabled']; // Keep URL params
  const storage = { ...localStorage };
  
  Object.keys(storage).forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });

  // Clear sessionStorage except pending params
  const sessionKeysToKeep = ['pendingParticipantId', 'pendingAiEnabled'];
  const sessionStorage = { ...window.sessionStorage };
  
  Object.keys(sessionStorage).forEach(key => {
    if (!sessionKeysToKeep.includes(key)) {
      window.sessionStorage.removeItem(key);
    }
  });

  // Clear IndexedDB if used
  if (window.indexedDB) {
    window.indexedDB.databases().then((databases) => {
      databases.forEach((db) => {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      });
    });
  }
};

/**
 * Check if this is a fresh participant session and clear data if needed
 */
export const checkAndClearForParticipant = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const participantId = urlParams.get('participantId');
  
  if (participantId) {
    const lastParticipantId = localStorage.getItem('lastParticipantId');
    
    // If different participant or first time, clear everything
    if (lastParticipantId !== participantId) {
      clearAllData();
      localStorage.setItem('lastParticipantId', participantId);
    }
  }
};
