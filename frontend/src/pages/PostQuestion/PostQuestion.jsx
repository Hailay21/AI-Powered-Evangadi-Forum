import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  generateQuestionDraftCoach,
  createQuestion,
} from "../../services/question.service";
import styles from "./PostQuestion.module.css";

export default function PostQuestion() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCoaching, setIsCoaching] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateForm = () => {
    if (formData.title.trim().length < 5) {
      return "Title must be at least 5 characters";
    }
    if (formData.content.trim().length < 10) {
      return "Content must be at least 10 characters";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleGetFeedback = async () => {
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsCoaching(true);
      const data = await generateQuestionDraftCoach({
        title: formData.title.trim(),
        content: formData.content.trim(),
      });

      const tips =
        data?.tips || data?.data?.tips || (Array.isArray(data) ? data : []);

      setCoachFeedback({ tips });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch AI draft feedback.",
      );
    } finally {
      setIsCoaching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await createQuestion({
        title: formData.title.trim(),
        content: formData.content.trim(),
      });

      setSuccess("Question posted successfully!");
      setFormData({ title: "", content: "" });
      setCoachFeedback(null);

      const questionHash =
        data?.questionHash ||
        data?.hash ||
        data?.data?.questionHash ||
        data?.data?.hash;

      if (questionHash) {
        navigate(`/questions/${questionHash}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to post question.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting || isCoaching;

  return (
    <section className={styles.container}>
      <h1 className={styles.heading}>Ask a Question</h1>

      {error && (
        <div role="alert" className={styles.errorBox}>
          {error}
        </div>
      )}

      {success && <div className={styles.successBox}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="title" className={styles.label}>
            Question Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            disabled={isBusy}
            placeholder="Write a clear question title (min 5 characters)..."
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="content" className={styles.label}>
            Question Content
          </label>
          <textarea
            id="content"
            name="content"
            rows={7}
            value={formData.content}
            onChange={handleChange}
            disabled={isBusy}
            placeholder="Explain your problem, context, and what you tried (min 10 characters)..."
            className={styles.textarea}
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleGetFeedback}
            disabled={isBusy}
            className={styles.coachButton}
          >
            {isCoaching ? "Getting AI Feedback..." : "Get AI Feedback"}
          </button>

          <button
            type="submit"
            disabled={isBusy}
            className={styles.submitButton}
          >
            {isSubmitting ? "Posting..." : "Post Question"}
          </button>
        </div>
      </form>

      {coachFeedback && (
        <aside className={styles.feedbackPanel}>
          <h2 className={styles.feedbackTitle}>AI Draft Coach Tips</h2>
          {Array.isArray(coachFeedback.tips) &&
          coachFeedback.tips.length > 0 ? (
            <ul className={styles.tipsList}>
              {coachFeedback.tips.map((tip, index) => (
                <li key={index}>
                  {typeof tip === "string"
                    ? tip
                    : tip?.tip || tip?.text || JSON.stringify(tip)}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyTips}>No tips returned for this draft.</p>
          )}
        </aside>
      )}
    </section>
  );
}
