type IncomeSubnavItem = {
  id: string;
  label: string;
  description: string;
};

type IncomeSubnavProps = {
  items: IncomeSubnavItem[];
  activeItemId: string;
  onSelect: (id: string) => void;
};

function IncomeSubnav({
  items,
  activeItemId,
  onSelect,
}: IncomeSubnavProps) {
  const activeItem = items.find((item) => item.id === activeItemId) ?? items[0];

  return (
    <section className="feature-section">
      <div className="compliance-subnav">
        <div className="compliance-subnav__list" role="tablist" aria-label="Undernavigasjon for compliance">
          {items.map((item) => {
            const isActive = item.id === activeItemId;

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`compliance-subnav__item${
                  isActive ? ' compliance-subnav__item--active' : ''
                }`}
                onClick={() => onSelect(item.id)}
              >
                <span className="compliance-subnav__label">{item.label}</span>
              </button>
            );
          })}
        </div>

        <p className="compliance-subnav__description">{activeItem.description}</p>
      </div>
    </section>
  );
}

export default IncomeSubnav;

