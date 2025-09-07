import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, CardActions, Button, Grid, Avatar, Divider, Collapse, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Chip } from '@mui/material';
import { AccessTime, People, Payment, CalendarToday, ExpandMore, ExpandLess, Edit, AccountBalance, Warning } from '@mui/icons-material';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import ApiService from '../../ApiService';
import StatusChip from './StatusChip';
import ReservationDetails from './ReservationDetails';
import ReservationMessageDialog from './ReservationMessageDialog';
import ReceiptUploader from '../orders/ReceiptUploader';
import { useGlobalMessage } from '../GlobalMessageContext';
import { useNavigate } from "react-router-dom";

// הוספת פלאגינים של dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

const ReservationCard = ({ reservation, isFuture, onReservationUpdate }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageType, setMessageType] = useState('update');
  const [messageContent, setMessageContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [isReceiptUploaded, setIsReceiptUploaded] = useState(false);
  const { showMessage } = useGlobalMessage();

  const formatDateTime = (dt) => dayjs.utc(dt).tz(dayjs.tz.guess()).format('DD/MM/YYYY בשעה HH:mm');
  const formatDuration = (start, end) => {
    const d = dayjs.utc(end).tz(dayjs.tz.guess()).diff(dayjs.utc(start).tz(dayjs.tz.guess()), 'hour', true);
    return d === Math.floor(d) ? `${d} שעות` : `${d.toFixed(1)} שעות`;
  };
  const getDaysUntil = (dateStr) => {
    const days = dayjs.utc(dateStr).tz(dayjs.tz.guess()).diff(dayjs(), 'day');
    return days === 0 ? 'עוד פחות מ24 שעות' : days === 1 ? 'מחר' : days > 1 ? `בעוד ${days} ימים` : null;
  };
  const currentStatus = reservation.current_status || reservation.status;
  const canSendMessage = () => isFuture && ['approved', 'pending', 'awaiting_deposit'].includes(currentStatus);
  
  const needsDeposit = () => currentStatus === 'awaiting_deposit';
  const depositExpired = () => currentStatus === 'deposit_expired';
  const canConfirmDeposit = () => needsDeposit() && !depositExpired();

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return;
    setIsSubmitting(true);
    try {
      await ApiService.request({
        endPath: 'messages',
        method: 'POST',
        body: {
          reservation_id: reservation.id,
          user_id: reservation.user_id,
          message_type: messageType,
          message_content: messageContent.trim()
        },
         credentials: 'include'
      });
      setMessageDialogOpen(false);
      setMessageContent('');
      setMessageType('update');
      showMessage('ההודעה נשלחה בהצלחה למנהל','success');
    } catch (error) {
      console.error('Error sending message:', error);
      showMessage('שגיאה בשליחת ההודעה', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeposit = async () => {
    try {
      await ApiService.request({
        endPath: `reservations/${reservation.id}/confirm-deposit`,
        method: 'PATCH',
        body: { user_id: reservation.user_id },
        credentials: 'include'
      });
      
      setDepositDialogOpen(false);
      showMessage('הפיקדון אושר בהצלחה!', 'success');
      
      // עדכן את הסטטוס בקומפוננטה
      if (onReservationUpdate) {
        onReservationUpdate(reservation.id, 'approved');
      }
      
      // רענון הדף כדי לקבל את הנתונים המעודכנים
      window.location.reload();
    } catch (error) {
      console.error('Error confirming deposit:', error);
      showMessage('שגיאה באישור הפיקדון', 'error');
    }
  };

  return (
    <>
      <Card sx={{ mb: 2, position: 'relative', transition: '0.3s', background: isFuture ? 'linear-gradient(135deg, #f8f9ff 0%, #e8f4fd 100%)' : 'linear-gradient(135deg, #f0f8f0 0%, #e8f5e8 100%)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: isFuture ? 'primary.main' : 'success.main', fontSize: '0.875rem' }}>
                #{reservation.id}
              </Avatar>
              <Box>
                <Typography variant="h6">{formatDateTime(reservation.openTime)}</Typography>
                {isFuture && getDaysUntil(reservation.openTime) && (
                  <Typography variant="caption" color="primary">{getDaysUntil(reservation.openTime)}</Typography>
                )}
              </Box>
            </Box>
            <StatusChip status={reservation.current_status || reservation.status} />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><AccessTime fontSize="small" /><Typography variant="body2">משך</Typography></Box><Typography>{formatDuration(reservation.openTime, reservation.closeTime)}</Typography></Grid>
            <Grid item xs={6} sm={3}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><People fontSize="small" /><Typography variant="body2">אנשים</Typography></Box><Typography>{reservation.num_of_people}</Typography></Grid>
            <Grid item xs={6} sm={3}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><Payment fontSize="small" /><Typography variant="body2">תשלום</Typography></Box><Typography color="success.main">₪{parseFloat(reservation.payment || 0).toFixed(2)}</Typography></Grid>
            <Grid item xs={6} sm={3}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><CalendarToday fontSize="small" /><Typography variant="body2">הוזמן ב</Typography></Box><Typography>{dayjs(reservation.createdAt).format('DD/MM/YY')}</Typography></Grid>
          </Grid>
        </CardContent>
        {/* הצגת כפתורים רק להזמנות עתידיות */}
        {isFuture && (
          <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
            <Button onClick={() => setExpanded(!expanded)} endIcon={expanded ? <ExpandLess /> : <ExpandMore />} size="small">
              {expanded ? 'פחות פרטים' : 'עוד פרטים'}
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {canConfirmDeposit() && (
                <Button 
                  onClick={() => setDepositDialogOpen(true)} 
                  variant="contained" 
                  color="warning" 
                  size="small" 
                  startIcon={<AccountBalance />}
                >
                  אישור פיקדון
                </Button>
              )}
              {canSendMessage() && (
                <Button onClick={() => setMessageDialogOpen(true)} variant="outlined" size="small" startIcon={<Edit />}>
                  ביטול ועדכון הזמנה
                </Button>
              )}
            </Box>
          </CardActions>
        )}

         <Collapse in={expanded}>
          <Divider />
          <CardContent>
            <ReservationDetails reservation={reservation} />
            
            {/* קומפוננטה להעלאת הסמכתאות */}
            {/* {needsDeposit() && (
              <Box sx={{ mt: 3 }}>
                <ReceiptUploader
                  reservationId={reservation.id}
                  currentStatus={reservation.receipt_status || 'pending'}
                  receiptFilePath={reservation.receipt_file_path}
                  onReceiptUploaded={() => {
                    window.location.reload();
                  }}
                />
              </Box>
            )} */}

            {/* הצגת קישור לצפייה באסמכתא אם אושרה */}
            {reservation.receipt_status === 'receipt_verified' && reservation.receipt_file_path && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="success.main" gutterBottom>
                  המסמך שלך אושר! לצפייה באסמכתא:
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  href={reservation.receipt_file_path.startsWith('/') ? reservation.receipt_file_path : '/' + reservation.receipt_file_path}
                  target="_blank"
                  rel="noopener"
                >
                  צפייה באסמכתא שהועלתה
                </Button>
              </Box>
            )}
          </CardContent>
        </Collapse>
        
        {/* אזהרת פיקדון */}
        {needsDeposit() && (
          <Alert 
            severity={depositExpired() ? "error" : "warning"} 
            sx={{ m: 2, borderRadius: 2 }}
            icon={depositExpired() ? <Warning /> : <AccountBalance />}
          >
            {depositExpired() ? (
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  ⏰ הפיקדון פג תוקף!
                </Typography>
                <Typography variant="body2">
                  לא ביצעת העברה בנקאית תוך 12 שעות. ההזמנה בוטלה אוטומטית.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  💰 נדרש פיקדון של ₪50
                </Typography>
                <Typography variant="body2" gutterBottom>
                  יש לבצע העברה בנקאית תוך 12 שעות לאישור ההזמנה.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  תאריך יעד: {dayjs(reservation.deposit_deadline).format('DD/MM/YYYY בשעה HH:mm')}
                </Typography>
              </Box>
            )}
          </Alert>
        )}
      </Card>

      {/* דיאלוג אישור פיקדון */}
      <Dialog open={depositDialogOpen} onClose={() => setDepositDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalance color="warning" />
            <Typography variant="h6">אישור העברה בנקאית</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              אנא וודא שביצעת העברה בנקאית בסך ₪50 לחשבון הבנק שלנו.
            </Typography>
          </Alert>
          <Typography variant="body1" paragraph>
            פרטי החשבון:
          </Typography>
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">שם הבנק: בנק לאומי</Typography>
            <Typography variant="body2">מספר חשבון: 123456789</Typography>
            <Typography variant="body2">מספר סניף: 001</Typography>
            <Typography variant="body2">שם בעל החשבון: מיימד בע"מ</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            לאחר אישור, ההזמנה שלך תאושר אוטומטית.
          </Typography>
          {/* כאן העלאת האסמכתא */}
          <ReceiptUploader
            reservationId={reservation.id}
            currentStatus={reservation.receipt_status || 'pending'}
            receiptFilePath={reservation.receipt_file_path}
            onReceiptUploaded={() => {
              setIsReceiptUploaded(true); // עדכן שהאסמכתא הועלתה
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepositDialogOpen(false)}>ביטול</Button>
          <Button
            onClick={handleConfirmDeposit}
            variant="contained"
            color="warning"
            disabled={!isReceiptUploaded} // הכפתור פעיל רק אחרי העלאת אסמכתא
          >
            אישור העברה בנקאית
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={messageDialogOpen} onClose={() => setMessageDialogOpen(false)}>
        <DialogTitle>בחר פעולה</DialogTitle>
        <DialogContent>
          {reservation.status === 'pending' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Button
                color="error"
                variant="contained"
                onClick={async () => {
                  if (window.confirm('האם אתה בטוח שברצונך לבטל את ההזמנה?')) {
                    await onReservationUpdate(reservation.id, 'cancelled');
                    setMessageDialogOpen(false);
                  }
                }}
              > בטל הזמנה
              </Button>
              <Button
                color="primary"
                variant="contained"
                onClick={async () => {
                  if (window.confirm('עריכת ההזמנה תבטל את ההזמנה הנוכחית ותאפשר לך להזמין תור חדש. להמשיך?')) {
                    await   onReservationUpdate(reservation.id, 'cancelled');
                    setMessageDialogOpen(false);
                    navigate('/newOrder');
                  }
                }}
              >
                ערוך והזמן תור חדש
              </Button>
            </Box>
          ) : (
            <ReservationMessageDialog
              open={messageDialogOpen}
              onClose={() => setMessageDialogOpen(false)}
              reservation={reservation}
              messageType={messageType}
              setMessageType={setMessageType}
              messageContent={messageContent}
              setMessageContent={setMessageContent}
              onSubmit={handleSendMessage}
              isSubmitting={isSubmitting}
              hideTypeSelect={false}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialogOpen(false)}>סגור</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReservationCard;
