import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BookOpen, CircleHelp, MessageSquare, Plus, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { questionService } from '../../services/questions/question.service.js';
import QuestionCard from '../../components/QuestionCard/QuestionCard.jsx';
import styles from './Dashboard.module.css';

function extractError(error) {
  return error.response?.data?.message || error.message || 'Unable to load questions. Please try again.';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('q') || '';
  const semanticQuery = searchParams.get('semantic') || '';
  const searchMode = semanticQuery ? 'semantic' : 'keyword';
  const activeQuery = semanticQuery || keyword;
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = semanticQuery
        ? await questionService.searchQuestionsSemantic(semanticQuery)
        : await questionService.getQuestions({ search: keyword });
      setQuestions(Array.isArray(result) ? result : []);
    } catch (requestError) {
      setError(extractError(requestError));
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, semanticQuery]);

  useEffect(() => {
    let active = true;
    const fetchQuestions = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = semanticQuery
          ? await questionService.searchQuestionsSemantic(semanticQuery)
          : await questionService.getQuestions({ search: keyword });
        if (active) setQuestions(Array.isArray(result) ? result : []);
      } catch (requestError) {
        if (active) {
          setError(extractError(requestError));
          setQuestions([]);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchQuestions();
    return () => { active = false; };
  }, [keyword, semanticQuery]);

  const myQuestionCount = useMemo(
    () => questions.filter(question => String(question.author?.id ?? '') === String(user?.id ?? '')).length,
    [questions, user?.id],
  );

  const firstName = user?.firstName?.trim();
  const welcomeLine = firstName ? `Good to see you, ${firstName}.` : 'Welcome to the forum.';

  return (
    <div className={styles.page}>
      <section className={styles.welcome}>
        <div className={styles.eyebrow}>FORUM HOME</div>
        <div className={styles.welcomeHeading}>
          <div>
            <h1>{welcomeLine}</h1>
            <p>Start a topic, revisit your threads, or skim the live feed. Search above works from any page once you are back on Home.</p>
          </div>
        </div>

        <div className={styles.actions}>
          <Link to='/questions/ask' className={styles.actionCard}>
            <span className={styles.actionIcon}><Plus size={18} /></span>
            <span><strong>New question</strong><small>Share context, errors, and what you already tried</small></span>
            <ArrowRight size={15} className={styles.actionArrow} />
          </Link>
          <Link to='/my-questions' className={styles.actionCard}>
            <span className={styles.actionIcon}><MessageSquare size={18} /></span>
            <span><strong>Your topics</strong><small>Find the threads you have authored</small></span>
            <ArrowRight size={15} className={styles.actionArrow} />
          </Link>
          <Link to='/rag-documents' className={styles.actionCard}>
            <span className={styles.actionIcon}><BookOpen size={18} /></span>
            <span><strong>Knowledge base</strong><small>Upload, browse, and retrieve-backed context for threads</small></span>
            <ArrowRight size={15} className={styles.actionArrow} />
          </Link>
        </div>

        <div className={styles.statsIntro}>Figures below describe the newest threads in this feed (up to 100 from the API).</div>
        <div className={styles.stats}>
          <div><span>Questions</span><strong>{isLoading ? '—' : questions.length}</strong></div>
          <div><span>Replies</span><strong>{isLoading ? '—' : questions.reduce((sum, item) => sum + Number(item.answerCount || 0), 0)}</strong></div>
          <div><span>Unanswered</span><strong>{isLoading ? '—' : questions.filter(item => Number(item.answerCount || 0) === 0).length}</strong></div>
          <div><span>Yours in this feed</span><strong>{isLoading ? '—' : myQuestionCount}</strong></div>
        </div>
      </section>

      <section className={styles.feed}>
        <div className={styles.feedHeader}>
          <div><h2>Discussion feed</h2><p>Your threads as a live list of recent questions.</p></div>
          <span className={styles.feedBadge}>{searchMode === 'semantic' ? 'AI MATCHES' : 'NEWEST THREADS'}</span>
        </div>

        {activeQuery && (
          <div className={styles.searchNotice}>
            {searchMode === 'semantic' ? <Sparkles size={15} /> : <CircleHelp size={15} />}
            <span>{searchMode === 'semantic' ? 'AI semantic results for' : 'Keyword results for'} <strong>“{activeQuery}”</strong></span>
            <Link to='/dashboard'>Clear search</Link>
          </div>
        )}

        {isLoading ? (
          <div className={styles.state} role='status' aria-live='polite'>
            <span className={styles.spinner} />
            <strong>Loading questions</strong><p>Getting the latest discussions…</p>
            <div className={styles.skeleton}><i /><i /><i /></div>
          </div>
        ) : error ? (
          <div className={`${styles.state} ${styles.error}`} role='alert'>
            <CircleHelp size={25} /><strong>We couldn’t load the discussion feed</strong><p>{error}</p>
            <button type='button' onClick={loadQuestions}><RefreshCw size={15} /> Try again</button>
          </div>
        ) : questions.length === 0 ? (
          <div className={styles.state}>
            <div className={styles.emptyIcon}><MessageSquare size={24} /></div>
            <strong>{activeQuery ? 'No matching questions found' : 'No questions yet'}</strong>
            <p>{activeQuery ? 'Try another keyword or switch to AI Search with a more descriptive phrase.' : 'Be the first to start a discussion and help the community learn.'}</p>
            <Link to='/questions/ask' className={styles.primaryButton}>Ask the first question <ArrowRight size={15} /></Link>
          </div>
        ) : (
          <div className={styles.questionList}>
            {questions.map((question, index) => (
              <QuestionCard key={question.questionHash || question.id || index} question={question} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
