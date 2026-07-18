import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "../store";

// Botón compartido por Landing, Login y DashboardLayout — misma lógica de tema
// en los tres puntos de entrada de la UI (dentro y fuera del layout autenticado).
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isLight = theme === "light";

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      title={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      aria-label={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
    >
      {isLight ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
