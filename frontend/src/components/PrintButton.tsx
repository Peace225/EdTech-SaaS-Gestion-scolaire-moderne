// frontend/src/components/PrintButton.tsx
"use client";

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="bg-white text-black px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors shadow-sm"
    >
      Imprimer Bulletin PDF
    </button>
  );
}