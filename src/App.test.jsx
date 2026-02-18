import React from 'react';
import './App.css';

function App() {
    return (
        <div className="app">
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'white',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>
                    ⏱️ Tact Time Tracker
                </h1>
                <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
                    Testing... If you see this, React is working!
                </p>
                <button
                    style={{
                        padding: '1rem 2rem',
                        fontSize: '1.2rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer'
                    }}
                    onClick={() => alert('Button works!')}
                >
                    📸 Test Button
                </button>
            </div>
        </div>
    );
}

export default App;
