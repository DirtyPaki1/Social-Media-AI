import { createContext, useContext, useState, ReactNode } from "react";

interface RateLimitContextType {
  remaining: number | null;
  limit: number | null;
  reset: number | null;
  updateRateLimit: (remaining: number, limit: number, reset: number) => void;
}

const RateLimitContext = createContext<RateLimitContextType | null>(null);

export function RateLimitProvider({ children }: { children: ReactNode }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [reset, setReset] = useState<number | null>(null);

  const updateRateLimit = (remaining: number, limit: number, reset: number) => {
    setRemaining(remaining);
    setLimit(limit);
    setReset(reset);
  };

  return (
    <RateLimitContext.Provider
      value={{ remaining, limit, reset, updateRateLimit }}
    >
      {children}
    </RateLimitContext.Provider>
  );
}

export const useRateLimit = () => {
  const context = useContext(RateLimitContext);
  if (!context)
    throw new Error("useRateLimit must be used within a RateLimitProvider");
  return context;
};
