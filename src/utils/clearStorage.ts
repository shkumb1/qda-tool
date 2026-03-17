/**
 * Utility to clear all application data
 * Used when participants start fresh sessions
 */
export const clearAllData = () => {
  // Clear localStorage completely for fresh start
  localStorage.clear();

  // Clear sessionStorage
  sessionStorage.clear();

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
  const participantId = urlParams.get("participantId");
  const forceClear = urlParams.get("clear"); // Add ?clear=true to force clear

  // Force clear if ?clear=true parameter is present
  if (forceClear === "true") {
    clearAllData();
    // Remove the clear parameter from URL to avoid clearing on refresh
    urlParams.delete("clear");
    const newUrl = `${window.location.pathname}${urlParams.toString() ? "?" + urlParams.toString() : ""}`;
    window.history.replaceState({}, "", newUrl);
    return;
  }

  if (participantId) {
    const lastParticipantId = localStorage.getItem("lastParticipantId");

    // If different participant or first time, clear everything
    if (lastParticipantId !== participantId) {
      clearAllData();
      localStorage.setItem("lastParticipantId", participantId);
    }
  }
};
