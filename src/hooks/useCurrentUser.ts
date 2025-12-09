import { useEffect, useState } from "react";

export const useCurrentUser = (): string | null => {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("username");
    setUsername(stored);
  }, []);

  return username;
};
