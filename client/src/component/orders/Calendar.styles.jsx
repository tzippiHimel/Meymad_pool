
export const calendarStyles = {
  mainContainer: {
    width: '100vw',
    height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
    position: 'fixed',
    top: { xs: '56px', sm: '64px' },
    left: 0,
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 1000,
    padding: { xs: '10px', sm: '20px' },
    boxSizing: 'border-box',
  },

  calendarBox: {
    width: { xs: '98vw', sm: '90vw', md: '80vw', lg: '70vw' },
    maxWidth: '1400px',
    height: '100%',
    padding: { xs: '10px', sm: '20px' },
    display: 'flex',
    flexDirection: 'column',
    margin: '0 auto',
  },

  monthHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '15px',
    marginBottom: '15px',
    borderBottom: '2px solid #b3e5fc',
    flexShrink: 0,
  },

  monthButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: '12px',
    width: '45px',
    height: '45px',
    '&:hover': {
      backgroundColor: '#29b6f6',
      color: 'white',
      transform: 'scale(1.1)',
    },
  },

  monthTitle: {
    fontSize: { xs: '1.5rem', sm: '2rem' },
    fontWeight: 700,
    color: '#29b6f6',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
  },

  weekDaysHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    flexShrink: 0,
  },

  weekDay: {
    fontSize: { xs: '1rem', sm: '1.2rem' },
    fontWeight: 600,
    color: '#29b6f6',
    textAlign: 'center',
    width: 'calc(100% / 7)',
    height: { xs: '30px', sm: '35px' },
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  daysGrid: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  weekRow: {
    flex: 1,
    display: 'flex',
    gap: '8px',
    justifyContent: 'space-between',
  },

  dayNumberBox: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: { xs: '4px 8px 0 0', sm: '8px 12px 0 0' },
    boxSizing: 'border-box',
  },
};

export const getDayStyles = (day, currentMonth, selectedDate, today) => {
  const isToday = day.isSame(today, 'day');
  const isSelected = selectedDate && day.isSame(selectedDate, 'day');
  const isCurrentMonth = day.isSame(currentMonth, 'month');
  const isPast = day.isBefore(today, 'day');

  return {
    flex: 1,
    height: '100%',
    minHeight: { xs: '60px', sm: '80px' },
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: { xs: '1.4rem', sm: '1.8rem' },
    fontWeight: 700,
    borderRadius: '16px',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: isPast ? 'not-allowed' : 'pointer',
    opacity: 1,
    pointerEvents: 'auto',
    
    color: isPast ? '#bdbdbd' 
         : !isCurrentMonth ? '#ccc'
         : isSelected ? 'white'
         : isToday ? '#0288d1' : '#01579b',
    
    backgroundColor: isPast ? 'rgba(189, 189, 189, 0.2)'
                   : isSelected ? '#4fc3f7'
                   : isToday ? 'rgba(2, 136, 209, 0.1)'
                   : 'rgba(255, 255, 255, 0.8)',
    
    border: isPast ? '2px solid rgba(189, 189, 189, 0.3)'
          : isSelected ? '3px solid #29b6f6'
          : isToday ? '3px solid #0288d1'
          : '3px solid transparent',
    
    boxShadow: isSelected ? '0 20px 40px rgba(33, 150, 243, 0.2)' : 'none',
    
    '&:hover': !isPast ? {
      backgroundColor: isSelected ? '#29b6f6' : 'rgba(33, 150, 243, 0.1)',
      color: isSelected ? 'white' : '#29b6f6',
      transform: 'translateY(-8px) scale(1.05)',
      boxShadow: '0 15px 35px rgba(33, 150, 243, 0.2)',
      border: '3px solid #4fc3f7',
    } : {},
  };
};