import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return (
    <button className="flex items-center px-4 py-2 bg-blue-500 text-white" onClick={onClick}>
      {label}
    </button>
  );
}
