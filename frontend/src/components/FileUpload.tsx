import React, { useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (file: { name: string; type: string; content: string }) => void;
  disabled?: boolean;
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    background: 'none',
    border: '1px solid #2d3a4f',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
};

export default function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      onFileSelect({ name: file.name, type: file.type, content });
    };

    if (file.type.includes('text') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }

    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json,.txt,.xlsx,.xls,.pdf"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <button
        style={{ ...styles.button, opacity: disabled ? 0.5 : 1 }}
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        title="Adjuntar archivo"
      >
        📎 Archivo
      </button>
    </>
  );
}
