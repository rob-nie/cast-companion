
// This file is kept for historical reasons.
// All Firebase functionality has been migrated to Supabase.
// It can be safely deleted once all references are removed.

export const QUERY_LIMIT = 5;
export const SHARED_QUERY_LIMIT = 3;
export const RECENT_DATA_DAYS = 7;

export const INDEXES = {
  PROJECT_OWNER: 'project_owner_idx',
  PROJECT_MEMBER: 'project_member_idx',
  PROJECT_LAST_ACCESSED: 'project_last_accessed_idx'
};

// Function to get a date object for recent data filtering
export const getRecentDateThreshold = () => {
  const date = new Date();
  date.setDate(date.getDate() - RECENT_DATA_DAYS);
  return date;
};
