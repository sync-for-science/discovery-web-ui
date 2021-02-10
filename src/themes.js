import { createMuiTheme } from '@material-ui/core/styles';

export { ThemeProvider } from '@material-ui/core/styles';

export const rootTheme = createMuiTheme({
  components: {
    MuiButton: {
      defaultProps: {
        disableRipple: true,
        // See both: https://material-ui.com/getting-started/faq/
        //           https://next.material-ui.com/guides/migration-v4/
      },
      styleOverrides: {
        root: {
          fontFamily: 'text-bold',
        },
      },
    },
    MuiMenuItem: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          fontFamily: 'header'
        }
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          fontFamily: 'header',
          padding: '0px',
          paddingLeft: '8px',
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '8px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        justifyContent: 'space-between',
        padding: '8px 16px 8px 16px',
        root: {
          justifyContent: 'space-between',
          padding: '8px 16px 8px 16px',
          // example styling of nested component:
          '& .MuiDialogTitle-root': {
            // '& [class*="MuiDialogTitle-root"]': { // ^alternatively
            padding: 0,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: 'header',
        }
      }
    },
  },
  palette: {
    primary: {
      main: 'rgb(65, 151, 198)', // Colors.css --ca1
      dark: 'rgb(23, 104, 145)', //Colors.css --ca3
    },
    secondary: {
      main: '#fff',
    },
  },
  typography: {
    'user-profile': {
      marginLeft: '8px',
      fontFamily: 'header-bold',
      fontSize: '1rem',
      color: 'white',
    },
    'card-list-collection-count': {
      display: 'block',
      fontFamily: 'header',
    },
    'card-list-category-header': {
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: 'header-bold',
      color: 'var(--ca1)',
      margin: 4,
    },
    'card-list-category-label': {
      fontSize: '1rem',
    },
    'card-list-category-count': {
      fontFamily: 'header',
      display: 'inline',
      color: '#aaa',
    },
    s4sHeader: {
      fontFamily: 'header-bold',
      fontSize: '0.813rem',
    },
    s4sSubheader: {
      fontFamily: 'data-number',
      fontSize: '0.813rem',
      color: 'var(--label-data)',
    },
    s4sLabel: {
      fontFamily: 'data-text-bold',
      fontSize: '0.813rem',
      color: 'var(--label-data)',
    },
    s4sValueText: {
      fontFamily: 'label',
      fontSize: '0.813rem',
      color: 'var(--label-data)',
    },
    s4sValueTextBold: {
      fontFamily: 'data-text-bold',
      fontSize: '0.813rem',
    },
    s4sNoteHeader: {
      fontFamily: 'text-bold',
      fontSize: '0.813rem',
    },
    s4sNoteText: {
      fontFamily: 'text',
      color: 'var(--label-data)',
    },
    timeSeries: {
      fontFamily: 'text',
    },
  },
});
