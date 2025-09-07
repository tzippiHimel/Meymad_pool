import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Box, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import ApiService from '../../ApiService';
import { useUser } from "../UserContext";
import { useReservationLogic } from './useReservationLogic';
import ReservationDialog from './ReservationDialog';
import AuthDialog from './AuthDialog';
import { useGlobalMessage } from "../GlobalMessageContext";
import { calendarStyles, getDayStyles } from './Calendar.styles';

dayjs.extend(utc);
dayjs.extend(timezone);

// Helpers: Hebrew date + Gematria
const GERESH = '\u05F3';
const GERSHAYIM = '\u05F4';
const onesMap = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const tensMap = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const hundredsMap = { 0: '', 100: 'ק', 200: 'ר', 300: 'ש', 400: 'ת', 500: 'תק', 600: 'תר', 700: 'תש', 800: 'תת', 900: 'תתק' };
const addGereshim = (letters) => {
  if (!letters) return '';
  return letters.length === 1 ? letters + GERESH : letters.slice(0, -1) + GERSHAYIM + letters.slice(-1);
};
const numberToHebrew = (num, isYear = false) => {
  let n = Number(num) || 0;
  if (isYear && n >= 1000) n = n % 1000;
  let out = '';
  const hundreds = Math.floor(n / 100) * 100;
  out += hundredsMap[hundreds] || '';
  n = n % 100;
  if (n === 15) { out += 'טו'; n = 0; }
  else if (n === 16) { out += 'טז'; n = 0; }
  else { const tens = Math.floor(n / 10); out += tensMap[tens] || ''; n = n % 10; }
  out += onesMap[n] || '';
  return addGereshim(out);
};
const getHebrewDayNumber = (date) => Number(new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric' }).format(date));
const getHebrewMonthName = (date) => new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long' }).format(date);
const getHebrewYearNumber = (date) => Number(new Intl.DateTimeFormat('en-u-ca-hebrew', { year: 'numeric' }).format(date));

export default function NewOrder() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const { currentUser } = useUser();
  const reservationLogic = useReservationLogic();
  const { showMessage } = useGlobalMessage();

  const {
    selectedDate: reservationSelectedDate,
    setSelectedDate,
    setBusySlots,
    setNextDayBusySlots,
    setIsEndTimeNextDay,
    formData,
    setFormData,
    fetchBusySlots,
    fetchNextDayBusySlots
  } = reservationLogic;

  // שמירה על selectedDate מקומי כדי למנוע בלבול
  const [selectedDate, setLocalSelectedDate] = useState(null);

  const weekDaysHebrew = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  const today = dayjs();

  useEffect(() => {
    if (openDialog && selectedDate) {
      fetchBusySlots(selectedDate);
      fetchNextDayBusySlots(selectedDate);
    }
  }, [openDialog, selectedDate, fetchBusySlots, fetchNextDayBusySlots]);

  // עדכן את user_id ב-formData כאשר currentUser משתנה
  useEffect(() => {
    if (currentUser?.id && formData.user_id === null) {
      setFormData(prev => ({
        ...prev,
        user_id: currentUser.id
      }));
    }
  }, [currentUser, formData.user_id]);

  const handleDateChange = async (date) => {
  console.log('Date selected:', date.format('YYYY-MM-DD'));
  setLocalSelectedDate(date);
  setSelectedDate(date); // עדכון גם ב-reservationLogic
  setOpenDialog(true);
  setIsEndTimeNextDay(false);

  setFormData({
    user_id: currentUser?.id || null,
    startTime: null,
    endTime: null,
    num_of_people: '',
    payment: '',
    group_description: ''
  });

  const formatDate = (d) => d.format('YYYY-MM-DD');
  const baseUrl = 'reservations'; 

  try {
    const response1 = await fetch(`${baseUrl}?openTime=${formatDate(date)} 00:00:00&closeTime=${formatDate(date)} 23:59:59`);
    const busyObj = await response1.json();

    const nextDay = date.clone().add(1, 'day');
    const response2 = await fetch(`${baseUrl}?openTime=${formatDate(nextDay)} 00:00:00&closeTime=${formatDate(nextDay)} 23:59:59`);
    const nextDayBusyObj = await response2.json();

    setBusySlots(busyObj || { busySlots: [] });
    setNextDayBusySlots(nextDayBusyObj || { busySlots: [] });
  } catch (error) {
    console.error('Error fetching busy slots:', error);
    setBusySlots({ busySlots: [] });
    setNextDayBusySlots({ busySlots: [] });
  }
};


  const handleTimeChange = (field) => (newValue) => {
    if (!dayjs.isDayjs(newValue) || !selectedDate) {
      console.log('Invalid time value or no selected date:', newValue, selectedDate);
      return;
    }
    
    console.log('Creating merged value for field:', field);
    console.log('Selected Date:', selectedDate.format('YYYY-MM-DD'));
    console.log('Time Value:', newValue.format('HH:mm'));
    
    const mergedValue = selectedDate
      .hour(newValue.hour())
      .minute(newValue.minute())
      .second(0);
      
    console.log('Merged Value:', mergedValue.format('YYYY-MM-DD HH:mm:ss'));

    if (field === 'startTime') {
      const minimumEndTime = mergedValue.add(reservationLogic.CONFIG.MINIMUM_DURATION, 'hour');
      const shouldSetNextDay = minimumEndTime.date() !== mergedValue.date();

      setIsEndTimeNextDay(shouldSetNextDay);

      let endTimeToSet = minimumEndTime;
      if (shouldSetNextDay) {
        endTimeToSet = selectedDate
          .hour(minimumEndTime.hour())
          .minute(minimumEndTime.minute())
          .second(0);
      }

      console.log('Setting start time:', mergedValue.format('YYYY-MM-DD HH:mm:ss'));
      console.log('Setting end time:', endTimeToSet.format('YYYY-MM-DD HH:mm:ss'));
      
      setFormData(prev => ({
        ...prev,
        startTime: mergedValue,
        endTime: endTimeToSet
      }));
    } else {
      console.log('Setting end time:', mergedValue.format('YYYY-MM-DD HH:mm:ss'));
      setFormData(prev => ({ ...prev, [field]: mergedValue }));
    }
  };

  const handleEndTimeNextDayChange = (event) => {
    const checked = event.target.checked;
    setIsEndTimeNextDay(checked);

    if (!checked && formData.endTime && formData.startTime) {
      const duration = formData.endTime.diff(formData.startTime, 'minute');
      if (duration < reservationLogic.CONFIG.MINIMUM_DURATION * 60) {
        // יצירת זמן סיום מינימלי באותו תאריך
        const minimumEndTime = selectedDate
          .hour(formData.startTime.hour())
          .minute(formData.startTime.minute())
          .second(0)
          .add(reservationLogic.CONFIG.MINIMUM_DURATION, 'hour');
        
        setFormData(prev => ({ ...prev, endTime: minimumEndTime }));
      }
    }
  };

  const handleFieldChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // בדיקה אם המשתמש מחובר
    if (!currentUser?.id) {
      setOpenAuthDialog(true);
      return;
    }

    try {
      // וידוא שהתאריכים נכונים
      let startDateTime = formData.startTime;
      let endDateTime = formData.endTime;

      // אם זמן הסיום הוא ליום הבא
      if (reservationLogic.isEndTimeNextDay) {
        endDateTime = selectedDate
          .add(1, 'day')
          .hour(endDateTime.hour())
          .minute(endDateTime.minute())
          .second(0);
      }

      console.log('Selected Date:', selectedDate.format('YYYY-MM-DD'));
      console.log('Start DateTime:', startDateTime.format('YYYY-MM-DD HH:mm:ss'));
      console.log('End DateTime:', endDateTime.format('YYYY-MM-DD HH:mm:ss'));
      console.log('Is End Time Next Day:', reservationLogic.isEndTimeNextDay);

      await ApiService.request({
        endPath: 'reservations',
        method: 'POST',
        body: {
          user_id: currentUser.id,
          openTime: startDateTime.format('YYYY-MM-DD HH:mm:ss'),
          closeTime: endDateTime.format('YYYY-MM-DD HH:mm:ss'),
          num_of_people: parseInt(formData.num_of_people, 10),
          payment: parseFloat(formData.payment),
          group_description: formData.group_description
        },
        credentials: 'include'
      });

      showMessage("ההזמנה נשלחה בהצלחה!", "success");
      setOpenDialog(false);
      setLocalSelectedDate(null);
      setSelectedDate(null);
    } catch (error) {
      const message = error.status === 409 ? error.message : "אירעה שגיאה בשליחת ההזמנה";
      showMessage(message, "error");
      console.error('Error creating reservation:', error);
    }
  };

  const handleAuthSuccess = () => {
    // אחרי התחברות/הרשמה מוצלחת, נסה לשלוח את ההזמנה שוב
    handleSubmit({ preventDefault: () => {} });
  };

  const getDaysInMonth = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDate = startOfMonth.startOf('week');
    const endDate = endOfMonth.endOf('week');
    
    const days = [];
    let currentDate = startDate;
    
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      days.push(currentDate);
      currentDate = currentDate.add(1, 'day');
    }
    
    return days;
  };

  const days = getDaysInMonth();

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Month title: Gregorian outside, Hebrew in parentheses
  const monthTitle = (() => {
    const dateObj = currentMonth.toDate();
    const greg = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(dateObj);
    const hName = getHebrewMonthName(dateObj);
    const hYear = numberToHebrew(getHebrewYearNumber(dateObj), true);
    return `${greg} (${hName} ${hYear})`;
  })();

  return (
    <Box dir="rtl" sx={calendarStyles.mainContainer}>
      <Box sx={calendarStyles.calendarBox}>
        {/* removed HebrewDatePicker */}

        <Box sx={calendarStyles.monthHeader}>
          <IconButton
            onClick={() => setCurrentMonth(prev => prev.subtract(1, 'month'))}
            sx={calendarStyles.monthButton}  >
            <ChevronLeft />
          </IconButton>
          <Typography variant="h4" sx={calendarStyles.monthTitle}>
            {monthTitle}
          </Typography> 
          <IconButton
            onClick={() => setCurrentMonth(prev => prev.add(1, 'month'))}
            sx={calendarStyles.monthButton}  >
            <ChevronRight />
          </IconButton>
        </Box>
        <Box sx={calendarStyles.weekDaysHeader}>
          {weekDaysHebrew.map((day, index) => (
            <Typography key={index} sx={calendarStyles.weekDay}>
              {day}
            </Typography>
          ))}
        </Box>

        <Box sx={calendarStyles.daysGrid}>
          {weeks.map((week, weekIndex) => (
            <Box key={weekIndex} sx={calendarStyles.weekRow}>
              {week.map((day, dayIndex) => {
                const isPast = day.isBefore(today, 'day');
                const hebLetters = numberToHebrew(getHebrewDayNumber(day.toDate()));
                const gregDay = day.date();
                return (
                  <Box
                    key={dayIndex}
                    onClick={() => !isPast && handleDateChange(day)}
                    sx={getDayStyles(day, currentMonth, selectedDate, today)}
                  >
                    <Box sx={calendarStyles.dayNumberBox}>
                      <Typography sx={{ fontWeight: 700 }}>
                        {`${gregDay} (${hebLetters})`}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      <ReservationDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        reservationLogic={{
          ...reservationLogic,
          selectedDate: selectedDate // העברת ה-selectedDate המקומי
        }}
        onTimeChange={handleTimeChange}
        onEndTimeNextDayChange={handleEndTimeNextDayChange}
        onFieldChange={handleFieldChange}
        onSubmit={handleSubmit}
      />
      
      <AuthDialog
        open={openAuthDialog}
        onClose={() => setOpenAuthDialog(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </Box>
  );
}