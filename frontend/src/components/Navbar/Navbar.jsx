import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar({ title, subtitle }) {
  return (
    <header className={styles.navbar}>
      <div className={styles.copy}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      <Link to="/questions/ask" className={styles.askButton}>
        <Plus size={16} aria-hidden />
        Ask a question
      </Link>
    </header>
  );
}
