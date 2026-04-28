import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { userManager, User } from "../utils/userManager";

export type Theme = "default" | "jewel" | "amoled";

interface AppContextType {
  user: User;
  setUser: (user: User) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User>(() =>
    userManager.getCurrentUser(),
  );
  const [theme, setTheme] = useLocalStorage<Theme>(
    "smartbody_theme",
    "default",
  );

  const setUser = (newUser: User) => {
    userManager.setCurrentUser(newUser);
    setUserState(newUser);
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === "default") return "jewel";
      if (prev === "jewel") return "amoled";
      return "default";
    });
  };

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "amoled") {
      document.documentElement.classList.add("dark");
    } else {
      // All current themes are dark-based, but we can manage this more granularly if needed
      document.documentElement.classList.add("dark");
    }
  }, [theme]);

  return (
    <AppContext.Provider
      value={{ user, setUser, theme, setTheme, toggleTheme }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
