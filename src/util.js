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
