import { Link } from "react-router-dom";

function AuthLayout({ eyebrow, title, description, children }) {
  return (
    <main className="auth-page">
      <section className="auth-intro" aria-labelledby="auth-brand-title">
        <Link className="auth-brand" to="/login" aria-label="Student Planner">
          <span aria-hidden="true">S</span>
          Student Planner
        </Link>
        <div className="auth-intro__content">
          <p className="eyebrow eyebrow--light">Plan with purpose</p>
          <h1 id="auth-brand-title">Make space for what matters.</h1>
          <p>
            Organize study tasks, school events, and daily priorities in one calm,
            focused workspace.
          </p>
        </div>
        <div className="auth-preview" aria-hidden="true">
          <span>Today</span>
          <div><i />Review biology notes</div>
          <div><i />Prepare for math exam</div>
          <div><i />School club meeting</div>
        </div>
      </section>

      <section className="auth-card" aria-labelledby="auth-form-title">
        <div className="auth-card__heading">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="auth-form-title">{title}</h2>
          <p>{description}</p>
        </div>
        {children}
      </section>
    </main>
  );
}

export default AuthLayout;
