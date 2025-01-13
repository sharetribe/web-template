import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './ProtectedComponent.module.css';

export function ProtectedComponent({ children }) {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();

  const ALLOWED_PATHS = [
    '/l/letter-making-stations-tag-torino/6773d00a-bcbc-4a69-919c-76b2b5d6cb08',
    '/l/6773d00a-bcbc-4a69-919c-76b2b5d6cb08',
  ];

  function isAllowedPath(path) {
    return ALLOWED_PATHS.includes(path);
  }

  const CORRECT_PASSWORD = 'TAGTORINO';

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthorized(true);
    } else {
      alert('Incorrect password');
    }
  };

  const isProtected = isAllowedPath(location.pathname);

  if (isProtected && !isAuthorized) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Evento riservato ai community members del Talent Garden Torino. Registrati gratis con il codice fornito! :)</h2>
        <form onSubmit={handlePasswordSubmit} className={styles.form}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={styles.input}
          />
          <button type="submit" className={styles.button}>
          Partecipa!
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
