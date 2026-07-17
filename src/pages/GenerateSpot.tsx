import { Film } from "lucide-react";

export default function GenerateSpot() {
  return (
    <div className="page">
      <h1>Generar Spot</h1>
      <div className="coming-soon">
        <Film size={40} className="feature-icon" />
        <h2>Próximamente</h2>
        <p>
          La generación de spots de video (personaje + guion → video corto o largo)
          está en desarrollo. Mientras tanto, creá y elegí tus personajes en la
          sección Personajes — quedarán listos para usarse acá.
        </p>
      </div>
    </div>
  );
}
