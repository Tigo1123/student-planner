function DashboardSkeleton({ user }) {
  return (
    <aside className="academic-dashboard academic-dashboard--loading" id="dashboard" tabIndex="-1" aria-label="Loading academic dashboard" aria-busy="true">
      <section className="academic-dashboard-hero dashboard-skeleton-hero">
        <div><span /><h1>Welcome, {user.name.split(" ")[0]}</h1><span /></div>
        <span className="dashboard-skeleton-button" />
      </section>
      <section className="academic-summary-cards dashboard-skeleton-summary" aria-label="Loading summary cards">
        {[0, 1, 2, 3, 4].map((item) => <article key={item}><span /><strong /><small /></article>)}
      </section>
      <div className="academic-dashboard-grid dashboard-skeleton-sections">
        {["Today’s Classes", "Upcoming Deadlines", "Nearest Exam", "Assignments", "Upcoming Events"].map((title) => <section className="dashboard-section" key={title}>
          <header><h2>{title}</h2></header><span /><span /><span />
        </section>)}
      </div>
    </aside>
  );
}

export default DashboardSkeleton;
