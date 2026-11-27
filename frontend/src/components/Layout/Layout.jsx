import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import styles from "./Layout.module.css";

function getTitle(pathname) {
  if (pathname.startsWith("/questions/ask")) return "Ask a question";
  if (pathname.startsWith("/questions/")) return "Question";
  if (pathname.startsWith("/my-questions")) return "My questions";
  if (pathname.startsWith("/rag-documents")) return "Knowledge base";
  return "Home";
}

function getSubtitle(pathname) {
  if (pathname.startsWith("/questions/ask")) {
    return "Write a clear title and enough context for peers to help.";
  }
  if (pathname.startsWith("/questions/")) {
    return "Read the thread, check similar posts, and share an answer.";
  }
  if (pathname.startsWith("/my-questions")) {
    return "Threads you started in the community.";
  }
  if (pathname.startsWith("/rag-documents")) {
    return "Upload course PDFs and ask grounded questions.";
  }
  return "Browse, search, and answer community questions.";
}

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.layout__content}>
        <div className={styles.layout__mainInner}>
          <Navbar title={getTitle(pathname)} subtitle={getSubtitle(pathname)} />
          <main className={styles.layout__main}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
