import { GOOGLE_ANALYTICS_ID, META_PIXEL_ID } from "./site";

/**
 * Google Analytics and the Meta Pixel, placed in each page's HTML so they run
 * at once, even for visitors who leave right away. They stay off for anyone who
 * has declined. They must never receive birth details: the script before this
 * one keeps the address clean, and the pixel's automatic form and button
 * scanning is off. The storage key must match KEY in lib/consent.ts.
 */
export const ANALYTICS_SCRIPT = `(function(){var c=null;try{c=localStorage.getItem("tithi-cookie-choice")}catch(e){}if(c==="denied")return;
var g=document.createElement("script");g.async=true;g.src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}";document.head.appendChild(g);
window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag("js",new Date());gtag("config","${GOOGLE_ANALYTICS_ID}");
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq("set","autoConfig",false,"${META_PIXEL_ID}");fbq("init","${META_PIXEL_ID}");fbq("track","PageView")})()`;
