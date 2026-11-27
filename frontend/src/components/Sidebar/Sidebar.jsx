import { NavLink } from "react-router-dom";
import {
  Home,
  MessageSquarePlus,
  Library,
  FileText,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./Sidebar.module.css";

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/questions/ask", label: "Ask a question", icon: MessageSquarePlus },
  { to: "/my-questions", label: "My questions", icon: Library },
  { to: "/rag-documents", label: "Knowledge base", icon: FileText, soon: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const displayName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={styles.sidebar} aria-label="Forum navigation">
      <div className={styles.brand}>
        <MessageSquarePlus size={20} aria-hidden />
        <div>
          <p className={styles.brandName}>Evangadi Forum</p>
          <p className={styles.brandLine}>Ask with context</p>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map(({ to, label, icon: Icon, soon }) =>
          soon ? (
            <span key={to} className={`${styles.link} ${styles.linkSoon}`}>
              <Icon size={18} aria-hidden />
              <span>{label}</span>
              <em>Soon</em>
            </span>
          ) : (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.linkActive : ""}`
              }
            >
              <Icon size={18} aria-hidden />
              <span>{label}</span>
            </NavLink>
          ),
        )}
      </nav>

      <div className={styles.footer}>
        {displayName && <p className={styles.userName}>{displayName}</p>}
        <button type="button" className={styles.logout} onClick={logout}>
          <LogOut size={16} aria-hidden />
          Log out
        </button>
      </div>
    </aside>
  );
}
