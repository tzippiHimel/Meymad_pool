// navStyles.js - קובץ העיצובים המתוקן עבור קומפוננטת הניווט

export const drawerWidth = 72;
export const mainColor = '#e0f7fa';

export const navStyles = {
  // Container עיקרי
  mainContainer: {
    display: 'flex',
    minHeight: '100vh',
    bgcolor: '#f0fefe'
  },

  // לוגו
  logoContainer: {
    position: 'fixed',
    bottom:470,      // במקום top
    left: 20,        // במקום right
    right: 'auto',   // הוסיפי שורה זו
    top: 'auto',     // הוסיפי שורה זו
    zIndex: (theme) => theme.zIndex.drawer + 10,
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.25s cubic-bezier(.4,2,.6,1)',
    '&:hover': {
      transform: 'scale(1.10)',
    }
  },
  
  logoImage: {
    height: 120,
    width: 'auto',
    display: 'block'
  },

  // AppBar
  appBar: {
    bgcolor: mainColor,
    color: '#007c91',
    borderBottom: '1px solid #b2ebf2',
    zIndex: (theme) => theme.zIndex.drawer + 1,
  },

  // Toolbar
  toolbar: {
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    pr: { sm: `${drawerWidth + 20}px` }, // מוסיף מקום לניתוב הצדדי
    minHeight: { xs: '56px', sm: '64px' },
    px: { xs: 1, sm: 2 }
  },

  // קבוצת כפתורים שמאלית
  leftButtonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: { xs: 0.5, sm: 1 },
    flexWrap: 'wrap',
    flexGrow: 1,
    overflow: 'hidden'
  },

  // קבוצת כפתורים ימנית
  rightButtonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: { xs: 0.5, sm: 1 },
    flexShrink: 0
  },

  // כפתורים רגילים
  regularButton: {
    color: '#007c91',
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    px: { xs: 1, sm: 2 },
    py: { xs: 0.5, sm: 1 },
    minWidth: 'auto'
  },

  // כפתור הזמנה חדשה
  newOrderButton: {
    bgcolor: '#00acc1',
    color: '#fff',
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    px: { xs: 1.5, sm: 2 },
    py: { xs: 0.5, sm: 1 },
    '&:hover': { bgcolor: '#00838f' }
  },

  homeButton: {
    bgcolor: '#00bcd4',
    color: '#fff',
    '&:hover': { bgcolor: '#0097a7' }
  },

  homeIconButton: {
    color: '#007c91',
    '&:hover': { color: '#005f73', bgcolor: 'transparent' }
  },

  // כפתור משתמש
  userButton: {
    textTransform: 'none',
    fontWeight: 600,
    color: '#007c91'
  },

  // אווטר משתמש
  userAvatar: {
    bgcolor: '#00bcd4'
  },

  // Drawer
  drawer: {
    display: { xs: 'none', sm: 'block' }, // הסתרה במכשירים קטנים
    '& .MuiDrawer-paper': {
      width: drawerWidth,
      boxSizing: 'border-box',
      bgcolor: mainColor,
      borderLeft: '1px solid #b2ebf2',
      boxShadow: '3px 0 6px rgba(0,0,0,0.05)',
    },
  },

  // רווח תחת ה-Toolbar ב-Drawer
  drawerSpacing: {
    mt: 2
  },

  // כפתורי הניווט בצד
  navButton: {
    justifyContent: 'center',
    py: 2
  },

  // אייקונים בניווט הצדדי
  navIcon: {
    minWidth: 'auto',
    color: '#007c91'
  },

  mainContent: {
    flexGrow: 1,
    marginTop: { xs: '56px', sm: '64px' }, // גובה ה-AppBar
    marginRight: { xs: 0, sm: `${drawerWidth}px` }, // רוחב הניווט הצדדי
    width: { xs: '100vw', sm: `calc(100vw - ${drawerWidth}px)` }, // רוחב המסך פחות הניווט
    maxWidth: { xs: '100vw', sm: `calc(100vw - ${drawerWidth}px)` }, // מונע חריגה
    overflow: 'hidden', // מונע גלילה אופקית
    bgcolor: '#f7fdff',
    minHeight: { xs: `calc(100vh - 56px)`, sm: `calc(100vh - 64px)` }, // גובה מלא פחות ה-AppBar
    position: 'relative'
  },

  footer: {
    mt: 4,
    py: 2,
    px: 2,
    borderTop: '1px solid #b2ebf2',
    color: '#006978',
    bgcolor: '#e0f7fa',
  },

  footerLink: {
    color: '#006978',
    textDecoration: 'underline',
    '&:hover': { color: '#004d5a' }
  },

  footerIcon: {
    verticalAlign: 'middle',
    color: '#007c91'
  },

  footerEmphasis: {
    fontStyle: 'italic',
    fontWeight: 600
  },

  footerHomeBox: {
    // removed
  },

  footerHomeButton: {
    // removed
  }
};