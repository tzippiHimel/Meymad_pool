import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Grid, Paper, Chip, CircularProgress, Stack, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import ApiService from '../../ApiService';
import { useGlobalMessage } from "../GlobalMessageContext";
import ReservationDetailsDialog from './adminReservations/ReservationDetailsDialog';

const DAY_BG = '#f8fafc';
const DAY_BORDER = '#e0e0e0';
const TODAY_BG = '#fffde7';
const TODAY_BORDER = '#ffd600';
const RES_BG = '#e3f2fd';
const RES_TEXT = '#1565c0';
const DEPOSIT_BG = '#fff3e0';
const DEPOSIT_TEXT = '#ef6c00';
const NO_RES_TEXT = '#bdbdbd';
const MAX_VISIBLE_RES = 3;
const DAY_BOX_WIDTH = 170;
const DAY_BOX_HEIGHT = 180;

dayjs.extend(utc);
dayjs.extend(timezone);

// עזר: המרת מספר לאותיות עבריות (גימטריה) עם גרש/גרשיים
const GERESH = '\u05F3';
const GERSHAYIM = '\u05F4';
const onesMap = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const tensMap = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const hundredsMap = {
  0: '', 100: 'ק', 200: 'ר', 300: 'ש', 400: 'ת', 500: 'תק', 600: 'תר', 700: 'תש', 800: 'תת', 900: 'תתק'
};
const addGereshim = (letters) => {
  if (!letters) return '';
  return letters.length === 1 ? letters + GERESH : letters.slice(0, -1) + GERSHAYIM + letters.slice(-1);
};
const numberToHebrew = (num, isYear = false) => {
  let n = Number(num) || 0;
  if (isYear && n >= 1000) {
    // בשנים עבריות מדלגים על האלפים (5000+)
    n = n % 1000;
  }
  let out = '';
  const hundreds = Math.floor(n / 100) * 100;
  out += hundredsMap[hundreds] || '';
  n = n % 100;
  if (n === 15) {
    out += 'טו';
    n = 0;
  } else if (n === 16) {
    out += 'טז';
    n = 0;
  } else {
    const tens = Math.floor(n / 10);
    out += tensMap[tens] || '';
    n = n % 10;
  }
  out += onesMap[n] || '';
  return addGereshim(out);
};

// עזר: שמות חודשים עבריים מה-Intl
const hebrewMonthName = (date) =>
  new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long' }).format(date);
const hebrewYearNumber = (date) =>
  Number(new Intl.DateTimeFormat('en-u-ca-hebrew', { year: 'numeric' }).format(date));
const hebrewDayNumber = (date) =>
  Number(new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric' }).format(date));

const getDaysInMonth = (month, year) => {
  const days = [];
  const firstDay = dayjs(`${year}-${String(month + 1).padStart(2, '0')}-01`);
  const daysInMonth = firstDay.daysInMonth();
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(dayjs(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`));
  }
  return days;
};

export default function AdminReservationCalendar() {
  const [reservationsByDay, setReservationsByDay] = useState({});
  const [loading, setLoading] = useState(false);
  const { showMessage } = useGlobalMessage();
  const [currentMonth, setCurrentMonth] = useState(dayjs().month());
  const [currentYear, setCurrentYear] = useState(dayjs().year());
  const [expandedDay, setExpandedDay] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [editData, setEditData] = useState(null);
  const today = dayjs().format('YYYY-MM-DD');

  const fetchMonthReservations = useCallback(async () => {
    setLoading(true);
    try {
      const start = dayjs(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`).startOf('month').format('YYYY-MM-DD HH:mm:ss');
      const end = dayjs(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`).endOf('month').format('YYYY-MM-DD HH:mm:ss');
      const [approved, awaiting] = await Promise.all([
        ApiService.request({ endPath: `reservations?status=approved&start=${start}&end=${end}`, credentials: 'include' }),
        ApiService.request({ endPath: `reservations?status=awaiting_deposit&start=${start}&end=${end}`, credentials: 'include' })
      ]);
      const data = [
        ...(Array.isArray(approved) ? approved : []),
        ...(Array.isArray(awaiting) ? awaiting : [])
      ];
      const grouped = {};
      data.forEach(res => {
        const day = dayjs(res.openTime).format('YYYY-MM-DD');
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(res);
      });
      setReservationsByDay(grouped);
    } catch (e) {
      showMessage('שגיאה בטעינת ההזמנות', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, showMessage]);

  useEffect(() => {
    fetchMonthReservations();
  }, [fetchMonthReservations]);

  const days = getDaysInMonth(currentMonth, currentYear);
  const weekDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  const firstDayOfWeek = days[0].day();
  const daysWithPadding = [
    ...Array(firstDayOfWeek).fill(null),
    ...days
  ];
  const weeks = [];
  for (let i = 0; i < daysWithPadding.length; i += 7) {
    weeks.push(daysWithPadding.slice(i, i + 7));
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const DAY_BOX_STYLE = {
    minHeight: DAY_BOX_HEIGHT,
    maxHeight: DAY_BOX_HEIGHT,
    minWidth: DAY_BOX_WIDTH,
    maxWidth: DAY_BOX_WIDTH,
    overflow: 'hidden',
    transition: 'all 0.2s',
    cursor: 'default',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };
  const DAY_BOX_EXPANDED = {
    minHeight: 320,
    maxHeight: 500,
    zIndex: 10,
    boxShadow: '0 0 24px #90caf9',
    overflowY: 'auto',
    cursor: 'pointer',
  };

  const handleOpenDetails = (event, res) => {
    event.stopPropagation();
    setSelectedReservation(res);
    const localTz = dayjs.tz.guess();
    setEditData({
      manager_comment: res.manager_comment || '',
      openTime: dayjs.utc(res.openTime).tz(localTz).format('HH:mm'),
      closeTime: dayjs.utc(res.closeTime).tz(localTz).format('HH:mm'),
      activityDate: dayjs.utc(res.openTime).tz(localTz).format('YYYY-MM-DD'),
      num_of_people: res.num_of_people,
      payment: res.payment,
      group_description: res.group_description || '',
      _editPeople: false,
      _editPayment: false,
      _editDate: false,
      _editStart: false,
      _editEnd: false,
      _editComment: false
    });
    setDetailsOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedReservation || !editData) return;
    try {
      const openDateTime = dayjs(`${editData.activityDate} ${editData.openTime}:00`).format('YYYY-MM-DD HH:mm:ss');
      const closeDateTime = dayjs(`${editData.activityDate} ${editData.closeTime}:00`).format('YYYY-MM-DD HH:mm:ss');

      await ApiService.request({
        endPath: `reservations/${selectedReservation.id}`,
        method: 'PATCH',
        body: {
          manager_comment: editData.manager_comment,
          openTime: openDateTime,
          closeTime: closeDateTime,
          num_of_people: editData.num_of_people,
          payment: editData.payment
        },
        credentials: 'include'
      });

      showMessage('ההזמנה עודכנה', 'success');
      setDetailsOpen(false);
      setSelectedReservation(null);
      await fetchMonthReservations();
    } catch (err) {
      console.error('Error updating reservation:', err);
      const message = err?.data?.error || err?.message || 'שגיאה בעדכון ההזמנה';
      showMessage(message, 'error');
    }
  };

  // חישובי הצגה עבריים
  const monthTitleHebrew = (() => {
    const date = new Date(currentYear, currentMonth, 1);
    const monthName = hebrewMonthName(date);
    const yearNum = hebrewYearNumber(date);
    const yearHeb = numberToHebrew(yearNum, true);
    const gregMonthYear = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(date);
    return `${gregMonthYear} (${monthName} ${yearHeb})`;
  })();

  return (
    <Card sx={{ my: 4, p: 2, maxWidth: '100vw', mx: 'auto', bgcolor: '#f4f6fb' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight={700}>לוח הזמנות חודשי</Typography>
          <Box>
            <button onClick={handlePrevMonth} style={{marginLeft: 8, padding: '6px 16px', borderRadius: 8, border: 'none', background: '#e3f2fd', color: '#1565c0', fontWeight: 600, cursor: 'pointer'}}>חודש קודם</button>
            <button onClick={handleNextMonth} style={{padding: '6px 16px', borderRadius: 8, border: 'none', background: '#e3f2fd', color: '#1565c0', fontWeight: 600, cursor: 'pointer'}}>חודש הבא</button>
          </Box>
        </Box>
        <Typography variant="h6" align="center" gutterBottom sx={{ letterSpacing: 2, color: '#1976d2', fontWeight: 700 }}>
          {monthTitleHebrew}
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto', width: '100%' }}>
            <Grid container spacing={1} sx={{ mb: 1, minWidth: DAY_BOX_WIDTH * 7 + 16 }} wrap="nowrap">
              {weekDays.map((wd, idx) => (
                <Grid item key={idx} sx={{ minWidth: DAY_BOX_WIDTH, maxWidth: DAY_BOX_WIDTH }}>
                  <Typography align="center" fontWeight={700} color="#1976d2">{wd}</Typography>
                </Grid>
              ))}
            </Grid>
            {weeks.map((week, wi) => (
              <Grid container spacing={1} key={wi} sx={{ minWidth: DAY_BOX_WIDTH * 7 + 16 }} wrap="nowrap">
                {week.map((day, di) => {
                  if (!day) return <Grid item key={di} sx={{ minWidth: DAY_BOX_WIDTH, maxWidth: DAY_BOX_WIDTH }}><Box sx={{ minHeight: DAY_BOX_HEIGHT }} /></Grid>;
                  const dayKey = day.format('YYYY-MM-DD');
                  const isToday = dayKey === today;
                  let resList = reservationsByDay[dayKey] || [];
                  resList = [...resList].sort((a, b) => dayjs(a.openTime) - dayjs(b.openTime));
                  const isExpanded = expandedDay === dayKey;
                  const showExpand = resList.length > MAX_VISIBLE_RES;
                  const visibleRes = isExpanded ? resList : resList.slice(0, MAX_VISIBLE_RES);
                  const canExpand = showExpand;
                  const handleExpand = () => {
                    if (canExpand) setExpandedDay(isExpanded ? null : dayKey);
                  };
                  const gregDayNumber = day.date(); // תאריך לועזי
                  const hebDayLetters = numberToHebrew(hebrewDayNumber(day.toDate()));
                  const isPastDay = day.isBefore(dayjs().startOf('day'));
                  return (
                    <Grid item key={di} sx={{ minWidth: DAY_BOX_WIDTH, maxWidth: DAY_BOX_WIDTH }}>
                      <Paper elevation={isToday ? 6 : 2}
                        sx={{
                          ...DAY_BOX_STYLE,
                          ...(isExpanded ? DAY_BOX_EXPANDED : {}),
                          bgcolor: isToday ? TODAY_BG : (resList.length ? RES_BG : DAY_BG),
                          border: `2px solid ${isToday ? TODAY_BORDER : (resList.length ? '#90caf9' : DAY_BORDER)}`,
                          borderRadius: 3,
                          boxShadow: isToday ? '0 0 10px #ffd60055' : undefined,
                          cursor: canExpand ? 'pointer' : 'default',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                        onClick={handleExpand}
                      >
                        {isPastDay && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              zIndex: 20,
                              pointerEvents: 'none',
                              opacity: 0.22,
                              width: '100%',
                            }}
                          >
                            <Typography
                              variant="h3"
                              fontWeight={900}
                              color="#1976d2"
                              sx={{
                                textAlign: 'center',
                                letterSpacing: 8,
                                fontSize: 38,
                                userSelect: 'none',
                              }}
                            >
                            חלף
                            </Typography>
                          </Box>
                        )}
                        <Box width="100%" mb={1} display="flex" alignItems="center" justifyContent="center">
                          <Typography variant="subtitle1" align="center" fontWeight={700} sx={{ color: isToday ? '#fbc02d' : '#1976d2', fontSize: 20 }}>
                            {`${gregDayNumber} (${hebDayLetters})`}
                          </Typography>
                          {showExpand && (
                            <IconButton size="small" sx={{ ml: 1 }} onClick={(e) => { e.stopPropagation(); handleExpand(); }}>
                              {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </IconButton>
                          )}
                        </Box>
                        <Stack spacing={0.5} width="100%" alignItems="center">
                          {visibleRes.length > 0 ? (
                            visibleRes.map(res => (
                              <Chip
                                key={res.id}
                                label={dayjs.utc(res.openTime).tz(dayjs.tz.guess()).format('HH:mm') + ' - ' + dayjs.utc(res.closeTime).tz(dayjs.tz.guess()).format('HH:mm')}
                                size="small"
                                onClick={(e) => { e.stopPropagation(); handleOpenDetails(e, res); }}
                                sx={{
                                  bgcolor: res.status === 'awaiting_deposit' ? DEPOSIT_BG : RES_BG,
                                  color: res.status === 'awaiting_deposit' ? DEPOSIT_TEXT : RES_TEXT,
                                  fontWeight: 700,
                                  width: '90%',
                                  fontSize: 15,
                                  mb: 0.5
                                }}
                              />
                            ))
                          ) : (
                            <Typography variant="caption" color={NO_RES_TEXT} align="center" sx={{ mt: 2 }}>
                              אין הזמנות
                            </Typography>
                          )}
                          {showExpand && !isExpanded && (
                            <Box mt={1}>
                              <Chip label={`+${resList.length - MAX_VISIBLE_RES} נוספים`} size="small" color="primary" />
                            </Box>
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            ))}
          </Box>
        )}
      </CardContent>

      {detailsOpen && selectedReservation && editData && (
        <ReservationDetailsDialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          selectedReservation={selectedReservation}
          editData={editData}
          setEditData={setEditData}
          handleUpdate={handleUpdate}
        />
      )}
    </Card>
  );
}