import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./ForumShell.module.css";

export default function ForumShell({ children }) {
  const { logout, user } = useAuth();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/dashboard" className={styles.brand}>
          Evangadi Forum
        </Link>
        <nav className={styles.nav} aria-label="Forum">
          <Link to="/dashboard">Home</Link>
          <Link to="/my-questions">My questions</Link>
          <Link to="/questions/ask">Ask</Link>
        </nav>
        <div className={styles.account}>
          {name && <span className={styles.name}>{name}</span>}
          <button type="button" className={styles.logout} onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
