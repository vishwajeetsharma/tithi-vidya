import { CONSENT_DAYS, CONSENT_KEY, CONSENT_VERSION } from "./consent";
import { FC_ERROR_PROTECTION } from "./funding-choices";
import { ADSENSE_CLIENT, GOOGLE_ANALYTICS_ID, META_PIXEL_ID } from "./site";

/** How long Google Analytics cookies last: 13 months, the most European regulators accept. */
const GA_COOKIE_SECONDS = 395 * 86_400;

/**
 * Google Analytics, Google AdSense and the Meta Pixel, placed in each page's
 * HTML on the live site. None of them loads until the visitor says yes in the
 * cookie box (components/CookieConsent.tsx). "Visit counts" starts Google
 * Analytics, and "Ads" starts AdSense, its ad blocking recovery message and the pixel. A returning visitor's saved
 * choice starts them at once, and the box starts them through __tithiTags the
 * moment someone says yes. The rules for reading the choice must match
 * parseChoice in lib/consent.ts.
 *
 * They must never receive birth details: the script before this one keeps the
 * address clean, and the pixel's automatic form and button scanning is off.
 */
export const ANALYTICS_SCRIPT = `(function(){var w=window,d=document,on={};
function add(src,cors){var s=d.createElement("script");s.async=true;if(cors)s.crossOrigin="anonymous";s.src=src;d.head.appendChild(s)}
w.__tithiTags=function(c){var ads=c.ads?"granted":"denied";
if(c.analytics&&!on.ga){on.ga=1;on.gaAds=c.ads;w.dataLayer=w.dataLayer||[];w.gtag=function(){dataLayer.push(arguments)};
gtag("consent","default",{analytics_storage:"granted",ad_storage:ads,ad_user_data:ads,ad_personalization:ads});
add("https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}");gtag("js",new Date());gtag("config","${GOOGLE_ANALYTICS_ID}",{cookie_expires:${GA_COOKIE_SECONDS}})}
else if(on.ga&&c.ads&&!on.gaAds){on.gaAds=1;gtag("consent","update",{ad_storage:"granted",ad_user_data:"granted",ad_personalization:"granted"})}
if(c.ads&&!on.ads){on.ads=1;add("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}",1);
add("https://fundingchoicesmessages.google.com/i/${ADSENSE_CLIENT.replace(/^ca-/, "")}?ers=1");
(function f(){if(w.frames.googlefcPresent)return;if(!d.body)return setTimeout(f,0);var i=d.createElement("iframe");i.style="width: 0; height: 0; border: none; z-index: -1000; left: -1000px; top: -1000px;";i.style.display="none";i.name="googlefcPresent";d.body.appendChild(i)})();
(function(){${FC_ERROR_PROTECTION}}).call(w);
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(w,d,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq("set","autoConfig",false,"${META_PIXEL_ID}");fbq("init","${META_PIXEL_ID}");fbq("track","PageView")}};
var c=null;try{c=JSON.parse(localStorage.getItem("${CONSENT_KEY}"))}catch(e){}
if(c&&c.v===${CONSENT_VERSION}&&typeof c.at==="number"&&Date.now()-c.at<=${CONSENT_DAYS * 86_400_000})w.__tithiTags({analytics:c.analytics===true,ads:c.ads===true})})()`;
