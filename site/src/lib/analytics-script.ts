import { CONSENT_DAYS, CONSENT_KEY, CONSENT_VERSION, REGION_EVENT, REGION_KEY } from "./consent";
import { FC_ERROR_PROTECTION } from "./funding-choices";
import { STRICT_REGIONS } from "./region";
import { ADSENSE_CLIENT, CLARITY_ID, GOOGLE_ANALYTICS_ID, META_PIXEL_ID } from "./site";

/** How long Google Analytics cookies last: 13 months, the most European regulators accept. */
const GA_COOKIE_SECONDS = 395 * 86_400;

/**
 * The page head's tags on the live site.
 *
 * - **Google AdSense loads for everyone, with full ads.** The cookie box
 *   doesn't change it. Readers can turn off personalised ads in Google's My Ad
 *   Center. In Europe (lib/region.ts) Google's own consent message, set up in
 *   AdSense under Privacy & messaging, asks about ad cookies: Google's ad
 *   cookies start "denied" there, and its message updates them. Google's ad
 *   blocking recovery message comes with AdSense, for everyone.
 * - **Google Analytics, Microsoft Clarity and the Meta Pixel follow the cookie
 *   box** (components/CookieConsent.tsx). "Visit counts" is Analytics and
 *   Clarity, and "Ad measurement" is the pixel. A saved choice applies at once.
 *   With no choice yet, it depends on where the visitor is, which /api/region
 *   tells this script once a visit:
 *   - Outside Europe, all three start, and the box shows a notice.
 *   - In Europe, none of them sets a cookie until the visitor says yes.
 *     Analytics runs in Google's advanced consent mode: it sends Google
 *     cookie-free pings, which Google uses to estimate visits. A decline stops those too.
 *
 * The rules for reading the choice must match parseChoice in lib/consent.ts.
 * None of these ever receives birth details: the script before this one keeps
 * the address clean, and the pixel's automatic form and button scanning is off.
 */
export const ANALYTICS_SCRIPT = `(function(){var w=window,d=document,on={};
function add(src,cors){var s=d.createElement("script");s.async=true;if(cors)s.crossOrigin="anonymous";s.src=src;d.head.appendChild(s)}
add("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}",1);
add("https://fundingchoicesmessages.google.com/i/${ADSENSE_CLIENT.replace(/^ca-/, "")}?ers=1");
(function f(){if(w.frames.googlefcPresent)return;if(!d.body)return setTimeout(f,0);var i=d.createElement("iframe");i.style="width: 0; height: 0; border: none; z-index: -1000; left: -1000px; top: -1000px;";i.style.display="none";i.name="googlefcPresent";d.body.appendChild(i)})();
(function(){${FC_ERROR_PROTECTION}}).call(w);
var c=null;try{c=JSON.parse(localStorage.getItem("${CONSENT_KEY}"))}catch(e){}
var ok=!!c&&c.v===${CONSENT_VERSION}&&typeof c.at==="number"&&Date.now()-c.at<=${CONSENT_DAYS * 86_400_000};
w.dataLayer=w.dataLayer||[];w.gtag=function(){dataLayer.push(arguments)};
gtag("consent","default",{ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",region:${JSON.stringify(STRICT_REGIONS)}});
gtag("consent","default",{ad_storage:"granted",ad_user_data:"granted",ad_personalization:"granted"});
gtag("set","ads_data_redaction",true);
w.__tithiTags=function(t){
if((t.analytics||t.pings)&&!on.ga){on.ga=1;gtag("consent","default",{analytics_storage:t.analytics?"granted":"denied"});
add("https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}");gtag("js",new Date());gtag("config","${GOOGLE_ANALYTICS_ID}",{cookie_expires:${GA_COOKIE_SECONDS}})}
else if(on.ga){gtag("consent","update",{analytics_storage:t.analytics?"granted":"denied"})}
if(on.ga)w["ga-disable-${GOOGLE_ANALYTICS_ID}"]=!t.analytics&&!t.pings;
if(t.analytics&&!on.cl){on.cl=1;(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(w,d,"clarity","script","${CLARITY_ID}");w.clarity("consentv2",{ad_Storage:"denied",analytics_Storage:"granted"})}
if(t.ads&&!on.px){on.px=1;
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(w,d,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq("set","autoConfig",false,"${META_PIXEL_ID}");fbq("init","${META_PIXEL_ID}");fbq("track","PageView")}};
function start(r){w.__tithiRegion=r;var open=r==="open";w.__tithiTags({analytics:open,ads:open,pings:!open});try{w.dispatchEvent(new Event("${REGION_EVENT}"))}catch(e){}}
if(ok)w.__tithiTags({analytics:c.analytics===true,ads:c.ads===true});
else{var r=null;try{r=sessionStorage.getItem("${REGION_KEY}")}catch(e){}
if(r==="open"||r==="strict")start(r);
else fetch("/api/region").then(function(x){if(!x.ok)throw x.status;return x.json()}).then(function(j){var r=j.strict===false?"open":"strict";try{sessionStorage.setItem("${REGION_KEY}",r)}catch(e){}start(r)}).catch(function(){start("strict")})}})()`;
