import ReactMarkdown from "react-markdown";
import styles from "./RagAnswerBody.module.css";

export default function RagAnswerBody({ answer, citations = [] }) {
  return (
    <div className={styles.answer}>
      <div className={styles.answer__markdown}>
        <ReactMarkdown>{answer}</ReactMarkdown>
      </div>
      {citations.length > 0 && (
        <div className={styles.answer__sources}>
          <h4>Sources</h4>
          <ul>
            {citations.map(citation => (
              <li key={`${citation.ref}-${citation.chunkIndex}`}>
                <span className={styles.answer__reference}>[{citation.ref}]</span>
                Document excerpt · chunk {citation.chunkIndex + 1}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}