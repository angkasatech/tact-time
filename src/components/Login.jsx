import React, { useState } from 'react';
import './Login.css';

// Hardcoded credentials for on-premise internal use
const USERS = [
    { username: 'alva', password: 'jaya' }
];

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate brief loading
        setTimeout(() => {
            const user = USERS.find(
                u => u.username === username.trim().toLowerCase() && u.password === password
            );

            if (user) {
                // Save session to localStorage
                localStorage.setItem('tacttime_session', JSON.stringify({
                    username: user.username,
                    loginTime: new Date().toISOString()
                }));
                onLogin(user.username);
            } else {
                setError('Invalid username or password');
                setIsLoading(false);
            }
        }, 500);
    };

    return (
        <div className="login-page">
            <div className="login-bg">
                <div className="login-orb orb-1"></div>
                <div className="login-orb orb-2"></div>
                <div className="login-orb orb-3"></div>
            </div>

            <div className="login-container">
                <div className="login-card glass-card">
                    <div className="login-header">
                        <div className="login-logo">⏱️</div>
                        <h1>Tact Time Tracker</h1>
                        <p>Sign in to continue</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                className="input-field"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                                autoComplete="username"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="input-field"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>

                        {error && (
                            <div className="login-error">
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-login"
                            disabled={isLoading || !username || !password}
                        >
                            {isLoading ? '⏳ Signing in...' : '🔐 Sign In'}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>Internal use only · Angkasa Tech</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
