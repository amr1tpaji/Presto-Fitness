import { cloneElement, isValidElement } from 'react';

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  required = false,
  name,
  className = '',
  ...rest
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label" htmlFor={name}>
          {label}
          {required && <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <div className="form-input-wrapper">
        {Icon && (
          isValidElement(Icon) 
            ? cloneElement(Icon, { className: 'form-input-icon', size: 18 }) 
            : <Icon className="form-input-icon" size={18} />
        )}
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`form-input ${Icon ? 'has-icon' : ''} ${error ? 'error' : ''}`}
          {...rest}
        />
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
