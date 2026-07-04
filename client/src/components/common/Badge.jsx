export default function Badge({ children, variant = 'default', size = 'md' }) {
  const sizeClass = size !== 'md' ? `badge-${size}` : '';
  const variantClass = variant !== 'default' ? `badge-${variant}` : '';

  return (
    <span className={`badge ${variantClass} ${sizeClass}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
