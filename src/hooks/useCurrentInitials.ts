import { useEffect, useState } from "react";

export const useCurrentInitials = (): string | null => {
  const [initials, setInitials] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("initials");
    setInitials(stored);
  }, []);

  return initials;
};
