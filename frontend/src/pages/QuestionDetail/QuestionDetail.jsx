import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import ForumShell from "../../components/ForumShell/ForumShell";
import { questionService } from "../../services/question/question.service";
import { getApiErrorMessage, timeAgo } from "../../lib/utils";
import styles from "./QuestionDetail.module.css";

const MIN_ANSWER_LENGTH = 10;

function QuestionDetailInner({ questionHash }) {
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [answerText, setAnswerText] = useState("");
  const [fit, setFit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let mounted = true;

    questionService
      .getSingleQuestion(questionHash)
      .then((response) => {
        if (!mounted) return;
        setQuestion(response.question);
        setAnswers(response.answers || []);
      })
      .catch((err) => {
        if (mounted) {
          setError(getApiErrorMessage(err, "Unable to load this question."));
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    questionService
      .getSimilarQuestions(questionHash)
      .then((response) => {
        if (mounted) setSimilar(response.data || []);
      })
      .catch(() => {
        if (mounted) setSimilar([]);
      });

    return () => {
      mounted = false;
    };
  }, [questionHash]);

  async function handleCheckFit() {
    setFormError("");
    setFit(null);
    if (answerText.trim().length < 20) {
      setFormError("Write at least 20 characters before checking fit.");
      return;
    }
    setIsChecking(true);
    try {
      const response = await questionService.assessAnswerFit(
        questionHash,
        answerText.trim(),
      );
      setFit(response.data);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not check this answer."));
    } finally {
      setIsChecking(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    const content = answerText.trim();
    if (content.length < MIN_ANSWER_LENGTH) {
      setFormError(
        `Answer must be at least ${MIN_ANSWER_LENGTH} characters.`,
      );
      return;
    }
    setIsPosting(true);
    try {
      await questionService.createAnswer(questionHash, content);
      const response = await questionService.getSingleQuestion(questionHash);
      setQuestion(response.question);
      setAnswers(response.answers || []);
      setAnswerText("");
      setFit(null);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Failed to post your answer."));
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <ForumShell>
      <div className={styles.page}>
        <Link className={styles.back} to="/dashboard">
          Back to questions
        </Link>
        {isLoading && <p className={styles.state}>Loading question...</p>}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {!isLoading && question && (
          <div className={styles.layout}>
            <article className={styles.thread}>
              <header>
                <p className={styles.eyebrow}>Question</p>
                <h2>{question.title}</h2>
                <p className={styles.meta}>
                  {question.author?.firstName} {question.author?.lastName}
                  {question.createdAt
                    ? ` · ${timeAgo(question.createdAt)}`
                    : ""}
                </p>
              </header>
              <div className={styles.body}>
                <ReactMarkdown>{question.content}</ReactMarkdown>
              </div>

              <section className={styles.answers} aria-label="Answers">
                <h3>{answers.length} answers</h3>
                {answers.length === 0 && (
                  <p className={styles.state}>No answers yet. Be the first.</p>
                )}
                {answers.map((answer) => (
                  <div key={answer.id} className={styles.answer}>
                    <p className={styles.meta}>
                      {answer.author?.firstName} {answer.author?.lastName}
                      {answer.createdAt
                        ? ` · ${timeAgo(answer.createdAt)}`
                        : ""}
                    </p>
                    <div className={styles.body}>
                      <ReactMarkdown>{answer.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </section>

              <form className={styles.form} onSubmit={handleSubmit}>
                <label htmlFor="answer-content">Your answer</label>
                <textarea
                  id="answer-content"
                  value={answerText}
                  onChange={(event) => setAnswerText(event.target.value)}
                  placeholder="Explain what worked, include code if it helps, and say why."
                  disabled={isPosting || isChecking}
                />
                {formError && (
                  <p className={styles.error} role="alert">
                    {formError}
                  </p>
                )}
                {fit && (
                  <p className={styles.fit} data-level={fit.level}>
                    Fit: {fit.level}. {fit.note}
                  </p>
                )}
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={handleCheckFit}
                    disabled={isPosting || isChecking}
                  >
                    {isChecking ? "Checking..." : "Check fit"}
                  </button>
                  <button
                    type="submit"
                    className={styles.primary}
                    disabled={isPosting || isChecking}
                  >
                    {isPosting ? "Posting..." : "Post answer"}
                  </button>
                </div>
              </form>
            </article>

            <aside className={styles.similar} aria-label="Similar questions">
              <h3>Similar questions</h3>
              {similar.length === 0 && (
                <p className={styles.state}>No similar questions yet.</p>
              )}
              {similar.map((item) => (
                <Link
                  key={item.questionHash}
                  to={`/questions/${item.questionHash}`}
                  className={styles.similarItem}
                >
                  <strong>{item.title}</strong>
                  {typeof item.score === "number" && (
                    <span>{Math.round(item.score * 100)}% similar</span>
                  )}
                </Link>
              ))}
            </aside>
          </div>
        )}
      </div>
    </ForumShell>
  );
}

export default function QuestionDetail() {
  const { questionHash } = useParams();
  return <QuestionDetailInner key={questionHash} questionHash={questionHash} />;
}
