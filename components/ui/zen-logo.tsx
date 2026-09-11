/**
 * ZenLogo — monogramme SVG personnalisé
 *
 * Concept : un "Z" construit à partir de deux segments horizontaux (raison /
 * clarté) reliés par une diagonale dynamique. La diagonale est légèrement
 * plus fine que les horizontales, ce qui crée un rythme visuel plutôt qu'un
 * caractère typographique générique. La couleur par défaut est le sapin #2D5D53.
 */

interface ZenLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export function ZenLogo({
  size = 28,
  color = "#2D5D53",
  className,
}: ZenLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Segment supérieur horizontal */}
      <line
        x1="5"
        y1="7"
        x2="23"
        y2="7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Diagonale — plus fine, descend droite→gauche */}
      <line
        x1="22"
        y1="8"
        x2="6"
        y2="20"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Segment inférieur horizontal */}
      <line
        x1="5"
        y1="21"
        x2="23"
        y2="21"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
