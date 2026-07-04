export default function Card({ children, className = '', onClick, hoverable = false }) {
  return (
    <div
      className={`card ${hoverable ? 'hoverable' : ''} ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {children}
    </div>
  );
}
