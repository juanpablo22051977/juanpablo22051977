import React from 'react';

const styles: Record<string, React.CSSProperties> = {
  header: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderBottom: '1px solid #2d3a4f',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  icon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #d4a843, #f0d78c)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 700,
    color: '#0a0f1c',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: 400,
  },
  badge: {
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '20px',
    background: 'rgba(212, 168, 67, 0.15)',
    color: '#d4a843',
    border: '1px solid rgba(212, 168, 67, 0.3)',
    fontWeight: 600,
  },
};

export default function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <div style={styles.icon}>C</div>
        <div>
          <div style={styles.title}>C-Level Strategic AI</div>
          <div style={styles.subtitle}>Consultor Estratégico Integral — Ecuador Autopartes</div>
        </div>
      </div>
      <span style={styles.badge}>McKinsey / BCG / Bain Level</span>
    </header>
  );
}
