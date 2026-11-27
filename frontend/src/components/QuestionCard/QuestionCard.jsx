import { Link } from 'react-router-dom';
import { MessageCircle, Clock3, ArrowUpRight } from 'lucide-react';
import { timeAgo } from '../../lib/utils.js';
import styles from './QuestionCard.module.css';

function getInitials(author) {
  const first = author?.firstName?.[0] || '';
  const last = author?.lastName?.[0] || '';
  return `${first}${last}`.toUpperCase() || 'U';
}

export default function QuestionCard({ question, isMine = false }) {
  const author = question.author || {};
  const authorName = [author.firstName, author.lastName].filter(Boolean).join(' ') || 'Community member';
  const questionPath = question.questionHash
    ? `/questions/${encodeURIComponent(question.questionHash)}`
    : question.id
      ? `/questions/${encodeURIComponent(question.id)}`
      : '/dashboard';

  return (
    <article className={styles.card}>
      <div className={styles.avatar} aria-hidden='true'>{getInitials(author)}</div>
      <div className={styles.body}>
        <div className={styles.titleLine}>
          <Link className={styles.title} to={questionPath}>{question.title || 'Untitled question'}</Link>
          {isMine && <span className={styles.mine}>Yours</span>}
        </div>
        {question.content && <p className={styles.excerpt}>{question.content}</p>}
        <div className={styles.meta}>
          <span><MessageCircle size={13} /> {Number(question.answerCount ?? 0)} {Number(question.answerCount ?? 0) === 1 ? 'reply' : 'replies'}</span>
          <span><Clock3 size={13} /> {timeAgo(question.createdAt) || 'Date unavailable'}</span>
          {!isMine && <span className={styles.author}>Asked by {authorName}</span>}
          {typeof question.score === 'number' && <span className={styles.score}>{Math.round(question.score * 100)}% match</span>}
        </div>
      </div>
      <Link className={styles.open} to={questionPath} aria-label={`Open ${question.title || 'question'}`}><ArrowUpRight size={17} /></Link>
    </article>
  );
}
