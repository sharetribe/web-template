import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './ProtectedComponent.module.css';

export function ProtectedComponent({ children }) {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();

  const ALLOWED_PATHS = [
    '/l/test-gratis/672e005a-aafd-4440-a476-49d5c82296f3',
    '/l/672e005a-aafd-4440-a476-49d5c82296f3',
  ];

  function isAllowedPath(path) {
    return ALLOWED_PATHS.includes(path);
  }

  const CORRECT_PASSWORD = '123';

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
        <h2 className={styles.title}>Ciao questo è un listing protetto, Inserisci la password che ti è stata fornita :)</h2>
        <form onSubmit={handlePasswordSubmit} className={styles.form}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className={styles.input}
          />
          <button type="submit" className={styles.button}>
            Invio
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
