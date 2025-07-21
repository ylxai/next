"use client";

import { useEffect, useState } from 'react';

interface DateDisplayProps {
  date: string | Date;
  format?: 'short' | 'long' | 'medium';
  locale?: string;
  className?: string;
  fallback?: string;
}

export function DateDisplay({ 
  date, 
  format = 'short', 
  locale = 'id-ID',
  className = '',
  fallback = 'Invalid Date'
}: DateDisplayProps) {
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObj.getTime())) {
        setFormattedDate(fallback);
        return;
      }

      let options: Intl.DateTimeFormatOptions;
      
      switch (format) {
        case 'long':
          options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          };
          break;
        case 'medium':
          options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          };
          break;
        case 'short':
        default:
          options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          };
          break;
      }

      const formatted = dateObj.toLocaleDateString(locale, options);
      setFormattedDate(formatted);
    } catch (error) {
      console.error('Date formatting error:', error);
      setFormattedDate(fallback);
    }
  }, [date, format, locale, fallback]);

  // Prevent hydration mismatch by showing placeholder until client renders
  if (!isClient) {
    return <span className={className}>Loading...</span>;
  }

  return <span className={className}>{formattedDate}</span>;
}

// Helper component for just the date part (no time)
export function DateOnly({ 
  date, 
  className = '',
  locale = 'id-ID' 
}: { 
  date: string | Date; 
  className?: string; 
  locale?: string; 
}) {
  return (
    <DateDisplay 
      date={date} 
      format="short" 
      locale={locale}
      className={className}
    />
  );
}

// Helper component for date with month name
export function DateWithMonth({ 
  date, 
  className = '',
  locale = 'id-ID' 
}: { 
  date: string | Date; 
  className?: string; 
  locale?: string; 
}) {
  return (
    <DateDisplay 
      date={date} 
      format="medium" 
      locale={locale}
      className={className}
    />
  );
}

// Helper component for full date with day name
export function DateFull({ 
  date, 
  className = '',
  locale = 'id-ID' 
}: { 
  date: string | Date; 
  className?: string; 
  locale?: string; 
}) {
  return (
    <DateDisplay 
      date={date} 
      format="long" 
      locale={locale}
      className={className}
    />
  );
}