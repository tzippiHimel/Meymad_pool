import React, { useState } from "react";
import "./Guide.css";

const Guide = () => {
  const [activeSection, setActiveSection] = useState("rules");

  const sections = {
    rules: {
      title: "כללי התנהגות",
      icon: "📋",
      content: (
        <div className="guide-section-content">
          <h3>כללי התנהגות חשובים בבריכה</h3>
          
          <div className="guide-step">
            <h4>🚿 לפני הכניסה למים</h4>
            <ul>
              <li>חובה להתקלח לפני הכניסה למים</li>
              <li>השתמשו בסבון ומים חמים</li>
              <li>הסירו קוסמטיקה, שמנים וקרמים</li>
              <li>השתמשו בכובע שחייה (חובה)</li>
            </ul>
          </div>

          <div className="guide-step">
            <h4>🏊 בזמן השחייה</h4>
            <ul>
              <li>שמרו על שקט ושלווה למען כולם</li>
              <li>אל תרוצו או תקפצו ליד הבריכה</li>
              <li>השתמשו במסלולים המיועדים לשחייה</li>
              <li>אל תפריעו לשחיינים אחרים</li>
            </ul>
          </div>

          <div className="guide-step">
            <h4>🧼 אחרי השחייה</h4>
            <ul>
              <li>התקלחו שוב עם סבון</li>
              <li>השתמשו בקרם לחות</li>
              <li>השאירו את המקלחות נקיות</li>
              <li>החזירו ציוד למקום המיועד</li>
            </ul>
          </div>

          <div className="guide-tip">
            <strong>💡 זכרו:</strong> הבריכה היא מקום משותף לכולם. שמירה על כללי ההתנהגות מבטיחה חוויה נעימה לכולם.
          </div>
        </div>
      )
    },
    schedule: {
      title: "שעות ומחירים",
      icon: "⏰",
      content: (
        <div className="guide-section-content">
          <h3>מידע על שעות פעילות ומחירים</h3>
          
          <div className="guide-step">
            <h4>🕐 שעות פעילות</h4>
            <ul>
              <li><strong>בוקר:</strong> 06:00 - 10:00 (שחייה בוקר)</li>
              <li><strong>צהריים:</strong> 12:00 - 14:00 (שחייה צהריים)</li>
              <li><strong>אחר הצהריים:</strong> 16:00 - 19:00 (שחייה ערב)</li>
              <li><strong>סופי שבוע:</strong> 08:00 - 18:00 (שעות מורחבות)</li>
            </ul>
          </div>

          <div className="guide-step">
            <h4>💰 מחירים</h4>
            <ul>
              <li><strong>שחייה בודדת:</strong> 25 ש"ח</li>
              <li><strong>כרטיס 10 שחיות:</strong> 200 ש"ח (20 ש"ח לשחייה)</li>
              <li><strong>מנוי חודשי:</strong> 300 ש"ח (שחייה בלתי מוגבלת)</li>
              <li><strong>מנוי משפחתי:</strong> 500 ש"ח (עד 4 נפשות)</li>
            </ul>
          </div>

          <div className="guide-step">
            <h4>📅 הזמנות</h4>
            <ul>
              <li>הזמנות מתבצעות באתר או בטלפון</li>
              <li>יש להזמין לפחות שעה מראש</li>
              <li>ביטול עד 2 שעות לפני השעה המתוכננת</li>
              <li>במקרה של איחור, השחייה תתקצר בהתאם</li>
            </ul>
          </div>

          <div className="guide-tip">
            <strong>💡 טיפ:</strong> הזמינו מראש כדי להבטיח מקום, במיוחד בסופי שבוע ובחופשות.
          </div>
        </div>
      )
    },
    equipment: {
      title: "ציוד נדרש",
      icon: "🏊‍♀️",
      content: (
        <div className="guide-section-content">
          <h3>מה צריך להביא לשחייה</h3>
          
          <div className="guide-step">
            <h4>🏊‍♂️ ציוד חובה</h4>
            <ul>
              <li><strong>כובע שחייה:</strong> חובה לכל השחיינים</li>
              <li><strong>בגד ים:</strong> נוח ומותאם לשחייה</li>
              <li><strong>מגבת:</strong> לניגוב אחרי השחייה</li>
              <li><strong>סבון ושמפו:</strong> להתקלח לפני ואחרי</li>
            </ul>
          </div>

          <div className="guide-step">
            <h4>👓 ציוד מומלץ</h4>
            <ul>
              <li><strong>משקפי שחייה:</strong> לשחייה נוחה יותר</li>
              <li><strong>אטמי אוזניים:</strong> למניעת דלקות אוזניים</li>
              <li><strong>קרם הגנה:</strong> אם הבריכה פתוחה</li>
              <li><strong>שעון מים:</strong> למעקב אחר זמן השחייה</li>
            </ul>
          </div>

          <div className="guide-step">
            <h4>🎒 ציוד נוסף</h4>
            <ul>
              <li><strong>שקית אטומה:</strong> לשמירת בגדים רטובים</li>
              <li><strong>קרם לחות:</strong> אחרי השחייה</li>
              <li><strong>בקבוק מים:</strong> להידרציה</li>
              <li><strong>נעלי בריכה:</strong> למניעת החלקה</li>
            </ul>
          </div>

          <div className="guide-tip">
            <strong>💡 טיפ:</strong> הכינו את התיק מראש כדי לא לשכוח דברים חשובים. רשימת בדיקה תעזור לכם!
          </div>
        </div>
      )
    },
    tips: {
      title: "טיפים לשחייה",
      icon: "💡",
      content: (
        <div className="guide-section-content">
          <h3>טיפים לשחייה נעימה ובריאה</h3>
          
          <div className="guide-step">
            <h4>🌅 הכנה לשחייה</h4>
            <ul>
              <li>אל תאכלו שעה לפני השחייה</li>
              <li>שתו מים לפני הכניסה למים</li>
              <li>התחממו עם תרגילי מתיחה קלים</li>
              <li>התחילו בשחייה איטית לחימום</li>
            </ul>
          </div>

          <div className="guide-step">
            <h4>🏊‍♀️ בזמן השחייה</h4>
            <ul>
              <li>שמרו על נשימה סדירה ורגועה</li>
              <li>התחילו עם מסלולים קצרים</li>
              <li>שנו סגנונות שחייה למגוון</li>
              <li>הקשיבו לגוף - אל תגזימו</li>
            </ul>
          </div>

          <div className="guide-step">
            <h4>🧘‍♀️ אחרי השחייה</h4>
            <ul>
              <li>התקלחו מיד עם סבון</li>
              <li>שתו מים להחזרת נוזלים</li>
              <li>השתמשו בקרם לחות</li>
              <li>עשו מתיחות קלות</li>
            </ul>
          </div>

          <div className="guide-step">
            <h4>💪 יתרונות השחייה</h4>
            <ul>
              <li>מחזקת את כל שרירי הגוף</li>
              <li>משפרת את הכושר הגופני</li>
              <li>מפחיתה לחץ ומתח</li>
              <li>ידידותית למפרקים</li>
            </ul>
          </div>

          <div className="guide-tip">
            <strong>🌟 זכרו:</strong> השחייה היא פעילות נפלאה לבריאות הגוף והנפש. תהנו מהחוויה!
          </div>
        </div>
      )
    }
  };

  return (
    <div className="guide-container">
      <div className="guide-header">
        <h1 className="guide-main-title">מדריך השחיין</h1>
        <p className="guide-subtitle">כל מה שאתם צריכים לדעת לפני השחייה</p>
      </div>

      <div className="guide-navigation">
        {Object.entries(sections).map(([key, section]) => (
          <button
            key={key}
            className={`guide-nav-button ${activeSection === key ? 'active' : ''}`}
            onClick={() => setActiveSection(key)}
          >
            <span className="guide-nav-icon">{section.icon}</span>
            <span className="guide-nav-text">{section.title}</span>
          </button>
        ))}
      </div>

      <div className="guide-content">
        <div className="guide-section">
          <h2 className="guide-section-title">
            {sections[activeSection].icon} {sections[activeSection].title}
          </h2>
          {sections[activeSection].content}
        </div>
      </div>
    </div>
  );
};

export default Guide;