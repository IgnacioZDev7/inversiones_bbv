import React, { useRef, useState, MouseEvent } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function TiltCard({ children, className = '' }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Posición del mouse relativa al centro de la tarjeta
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Rotación muy sutil para efecto profesional (máximo ~2 grados)
    const rotateX = -(y / (rect.height / 2)) * 2; 
    const rotateY = (x / (rect.width / 2)) * 2;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.005, 1.005, 1.005)`,
      transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out', // Transición muy corta para suavizar el tracking
      boxShadow: `${-x / 15}px ${-y / 15 + 8}px 20px -5px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.03)`,
      zIndex: 10,
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.5s ease-out, box-shadow 0.5s ease-out',
      boxShadow: 'none',
      zIndex: 1,
    });
  };

  // Render inicial con transiciones base
  const finalStyle: React.CSSProperties = {
    transition: 'transform 0.5s ease-out, box-shadow 0.5s ease-out',
    ...style,
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`will-change-transform ${className}`}
      style={finalStyle}
    >
      {children}
    </div>
  );
}
