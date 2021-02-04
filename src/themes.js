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
  },
  palette: {
    primary: {
      main: 'rgb(65, 151, 198)', // Colors.css --ca1
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
