"use client";

import { ReactNode, useState, useEffect } from 'react';

interface HydrationBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/**
 * HydrationBoundary component to prevent hydration mismatches
 * Use this component around elements that may render differently on server vs client
 * (e.g., dates, user-specific content, browser-dependent content)
 */
export function HydrationBoundary({ 
  children, 
  fallback = null,
  className = '' 
}: HydrationBoundaryProps) {
  return (
    <div className={className} suppressHydrationWarning>
      {children}
    </div>
  );
}

/**
 * NoSSR component - only renders on client side
 * Use this for components that should never be server-side rendered
 */
export function NoSSR({ 
  children, 
  fallback = <div>Loading...</div> 
}: { 
  children: ReactNode; 
  fallback?: ReactNode; 
}) {
  if (typeof window === 'undefined') {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * ClientOnly component with useState tracking
 * More reliable than NoSSR for complex components
 */
export function ClientOnly({ 
  children, 
  fallback = <div>Loading...</div> 
}: { 
  children: ReactNode; 
  fallback?: ReactNode; 
}) {
  // React hooks are already imported at the top
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}