import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleHelp, Plus, RefreshCw, MessageSquare } from 'lucide-react';
import { questionService } from '../../services/questions/question.service.js';
import QuestionCard from '../../components/QuestionCard/QuestionCard.jsx';
import styles from './MyQuestions.module.css';

function extractError(error) {
  return error.response?.data?.message || error.message || 'Unable to load your questions. Please try again.';
}

export default function MyQuestions() {
  const [myQuestions, setMyQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMyQuestions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await questionService.getQuestions({ mine: true });
      setMyQuestions(Array.isArray(result) ? result : []);
    } catch (requestError) {
      setError(extractError(requestError));
      setMyQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const fetchMyQuestions = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await questionService.getQuestions({ mine: true });
        if (active) setMyQuestions(Array.isArray(result) ? result : []);
      } catch (requestError) {
        if (active) {
          setError(extractError(requestError));
          setMyQuestions([]);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchMyQuestions();
    return () => { active = false; };
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.heading}>
        <div>
          <div className={styles.eyebrow}>YOUR WORKSPACE</div>
          <h1>My questions</h1>
          <p>Only questions you created appear here. Open one to read answers or add follow-ups. Your topics use the same feed style as the Home page.</p>
        </div>
        <Link to='/questions/ask' className={styles.newButton}><Plus size={15} /> New question</Link>
      </section>

      {isLoading ? (
        <section className={styles.state} role='status' aria-live='polite'>
          <span className={styles.spinner} />
          <strong>Loading your questions</strong>
          <p>Fetching the questions you have posted…</p>
          <div className={styles.skeleton}><i /><i /><i /></div>
        </section>
      ) : error ? (
        <section className={`${styles.state} ${styles.error}`} role='alert'>
          <CircleHelp size={25} />
          <strong>We couldn’t load your questions</strong>
          <p>{error}</p>
          <button type='button' onClick={loadMyQuestions}><RefreshCw size={15} /> Try again</button>
        </section>
      ) : myQuestions.length === 0 ? (
        <section className={styles.state}>
          <div className={styles.emptyIcon}><MessageSquare size={24} /></div>
          <strong>You haven’t asked any questions yet</strong>
          <p>When you post a question, it will appear here so you can easily return to the discussion and follow its answers.</p>
          <Link to='/questions/ask' className={styles.newButton}>Ask your first question <ArrowRight size={15} /></Link>
        </section>
      ) : (
        <section className={styles.list} aria-label='Questions you authored'>
          {myQuestions.map((question, index) => (
            <QuestionCard key={question.questionHash || question.id || index} question={question} isMine />
          ))}
        </section>
      )}
    </div>
  );
}
