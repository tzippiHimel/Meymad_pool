const reservationService = require('../service/reservations.service');
const fs = require('fs');
const path = require('path');
let pdfParse;
try { pdfParse = require('pdf-parse'); } catch (_) { pdfParse = null; }
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

const calculateBusySlots = (reservations) => {
    if (!reservations || reservations.length === 0) {
        return {
            busySlots: []
        };
    }

    const busyTimes = new Set();
    const STEP_MINUTES = 5;
    const BREAK_TIME = 10;
    const dailySlots = new Map();

    reservations.forEach(reservation => {
        const start = dayjs(reservation.openTime);
        const end = dayjs(reservation.closeTime);
        const currentDate = start.format('YYYY-MM-DD');

        if (!dailySlots.has(currentDate)) {
            dailySlots.set(currentDate, new Set());
        }

        let current = start.subtract(BREAK_TIME, 'minute');
        while (current.isBefore(start)) {
            const timeStr = current.format('HH:mm');
            busyTimes.add(timeStr);
            dailySlots.get(currentDate).add(timeStr);
            current = current.add(STEP_MINUTES, 'minute');
        }

        current = start;
        while (current.isBefore(end)) {
            const timeStr = current.format('HH:mm');
            busyTimes.add(timeStr);
            dailySlots.get(currentDate).add(timeStr);
            current = current.add(STEP_MINUTES, 'minute');
        }
        current = end;
        const endBreak = end.add(BREAK_TIME, 'minute');
        while (current.isBefore(endBreak)) {
            const timeStr = current.format('HH:mm');
            busyTimes.add(timeStr);
            dailySlots.get(currentDate).add(timeStr);
            current = current.add(STEP_MINUTES, 'minute');
        }
    });

    const results = Array.from(busyTimes).map(time => ({
        time,
    }));

    const response = {
        busySlots: results.sort((a, b) => a.time.localeCompare(b.time)),
    };

    return response;
};

const validateReservationData = (data) => {
    const { user_id, openTime, closeTime, num_of_people } = data;

    if (!user_id || !openTime || !closeTime || !num_of_people) {
        throw new Error('חסרים נתונים נדרשים');
    }

    const start = dayjs(openTime);
    const end = dayjs(closeTime);

    if (!start.isValid() || !end.isValid()) {
        throw new Error('פורמט תאריך לא תקין');
    }

    if (start.isAfter(end) || start.isSame(end)) {
        throw new Error('שעת סיום חייבת להיות אחרי שעת התחלה');
    }

    if (num_of_people <= 0) {
        throw new Error('מספר האנשים חייב להיות חיובי');
    }

    const maxDuration = 48 * 60;
    const durationMinutes = end.diff(start, 'minute');
    if (durationMinutes > maxDuration) {
        throw new Error('משך ההזמנה לא יכול לחרוג מ-48 שעות');
    }

    return true;
};

exports.getReservations = async (req, res) => {
    try {
        if (req.query.openTime && req.query.closeTime) {
            const reservations = await reservationService.getActiveReservationsExtended(
                req.query.openTime,
                req.query.closeTime
            );
            const { busySlots } = calculateBusySlots(reservations);
            return res.status(200).json({ busySlots });
        }

        if (Object.keys(req.query).length > 0) {
            const reservations = await reservationService.getReservationsByQuery(req.query);
            return res.status(200).json(reservations);
        }

        reservations = await reservationService.getAllReservations();

        if (!reservations || reservations.length === 0) {
            return res.status(404).json({ error: 'לא מצאנו הזמנות' });
        }

        res.status(200).json(reservations);
    } catch (error) {
        console.error('Error in getSchedules:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.createReservation = async (req, res) => {
    try {
        validateReservationData(req.body);

        const hasReservation = await reservationService.hasUserReservationInRange(
            req.body.user_id,
            req.body.openTime,
            req.body.closeTime
        );
        if (hasReservation) {
            return res.status(409).json({ error: 'יש לך כבר הזמנה קיימת בטווח השעות הזה.' });
        }

        const canReserve = await reservationService.checkReservationInTwoWeeks(
            req.body.user_id,
            req.body.openTime
        );

        if (!canReserve) {
            return res.status(409).json({ error: 'לא ניתן להזמין יותר מ-3 פעמים במצב ממתין לאישור בתוך טווח של שבועיים.' });
        }

        const { user_id, openTime, closeTime, num_of_people, payment, group_description } = req.body;

        if (!group_description || group_description.trim() === '') {
            return res.status(400).json({ error: 'יש למלא תיאור קבוצה' });
        }

        const reservationData = {
            user_id,
            openTime,
            closeTime,
            num_of_people,
            payment,
            group_description,
            status: 'pending'
        };

        const newReservation = await reservationService.insertReservation(reservationData);

        const response = {
            ...newReservation,
            message: 'ההזמנה נוצרה בהצלחה וממתינה לאישור מנהל',
        };

        const io = req.app.get('io');
        io.to('admin').emit('newReservation', reservationData);

        res.status(201).json(response);

    } catch (error) {
        console.error('Error in createReservation:', error);

        if (error.message.includes('חסרים נתונים') ||
            error.message.includes('פורמט תאריך') ||
            error.message.includes('שעת סיום') ||
            error.message.includes('מספר האנשים') ||
            error.message.includes('משך ההזמנה')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'שגיאה ביצירת הזמנה' });
    }
};
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const {status, num_of_people, manager_comment, openTime, closeTime,payment,activityDate} = req.body;
        if (!id) {
            return res.status(400).json({ error: 'חסר מזהה הזמנה' });
        }

        const updateData = {};

        if (status) {
            const validStatuses = ['approved', 'rejected', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: 'סטטוס לא תקין' });
            }
            updateData.status = status;
        }

        const fieldsToUpdate = {
            num_of_people,
            manager_comment,
            openTime,
            closeTime,
            payment,
            activityDate
        };

        for (const [key, value] of Object.entries(fieldsToUpdate)) {
            if (typeof value !== 'undefined') {
                updateData[key] = value;
            }
        }


        const updatedReservation = await reservationService.updateReservationFields(id, updateData);

        if (updatedReservation.status === 'approved') {
            await reservationService.rejectOverlappingReservations(updatedReservation);
        }

        if (!updatedReservation) {
            return res.status(404).json({ error: 'ההזמנה לא נמצאה' });
        }


        res.status(200).json({
            message: 'ההזמנה עודכנה',
            updatedAt: new Date().toISOString(),
            ...updatedReservation
        });

    } catch (error) {
        console.error('שגיאה בעדכון ההזמנה:', error);
        res.status(500).json({ error: 'שגיאה בעדכון ההזמנה' });
    }
};

// פונקציות חדשות לניהול הפיקדון
exports.approveWithDeposit = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ error: 'חסר מזהה הזמנה' });
        }

        const updatedReservation = await reservationService.approveReservationWithDeposit(id);
        
        if (!updatedReservation) {
            return res.status(404).json({ error: 'ההזמנה לא נמצאה' });
        }

        // דחיית הזמנות חופפות
        await reservationService.rejectOverlappingReservations(updatedReservation);

        res.status(200).json({
            message: 'ההזמנה אושרה עם דרישה לפיקדון',
            updatedAt: new Date().toISOString(),
            ...updatedReservation
        });

    } catch (error) {
        console.error('שגיאה באישור הזמנה עם פיקדון:', error);
        res.status(500).json({ error: 'שגיאה באישור הזמנה עם פיקדון' });
    }
};

exports.confirmDeposit = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;
        
        if (!id || !user_id) {
            return res.status(400).json({ error: 'חסרים נתונים נדרשים' });
        }

        const updatedReservation = await reservationService.confirmDepositPayment(id, user_id);
        
        if (!updatedReservation) {
            return res.status(404).json({ error: 'ההזמנה לא נמצאה או שאין לך הרשאה' });
        }

        res.status(200).json({
            message: 'הפיקדון אושר בהצלחה',
            updatedAt: new Date().toISOString(),
            ...updatedReservation
        });

    } catch (error) {
        console.error('שגיאה באישור פיקדון:', error);
        res.status(500).json({ error: 'שגיאה באישור פיקדון' });
    }
};

exports.getReservationsWithDeposit = async (req, res) => {
    try {
        const { user_id } = req.query;
        const reservations = await reservationService.getReservationsWithDepositInfo(user_id);
        
        res.status(200).json(reservations);

    } catch (error) {
        console.error('שגיאה בקבלת הזמנות עם מידע פיקדון:', error);
        res.status(500).json({ error: 'שגיאה בקבלת הזמנות' });
    }
};

exports.checkExpiredDeposits = async (req, res) => {
    try {
        const expiredCount = await reservationService.checkExpiredDeposits();
        
        res.status(200).json({
            message: `${expiredCount} פיקדונות פגו`,
            expiredCount
        });

    } catch (error) {
        console.error('שגיאה בבדיקת פיקדונות פגי תוקף:', error);
        res.status(500).json({ error: 'שגיאה בבדיקת פיקדונות' });
    }
};

// פונקציות חדשות לניהול הסמכתאות
exports.uploadReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ error: 'חסר מזהה הזמנה' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'לא הועלה קובץ' });
        }

        // בדיקה שההזמנה קיימת ושייכת למשתמש
        const reservation = await reservationService.getReservationById(id);
        if (!reservation) {
            return res.status(404).json({ error: 'ההזמנה לא נמצאה' });
        }

        if (reservation.user_id !== req.user.id) {
            return res.status(403).json({ error: 'אין לך הרשאה לעדכן הזמנה זו' });
        }

        // שמירת הקובץ ועדכון הסטטוס
        const filePath = req.file.path;
        const updatedReservation = await reservationService.uploadReceipt(id, filePath);

        res.status(200).json({
            message: 'הסמכתא הועלתה בהצלחה',
            receiptStatus: 'receipt_under_review',
            ...updatedReservation
        });

    } catch (error) {
        console.error('שגיאה בהעלאת הסמכתא:', error);
        res.status(500).json({ error: 'שגיאה בהעלאת הסמכתא' });
    }
};

exports.verifyReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        let { analyzedText, amount, date, senderName, confidence } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'חסר מזהה הזמנה' });
        }

        // בדיקה שההזמנה קיימת ושייכת למשתמש
        const reservation = await reservationService.getReservationById(id);
        if (!reservation) {
            return res.status(404).json({ error: 'ההזמנה לא נמצאה' });
        }

        if (reservation.user_id !== req.user.id) {
            return res.status(403).json({ error: 'אין לך הרשאה לעדכן הזמנה זו' });
        }

        // אם לא התקבל טקסט מנותח מהלקוח (למשל במקרה של PDF) ננסה לחלץ בשרת
        if (!analyzedText && reservation.receipt_file_path) {
            const ext = path.extname(reservation.receipt_file_path).toLowerCase();
            if (ext === '.pdf' && pdfParse && fs.existsSync(reservation.receipt_file_path)) {
                try {
                    const dataBuffer = fs.readFileSync(reservation.receipt_file_path);
                    const pdfData = await pdfParse(dataBuffer);
                    analyzedText = (pdfData.text || '').trim();
                } catch (e) {
                    console.error('PDF parse failed:', e);
                }
            }
        }

        if (!analyzedText || analyzedText.trim().length === 0) {
            return res.status(400).json({ error: 'חסר טקסט מנותח' });
        }

        // בדיקות אימות בסיסיות למסמך
        const errors = [];
        const textLower = (analyzedText || '').toLowerCase();

        // אם לא התקבל סכום מהלקוח, ננסה לאתר אותו מהטקסט (עמיד לוריאציות מטבע)
        if ((amount === null || amount === undefined || amount === '') && analyzedText) {
            const txt = analyzedText;
            const candidates = [];
            const pushParsed = (str) => {
                const n = parseFloat(str.replace(/[\s,]/g, '').replace(/[^\d.]/g, ''));
                if (!Number.isNaN(n)) candidates.push(n);
            };

            // מטבע לפני המספר
            const r1 = /(₪|ש(?:"|״|”)?ח|nis|NIS)\s*([0-9]{1,3}(?:[\s,]\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/g;
            let m;
            while ((m = r1.exec(txt)) !== null) {
                pushParsed(m[2]);
            }

            // מטבע אחרי המספר
            const r2 = /([0-9]{1,3}(?:[\s,]\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)(?:\s*)(₪|ש(?:"|״|”)?ח|nis|NIS)/g;
            while ((m = r2.exec(txt)) !== null) {
                pushParsed(m[1]);
            }

            // מספר ליד מילות מפתח סכום/סה"כ/amount/total
            const keywordWindow = 25;
            const r3 = /[0-9]{1,3}(?:[\s,]\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?/g;
            while ((m = r3.exec(txt)) !== null) {
                const idx = m.index;
                const around = txt.slice(Math.max(0, idx - keywordWindow), idx + keywordWindow).toLowerCase();
                if (/(סה"כ|סה״כ|סכום|amount|total)/.test(around)) {
                    pushParsed(m[0]);
                }
            }

            if (candidates.length > 0) {
                // בחר את הסכום הגבוה ביותר כמועמד
                amount = Math.max(...candidates);
            }
        }

        // אם לא הגיע תאריך מהלקוח (במיוחד עבור PDF), ננסה לחלץ מהטקסט
        if ((!date || String(date).trim().length === 0) && analyzedText) {
            const dateRegex = /(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?))?/;
            const dm = analyzedText.match(dateRegex);
            if (dm) {
                const datePart = dm[1];
                const timePart = dm[2] || '00:00:00';
                let normalized;
                if (/^\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}$/.test(datePart)) {
                    // yyyy-mm-dd
                    normalized = datePart.replace(/[\.\/]/g, '-');
                } else {
                    // dd-mm-yyyy
                    const [dd, mm, yy] = datePart.replace(/[\.]/g, '-').replace(/[\/]/g, '-').split('-');
                    const yyyy = yy.length === 2 ? (Number(yy) > 50 ? `19${yy}` : `20${yy}`) : yy;
                    normalized = `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
                }
                const timeNorm = timePart.length === 5 ? `${timePart}:00` : timePart; // HH:mm -> HH:mm:ss
                date = `${normalized} ${timeNorm}`;
            }
        }

        // 1) חובה לזהות סכום והוא צריך להיות לפחות סכום הפיקדון המבוקש
        const requiredMin = reservation.deposit_amount || 50;
        if (!amount || Number.isNaN(Number(amount))) {
            errors.push('לא זוהה סכום בהסמכתא');
        } else if (Number(amount) + 0.01 < Number(requiredMin)) {
            errors.push(`הסכום שזוהה (${amount} ₪) נמוך מדרישת הפיקדון (${requiredMin} ₪)`);
        }

        // 2) מילות מפתח אופייניות להעברה/אישור תשלום
        const keywords = ['העברה', 'העברה בנקאית', 'קבלה', 'אישור', 'receipt', 'transfer', 'bank', 'payment'];
        const hasKeyword = keywords.some(k => textLower.includes(k));
        if (!hasKeyword) {
            errors.push('לא נמצאו מילות מפתח אופייניות למסמך תשלום');
        }

        // 3) תאריך: חובה לזהות תאריך, והוא חייב להיות בסביבת זמן סבירה להזמנה
        if (!date || String(date).trim().length === 0) {
            errors.push('לא זוהה תאריך במסמך');
        } else {
            const d = new Date(date);
            if (isNaN(d.getTime())) {
                errors.push('תאריך שזוהה אינו תקין');
            } else {
                const created = new Date(reservation.createdAt);
                const deadline = reservation.deposit_deadline ? new Date(reservation.deposit_deadline) : new Date(created.getTime() + 24*60*60*1000);
                const allowedStart = new Date(created.getTime() - 6*60*60*1000); // 6 שעות לפני יצירת ההזמנה
                const allowedEnd = new Date(deadline.getTime() + 24*60*60*1000); // עד יממה אחרי הדדליין
                // if (d < allowedStart) {
                //     errors.push('התאריך במסמך מוקדם מדי ביחס להזמנה');
                // }
                if (d > allowedEnd) {
                    errors.push('התאריך במסמך מאוחר מדי ביחס לדדליין');
                }
            }
        }

        // 4) סף ביטחון מה-OCR אם קיים
        if (confidence !== null && confidence !== undefined) {
            const confNum = Number(confidence);
            if (!Number.isNaN(confNum) && confNum < 50) {
                errors.push('רמת הביטחון בזיהוי נמוכה מדי');
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join('. ') });
        }

        // עדכון הסטטוס לאישור
        const updatedReservation = await reservationService.verifyReceipt(id, {
            analyzedText,
            amount,
            date,
            senderName,
            confidence
        });

        res.status(200).json({
            message: 'הסמכתא אושרה בהצלחה',
            receiptStatus: 'receipt_verified',
            ...updatedReservation
        });

    } catch (error) {
        console.error('שגיאה באישור הסמכתא:', error);
        res.status(500).json({ error: 'שגיאה באישור הסמכתא', details: error?.message || String(error) });
    }
};

