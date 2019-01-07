export default {
   serverUrl: 'http://data.discovery.cingulata.us',
   timeout: 5000,			// msec

   normalDotRadius: '5px',
   highlightDotRadius: '7.5px',

   textSizeStep: 0.04,
   minTextSize: 0.80,
   maxTextSize: 1.16,

   maxSinglePeriods: 15,		// Maximum single years/months to show in timeline

   searchMaxLength: 200,
   searchShowSearching: 10000,		// Number of search references before showing "Searching..." in status

   viewHelpCloseTime: 15,		// seconds before "auto-close" view help (0 --> no auto-close)
   viewHelpCloseCountdown: false,	// true --> show countdown of remaining time before closing view help

   compareViewMaxCountHeight: 20,
   summaryViewMaxMRNChars: 8
}
