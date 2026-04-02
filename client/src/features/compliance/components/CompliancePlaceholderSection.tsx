type CompliancePlaceholderSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
};

function CompliancePlaceholderSection({
  eyebrow,
  title,
  description,
}: CompliancePlaceholderSectionProps) {
  return (
    <section className="feature-section">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">{eyebrow}</p>
            <h2 className="feature-section__title">{title}</h2>
            <p className="feature-section__description">{description}</p>
          </div>
        </div>

        <div className="content-card__placeholder">
          Placeholder.
        </div>
      </div>
    </section>
  );
}

export default CompliancePlaceholderSection;
