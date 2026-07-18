// Placeholders con la misma silueta que el contenido real que están anticipando.
// Reutilizan las clases reales (.character-card, .card, .users-table) para que el
// "salto" al llegar los datos sea mínimo — solo agregan el shimmer (.skeleton).

export function CharacterCardSkeleton() {
  return (
    <div className="character-card">
      <div className="character-card-image skeleton" />
      <div className="character-card-info">
        <div className="skeleton skeleton-line skeleton-line--title" />
        <div className="skeleton skeleton-line skeleton-line--short" />
        <div className="skeleton skeleton-line skeleton-line--long" />
      </div>
      <div className="skeleton skeleton-badge" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card">
      <div className="skeleton skeleton-line skeleton-line--label" />
      <div className="skeleton skeleton-line skeleton-line--value" />
      <div className="skeleton skeleton-line skeleton-line--short" />
    </div>
  );
}

export function TableRowSkeleton({ columns }: { columns: number }) {
  return (
    <tr>
      {Array.from({ length: columns }, (_, i) => (
        <td key={i}>
          <div className="skeleton skeleton-line skeleton-line--short" />
        </td>
      ))}
    </tr>
  );
}
