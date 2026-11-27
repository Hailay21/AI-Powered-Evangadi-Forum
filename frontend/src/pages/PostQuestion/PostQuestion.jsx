import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  generateQuestionDraftCoach,
  createQuestion,
} from "../../services/question.service";
import styles from "./PostQuestion.module.css";

const MIN_TITLE_LENGTH = 5;
const MIN_CONTENT_LENGTH = 10;

export default function PostQuestion() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState({});
  const [statusError, setStatusError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [coachResult, setCoachResult] = useState(null);

  const [isCoaching, setIsCoaching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm() {
    const nextErrors = {};
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (trimmedTitle.length < MIN_TITLE_LENGTH) {
      nextErrors.title = `Title must be at least ${MIN_TITLE_LENGTH} characters.`;
    }

    if (trimmedContent.length < MIN_CONTENT_LENGTH) {
      nextErrors.content = `Question details must be at least ${MIN_CONTENT_LENGTH} characters.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleGetAiFeedback() {
    setStatusError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsCoaching(true);
    try {
      const data = await generateQuestionDraftCoach({ title, content });
      setCoachResult(data?.data || data);
    } catch (err) {
      setStatusError(err.message || "Could not fetch AI draft feedback.");
    } finally {
      setIsCoaching(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatusError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createQuestion({ title, content });
      const createdId =
        response?.data?.id ||
        response?.data?._id ||
        response?.id ||
        response?._id;

      setSuccessMessage("Your question has been posted successfully.");
      setTitle("");
      setContent("");
      setErrors({});
      setCoachResult(null);

      if (createdId) {
        navigate(`/questions/${createdId}`);
      }
    } catch (err) {
      setStatusError(err.message || "Failed to post your question.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isBusy = isCoaching || isSubmitting;
  const feedbackItems = Array.isArray(coachResult?.tips)
    ? coachResult.tips
    : Array.isArray(coachResult?.suggestions)
      ? coachResult.suggestions
      : [];

  return (
    <section className={styles.pageWrapper}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Ask a Question</h1>
          <p className={styles.subtitle}>
            Write a clear title and describe what you tried, what happened, and
            what you expected.
          </p>
        </header>

        {statusError && (
          <div role="alert" className={styles.alertError}>
            {statusError}
          </div>
        )}

        {successMessage && (
          <div role="status" className={styles.alertSuccess}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="question-title" className={styles.label}>
                Question Title
              </label>
              <span className={styles.counter}>
                {title.trim().length}/{MIN_TITLE_LENGTH}+ chars
              </span>
            </div>
            <input
              id="question-title"
              type="text"
              className={styles.input}
              placeholder="e.g., How do I handle async errors in Express middleware?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isBusy}
            />
            {errors.title && (
              <span className={styles.fieldError}>{errors.title}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="question-content" className={styles.label}>
                Question Details
              </label>
              <span className={styles.counter}>
                {content.trim().length}/{MIN_CONTENT_LENGTH}+ chars
              </span>
            </div>
            <textarea
              id="question-content"
              className={styles.textarea}
              placeholder="Include context, relevant code or error messages, and what you have already tried..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isBusy}
            />
            {errors.content && (
              <span className={styles.fieldError}>{errors.content}</span>
            )}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleGetAiFeedback}
              disabled={isBusy}
            >
              {isCoaching ? "Getting AI Feedback..." : "Get AI Feedback"}
            </button>

            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={isBusy}
            >
              {isSubmitting ? "Posting Question..." : "Post Question"}
            </button>
          </div>
        </form>

        {coachResult && (
          <aside className={styles.coachBox} aria-label="AI Draft Coach">
            <h2 className={styles.coachTitle}>AI Draft Coach Suggestions</h2>
            {coachResult.summary && (
              <p className={styles.coachText}>{coachResult.summary}</p>
            )}
            {coachResult.improvedTitle && (
              <p className={styles.coachText}>
                <strong>Suggested Title:</strong> {coachResult.improvedTitle}
              </p>
            )}
            {feedbackItems.length > 0 && (
              <ul className={styles.coachList}>
                {feedbackItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
            {!coachResult.summary &&
              !coachResult.improvedTitle &&
              feedbackItems.length === 0 && (
                <p className={styles.coachText}>
                  {typeof coachResult === "string"
                    ? coachResult
                    : JSON.stringify(coachResult, null, 2)}
                </p>
              )}
          </aside>
        )}
      </div>
    </section>
  );
}
