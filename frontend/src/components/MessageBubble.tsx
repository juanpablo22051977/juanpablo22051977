import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, parseChartBlocks } from '../services/api';
import ChartRenderer from './ChartRenderer';

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    gap: '12px',
    maxWidth: '85%',
    animation: 'fadeIn 0.3s ease',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 700,
    flexShrink: 0,
  },
  bubble: {
    borderRadius: '12px',
    padding: '14px 18px',
    fontSize: '14px',
    lineHeight: '1.7',
    wordBreak: 'break-word' as const,
  },
  time: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '6px',
  },
};

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const { text, charts } = isUser
    ? { text: message.content, charts: [] }
    : parseChartBlocks(message.content);

  return (
    <div style={{ ...styles.wrapper, alignSelf: isUser ? 'flex-end' : 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div
        style={{
          ...styles.avatar,
          background: isUser ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #d4a843, #f0d78c)',
          color: isUser ? '#fff' : '#0a0f1c',
        }}
      >
        {isUser ? 'U' : 'C'}
      </div>
      <div>
        <div
          style={{
            ...styles.bubble,
            background: isUser ? '#1d4ed8' : '#1e293b',
            border: isUser ? 'none' : '1px solid #2d3a4f',
            color: '#f1f5f9',
          }}
        >
          {isUser ? (
            <>
              <p>{text}</p>
              {message.files?.map((f, i) => (
                <div key={i} style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '12px' }}>
                  📎 {f.name}
                </div>
              ))}
            </>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )}
        </div>
        {charts.map((chart, i) => (
          <ChartRenderer key={i} chart={chart} />
        ))}
        <div style={styles.time}>
          {message.timestamp.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
