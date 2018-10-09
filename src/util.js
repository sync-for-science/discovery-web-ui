export function getStyle(oElm, css3Prop){
      try {
	 if (window.getComputedStyle){
	    return getComputedStyle(oElm).getPropertyValue(css3Prop);
	 } else if (oElm.currentStyle){
	    return oElm.currentStyle[css3Prop];
	 }
      } catch (e) {
      	 return '';
      }
   }

export function stringCompare(a, b) {
   const aLower = a.toLowerCase();
   const bLower = b.toLowerCase();
   if (aLower === bLower) {
      return 0;
   } else if (aLower < bLower) {
      return -1;
   } else { // aLower > bLower
      return 1;
   }
}

export function formatDate(date, fillShortDates, surpressTime) {
   let strDate = date+'';

   if (fillShortDates) {
      strDate = strDate.length === 4 ? strDate += '-01' : strDate;
      strDate = strDate.length === 7 ? strDate += '-01' : strDate;
   }

   const tLoc = strDate.indexOf('T');
   if (tLoc === -1) {
      // No time
      return strDate;
   } else {
      // Time is present
      const datePart = strDate.substring(0,tLoc);
      if (surpressTime) {
	 return datePart;
      } else {
	 let time = new Date(strDate).toLocaleTimeString('en-US', {timeZone:'UTC', timeZoneName:'short'}).replace('UTC','GMT');
	 return datePart + ' ' + time;
      }
   }
}

export function formatDPs(number, places) {
   const mult = Math.pow(10, places);
   return parseFloat(Math.round(number * mult) / mult).toFixed(places);
}

export function isValid(data, accessor) {
   try {
      return accessor(data) !== undefined;
   } catch (e) {
      return false;
   }
}

// Acronyms that should be displayed all uppercase
const acronyms = ['Bmi'];

// Words that should be displayed all lowercase
const minorWords = ['A', 'An', 'And', 'As', 'At', 'But', 'By', 'For', 'From', 'In',
		  'Into', 'Near', 'Nor', 'Of', 'On', 'Onto', 'Or', 'The', 'To', 'With']; 

export function titleCase(str) {
   let finalWords = [];
   let words = str.toLowerCase().split(' ').map(word => word.replace(word[0], word[0].toUpperCase()));

   for (let index = 0; index < words.length; index++) {
      let word = words[index];
      if (acronyms.indexOf(word) >= 0) {
	   // Uppercase acronyms
	   finalWords.push(word.toUpperCase());
       } else if (minorWords.indexOf(word) >= 0 && index > 0) {
	   // Lowercase minor words, unless first
	   finalWords.push(word.toLowerCase());
       } else {
	   // Title case everything else
	   finalWords.push(word);
       }
   }

   return finalWords.join(' ');
}

export function numericPart(val) {
   const index = val.toString().search(/[A-Za-z%]/);
   return parseFloat(val.toString().substring(0,index));
}

export function unitPart(val) {
   const index = val.toString().search(/[A-Za-z%]/);
   return val.toString().substring(index);
}
