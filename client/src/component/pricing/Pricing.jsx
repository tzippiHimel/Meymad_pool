import React, { useMemo, useState } from "react";
import "./Pricing.css";

const PRICING = {
  BASE_UP_TO_2: 200,
  BASE_UP_TO_5: 250,
  ADDITIONAL_PER_5: 50,
  MINIMUM_DURATION: 2
};

function getPrice(numPeople, hours) {
  let basePrice;
  if (numPeople <= 2) {
    basePrice = PRICING.BASE_UP_TO_2;
  } else if (numPeople <= 5) {
    basePrice = PRICING.BASE_UP_TO_5;
  } else {
    const additionalGroups = Math.ceil((numPeople - 5) / 5);
    basePrice = PRICING.BASE_UP_TO_5 + additionalGroups * PRICING.ADDITIONAL_PER_5;
  }
  const ratio = (hours || PRICING.MINIMUM_DURATION) / PRICING.MINIMUM_DURATION;
  return Math.round(basePrice * ratio);
}

const examples = [
  { people: 2, hours: 2 },
  { people: 5, hours: 2 },
  { people: 8, hours: 2 },
  { people: 12, hours: 3 },
];

const Pricing = () => {
  const [people, setPeople] = useState(5);
  const [hours, setHours] = useState(2);
  const livePrice = useMemo(() => getPrice(people, hours), [people, hours]);

  return (
    <div className="pricing-container">
      <div className="pricing-content">
        <h1 className="pricing-title">מחירון מימד — בריכה פרטית</h1>

        <div className="pricing-hero-grid">
          <div className="pricing-card highlight">
            <h3>עד 2 אנשים</h3>
            <div className="price">₪{PRICING.BASE_UP_TO_2}</div>
            <div className="note">לשעתיים</div>
          </div>
          <div className="pricing-card highlight">
            <h3>3–5 אנשים</h3>
            <div className="price">₪{PRICING.BASE_UP_TO_5}</div>
            <div className="note">לשעתיים</div>
          </div>
          <div className="pricing-card">
            <h3>תוספת</h3>
            <div className="price">₪{PRICING.ADDITIONAL_PER_5}</div>
            <div className="note">לכל 5 אנשים נוספים</div>
          </div>
        </div>

        <div className="calc-card">
          <h2>מחשבון מחיר מהיר</h2>
          <div className="calc-controls" dir="rtl">
            <div className="field">
              <label>מספר אנשים: <strong>{people}</strong></label>
              <input
                type="range"
                min="1"
                max="30"
                value={people}
                onChange={(e) => setPeople(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>משך השהות (שעות): <strong>{hours}</strong></label>
              <input
                type="range"
                min="2"
                max="8"
                step="1"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="calc-result">
            <div className="total-label">מחיר מוערך:</div>
            <div className="total-value">₪{livePrice}</div>
          </div>
          <div className="calc-cta">
            <a className="cta-button" href="/newOrder">הזמנה מהירה</a>
          </div>
        </div>

        <div className="pricing-table">
          <table>
            <thead>
              <tr>
                <th>מספר אנשים</th>
                <th>משך (שעות)</th>
                <th>מחיר</th>
              </tr>
            </thead>
            <tbody>
              {examples.map((ex, i) => (
                <tr key={i}>
                  <td>{ex.people}</td>
                  <td>{ex.hours}</td>
                  <td>₪{getPrice(ex.people, ex.hours)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pricing-note">
          <ul>
            <li>המחיר הבסיסי הוא לשעתיים. כל שעה נוספת מחושבת באופן יחסי.</li>
            <li>עד 2 אנשים: ₪{PRICING.BASE_UP_TO_2} לשעתיים.</li>
            <li>3–5 אנשים: ₪{PRICING.BASE_UP_TO_5} לשעתיים.</li>
            <li>כל 5 אנשים נוספים: תוספת ₪{PRICING.ADDITIONAL_PER_5}.</li>
            <li>המחיר הסופי נקבע בעת ההזמנה לפי מספר האנשים והזמן שתבחרו.</li>
          </ul>
          <div style={{ marginTop: "1.5rem", color: "#0097a7", fontWeight: 600 }}>
            כל המחירים כוללים מע״מ.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;