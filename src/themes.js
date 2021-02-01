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
  },
  typography: {
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
      fontFamily: 'label',
      fontSize: '0.813rem',
      color: 'var(--label-data)',
    },
    s4sNoteHeader: {
      fontFamily: 'text-bold',
      fontSize: '0.813rem',
    },
    s4sNoteText: {
      fontFamily: 'text',
      color: 'var(--label-data)',
    },
    s4sNoteHeaderButton: {
      fontFamily: 'text-bold',
      fontSize: '0.813rem',
      color: 'var(--ca1)',
    },
    s4sValueText: {
      fontFamily: 'data-text-bold',
      fontSize: '0.813rem',
    },
    timeSeries: {
      fontFamily: 'text',
    },
  },
});
