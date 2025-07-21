// Server-safe date formatting utilities
// These functions return consistent strings regardless of server/client timezone

export function formatDateISO(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch (error) {
    return 'Invalid Date';
  }
}

export function formatDateSimple(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    return 'Invalid Date';
  }
}

export function formatDateWithMonth(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const year = dateObj.getFullYear();
    const month = months[dateObj.getMonth()];
    const day = dateObj.getDate();
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    return 'Invalid Date';
  }
}

export function formatDateTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toISOString().replace('T', ' ').substring(0, 19);
  } catch (error) {
    return 'Invalid Date';
  }
}

// For form inputs and database operations
export function getDateInputValue(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
}

// Check if date is valid
export function isValidDate(date: string | Date): boolean {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return !isNaN(dateObj.getTime());
  } catch (error) {
    return false;
  }
}

// Get relative time (e.g., "2 days ago") - server safe
export function getRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays > 1 && diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays >= 7 && diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffDays >= 30 && diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  } catch (error) {
    return 'Invalid Date';
  }
}