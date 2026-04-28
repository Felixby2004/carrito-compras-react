// src/components/Price.tsx
import React from 'react';

interface PriceProps {
  value: number | string | null | undefined;
  className?: string;
}

export const Price: React.FC<PriceProps> = ({ value, className = '' }) => {
  // Convertir a número de forma segura
  const numericValue = (() => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    return 0;
  })();
  
  // Si es NaN, mostrar 0.00
  const finalValue = isNaN(numericValue) ? 0 : numericValue;
  
  return <span className={className}>S/{finalValue.toFixed(2)}</span>;
};