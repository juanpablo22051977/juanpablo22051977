import React, { useState, useRef, useEffect } from 'react';
import { Message, FileAttachment, sendMessage } from '../services/api';
import MessageBubble from './MessageBubble';
import FileUpload from './FileUpload';

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  welcome: {
    textAlign: 'center',
    padding: '60px 20px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: '12px',
    letterSpacing: '-0.03em',
  },
  welcomeText: {
    fontSize: '15px',
    color: '#94a3b8',
    lineHeight: '1.6',
    marginBottom: '32px',
  },
  suggestions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  suggestion: {
    background: '#1e293b',
    border: '1px solid #2d3a4f',
    borderRadius: '10px',
    padding: '14px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    color: '#94a3b8',
    fontSize: '13px',
    lineHeight: '1.4',
    transition: 'all 0.2s',
  },
  inputArea: {
    padding: '16px 24px',
    borderTop: '1px solid #2d3a4f',
    background: '#111827',
  },
  attachedFile: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#1e293b',
    border: '1px solid #2d3a4f',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '8px',
  },
  removeFile: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0 2px',
  },
  inputRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    background: '#1e293b',
    border: '1px solid #2d3a4f',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#f1f5f9',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'none' as const,
    outline: 'none',
    minHeight: '48px',
    maxHeight: '150px',
  },
  sendBtn: {
    background: 'linear-gradient(135deg, #d4a843, #f0d78c)',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 20px',
    color: '#0a0f1c',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '14px',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#94a3b8',
    fontSize: '14px',
    padding: '12px 18px',
    background: '#1e293b',
    border: '1px solid #2d3a4f',
    borderRadius: '12px',
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
};

const SUGGESTIONS = [
  'Realiza una valuación DCF de mi empresa con un WACC estimado para Ecuador',
  'Calcula el EOQ óptimo para mis repuestos de mayor rotación',
  'Analiza la estructura de capital ideal para una importadora de autopartes',
  'Genera un benchmarking competitivo del sector autopartes en Ecuador',
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<FileAttachment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content && !attachedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: attachedFile ? `${content}\n\n[Archivo adjunto: ${attachedFile.name}]\n${attachedFile.content}` : content,
      timestamp: new Date(),
      files: attachedFile ? [attachedFile] : undefined,
    };

    const displayMessage: Message = { ...userMessage, content };

    setMessages(prev => [...prev, displayMessage]);
    setInput('');
    setAttachedFile(null);
    setLoading(true);

    try {
      const history = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendMessage(history);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Error:** ${error.message}\n\nVerifica que el backend esté corriendo en el puerto 3001 y que la variable \`ANTHROPIC_API_KEY\` esté configurada.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.messages}>
        {messages.length === 0 ? (
          <div style={styles.welcome}>
            <div style={styles.welcomeTitle}>Bienvenido al C-Level Strategic AI</div>
            <div style={styles.welcomeText}>
              Soy tu consultor estratégico de élite. Puedo ayudarte con valuación DCF, análisis WACC,
              optimización de inventarios, benchmarking competitivo y más. Sube tus archivos financieros
              o haz una pregunta para comenzar.
            </div>
            <div style={styles.suggestions}>
              {SUGGESTIONS.map((s, i) => (
                <div
                  key={i}
                  style={styles.suggestion}
                  onClick={() => handleSend(s)}
                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#d4a843'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#2d3a4f'; }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
        )}
        {loading && (
          <div style={styles.loading}>
            <span className="loading-dots">Analizando</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputArea}>
        {attachedFile && (
          <div style={styles.attachedFile}>
            📎 {attachedFile.name}
            <button style={styles.removeFile} onClick={() => setAttachedFile(null)}>✕</button>
          </div>
        )}
        <div style={styles.inputRow}>
          <FileUpload onFileSelect={setAttachedFile} disabled={loading} />
          <textarea
            ref={textareaRef}
            style={styles.textarea}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu consulta estratégica..."
            disabled={loading}
            rows={1}
          />
          <button
            style={{ ...styles.sendBtn, opacity: loading ? 0.5 : 1 }}
            onClick={() => handleSend()}
            disabled={loading}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
