import{f as h0,j as f,d as x,l as Ut,m as Xu,o as g0}from"./ui-CzYsczIE.js";import{R as hd,u as Zu,r as W,a as y0,N as Qd,b as Gd,B as b0,c as v0,d as yl}from"./router-BDXqoozo.js";import{r as p0,a as x0}from"./vendor-DJG_os-6.js";import{a as S0,u as z0,Q as A0,b as T0}from"./api-Fek6J8up.js";import{l as j0}from"./socket-BLRFddlS.js";(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const S of document.querySelectorAll('link[rel="modulepreload"]'))s(S);new MutationObserver(S=>{for(const M of S)if(M.type==="childList")for(const T of M.addedNodes)T.tagName==="LINK"&&T.rel==="modulepreload"&&s(T)}).observe(document,{childList:!0,subtree:!0});function m(S){const M={};return S.integrity&&(M.integrity=S.integrity),S.referrerPolicy&&(M.referrerPolicy=S.referrerPolicy),S.crossOrigin==="use-credentials"?M.credentials="include":S.crossOrigin==="anonymous"?M.credentials="omit":M.credentials="same-origin",M}function s(S){if(S.ep)return;S.ep=!0;const M=m(S);fetch(S.href,M)}})();var rr={exports:{}},xn={},sr={exports:{}},or={};/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var gd;function E0(){return gd||(gd=1,function(i){function o(A,C){var Z=A.length;A.push(C);t:for(;0<Z;){var tt=Z-1>>>1,gt=A[tt];if(0<S(gt,C))A[tt]=C,A[Z]=gt,Z=tt;else break t}}function m(A){return A.length===0?null:A[0]}function s(A){if(A.length===0)return null;var C=A[0],Z=A.pop();if(Z!==C){A[0]=Z;t:for(var tt=0,gt=A.length,Xt=gt>>>1;tt<Xt;){var bt=2*(tt+1)-1,st=A[bt],Ot=bt+1,pe=A[Ot];if(0>S(st,Z))Ot<gt&&0>S(pe,st)?(A[tt]=pe,A[Ot]=Z,tt=Ot):(A[tt]=st,A[bt]=Z,tt=bt);else if(Ot<gt&&0>S(pe,Z))A[tt]=pe,A[Ot]=Z,tt=Ot;else break t}}return C}function S(A,C){var Z=A.sortIndex-C.sortIndex;return Z!==0?Z:A.id-C.id}if(i.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var M=performance;i.unstable_now=function(){return M.now()}}else{var T=Date,O=T.now();i.unstable_now=function(){return T.now()-O}}var H=[],N=[],q=1,U=null,_=3,D=!1,Q=!1,w=!1,J=!1,I=typeof setTimeout=="function"?setTimeout:null,Y=typeof clearTimeout=="function"?clearTimeout:null,F=typeof setImmediate<"u"?setImmediate:null;function k(A){for(var C=m(N);C!==null;){if(C.callback===null)s(N);else if(C.startTime<=A)s(N),C.sortIndex=C.expirationTime,o(H,C);else break;C=m(N)}}function R(A){if(w=!1,k(A),!Q)if(m(H)!==null)Q=!0,B||(B=!0,wt());else{var C=m(N);C!==null&&$t(R,C.startTime-A)}}var B=!1,V=-1,St=5,Gt=-1;function Xe(){return J?!0:!(i.unstable_now()-Gt<St)}function Yt(){if(J=!1,B){var A=i.unstable_now();Gt=A;var C=!0;try{t:{Q=!1,w&&(w=!1,Y(V),V=-1),D=!0;var Z=_;try{e:{for(k(A),U=m(H);U!==null&&!(U.expirationTime>A&&Xe());){var tt=U.callback;if(typeof tt=="function"){U.callback=null,_=U.priorityLevel;var gt=tt(U.expirationTime<=A);if(A=i.unstable_now(),typeof gt=="function"){U.callback=gt,k(A),C=!0;break e}U===m(H)&&s(H),k(A)}else s(H);U=m(H)}if(U!==null)C=!0;else{var Xt=m(N);Xt!==null&&$t(R,Xt.startTime-A),C=!1}}break t}finally{U=null,_=Z,D=!1}C=void 0}}finally{C?wt():B=!1}}}var wt;if(typeof F=="function")wt=function(){F(Yt)};else if(typeof MessageChannel<"u"){var ve=new MessageChannel,De=ve.port2;ve.port1.onmessage=Yt,wt=function(){De.postMessage(null)}}else wt=function(){I(Yt,0)};function $t(A,C){V=I(function(){A(i.unstable_now())},C)}i.unstable_IdlePriority=5,i.unstable_ImmediatePriority=1,i.unstable_LowPriority=4,i.unstable_NormalPriority=3,i.unstable_Profiling=null,i.unstable_UserBlockingPriority=2,i.unstable_cancelCallback=function(A){A.callback=null},i.unstable_forceFrameRate=function(A){0>A||125<A?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):St=0<A?Math.floor(1e3/A):5},i.unstable_getCurrentPriorityLevel=function(){return _},i.unstable_next=function(A){switch(_){case 1:case 2:case 3:var C=3;break;default:C=_}var Z=_;_=C;try{return A()}finally{_=Z}},i.unstable_requestPaint=function(){J=!0},i.unstable_runWithPriority=function(A,C){switch(A){case 1:case 2:case 3:case 4:case 5:break;default:A=3}var Z=_;_=A;try{return C()}finally{_=Z}},i.unstable_scheduleCallback=function(A,C,Z){var tt=i.unstable_now();switch(typeof Z=="object"&&Z!==null?(Z=Z.delay,Z=typeof Z=="number"&&0<Z?tt+Z:tt):Z=tt,A){case 1:var gt=-1;break;case 2:gt=250;break;case 5:gt=1073741823;break;case 4:gt=1e4;break;default:gt=5e3}return gt=Z+gt,A={id:q++,callback:C,priorityLevel:A,startTime:Z,expirationTime:gt,sortIndex:-1},Z>tt?(A.sortIndex=Z,o(N,A),m(H)===null&&A===m(N)&&(w?(Y(V),V=-1):w=!0,$t(R,Z-tt))):(A.sortIndex=gt,o(H,A),Q||D||(Q=!0,B||(B=!0,wt()))),A},i.unstable_shouldYield=Xe,i.unstable_wrapCallback=function(A){var C=_;return function(){var Z=_;_=C;try{return A.apply(this,arguments)}finally{_=Z}}}}(or)),or}var yd;function M0(){return yd||(yd=1,sr.exports=E0()),sr.exports}/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var bd;function D0(){if(bd)return xn;bd=1;var i=M0(),o=p0(),m=x0();function s(t){var e="https://react.dev/errors/"+t;if(1<arguments.length){e+="?args[]="+encodeURIComponent(arguments[1]);for(var l=2;l<arguments.length;l++)e+="&args[]="+encodeURIComponent(arguments[l])}return"Minified React error #"+t+"; visit "+e+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function S(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)}function M(t){var e=t,l=t;if(t.alternate)for(;e.return;)e=e.return;else{t=e;do e=t,(e.flags&4098)!==0&&(l=e.return),t=e.return;while(t)}return e.tag===3?l:null}function T(t){if(t.tag===13){var e=t.memoizedState;if(e===null&&(t=t.alternate,t!==null&&(e=t.memoizedState)),e!==null)return e.dehydrated}return null}function O(t){if(M(t)!==t)throw Error(s(188))}function H(t){var e=t.alternate;if(!e){if(e=M(t),e===null)throw Error(s(188));return e!==t?null:t}for(var l=t,a=e;;){var n=l.return;if(n===null)break;var u=n.alternate;if(u===null){if(a=n.return,a!==null){l=a;continue}break}if(n.child===u.child){for(u=n.child;u;){if(u===l)return O(n),t;if(u===a)return O(n),e;u=u.sibling}throw Error(s(188))}if(l.return!==a.return)l=n,a=u;else{for(var c=!1,r=n.child;r;){if(r===l){c=!0,l=n,a=u;break}if(r===a){c=!0,a=n,l=u;break}r=r.sibling}if(!c){for(r=u.child;r;){if(r===l){c=!0,l=u,a=n;break}if(r===a){c=!0,a=u,l=n;break}r=r.sibling}if(!c)throw Error(s(189))}}if(l.alternate!==a)throw Error(s(190))}if(l.tag!==3)throw Error(s(188));return l.stateNode.current===l?t:e}function N(t){var e=t.tag;if(e===5||e===26||e===27||e===6)return t;for(t=t.child;t!==null;){if(e=N(t),e!==null)return e;t=t.sibling}return null}var q=Object.assign,U=Symbol.for("react.element"),_=Symbol.for("react.transitional.element"),D=Symbol.for("react.portal"),Q=Symbol.for("react.fragment"),w=Symbol.for("react.strict_mode"),J=Symbol.for("react.profiler"),I=Symbol.for("react.provider"),Y=Symbol.for("react.consumer"),F=Symbol.for("react.context"),k=Symbol.for("react.forward_ref"),R=Symbol.for("react.suspense"),B=Symbol.for("react.suspense_list"),V=Symbol.for("react.memo"),St=Symbol.for("react.lazy"),Gt=Symbol.for("react.activity"),Xe=Symbol.for("react.memo_cache_sentinel"),Yt=Symbol.iterator;function wt(t){return t===null||typeof t!="object"?null:(t=Yt&&t[Yt]||t["@@iterator"],typeof t=="function"?t:null)}var ve=Symbol.for("react.client.reference");function De(t){if(t==null)return null;if(typeof t=="function")return t.$$typeof===ve?null:t.displayName||t.name||null;if(typeof t=="string")return t;switch(t){case Q:return"Fragment";case J:return"Profiler";case w:return"StrictMode";case R:return"Suspense";case B:return"SuspenseList";case Gt:return"Activity"}if(typeof t=="object")switch(t.$$typeof){case D:return"Portal";case F:return(t.displayName||"Context")+".Provider";case Y:return(t._context.displayName||"Context")+".Consumer";case k:var e=t.render;return t=t.displayName,t||(t=e.displayName||e.name||"",t=t!==""?"ForwardRef("+t+")":"ForwardRef"),t;case V:return e=t.displayName||null,e!==null?e:De(t.type)||"Memo";case St:e=t._payload,t=t._init;try{return De(t(e))}catch{}}return null}var $t=Array.isArray,A=o.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,C=m.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,Z={pending:!1,data:null,method:null,action:null},tt=[],gt=-1;function Xt(t){return{current:t}}function bt(t){0>gt||(t.current=tt[gt],tt[gt]=null,gt--)}function st(t,e){gt++,tt[gt]=t.current,t.current=e}var Ot=Xt(null),pe=Xt(null),Ze=Xt(null),Sn=Xt(null);function zn(t,e){switch(st(Ze,e),st(pe,t),st(Ot,null),e.nodeType){case 9:case 11:t=(t=e.documentElement)&&(t=t.namespaceURI)?Yf(t):0;break;default:if(t=e.tagName,e=e.namespaceURI)e=Yf(e),t=$f(e,t);else switch(t){case"svg":t=1;break;case"math":t=2;break;default:t=0}}bt(Ot),st(Ot,t)}function Hl(){bt(Ot),bt(pe),bt(Ze)}function Ku(t){t.memoizedState!==null&&st(Sn,t);var e=Ot.current,l=$f(e,t.type);e!==l&&(st(pe,t),st(Ot,l))}function An(t){pe.current===t&&(bt(Ot),bt(pe)),Sn.current===t&&(bt(Sn),gn._currentValue=Z)}var ku=Object.prototype.hasOwnProperty,Ju=i.unstable_scheduleCallback,Wu=i.unstable_cancelCallback,Vd=i.unstable_shouldYield,Kd=i.unstable_requestPaint,xe=i.unstable_now,kd=i.unstable_getCurrentPriorityLevel,xr=i.unstable_ImmediatePriority,Sr=i.unstable_UserBlockingPriority,Tn=i.unstable_NormalPriority,Jd=i.unstable_LowPriority,zr=i.unstable_IdlePriority,Wd=i.log,Fd=i.unstable_setDisableYieldValue,za=null,Ft=null;function Ve(t){if(typeof Wd=="function"&&Fd(t),Ft&&typeof Ft.setStrictMode=="function")try{Ft.setStrictMode(za,t)}catch{}}var It=Math.clz32?Math.clz32:tm,Id=Math.log,Pd=Math.LN2;function tm(t){return t>>>=0,t===0?32:31-(Id(t)/Pd|0)|0}var jn=256,En=4194304;function vl(t){var e=t&42;if(e!==0)return e;switch(t&-t){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t&4194048;case 4194304:case 8388608:case 16777216:case 33554432:return t&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return t}}function Mn(t,e,l){var a=t.pendingLanes;if(a===0)return 0;var n=0,u=t.suspendedLanes,c=t.pingedLanes;t=t.warmLanes;var r=a&134217727;return r!==0?(a=r&~u,a!==0?n=vl(a):(c&=r,c!==0?n=vl(c):l||(l=r&~t,l!==0&&(n=vl(l))))):(r=a&~u,r!==0?n=vl(r):c!==0?n=vl(c):l||(l=a&~t,l!==0&&(n=vl(l)))),n===0?0:e!==0&&e!==n&&(e&u)===0&&(u=n&-n,l=e&-e,u>=l||u===32&&(l&4194048)!==0)?e:n}function Aa(t,e){return(t.pendingLanes&~(t.suspendedLanes&~t.pingedLanes)&e)===0}function em(t,e){switch(t){case 1:case 2:case 4:case 8:case 64:return e+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Ar(){var t=jn;return jn<<=1,(jn&4194048)===0&&(jn=256),t}function Tr(){var t=En;return En<<=1,(En&62914560)===0&&(En=4194304),t}function Fu(t){for(var e=[],l=0;31>l;l++)e.push(t);return e}function Ta(t,e){t.pendingLanes|=e,e!==268435456&&(t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0)}function lm(t,e,l,a,n,u){var c=t.pendingLanes;t.pendingLanes=l,t.suspendedLanes=0,t.pingedLanes=0,t.warmLanes=0,t.expiredLanes&=l,t.entangledLanes&=l,t.errorRecoveryDisabledLanes&=l,t.shellSuspendCounter=0;var r=t.entanglements,d=t.expirationTimes,b=t.hiddenUpdates;for(l=c&~l;0<l;){var z=31-It(l),E=1<<z;r[z]=0,d[z]=-1;var v=b[z];if(v!==null)for(b[z]=null,z=0;z<v.length;z++){var p=v[z];p!==null&&(p.lane&=-536870913)}l&=~E}a!==0&&jr(t,a,0),u!==0&&n===0&&t.tag!==0&&(t.suspendedLanes|=u&~(c&~e))}function jr(t,e,l){t.pendingLanes|=e,t.suspendedLanes&=~e;var a=31-It(e);t.entangledLanes|=e,t.entanglements[a]=t.entanglements[a]|1073741824|l&4194090}function Er(t,e){var l=t.entangledLanes|=e;for(t=t.entanglements;l;){var a=31-It(l),n=1<<a;n&e|t[a]&e&&(t[a]|=e),l&=~n}}function Iu(t){switch(t){case 2:t=1;break;case 8:t=4;break;case 32:t=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:t=128;break;case 268435456:t=134217728;break;default:t=0}return t}function Pu(t){return t&=-t,2<t?8<t?(t&134217727)!==0?32:268435456:8:2}function Mr(){var t=C.p;return t!==0?t:(t=window.event,t===void 0?32:rd(t.type))}function am(t,e){var l=C.p;try{return C.p=t,e()}finally{C.p=l}}var Ke=Math.random().toString(36).slice(2),Lt="__reactFiber$"+Ke,Vt="__reactProps$"+Ke,Nl="__reactContainer$"+Ke,ti="__reactEvents$"+Ke,nm="__reactListeners$"+Ke,um="__reactHandles$"+Ke,Dr="__reactResources$"+Ke,ja="__reactMarker$"+Ke;function ei(t){delete t[Lt],delete t[Vt],delete t[ti],delete t[nm],delete t[um]}function Bl(t){var e=t[Lt];if(e)return e;for(var l=t.parentNode;l;){if(e=l[Nl]||l[Lt]){if(l=e.alternate,e.child!==null||l!==null&&l.child!==null)for(t=Kf(t);t!==null;){if(l=t[Lt])return l;t=Kf(t)}return e}t=l,l=t.parentNode}return null}function Ll(t){if(t=t[Lt]||t[Nl]){var e=t.tag;if(e===5||e===6||e===13||e===26||e===27||e===3)return t}return null}function Ea(t){var e=t.tag;if(e===5||e===26||e===27||e===6)return t.stateNode;throw Error(s(33))}function Ql(t){var e=t[Dr];return e||(e=t[Dr]={hoistableStyles:new Map,hoistableScripts:new Map}),e}function _t(t){t[ja]=!0}var Ur=new Set,Or={};function pl(t,e){Gl(t,e),Gl(t+"Capture",e)}function Gl(t,e){for(Or[t]=e,t=0;t<e.length;t++)Ur.add(e[t])}var im=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),_r={},qr={};function cm(t){return ku.call(qr,t)?!0:ku.call(_r,t)?!1:im.test(t)?qr[t]=!0:(_r[t]=!0,!1)}function Dn(t,e,l){if(cm(e))if(l===null)t.removeAttribute(e);else{switch(typeof l){case"undefined":case"function":case"symbol":t.removeAttribute(e);return;case"boolean":var a=e.toLowerCase().slice(0,5);if(a!=="data-"&&a!=="aria-"){t.removeAttribute(e);return}}t.setAttribute(e,""+l)}}function Un(t,e,l){if(l===null)t.removeAttribute(e);else{switch(typeof l){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(e);return}t.setAttribute(e,""+l)}}function Ue(t,e,l,a){if(a===null)t.removeAttribute(l);else{switch(typeof a){case"undefined":case"function":case"symbol":case"boolean":t.removeAttribute(l);return}t.setAttributeNS(e,l,""+a)}}var li,Rr;function Yl(t){if(li===void 0)try{throw Error()}catch(l){var e=l.stack.trim().match(/\n( *(at )?)/);li=e&&e[1]||"",Rr=-1<l.stack.indexOf(`
    at`)?" (<anonymous>)":-1<l.stack.indexOf("@")?"@unknown:0:0":""}return`
`+li+t+Rr}var ai=!1;function ni(t,e){if(!t||ai)return"";ai=!0;var l=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var a={DetermineComponentFrameRoot:function(){try{if(e){var E=function(){throw Error()};if(Object.defineProperty(E.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(E,[])}catch(p){var v=p}Reflect.construct(t,[],E)}else{try{E.call()}catch(p){v=p}t.call(E.prototype)}}else{try{throw Error()}catch(p){v=p}(E=t())&&typeof E.catch=="function"&&E.catch(function(){})}}catch(p){if(p&&v&&typeof p.stack=="string")return[p.stack,v.stack]}return[null,null]}};a.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var n=Object.getOwnPropertyDescriptor(a.DetermineComponentFrameRoot,"name");n&&n.configurable&&Object.defineProperty(a.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var u=a.DetermineComponentFrameRoot(),c=u[0],r=u[1];if(c&&r){var d=c.split(`
`),b=r.split(`
`);for(n=a=0;a<d.length&&!d[a].includes("DetermineComponentFrameRoot");)a++;for(;n<b.length&&!b[n].includes("DetermineComponentFrameRoot");)n++;if(a===d.length||n===b.length)for(a=d.length-1,n=b.length-1;1<=a&&0<=n&&d[a]!==b[n];)n--;for(;1<=a&&0<=n;a--,n--)if(d[a]!==b[n]){if(a!==1||n!==1)do if(a--,n--,0>n||d[a]!==b[n]){var z=`
`+d[a].replace(" at new "," at ");return t.displayName&&z.includes("<anonymous>")&&(z=z.replace("<anonymous>",t.displayName)),z}while(1<=a&&0<=n);break}}}finally{ai=!1,Error.prepareStackTrace=l}return(l=t?t.displayName||t.name:"")?Yl(l):""}function rm(t){switch(t.tag){case 26:case 27:case 5:return Yl(t.type);case 16:return Yl("Lazy");case 13:return Yl("Suspense");case 19:return Yl("SuspenseList");case 0:case 15:return ni(t.type,!1);case 11:return ni(t.type.render,!1);case 1:return ni(t.type,!0);case 31:return Yl("Activity");default:return""}}function Cr(t){try{var e="";do e+=rm(t),t=t.return;while(t);return e}catch(l){return`
Error generating stack: `+l.message+`
`+l.stack}}function ie(t){switch(typeof t){case"bigint":case"boolean":case"number":case"string":case"undefined":return t;case"object":return t;default:return""}}function wr(t){var e=t.type;return(t=t.nodeName)&&t.toLowerCase()==="input"&&(e==="checkbox"||e==="radio")}function sm(t){var e=wr(t)?"checked":"value",l=Object.getOwnPropertyDescriptor(t.constructor.prototype,e),a=""+t[e];if(!t.hasOwnProperty(e)&&typeof l<"u"&&typeof l.get=="function"&&typeof l.set=="function"){var n=l.get,u=l.set;return Object.defineProperty(t,e,{configurable:!0,get:function(){return n.call(this)},set:function(c){a=""+c,u.call(this,c)}}),Object.defineProperty(t,e,{enumerable:l.enumerable}),{getValue:function(){return a},setValue:function(c){a=""+c},stopTracking:function(){t._valueTracker=null,delete t[e]}}}}function On(t){t._valueTracker||(t._valueTracker=sm(t))}function Hr(t){if(!t)return!1;var e=t._valueTracker;if(!e)return!0;var l=e.getValue(),a="";return t&&(a=wr(t)?t.checked?"true":"false":t.value),t=a,t!==l?(e.setValue(t),!0):!1}function _n(t){if(t=t||(typeof document<"u"?document:void 0),typeof t>"u")return null;try{return t.activeElement||t.body}catch{return t.body}}var om=/[\n"\\]/g;function ce(t){return t.replace(om,function(e){return"\\"+e.charCodeAt(0).toString(16)+" "})}function ui(t,e,l,a,n,u,c,r){t.name="",c!=null&&typeof c!="function"&&typeof c!="symbol"&&typeof c!="boolean"?t.type=c:t.removeAttribute("type"),e!=null?c==="number"?(e===0&&t.value===""||t.value!=e)&&(t.value=""+ie(e)):t.value!==""+ie(e)&&(t.value=""+ie(e)):c!=="submit"&&c!=="reset"||t.removeAttribute("value"),e!=null?ii(t,c,ie(e)):l!=null?ii(t,c,ie(l)):a!=null&&t.removeAttribute("value"),n==null&&u!=null&&(t.defaultChecked=!!u),n!=null&&(t.checked=n&&typeof n!="function"&&typeof n!="symbol"),r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"?t.name=""+ie(r):t.removeAttribute("name")}function Nr(t,e,l,a,n,u,c,r){if(u!=null&&typeof u!="function"&&typeof u!="symbol"&&typeof u!="boolean"&&(t.type=u),e!=null||l!=null){if(!(u!=="submit"&&u!=="reset"||e!=null))return;l=l!=null?""+ie(l):"",e=e!=null?""+ie(e):l,r||e===t.value||(t.value=e),t.defaultValue=e}a=a??n,a=typeof a!="function"&&typeof a!="symbol"&&!!a,t.checked=r?t.checked:!!a,t.defaultChecked=!!a,c!=null&&typeof c!="function"&&typeof c!="symbol"&&typeof c!="boolean"&&(t.name=c)}function ii(t,e,l){e==="number"&&_n(t.ownerDocument)===t||t.defaultValue===""+l||(t.defaultValue=""+l)}function $l(t,e,l,a){if(t=t.options,e){e={};for(var n=0;n<l.length;n++)e["$"+l[n]]=!0;for(l=0;l<t.length;l++)n=e.hasOwnProperty("$"+t[l].value),t[l].selected!==n&&(t[l].selected=n),n&&a&&(t[l].defaultSelected=!0)}else{for(l=""+ie(l),e=null,n=0;n<t.length;n++){if(t[n].value===l){t[n].selected=!0,a&&(t[n].defaultSelected=!0);return}e!==null||t[n].disabled||(e=t[n])}e!==null&&(e.selected=!0)}}function Br(t,e,l){if(e!=null&&(e=""+ie(e),e!==t.value&&(t.value=e),l==null)){t.defaultValue!==e&&(t.defaultValue=e);return}t.defaultValue=l!=null?""+ie(l):""}function Lr(t,e,l,a){if(e==null){if(a!=null){if(l!=null)throw Error(s(92));if($t(a)){if(1<a.length)throw Error(s(93));a=a[0]}l=a}l==null&&(l=""),e=l}l=ie(e),t.defaultValue=l,a=t.textContent,a===l&&a!==""&&a!==null&&(t.value=a)}function Xl(t,e){if(e){var l=t.firstChild;if(l&&l===t.lastChild&&l.nodeType===3){l.nodeValue=e;return}}t.textContent=e}var fm=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function Qr(t,e,l){var a=e.indexOf("--")===0;l==null||typeof l=="boolean"||l===""?a?t.setProperty(e,""):e==="float"?t.cssFloat="":t[e]="":a?t.setProperty(e,l):typeof l!="number"||l===0||fm.has(e)?e==="float"?t.cssFloat=l:t[e]=(""+l).trim():t[e]=l+"px"}function Gr(t,e,l){if(e!=null&&typeof e!="object")throw Error(s(62));if(t=t.style,l!=null){for(var a in l)!l.hasOwnProperty(a)||e!=null&&e.hasOwnProperty(a)||(a.indexOf("--")===0?t.setProperty(a,""):a==="float"?t.cssFloat="":t[a]="");for(var n in e)a=e[n],e.hasOwnProperty(n)&&l[n]!==a&&Qr(t,n,a)}else for(var u in e)e.hasOwnProperty(u)&&Qr(t,u,e[u])}function ci(t){if(t.indexOf("-")===-1)return!1;switch(t){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var dm=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),mm=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function qn(t){return mm.test(""+t)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":t}var ri=null;function si(t){return t=t.target||t.srcElement||window,t.correspondingUseElement&&(t=t.correspondingUseElement),t.nodeType===3?t.parentNode:t}var Zl=null,Vl=null;function Yr(t){var e=Ll(t);if(e&&(t=e.stateNode)){var l=t[Vt]||null;t:switch(t=e.stateNode,e.type){case"input":if(ui(t,l.value,l.defaultValue,l.defaultValue,l.checked,l.defaultChecked,l.type,l.name),e=l.name,l.type==="radio"&&e!=null){for(l=t;l.parentNode;)l=l.parentNode;for(l=l.querySelectorAll('input[name="'+ce(""+e)+'"][type="radio"]'),e=0;e<l.length;e++){var a=l[e];if(a!==t&&a.form===t.form){var n=a[Vt]||null;if(!n)throw Error(s(90));ui(a,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name)}}for(e=0;e<l.length;e++)a=l[e],a.form===t.form&&Hr(a)}break t;case"textarea":Br(t,l.value,l.defaultValue);break t;case"select":e=l.value,e!=null&&$l(t,!!l.multiple,e,!1)}}}var oi=!1;function $r(t,e,l){if(oi)return t(e,l);oi=!0;try{var a=t(e);return a}finally{if(oi=!1,(Zl!==null||Vl!==null)&&(bu(),Zl&&(e=Zl,t=Vl,Vl=Zl=null,Yr(e),t)))for(e=0;e<t.length;e++)Yr(t[e])}}function Ma(t,e){var l=t.stateNode;if(l===null)return null;var a=l[Vt]||null;if(a===null)return null;l=a[e];t:switch(e){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(a=!a.disabled)||(t=t.type,a=!(t==="button"||t==="input"||t==="select"||t==="textarea")),t=!a;break t;default:t=!1}if(t)return null;if(l&&typeof l!="function")throw Error(s(231,e,typeof l));return l}var Oe=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),fi=!1;if(Oe)try{var Da={};Object.defineProperty(Da,"passive",{get:function(){fi=!0}}),window.addEventListener("test",Da,Da),window.removeEventListener("test",Da,Da)}catch{fi=!1}var ke=null,di=null,Rn=null;function Xr(){if(Rn)return Rn;var t,e=di,l=e.length,a,n="value"in ke?ke.value:ke.textContent,u=n.length;for(t=0;t<l&&e[t]===n[t];t++);var c=l-t;for(a=1;a<=c&&e[l-a]===n[u-a];a++);return Rn=n.slice(t,1<a?1-a:void 0)}function Cn(t){var e=t.keyCode;return"charCode"in t?(t=t.charCode,t===0&&e===13&&(t=13)):t=e,t===10&&(t=13),32<=t||t===13?t:0}function wn(){return!0}function Zr(){return!1}function Kt(t){function e(l,a,n,u,c){this._reactName=l,this._targetInst=n,this.type=a,this.nativeEvent=u,this.target=c,this.currentTarget=null;for(var r in t)t.hasOwnProperty(r)&&(l=t[r],this[r]=l?l(u):u[r]);return this.isDefaultPrevented=(u.defaultPrevented!=null?u.defaultPrevented:u.returnValue===!1)?wn:Zr,this.isPropagationStopped=Zr,this}return q(e.prototype,{preventDefault:function(){this.defaultPrevented=!0;var l=this.nativeEvent;l&&(l.preventDefault?l.preventDefault():typeof l.returnValue!="unknown"&&(l.returnValue=!1),this.isDefaultPrevented=wn)},stopPropagation:function(){var l=this.nativeEvent;l&&(l.stopPropagation?l.stopPropagation():typeof l.cancelBubble!="unknown"&&(l.cancelBubble=!0),this.isPropagationStopped=wn)},persist:function(){},isPersistent:wn}),e}var xl={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(t){return t.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Hn=Kt(xl),Ua=q({},xl,{view:0,detail:0}),hm=Kt(Ua),mi,hi,Oa,Nn=q({},Ua,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:yi,button:0,buttons:0,relatedTarget:function(t){return t.relatedTarget===void 0?t.fromElement===t.srcElement?t.toElement:t.fromElement:t.relatedTarget},movementX:function(t){return"movementX"in t?t.movementX:(t!==Oa&&(Oa&&t.type==="mousemove"?(mi=t.screenX-Oa.screenX,hi=t.screenY-Oa.screenY):hi=mi=0,Oa=t),mi)},movementY:function(t){return"movementY"in t?t.movementY:hi}}),Vr=Kt(Nn),gm=q({},Nn,{dataTransfer:0}),ym=Kt(gm),bm=q({},Ua,{relatedTarget:0}),gi=Kt(bm),vm=q({},xl,{animationName:0,elapsedTime:0,pseudoElement:0}),pm=Kt(vm),xm=q({},xl,{clipboardData:function(t){return"clipboardData"in t?t.clipboardData:window.clipboardData}}),Sm=Kt(xm),zm=q({},xl,{data:0}),Kr=Kt(zm),Am={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},Tm={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},jm={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function Em(t){var e=this.nativeEvent;return e.getModifierState?e.getModifierState(t):(t=jm[t])?!!e[t]:!1}function yi(){return Em}var Mm=q({},Ua,{key:function(t){if(t.key){var e=Am[t.key]||t.key;if(e!=="Unidentified")return e}return t.type==="keypress"?(t=Cn(t),t===13?"Enter":String.fromCharCode(t)):t.type==="keydown"||t.type==="keyup"?Tm[t.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:yi,charCode:function(t){return t.type==="keypress"?Cn(t):0},keyCode:function(t){return t.type==="keydown"||t.type==="keyup"?t.keyCode:0},which:function(t){return t.type==="keypress"?Cn(t):t.type==="keydown"||t.type==="keyup"?t.keyCode:0}}),Dm=Kt(Mm),Um=q({},Nn,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),kr=Kt(Um),Om=q({},Ua,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:yi}),_m=Kt(Om),qm=q({},xl,{propertyName:0,elapsedTime:0,pseudoElement:0}),Rm=Kt(qm),Cm=q({},Nn,{deltaX:function(t){return"deltaX"in t?t.deltaX:"wheelDeltaX"in t?-t.wheelDeltaX:0},deltaY:function(t){return"deltaY"in t?t.deltaY:"wheelDeltaY"in t?-t.wheelDeltaY:"wheelDelta"in t?-t.wheelDelta:0},deltaZ:0,deltaMode:0}),wm=Kt(Cm),Hm=q({},xl,{newState:0,oldState:0}),Nm=Kt(Hm),Bm=[9,13,27,32],bi=Oe&&"CompositionEvent"in window,_a=null;Oe&&"documentMode"in document&&(_a=document.documentMode);var Lm=Oe&&"TextEvent"in window&&!_a,Jr=Oe&&(!bi||_a&&8<_a&&11>=_a),Wr=" ",Fr=!1;function Ir(t,e){switch(t){case"keyup":return Bm.indexOf(e.keyCode)!==-1;case"keydown":return e.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function Pr(t){return t=t.detail,typeof t=="object"&&"data"in t?t.data:null}var Kl=!1;function Qm(t,e){switch(t){case"compositionend":return Pr(e);case"keypress":return e.which!==32?null:(Fr=!0,Wr);case"textInput":return t=e.data,t===Wr&&Fr?null:t;default:return null}}function Gm(t,e){if(Kl)return t==="compositionend"||!bi&&Ir(t,e)?(t=Xr(),Rn=di=ke=null,Kl=!1,t):null;switch(t){case"paste":return null;case"keypress":if(!(e.ctrlKey||e.altKey||e.metaKey)||e.ctrlKey&&e.altKey){if(e.char&&1<e.char.length)return e.char;if(e.which)return String.fromCharCode(e.which)}return null;case"compositionend":return Jr&&e.locale!=="ko"?null:e.data;default:return null}}var Ym={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function ts(t){var e=t&&t.nodeName&&t.nodeName.toLowerCase();return e==="input"?!!Ym[t.type]:e==="textarea"}function es(t,e,l,a){Zl?Vl?Vl.push(a):Vl=[a]:Zl=a,e=Au(e,"onChange"),0<e.length&&(l=new Hn("onChange","change",null,l,a),t.push({event:l,listeners:e}))}var qa=null,Ra=null;function $m(t){Nf(t,0)}function Bn(t){var e=Ea(t);if(Hr(e))return t}function ls(t,e){if(t==="change")return e}var as=!1;if(Oe){var vi;if(Oe){var pi="oninput"in document;if(!pi){var ns=document.createElement("div");ns.setAttribute("oninput","return;"),pi=typeof ns.oninput=="function"}vi=pi}else vi=!1;as=vi&&(!document.documentMode||9<document.documentMode)}function us(){qa&&(qa.detachEvent("onpropertychange",is),Ra=qa=null)}function is(t){if(t.propertyName==="value"&&Bn(Ra)){var e=[];es(e,Ra,t,si(t)),$r($m,e)}}function Xm(t,e,l){t==="focusin"?(us(),qa=e,Ra=l,qa.attachEvent("onpropertychange",is)):t==="focusout"&&us()}function Zm(t){if(t==="selectionchange"||t==="keyup"||t==="keydown")return Bn(Ra)}function Vm(t,e){if(t==="click")return Bn(e)}function Km(t,e){if(t==="input"||t==="change")return Bn(e)}function km(t,e){return t===e&&(t!==0||1/t===1/e)||t!==t&&e!==e}var Pt=typeof Object.is=="function"?Object.is:km;function Ca(t,e){if(Pt(t,e))return!0;if(typeof t!="object"||t===null||typeof e!="object"||e===null)return!1;var l=Object.keys(t),a=Object.keys(e);if(l.length!==a.length)return!1;for(a=0;a<l.length;a++){var n=l[a];if(!ku.call(e,n)||!Pt(t[n],e[n]))return!1}return!0}function cs(t){for(;t&&t.firstChild;)t=t.firstChild;return t}function rs(t,e){var l=cs(t);t=0;for(var a;l;){if(l.nodeType===3){if(a=t+l.textContent.length,t<=e&&a>=e)return{node:l,offset:e-t};t=a}t:{for(;l;){if(l.nextSibling){l=l.nextSibling;break t}l=l.parentNode}l=void 0}l=cs(l)}}function ss(t,e){return t&&e?t===e?!0:t&&t.nodeType===3?!1:e&&e.nodeType===3?ss(t,e.parentNode):"contains"in t?t.contains(e):t.compareDocumentPosition?!!(t.compareDocumentPosition(e)&16):!1:!1}function os(t){t=t!=null&&t.ownerDocument!=null&&t.ownerDocument.defaultView!=null?t.ownerDocument.defaultView:window;for(var e=_n(t.document);e instanceof t.HTMLIFrameElement;){try{var l=typeof e.contentWindow.location.href=="string"}catch{l=!1}if(l)t=e.contentWindow;else break;e=_n(t.document)}return e}function xi(t){var e=t&&t.nodeName&&t.nodeName.toLowerCase();return e&&(e==="input"&&(t.type==="text"||t.type==="search"||t.type==="tel"||t.type==="url"||t.type==="password")||e==="textarea"||t.contentEditable==="true")}var Jm=Oe&&"documentMode"in document&&11>=document.documentMode,kl=null,Si=null,wa=null,zi=!1;function fs(t,e,l){var a=l.window===l?l.document:l.nodeType===9?l:l.ownerDocument;zi||kl==null||kl!==_n(a)||(a=kl,"selectionStart"in a&&xi(a)?a={start:a.selectionStart,end:a.selectionEnd}:(a=(a.ownerDocument&&a.ownerDocument.defaultView||window).getSelection(),a={anchorNode:a.anchorNode,anchorOffset:a.anchorOffset,focusNode:a.focusNode,focusOffset:a.focusOffset}),wa&&Ca(wa,a)||(wa=a,a=Au(Si,"onSelect"),0<a.length&&(e=new Hn("onSelect","select",null,e,l),t.push({event:e,listeners:a}),e.target=kl)))}function Sl(t,e){var l={};return l[t.toLowerCase()]=e.toLowerCase(),l["Webkit"+t]="webkit"+e,l["Moz"+t]="moz"+e,l}var Jl={animationend:Sl("Animation","AnimationEnd"),animationiteration:Sl("Animation","AnimationIteration"),animationstart:Sl("Animation","AnimationStart"),transitionrun:Sl("Transition","TransitionRun"),transitionstart:Sl("Transition","TransitionStart"),transitioncancel:Sl("Transition","TransitionCancel"),transitionend:Sl("Transition","TransitionEnd")},Ai={},ds={};Oe&&(ds=document.createElement("div").style,"AnimationEvent"in window||(delete Jl.animationend.animation,delete Jl.animationiteration.animation,delete Jl.animationstart.animation),"TransitionEvent"in window||delete Jl.transitionend.transition);function zl(t){if(Ai[t])return Ai[t];if(!Jl[t])return t;var e=Jl[t],l;for(l in e)if(e.hasOwnProperty(l)&&l in ds)return Ai[t]=e[l];return t}var ms=zl("animationend"),hs=zl("animationiteration"),gs=zl("animationstart"),Wm=zl("transitionrun"),Fm=zl("transitionstart"),Im=zl("transitioncancel"),ys=zl("transitionend"),bs=new Map,Ti="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");Ti.push("scrollEnd");function ge(t,e){bs.set(t,e),pl(e,[t])}var vs=new WeakMap;function re(t,e){if(typeof t=="object"&&t!==null){var l=vs.get(t);return l!==void 0?l:(e={value:t,source:e,stack:Cr(e)},vs.set(t,e),e)}return{value:t,source:e,stack:Cr(e)}}var se=[],Wl=0,ji=0;function Ln(){for(var t=Wl,e=ji=Wl=0;e<t;){var l=se[e];se[e++]=null;var a=se[e];se[e++]=null;var n=se[e];se[e++]=null;var u=se[e];if(se[e++]=null,a!==null&&n!==null){var c=a.pending;c===null?n.next=n:(n.next=c.next,c.next=n),a.pending=n}u!==0&&ps(l,n,u)}}function Qn(t,e,l,a){se[Wl++]=t,se[Wl++]=e,se[Wl++]=l,se[Wl++]=a,ji|=a,t.lanes|=a,t=t.alternate,t!==null&&(t.lanes|=a)}function Ei(t,e,l,a){return Qn(t,e,l,a),Gn(t)}function Fl(t,e){return Qn(t,null,null,e),Gn(t)}function ps(t,e,l){t.lanes|=l;var a=t.alternate;a!==null&&(a.lanes|=l);for(var n=!1,u=t.return;u!==null;)u.childLanes|=l,a=u.alternate,a!==null&&(a.childLanes|=l),u.tag===22&&(t=u.stateNode,t===null||t._visibility&1||(n=!0)),t=u,u=u.return;return t.tag===3?(u=t.stateNode,n&&e!==null&&(n=31-It(l),t=u.hiddenUpdates,a=t[n],a===null?t[n]=[e]:a.push(e),e.lane=l|536870912),u):null}function Gn(t){if(50<cn)throw cn=0,qc=null,Error(s(185));for(var e=t.return;e!==null;)t=e,e=t.return;return t.tag===3?t.stateNode:null}var Il={};function Pm(t,e,l,a){this.tag=t,this.key=l,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=e,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=a,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function te(t,e,l,a){return new Pm(t,e,l,a)}function Mi(t){return t=t.prototype,!(!t||!t.isReactComponent)}function _e(t,e){var l=t.alternate;return l===null?(l=te(t.tag,e,t.key,t.mode),l.elementType=t.elementType,l.type=t.type,l.stateNode=t.stateNode,l.alternate=t,t.alternate=l):(l.pendingProps=e,l.type=t.type,l.flags=0,l.subtreeFlags=0,l.deletions=null),l.flags=t.flags&65011712,l.childLanes=t.childLanes,l.lanes=t.lanes,l.child=t.child,l.memoizedProps=t.memoizedProps,l.memoizedState=t.memoizedState,l.updateQueue=t.updateQueue,e=t.dependencies,l.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext},l.sibling=t.sibling,l.index=t.index,l.ref=t.ref,l.refCleanup=t.refCleanup,l}function xs(t,e){t.flags&=65011714;var l=t.alternate;return l===null?(t.childLanes=0,t.lanes=e,t.child=null,t.subtreeFlags=0,t.memoizedProps=null,t.memoizedState=null,t.updateQueue=null,t.dependencies=null,t.stateNode=null):(t.childLanes=l.childLanes,t.lanes=l.lanes,t.child=l.child,t.subtreeFlags=0,t.deletions=null,t.memoizedProps=l.memoizedProps,t.memoizedState=l.memoizedState,t.updateQueue=l.updateQueue,t.type=l.type,e=l.dependencies,t.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),t}function Yn(t,e,l,a,n,u){var c=0;if(a=t,typeof t=="function")Mi(t)&&(c=1);else if(typeof t=="string")c=e0(t,l,Ot.current)?26:t==="html"||t==="head"||t==="body"?27:5;else t:switch(t){case Gt:return t=te(31,l,e,n),t.elementType=Gt,t.lanes=u,t;case Q:return Al(l.children,n,u,e);case w:c=8,n|=24;break;case J:return t=te(12,l,e,n|2),t.elementType=J,t.lanes=u,t;case R:return t=te(13,l,e,n),t.elementType=R,t.lanes=u,t;case B:return t=te(19,l,e,n),t.elementType=B,t.lanes=u,t;default:if(typeof t=="object"&&t!==null)switch(t.$$typeof){case I:case F:c=10;break t;case Y:c=9;break t;case k:c=11;break t;case V:c=14;break t;case St:c=16,a=null;break t}c=29,l=Error(s(130,t===null?"null":typeof t,"")),a=null}return e=te(c,l,e,n),e.elementType=t,e.type=a,e.lanes=u,e}function Al(t,e,l,a){return t=te(7,t,a,e),t.lanes=l,t}function Di(t,e,l){return t=te(6,t,null,e),t.lanes=l,t}function Ui(t,e,l){return e=te(4,t.children!==null?t.children:[],t.key,e),e.lanes=l,e.stateNode={containerInfo:t.containerInfo,pendingChildren:null,implementation:t.implementation},e}var Pl=[],ta=0,$n=null,Xn=0,oe=[],fe=0,Tl=null,qe=1,Re="";function jl(t,e){Pl[ta++]=Xn,Pl[ta++]=$n,$n=t,Xn=e}function Ss(t,e,l){oe[fe++]=qe,oe[fe++]=Re,oe[fe++]=Tl,Tl=t;var a=qe;t=Re;var n=32-It(a)-1;a&=~(1<<n),l+=1;var u=32-It(e)+n;if(30<u){var c=n-n%5;u=(a&(1<<c)-1).toString(32),a>>=c,n-=c,qe=1<<32-It(e)+n|l<<n|a,Re=u+t}else qe=1<<u|l<<n|a,Re=t}function Oi(t){t.return!==null&&(jl(t,1),Ss(t,1,0))}function _i(t){for(;t===$n;)$n=Pl[--ta],Pl[ta]=null,Xn=Pl[--ta],Pl[ta]=null;for(;t===Tl;)Tl=oe[--fe],oe[fe]=null,Re=oe[--fe],oe[fe]=null,qe=oe[--fe],oe[fe]=null}var Zt=null,pt=null,it=!1,El=null,Se=!1,qi=Error(s(519));function Ml(t){var e=Error(s(418,""));throw Ba(re(e,t)),qi}function zs(t){var e=t.stateNode,l=t.type,a=t.memoizedProps;switch(e[Lt]=t,e[Vt]=a,l){case"dialog":at("cancel",e),at("close",e);break;case"iframe":case"object":case"embed":at("load",e);break;case"video":case"audio":for(l=0;l<sn.length;l++)at(sn[l],e);break;case"source":at("error",e);break;case"img":case"image":case"link":at("error",e),at("load",e);break;case"details":at("toggle",e);break;case"input":at("invalid",e),Nr(e,a.value,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name,!0),On(e);break;case"select":at("invalid",e);break;case"textarea":at("invalid",e),Lr(e,a.value,a.defaultValue,a.children),On(e)}l=a.children,typeof l!="string"&&typeof l!="number"&&typeof l!="bigint"||e.textContent===""+l||a.suppressHydrationWarning===!0||Gf(e.textContent,l)?(a.popover!=null&&(at("beforetoggle",e),at("toggle",e)),a.onScroll!=null&&at("scroll",e),a.onScrollEnd!=null&&at("scrollend",e),a.onClick!=null&&(e.onclick=Tu),e=!0):e=!1,e||Ml(t)}function As(t){for(Zt=t.return;Zt;)switch(Zt.tag){case 5:case 13:Se=!1;return;case 27:case 3:Se=!0;return;default:Zt=Zt.return}}function Ha(t){if(t!==Zt)return!1;if(!it)return As(t),it=!0,!1;var e=t.tag,l;if((l=e!==3&&e!==27)&&((l=e===5)&&(l=t.type,l=!(l!=="form"&&l!=="button")||kc(t.type,t.memoizedProps)),l=!l),l&&pt&&Ml(t),As(t),e===13){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(s(317));t:{for(t=t.nextSibling,e=0;t;){if(t.nodeType===8)if(l=t.data,l==="/$"){if(e===0){pt=be(t.nextSibling);break t}e--}else l!=="$"&&l!=="$!"&&l!=="$?"||e++;t=t.nextSibling}pt=null}}else e===27?(e=pt,ol(t.type)?(t=Ic,Ic=null,pt=t):pt=e):pt=Zt?be(t.stateNode.nextSibling):null;return!0}function Na(){pt=Zt=null,it=!1}function Ts(){var t=El;return t!==null&&(Wt===null?Wt=t:Wt.push.apply(Wt,t),El=null),t}function Ba(t){El===null?El=[t]:El.push(t)}var Ri=Xt(null),Dl=null,Ce=null;function Je(t,e,l){st(Ri,e._currentValue),e._currentValue=l}function we(t){t._currentValue=Ri.current,bt(Ri)}function Ci(t,e,l){for(;t!==null;){var a=t.alternate;if((t.childLanes&e)!==e?(t.childLanes|=e,a!==null&&(a.childLanes|=e)):a!==null&&(a.childLanes&e)!==e&&(a.childLanes|=e),t===l)break;t=t.return}}function wi(t,e,l,a){var n=t.child;for(n!==null&&(n.return=t);n!==null;){var u=n.dependencies;if(u!==null){var c=n.child;u=u.firstContext;t:for(;u!==null;){var r=u;u=n;for(var d=0;d<e.length;d++)if(r.context===e[d]){u.lanes|=l,r=u.alternate,r!==null&&(r.lanes|=l),Ci(u.return,l,t),a||(c=null);break t}u=r.next}}else if(n.tag===18){if(c=n.return,c===null)throw Error(s(341));c.lanes|=l,u=c.alternate,u!==null&&(u.lanes|=l),Ci(c,l,t),c=null}else c=n.child;if(c!==null)c.return=n;else for(c=n;c!==null;){if(c===t){c=null;break}if(n=c.sibling,n!==null){n.return=c.return,c=n;break}c=c.return}n=c}}function La(t,e,l,a){t=null;for(var n=e,u=!1;n!==null;){if(!u){if((n.flags&524288)!==0)u=!0;else if((n.flags&262144)!==0)break}if(n.tag===10){var c=n.alternate;if(c===null)throw Error(s(387));if(c=c.memoizedProps,c!==null){var r=n.type;Pt(n.pendingProps.value,c.value)||(t!==null?t.push(r):t=[r])}}else if(n===Sn.current){if(c=n.alternate,c===null)throw Error(s(387));c.memoizedState.memoizedState!==n.memoizedState.memoizedState&&(t!==null?t.push(gn):t=[gn])}n=n.return}t!==null&&wi(e,t,l,a),e.flags|=262144}function Zn(t){for(t=t.firstContext;t!==null;){if(!Pt(t.context._currentValue,t.memoizedValue))return!0;t=t.next}return!1}function Ul(t){Dl=t,Ce=null,t=t.dependencies,t!==null&&(t.firstContext=null)}function Qt(t){return js(Dl,t)}function Vn(t,e){return Dl===null&&Ul(t),js(t,e)}function js(t,e){var l=e._currentValue;if(e={context:e,memoizedValue:l,next:null},Ce===null){if(t===null)throw Error(s(308));Ce=e,t.dependencies={lanes:0,firstContext:e},t.flags|=524288}else Ce=Ce.next=e;return l}var th=typeof AbortController<"u"?AbortController:function(){var t=[],e=this.signal={aborted:!1,addEventListener:function(l,a){t.push(a)}};this.abort=function(){e.aborted=!0,t.forEach(function(l){return l()})}},eh=i.unstable_scheduleCallback,lh=i.unstable_NormalPriority,Mt={$$typeof:F,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function Hi(){return{controller:new th,data:new Map,refCount:0}}function Qa(t){t.refCount--,t.refCount===0&&eh(lh,function(){t.controller.abort()})}var Ga=null,Ni=0,ea=0,la=null;function ah(t,e){if(Ga===null){var l=Ga=[];Ni=0,ea=Lc(),la={status:"pending",value:void 0,then:function(a){l.push(a)}}}return Ni++,e.then(Es,Es),e}function Es(){if(--Ni===0&&Ga!==null){la!==null&&(la.status="fulfilled");var t=Ga;Ga=null,ea=0,la=null;for(var e=0;e<t.length;e++)(0,t[e])()}}function nh(t,e){var l=[],a={status:"pending",value:null,reason:null,then:function(n){l.push(n)}};return t.then(function(){a.status="fulfilled",a.value=e;for(var n=0;n<l.length;n++)(0,l[n])(e)},function(n){for(a.status="rejected",a.reason=n,n=0;n<l.length;n++)(0,l[n])(void 0)}),a}var Ms=A.S;A.S=function(t,e){typeof e=="object"&&e!==null&&typeof e.then=="function"&&ah(t,e),Ms!==null&&Ms(t,e)};var Ol=Xt(null);function Bi(){var t=Ol.current;return t!==null?t:ht.pooledCache}function Kn(t,e){e===null?st(Ol,Ol.current):st(Ol,e.pool)}function Ds(){var t=Bi();return t===null?null:{parent:Mt._currentValue,pool:t}}var Ya=Error(s(460)),Us=Error(s(474)),kn=Error(s(542)),Li={then:function(){}};function Os(t){return t=t.status,t==="fulfilled"||t==="rejected"}function Jn(){}function _s(t,e,l){switch(l=t[l],l===void 0?t.push(e):l!==e&&(e.then(Jn,Jn),e=l),e.status){case"fulfilled":return e.value;case"rejected":throw t=e.reason,Rs(t),t;default:if(typeof e.status=="string")e.then(Jn,Jn);else{if(t=ht,t!==null&&100<t.shellSuspendCounter)throw Error(s(482));t=e,t.status="pending",t.then(function(a){if(e.status==="pending"){var n=e;n.status="fulfilled",n.value=a}},function(a){if(e.status==="pending"){var n=e;n.status="rejected",n.reason=a}})}switch(e.status){case"fulfilled":return e.value;case"rejected":throw t=e.reason,Rs(t),t}throw $a=e,Ya}}var $a=null;function qs(){if($a===null)throw Error(s(459));var t=$a;return $a=null,t}function Rs(t){if(t===Ya||t===kn)throw Error(s(483))}var We=!1;function Qi(t){t.updateQueue={baseState:t.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Gi(t,e){t=t.updateQueue,e.updateQueue===t&&(e.updateQueue={baseState:t.baseState,firstBaseUpdate:t.firstBaseUpdate,lastBaseUpdate:t.lastBaseUpdate,shared:t.shared,callbacks:null})}function Fe(t){return{lane:t,tag:0,payload:null,callback:null,next:null}}function Ie(t,e,l){var a=t.updateQueue;if(a===null)return null;if(a=a.shared,(ct&2)!==0){var n=a.pending;return n===null?e.next=e:(e.next=n.next,n.next=e),a.pending=e,e=Gn(t),ps(t,null,l),e}return Qn(t,a,e,l),Gn(t)}function Xa(t,e,l){if(e=e.updateQueue,e!==null&&(e=e.shared,(l&4194048)!==0)){var a=e.lanes;a&=t.pendingLanes,l|=a,e.lanes=l,Er(t,l)}}function Yi(t,e){var l=t.updateQueue,a=t.alternate;if(a!==null&&(a=a.updateQueue,l===a)){var n=null,u=null;if(l=l.firstBaseUpdate,l!==null){do{var c={lane:l.lane,tag:l.tag,payload:l.payload,callback:null,next:null};u===null?n=u=c:u=u.next=c,l=l.next}while(l!==null);u===null?n=u=e:u=u.next=e}else n=u=e;l={baseState:a.baseState,firstBaseUpdate:n,lastBaseUpdate:u,shared:a.shared,callbacks:a.callbacks},t.updateQueue=l;return}t=l.lastBaseUpdate,t===null?l.firstBaseUpdate=e:t.next=e,l.lastBaseUpdate=e}var $i=!1;function Za(){if($i){var t=la;if(t!==null)throw t}}function Va(t,e,l,a){$i=!1;var n=t.updateQueue;We=!1;var u=n.firstBaseUpdate,c=n.lastBaseUpdate,r=n.shared.pending;if(r!==null){n.shared.pending=null;var d=r,b=d.next;d.next=null,c===null?u=b:c.next=b,c=d;var z=t.alternate;z!==null&&(z=z.updateQueue,r=z.lastBaseUpdate,r!==c&&(r===null?z.firstBaseUpdate=b:r.next=b,z.lastBaseUpdate=d))}if(u!==null){var E=n.baseState;c=0,z=b=d=null,r=u;do{var v=r.lane&-536870913,p=v!==r.lane;if(p?(nt&v)===v:(a&v)===v){v!==0&&v===ea&&($i=!0),z!==null&&(z=z.next={lane:0,tag:r.tag,payload:r.payload,callback:null,next:null});t:{var K=t,$=r;v=e;var dt=l;switch($.tag){case 1:if(K=$.payload,typeof K=="function"){E=K.call(dt,E,v);break t}E=K;break t;case 3:K.flags=K.flags&-65537|128;case 0:if(K=$.payload,v=typeof K=="function"?K.call(dt,E,v):K,v==null)break t;E=q({},E,v);break t;case 2:We=!0}}v=r.callback,v!==null&&(t.flags|=64,p&&(t.flags|=8192),p=n.callbacks,p===null?n.callbacks=[v]:p.push(v))}else p={lane:v,tag:r.tag,payload:r.payload,callback:r.callback,next:null},z===null?(b=z=p,d=E):z=z.next=p,c|=v;if(r=r.next,r===null){if(r=n.shared.pending,r===null)break;p=r,r=p.next,p.next=null,n.lastBaseUpdate=p,n.shared.pending=null}}while(!0);z===null&&(d=E),n.baseState=d,n.firstBaseUpdate=b,n.lastBaseUpdate=z,u===null&&(n.shared.lanes=0),il|=c,t.lanes=c,t.memoizedState=E}}function Cs(t,e){if(typeof t!="function")throw Error(s(191,t));t.call(e)}function ws(t,e){var l=t.callbacks;if(l!==null)for(t.callbacks=null,t=0;t<l.length;t++)Cs(l[t],e)}var aa=Xt(null),Wn=Xt(0);function Hs(t,e){t=Ye,st(Wn,t),st(aa,e),Ye=t|e.baseLanes}function Xi(){st(Wn,Ye),st(aa,aa.current)}function Zi(){Ye=Wn.current,bt(aa),bt(Wn)}var Pe=0,P=null,ot=null,Tt=null,Fn=!1,na=!1,_l=!1,In=0,Ka=0,ua=null,uh=0;function zt(){throw Error(s(321))}function Vi(t,e){if(e===null)return!1;for(var l=0;l<e.length&&l<t.length;l++)if(!Pt(t[l],e[l]))return!1;return!0}function Ki(t,e,l,a,n,u){return Pe=u,P=e,e.memoizedState=null,e.updateQueue=null,e.lanes=0,A.H=t===null||t.memoizedState===null?xo:So,_l=!1,u=l(a,n),_l=!1,na&&(u=Bs(e,l,a,n)),Ns(t),u}function Ns(t){A.H=nu;var e=ot!==null&&ot.next!==null;if(Pe=0,Tt=ot=P=null,Fn=!1,Ka=0,ua=null,e)throw Error(s(300));t===null||qt||(t=t.dependencies,t!==null&&Zn(t)&&(qt=!0))}function Bs(t,e,l,a){P=t;var n=0;do{if(na&&(ua=null),Ka=0,na=!1,25<=n)throw Error(s(301));if(n+=1,Tt=ot=null,t.updateQueue!=null){var u=t.updateQueue;u.lastEffect=null,u.events=null,u.stores=null,u.memoCache!=null&&(u.memoCache.index=0)}A.H=dh,u=e(l,a)}while(na);return u}function ih(){var t=A.H,e=t.useState()[0];return e=typeof e.then=="function"?ka(e):e,t=t.useState()[0],(ot!==null?ot.memoizedState:null)!==t&&(P.flags|=1024),e}function ki(){var t=In!==0;return In=0,t}function Ji(t,e,l){e.updateQueue=t.updateQueue,e.flags&=-2053,t.lanes&=~l}function Wi(t){if(Fn){for(t=t.memoizedState;t!==null;){var e=t.queue;e!==null&&(e.pending=null),t=t.next}Fn=!1}Pe=0,Tt=ot=P=null,na=!1,Ka=In=0,ua=null}function kt(){var t={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Tt===null?P.memoizedState=Tt=t:Tt=Tt.next=t,Tt}function jt(){if(ot===null){var t=P.alternate;t=t!==null?t.memoizedState:null}else t=ot.next;var e=Tt===null?P.memoizedState:Tt.next;if(e!==null)Tt=e,ot=t;else{if(t===null)throw P.alternate===null?Error(s(467)):Error(s(310));ot=t,t={memoizedState:ot.memoizedState,baseState:ot.baseState,baseQueue:ot.baseQueue,queue:ot.queue,next:null},Tt===null?P.memoizedState=Tt=t:Tt=Tt.next=t}return Tt}function Fi(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function ka(t){var e=Ka;return Ka+=1,ua===null&&(ua=[]),t=_s(ua,t,e),e=P,(Tt===null?e.memoizedState:Tt.next)===null&&(e=e.alternate,A.H=e===null||e.memoizedState===null?xo:So),t}function Pn(t){if(t!==null&&typeof t=="object"){if(typeof t.then=="function")return ka(t);if(t.$$typeof===F)return Qt(t)}throw Error(s(438,String(t)))}function Ii(t){var e=null,l=P.updateQueue;if(l!==null&&(e=l.memoCache),e==null){var a=P.alternate;a!==null&&(a=a.updateQueue,a!==null&&(a=a.memoCache,a!=null&&(e={data:a.data.map(function(n){return n.slice()}),index:0})))}if(e==null&&(e={data:[],index:0}),l===null&&(l=Fi(),P.updateQueue=l),l.memoCache=e,l=e.data[e.index],l===void 0)for(l=e.data[e.index]=Array(t),a=0;a<t;a++)l[a]=Xe;return e.index++,l}function He(t,e){return typeof e=="function"?e(t):e}function tu(t){var e=jt();return Pi(e,ot,t)}function Pi(t,e,l){var a=t.queue;if(a===null)throw Error(s(311));a.lastRenderedReducer=l;var n=t.baseQueue,u=a.pending;if(u!==null){if(n!==null){var c=n.next;n.next=u.next,u.next=c}e.baseQueue=n=u,a.pending=null}if(u=t.baseState,n===null)t.memoizedState=u;else{e=n.next;var r=c=null,d=null,b=e,z=!1;do{var E=b.lane&-536870913;if(E!==b.lane?(nt&E)===E:(Pe&E)===E){var v=b.revertLane;if(v===0)d!==null&&(d=d.next={lane:0,revertLane:0,action:b.action,hasEagerState:b.hasEagerState,eagerState:b.eagerState,next:null}),E===ea&&(z=!0);else if((Pe&v)===v){b=b.next,v===ea&&(z=!0);continue}else E={lane:0,revertLane:b.revertLane,action:b.action,hasEagerState:b.hasEagerState,eagerState:b.eagerState,next:null},d===null?(r=d=E,c=u):d=d.next=E,P.lanes|=v,il|=v;E=b.action,_l&&l(u,E),u=b.hasEagerState?b.eagerState:l(u,E)}else v={lane:E,revertLane:b.revertLane,action:b.action,hasEagerState:b.hasEagerState,eagerState:b.eagerState,next:null},d===null?(r=d=v,c=u):d=d.next=v,P.lanes|=E,il|=E;b=b.next}while(b!==null&&b!==e);if(d===null?c=u:d.next=r,!Pt(u,t.memoizedState)&&(qt=!0,z&&(l=la,l!==null)))throw l;t.memoizedState=u,t.baseState=c,t.baseQueue=d,a.lastRenderedState=u}return n===null&&(a.lanes=0),[t.memoizedState,a.dispatch]}function tc(t){var e=jt(),l=e.queue;if(l===null)throw Error(s(311));l.lastRenderedReducer=t;var a=l.dispatch,n=l.pending,u=e.memoizedState;if(n!==null){l.pending=null;var c=n=n.next;do u=t(u,c.action),c=c.next;while(c!==n);Pt(u,e.memoizedState)||(qt=!0),e.memoizedState=u,e.baseQueue===null&&(e.baseState=u),l.lastRenderedState=u}return[u,a]}function Ls(t,e,l){var a=P,n=jt(),u=it;if(u){if(l===void 0)throw Error(s(407));l=l()}else l=e();var c=!Pt((ot||n).memoizedState,l);c&&(n.memoizedState=l,qt=!0),n=n.queue;var r=Ys.bind(null,a,n,t);if(Ja(2048,8,r,[t]),n.getSnapshot!==e||c||Tt!==null&&Tt.memoizedState.tag&1){if(a.flags|=2048,ia(9,eu(),Gs.bind(null,a,n,l,e),null),ht===null)throw Error(s(349));u||(Pe&124)!==0||Qs(a,e,l)}return l}function Qs(t,e,l){t.flags|=16384,t={getSnapshot:e,value:l},e=P.updateQueue,e===null?(e=Fi(),P.updateQueue=e,e.stores=[t]):(l=e.stores,l===null?e.stores=[t]:l.push(t))}function Gs(t,e,l,a){e.value=l,e.getSnapshot=a,$s(e)&&Xs(t)}function Ys(t,e,l){return l(function(){$s(e)&&Xs(t)})}function $s(t){var e=t.getSnapshot;t=t.value;try{var l=e();return!Pt(t,l)}catch{return!0}}function Xs(t){var e=Fl(t,2);e!==null&&ue(e,t,2)}function ec(t){var e=kt();if(typeof t=="function"){var l=t;if(t=l(),_l){Ve(!0);try{l()}finally{Ve(!1)}}}return e.memoizedState=e.baseState=t,e.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:He,lastRenderedState:t},e}function Zs(t,e,l,a){return t.baseState=l,Pi(t,ot,typeof a=="function"?a:He)}function ch(t,e,l,a,n){if(au(t))throw Error(s(485));if(t=e.action,t!==null){var u={payload:n,action:t,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(c){u.listeners.push(c)}};A.T!==null?l(!0):u.isTransition=!1,a(u),l=e.pending,l===null?(u.next=e.pending=u,Vs(e,u)):(u.next=l.next,e.pending=l.next=u)}}function Vs(t,e){var l=e.action,a=e.payload,n=t.state;if(e.isTransition){var u=A.T,c={};A.T=c;try{var r=l(n,a),d=A.S;d!==null&&d(c,r),Ks(t,e,r)}catch(b){lc(t,e,b)}finally{A.T=u}}else try{u=l(n,a),Ks(t,e,u)}catch(b){lc(t,e,b)}}function Ks(t,e,l){l!==null&&typeof l=="object"&&typeof l.then=="function"?l.then(function(a){ks(t,e,a)},function(a){return lc(t,e,a)}):ks(t,e,l)}function ks(t,e,l){e.status="fulfilled",e.value=l,Js(e),t.state=l,e=t.pending,e!==null&&(l=e.next,l===e?t.pending=null:(l=l.next,e.next=l,Vs(t,l)))}function lc(t,e,l){var a=t.pending;if(t.pending=null,a!==null){a=a.next;do e.status="rejected",e.reason=l,Js(e),e=e.next;while(e!==a)}t.action=null}function Js(t){t=t.listeners;for(var e=0;e<t.length;e++)(0,t[e])()}function Ws(t,e){return e}function Fs(t,e){if(it){var l=ht.formState;if(l!==null){t:{var a=P;if(it){if(pt){e:{for(var n=pt,u=Se;n.nodeType!==8;){if(!u){n=null;break e}if(n=be(n.nextSibling),n===null){n=null;break e}}u=n.data,n=u==="F!"||u==="F"?n:null}if(n){pt=be(n.nextSibling),a=n.data==="F!";break t}}Ml(a)}a=!1}a&&(e=l[0])}}return l=kt(),l.memoizedState=l.baseState=e,a={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Ws,lastRenderedState:e},l.queue=a,l=bo.bind(null,P,a),a.dispatch=l,a=ec(!1),u=cc.bind(null,P,!1,a.queue),a=kt(),n={state:e,dispatch:null,action:t,pending:null},a.queue=n,l=ch.bind(null,P,n,u,l),n.dispatch=l,a.memoizedState=t,[e,l,!1]}function Is(t){var e=jt();return Ps(e,ot,t)}function Ps(t,e,l){if(e=Pi(t,e,Ws)[0],t=tu(He)[0],typeof e=="object"&&e!==null&&typeof e.then=="function")try{var a=ka(e)}catch(c){throw c===Ya?kn:c}else a=e;e=jt();var n=e.queue,u=n.dispatch;return l!==e.memoizedState&&(P.flags|=2048,ia(9,eu(),rh.bind(null,n,l),null)),[a,u,t]}function rh(t,e){t.action=e}function to(t){var e=jt(),l=ot;if(l!==null)return Ps(e,l,t);jt(),e=e.memoizedState,l=jt();var a=l.queue.dispatch;return l.memoizedState=t,[e,a,!1]}function ia(t,e,l,a){return t={tag:t,create:l,deps:a,inst:e,next:null},e=P.updateQueue,e===null&&(e=Fi(),P.updateQueue=e),l=e.lastEffect,l===null?e.lastEffect=t.next=t:(a=l.next,l.next=t,t.next=a,e.lastEffect=t),t}function eu(){return{destroy:void 0,resource:void 0}}function eo(){return jt().memoizedState}function lu(t,e,l,a){var n=kt();a=a===void 0?null:a,P.flags|=t,n.memoizedState=ia(1|e,eu(),l,a)}function Ja(t,e,l,a){var n=jt();a=a===void 0?null:a;var u=n.memoizedState.inst;ot!==null&&a!==null&&Vi(a,ot.memoizedState.deps)?n.memoizedState=ia(e,u,l,a):(P.flags|=t,n.memoizedState=ia(1|e,u,l,a))}function lo(t,e){lu(8390656,8,t,e)}function ao(t,e){Ja(2048,8,t,e)}function no(t,e){return Ja(4,2,t,e)}function uo(t,e){return Ja(4,4,t,e)}function io(t,e){if(typeof e=="function"){t=t();var l=e(t);return function(){typeof l=="function"?l():e(null)}}if(e!=null)return t=t(),e.current=t,function(){e.current=null}}function co(t,e,l){l=l!=null?l.concat([t]):null,Ja(4,4,io.bind(null,e,t),l)}function ac(){}function ro(t,e){var l=jt();e=e===void 0?null:e;var a=l.memoizedState;return e!==null&&Vi(e,a[1])?a[0]:(l.memoizedState=[t,e],t)}function so(t,e){var l=jt();e=e===void 0?null:e;var a=l.memoizedState;if(e!==null&&Vi(e,a[1]))return a[0];if(a=t(),_l){Ve(!0);try{t()}finally{Ve(!1)}}return l.memoizedState=[a,e],a}function nc(t,e,l){return l===void 0||(Pe&1073741824)!==0?t.memoizedState=e:(t.memoizedState=l,t=hf(),P.lanes|=t,il|=t,l)}function oo(t,e,l,a){return Pt(l,e)?l:aa.current!==null?(t=nc(t,l,a),Pt(t,e)||(qt=!0),t):(Pe&42)===0?(qt=!0,t.memoizedState=l):(t=hf(),P.lanes|=t,il|=t,e)}function fo(t,e,l,a,n){var u=C.p;C.p=u!==0&&8>u?u:8;var c=A.T,r={};A.T=r,cc(t,!1,e,l);try{var d=n(),b=A.S;if(b!==null&&b(r,d),d!==null&&typeof d=="object"&&typeof d.then=="function"){var z=nh(d,a);Wa(t,e,z,ne(t))}else Wa(t,e,a,ne(t))}catch(E){Wa(t,e,{then:function(){},status:"rejected",reason:E},ne())}finally{C.p=u,A.T=c}}function sh(){}function uc(t,e,l,a){if(t.tag!==5)throw Error(s(476));var n=mo(t).queue;fo(t,n,e,Z,l===null?sh:function(){return ho(t),l(a)})}function mo(t){var e=t.memoizedState;if(e!==null)return e;e={memoizedState:Z,baseState:Z,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:He,lastRenderedState:Z},next:null};var l={};return e.next={memoizedState:l,baseState:l,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:He,lastRenderedState:l},next:null},t.memoizedState=e,t=t.alternate,t!==null&&(t.memoizedState=e),e}function ho(t){var e=mo(t).next.queue;Wa(t,e,{},ne())}function ic(){return Qt(gn)}function go(){return jt().memoizedState}function yo(){return jt().memoizedState}function oh(t){for(var e=t.return;e!==null;){switch(e.tag){case 24:case 3:var l=ne();t=Fe(l);var a=Ie(e,t,l);a!==null&&(ue(a,e,l),Xa(a,e,l)),e={cache:Hi()},t.payload=e;return}e=e.return}}function fh(t,e,l){var a=ne();l={lane:a,revertLane:0,action:l,hasEagerState:!1,eagerState:null,next:null},au(t)?vo(e,l):(l=Ei(t,e,l,a),l!==null&&(ue(l,t,a),po(l,e,a)))}function bo(t,e,l){var a=ne();Wa(t,e,l,a)}function Wa(t,e,l,a){var n={lane:a,revertLane:0,action:l,hasEagerState:!1,eagerState:null,next:null};if(au(t))vo(e,n);else{var u=t.alternate;if(t.lanes===0&&(u===null||u.lanes===0)&&(u=e.lastRenderedReducer,u!==null))try{var c=e.lastRenderedState,r=u(c,l);if(n.hasEagerState=!0,n.eagerState=r,Pt(r,c))return Qn(t,e,n,0),ht===null&&Ln(),!1}catch{}finally{}if(l=Ei(t,e,n,a),l!==null)return ue(l,t,a),po(l,e,a),!0}return!1}function cc(t,e,l,a){if(a={lane:2,revertLane:Lc(),action:a,hasEagerState:!1,eagerState:null,next:null},au(t)){if(e)throw Error(s(479))}else e=Ei(t,l,a,2),e!==null&&ue(e,t,2)}function au(t){var e=t.alternate;return t===P||e!==null&&e===P}function vo(t,e){na=Fn=!0;var l=t.pending;l===null?e.next=e:(e.next=l.next,l.next=e),t.pending=e}function po(t,e,l){if((l&4194048)!==0){var a=e.lanes;a&=t.pendingLanes,l|=a,e.lanes=l,Er(t,l)}}var nu={readContext:Qt,use:Pn,useCallback:zt,useContext:zt,useEffect:zt,useImperativeHandle:zt,useLayoutEffect:zt,useInsertionEffect:zt,useMemo:zt,useReducer:zt,useRef:zt,useState:zt,useDebugValue:zt,useDeferredValue:zt,useTransition:zt,useSyncExternalStore:zt,useId:zt,useHostTransitionStatus:zt,useFormState:zt,useActionState:zt,useOptimistic:zt,useMemoCache:zt,useCacheRefresh:zt},xo={readContext:Qt,use:Pn,useCallback:function(t,e){return kt().memoizedState=[t,e===void 0?null:e],t},useContext:Qt,useEffect:lo,useImperativeHandle:function(t,e,l){l=l!=null?l.concat([t]):null,lu(4194308,4,io.bind(null,e,t),l)},useLayoutEffect:function(t,e){return lu(4194308,4,t,e)},useInsertionEffect:function(t,e){lu(4,2,t,e)},useMemo:function(t,e){var l=kt();e=e===void 0?null:e;var a=t();if(_l){Ve(!0);try{t()}finally{Ve(!1)}}return l.memoizedState=[a,e],a},useReducer:function(t,e,l){var a=kt();if(l!==void 0){var n=l(e);if(_l){Ve(!0);try{l(e)}finally{Ve(!1)}}}else n=e;return a.memoizedState=a.baseState=n,t={pending:null,lanes:0,dispatch:null,lastRenderedReducer:t,lastRenderedState:n},a.queue=t,t=t.dispatch=fh.bind(null,P,t),[a.memoizedState,t]},useRef:function(t){var e=kt();return t={current:t},e.memoizedState=t},useState:function(t){t=ec(t);var e=t.queue,l=bo.bind(null,P,e);return e.dispatch=l,[t.memoizedState,l]},useDebugValue:ac,useDeferredValue:function(t,e){var l=kt();return nc(l,t,e)},useTransition:function(){var t=ec(!1);return t=fo.bind(null,P,t.queue,!0,!1),kt().memoizedState=t,[!1,t]},useSyncExternalStore:function(t,e,l){var a=P,n=kt();if(it){if(l===void 0)throw Error(s(407));l=l()}else{if(l=e(),ht===null)throw Error(s(349));(nt&124)!==0||Qs(a,e,l)}n.memoizedState=l;var u={value:l,getSnapshot:e};return n.queue=u,lo(Ys.bind(null,a,u,t),[t]),a.flags|=2048,ia(9,eu(),Gs.bind(null,a,u,l,e),null),l},useId:function(){var t=kt(),e=ht.identifierPrefix;if(it){var l=Re,a=qe;l=(a&~(1<<32-It(a)-1)).toString(32)+l,e="«"+e+"R"+l,l=In++,0<l&&(e+="H"+l.toString(32)),e+="»"}else l=uh++,e="«"+e+"r"+l.toString(32)+"»";return t.memoizedState=e},useHostTransitionStatus:ic,useFormState:Fs,useActionState:Fs,useOptimistic:function(t){var e=kt();e.memoizedState=e.baseState=t;var l={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return e.queue=l,e=cc.bind(null,P,!0,l),l.dispatch=e,[t,e]},useMemoCache:Ii,useCacheRefresh:function(){return kt().memoizedState=oh.bind(null,P)}},So={readContext:Qt,use:Pn,useCallback:ro,useContext:Qt,useEffect:ao,useImperativeHandle:co,useInsertionEffect:no,useLayoutEffect:uo,useMemo:so,useReducer:tu,useRef:eo,useState:function(){return tu(He)},useDebugValue:ac,useDeferredValue:function(t,e){var l=jt();return oo(l,ot.memoizedState,t,e)},useTransition:function(){var t=tu(He)[0],e=jt().memoizedState;return[typeof t=="boolean"?t:ka(t),e]},useSyncExternalStore:Ls,useId:go,useHostTransitionStatus:ic,useFormState:Is,useActionState:Is,useOptimistic:function(t,e){var l=jt();return Zs(l,ot,t,e)},useMemoCache:Ii,useCacheRefresh:yo},dh={readContext:Qt,use:Pn,useCallback:ro,useContext:Qt,useEffect:ao,useImperativeHandle:co,useInsertionEffect:no,useLayoutEffect:uo,useMemo:so,useReducer:tc,useRef:eo,useState:function(){return tc(He)},useDebugValue:ac,useDeferredValue:function(t,e){var l=jt();return ot===null?nc(l,t,e):oo(l,ot.memoizedState,t,e)},useTransition:function(){var t=tc(He)[0],e=jt().memoizedState;return[typeof t=="boolean"?t:ka(t),e]},useSyncExternalStore:Ls,useId:go,useHostTransitionStatus:ic,useFormState:to,useActionState:to,useOptimistic:function(t,e){var l=jt();return ot!==null?Zs(l,ot,t,e):(l.baseState=t,[t,l.queue.dispatch])},useMemoCache:Ii,useCacheRefresh:yo},ca=null,Fa=0;function uu(t){var e=Fa;return Fa+=1,ca===null&&(ca=[]),_s(ca,t,e)}function Ia(t,e){e=e.props.ref,t.ref=e!==void 0?e:null}function iu(t,e){throw e.$$typeof===U?Error(s(525)):(t=Object.prototype.toString.call(e),Error(s(31,t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)))}function zo(t){var e=t._init;return e(t._payload)}function Ao(t){function e(g,h){if(t){var y=g.deletions;y===null?(g.deletions=[h],g.flags|=16):y.push(h)}}function l(g,h){if(!t)return null;for(;h!==null;)e(g,h),h=h.sibling;return null}function a(g){for(var h=new Map;g!==null;)g.key!==null?h.set(g.key,g):h.set(g.index,g),g=g.sibling;return h}function n(g,h){return g=_e(g,h),g.index=0,g.sibling=null,g}function u(g,h,y){return g.index=y,t?(y=g.alternate,y!==null?(y=y.index,y<h?(g.flags|=67108866,h):y):(g.flags|=67108866,h)):(g.flags|=1048576,h)}function c(g){return t&&g.alternate===null&&(g.flags|=67108866),g}function r(g,h,y,j){return h===null||h.tag!==6?(h=Di(y,g.mode,j),h.return=g,h):(h=n(h,y),h.return=g,h)}function d(g,h,y,j){var L=y.type;return L===Q?z(g,h,y.props.children,j,y.key):h!==null&&(h.elementType===L||typeof L=="object"&&L!==null&&L.$$typeof===St&&zo(L)===h.type)?(h=n(h,y.props),Ia(h,y),h.return=g,h):(h=Yn(y.type,y.key,y.props,null,g.mode,j),Ia(h,y),h.return=g,h)}function b(g,h,y,j){return h===null||h.tag!==4||h.stateNode.containerInfo!==y.containerInfo||h.stateNode.implementation!==y.implementation?(h=Ui(y,g.mode,j),h.return=g,h):(h=n(h,y.children||[]),h.return=g,h)}function z(g,h,y,j,L){return h===null||h.tag!==7?(h=Al(y,g.mode,j,L),h.return=g,h):(h=n(h,y),h.return=g,h)}function E(g,h,y){if(typeof h=="string"&&h!==""||typeof h=="number"||typeof h=="bigint")return h=Di(""+h,g.mode,y),h.return=g,h;if(typeof h=="object"&&h!==null){switch(h.$$typeof){case _:return y=Yn(h.type,h.key,h.props,null,g.mode,y),Ia(y,h),y.return=g,y;case D:return h=Ui(h,g.mode,y),h.return=g,h;case St:var j=h._init;return h=j(h._payload),E(g,h,y)}if($t(h)||wt(h))return h=Al(h,g.mode,y,null),h.return=g,h;if(typeof h.then=="function")return E(g,uu(h),y);if(h.$$typeof===F)return E(g,Vn(g,h),y);iu(g,h)}return null}function v(g,h,y,j){var L=h!==null?h.key:null;if(typeof y=="string"&&y!==""||typeof y=="number"||typeof y=="bigint")return L!==null?null:r(g,h,""+y,j);if(typeof y=="object"&&y!==null){switch(y.$$typeof){case _:return y.key===L?d(g,h,y,j):null;case D:return y.key===L?b(g,h,y,j):null;case St:return L=y._init,y=L(y._payload),v(g,h,y,j)}if($t(y)||wt(y))return L!==null?null:z(g,h,y,j,null);if(typeof y.then=="function")return v(g,h,uu(y),j);if(y.$$typeof===F)return v(g,h,Vn(g,y),j);iu(g,y)}return null}function p(g,h,y,j,L){if(typeof j=="string"&&j!==""||typeof j=="number"||typeof j=="bigint")return g=g.get(y)||null,r(h,g,""+j,L);if(typeof j=="object"&&j!==null){switch(j.$$typeof){case _:return g=g.get(j.key===null?y:j.key)||null,d(h,g,j,L);case D:return g=g.get(j.key===null?y:j.key)||null,b(h,g,j,L);case St:var et=j._init;return j=et(j._payload),p(g,h,y,j,L)}if($t(j)||wt(j))return g=g.get(y)||null,z(h,g,j,L,null);if(typeof j.then=="function")return p(g,h,y,uu(j),L);if(j.$$typeof===F)return p(g,h,y,Vn(h,j),L);iu(h,j)}return null}function K(g,h,y,j){for(var L=null,et=null,G=h,X=h=0,Ct=null;G!==null&&X<y.length;X++){G.index>X?(Ct=G,G=null):Ct=G.sibling;var ut=v(g,G,y[X],j);if(ut===null){G===null&&(G=Ct);break}t&&G&&ut.alternate===null&&e(g,G),h=u(ut,h,X),et===null?L=ut:et.sibling=ut,et=ut,G=Ct}if(X===y.length)return l(g,G),it&&jl(g,X),L;if(G===null){for(;X<y.length;X++)G=E(g,y[X],j),G!==null&&(h=u(G,h,X),et===null?L=G:et.sibling=G,et=G);return it&&jl(g,X),L}for(G=a(G);X<y.length;X++)Ct=p(G,g,X,y[X],j),Ct!==null&&(t&&Ct.alternate!==null&&G.delete(Ct.key===null?X:Ct.key),h=u(Ct,h,X),et===null?L=Ct:et.sibling=Ct,et=Ct);return t&&G.forEach(function(gl){return e(g,gl)}),it&&jl(g,X),L}function $(g,h,y,j){if(y==null)throw Error(s(151));for(var L=null,et=null,G=h,X=h=0,Ct=null,ut=y.next();G!==null&&!ut.done;X++,ut=y.next()){G.index>X?(Ct=G,G=null):Ct=G.sibling;var gl=v(g,G,ut.value,j);if(gl===null){G===null&&(G=Ct);break}t&&G&&gl.alternate===null&&e(g,G),h=u(gl,h,X),et===null?L=gl:et.sibling=gl,et=gl,G=Ct}if(ut.done)return l(g,G),it&&jl(g,X),L;if(G===null){for(;!ut.done;X++,ut=y.next())ut=E(g,ut.value,j),ut!==null&&(h=u(ut,h,X),et===null?L=ut:et.sibling=ut,et=ut);return it&&jl(g,X),L}for(G=a(G);!ut.done;X++,ut=y.next())ut=p(G,g,X,ut.value,j),ut!==null&&(t&&ut.alternate!==null&&G.delete(ut.key===null?X:ut.key),h=u(ut,h,X),et===null?L=ut:et.sibling=ut,et=ut);return t&&G.forEach(function(m0){return e(g,m0)}),it&&jl(g,X),L}function dt(g,h,y,j){if(typeof y=="object"&&y!==null&&y.type===Q&&y.key===null&&(y=y.props.children),typeof y=="object"&&y!==null){switch(y.$$typeof){case _:t:{for(var L=y.key;h!==null;){if(h.key===L){if(L=y.type,L===Q){if(h.tag===7){l(g,h.sibling),j=n(h,y.props.children),j.return=g,g=j;break t}}else if(h.elementType===L||typeof L=="object"&&L!==null&&L.$$typeof===St&&zo(L)===h.type){l(g,h.sibling),j=n(h,y.props),Ia(j,y),j.return=g,g=j;break t}l(g,h);break}else e(g,h);h=h.sibling}y.type===Q?(j=Al(y.props.children,g.mode,j,y.key),j.return=g,g=j):(j=Yn(y.type,y.key,y.props,null,g.mode,j),Ia(j,y),j.return=g,g=j)}return c(g);case D:t:{for(L=y.key;h!==null;){if(h.key===L)if(h.tag===4&&h.stateNode.containerInfo===y.containerInfo&&h.stateNode.implementation===y.implementation){l(g,h.sibling),j=n(h,y.children||[]),j.return=g,g=j;break t}else{l(g,h);break}else e(g,h);h=h.sibling}j=Ui(y,g.mode,j),j.return=g,g=j}return c(g);case St:return L=y._init,y=L(y._payload),dt(g,h,y,j)}if($t(y))return K(g,h,y,j);if(wt(y)){if(L=wt(y),typeof L!="function")throw Error(s(150));return y=L.call(y),$(g,h,y,j)}if(typeof y.then=="function")return dt(g,h,uu(y),j);if(y.$$typeof===F)return dt(g,h,Vn(g,y),j);iu(g,y)}return typeof y=="string"&&y!==""||typeof y=="number"||typeof y=="bigint"?(y=""+y,h!==null&&h.tag===6?(l(g,h.sibling),j=n(h,y),j.return=g,g=j):(l(g,h),j=Di(y,g.mode,j),j.return=g,g=j),c(g)):l(g,h)}return function(g,h,y,j){try{Fa=0;var L=dt(g,h,y,j);return ca=null,L}catch(G){if(G===Ya||G===kn)throw G;var et=te(29,G,null,g.mode);return et.lanes=j,et.return=g,et}finally{}}}var ra=Ao(!0),To=Ao(!1),de=Xt(null),ze=null;function tl(t){var e=t.alternate;st(Dt,Dt.current&1),st(de,t),ze===null&&(e===null||aa.current!==null||e.memoizedState!==null)&&(ze=t)}function jo(t){if(t.tag===22){if(st(Dt,Dt.current),st(de,t),ze===null){var e=t.alternate;e!==null&&e.memoizedState!==null&&(ze=t)}}else el()}function el(){st(Dt,Dt.current),st(de,de.current)}function Ne(t){bt(de),ze===t&&(ze=null),bt(Dt)}var Dt=Xt(0);function cu(t){for(var e=t;e!==null;){if(e.tag===13){var l=e.memoizedState;if(l!==null&&(l=l.dehydrated,l===null||l.data==="$?"||Fc(l)))return e}else if(e.tag===19&&e.memoizedProps.revealOrder!==void 0){if((e.flags&128)!==0)return e}else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break;for(;e.sibling===null;){if(e.return===null||e.return===t)return null;e=e.return}e.sibling.return=e.return,e=e.sibling}return null}function rc(t,e,l,a){e=t.memoizedState,l=l(a,e),l=l==null?e:q({},e,l),t.memoizedState=l,t.lanes===0&&(t.updateQueue.baseState=l)}var sc={enqueueSetState:function(t,e,l){t=t._reactInternals;var a=ne(),n=Fe(a);n.payload=e,l!=null&&(n.callback=l),e=Ie(t,n,a),e!==null&&(ue(e,t,a),Xa(e,t,a))},enqueueReplaceState:function(t,e,l){t=t._reactInternals;var a=ne(),n=Fe(a);n.tag=1,n.payload=e,l!=null&&(n.callback=l),e=Ie(t,n,a),e!==null&&(ue(e,t,a),Xa(e,t,a))},enqueueForceUpdate:function(t,e){t=t._reactInternals;var l=ne(),a=Fe(l);a.tag=2,e!=null&&(a.callback=e),e=Ie(t,a,l),e!==null&&(ue(e,t,l),Xa(e,t,l))}};function Eo(t,e,l,a,n,u,c){return t=t.stateNode,typeof t.shouldComponentUpdate=="function"?t.shouldComponentUpdate(a,u,c):e.prototype&&e.prototype.isPureReactComponent?!Ca(l,a)||!Ca(n,u):!0}function Mo(t,e,l,a){t=e.state,typeof e.componentWillReceiveProps=="function"&&e.componentWillReceiveProps(l,a),typeof e.UNSAFE_componentWillReceiveProps=="function"&&e.UNSAFE_componentWillReceiveProps(l,a),e.state!==t&&sc.enqueueReplaceState(e,e.state,null)}function ql(t,e){var l=e;if("ref"in e){l={};for(var a in e)a!=="ref"&&(l[a]=e[a])}if(t=t.defaultProps){l===e&&(l=q({},l));for(var n in t)l[n]===void 0&&(l[n]=t[n])}return l}var ru=typeof reportError=="function"?reportError:function(t){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var e=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof t=="object"&&t!==null&&typeof t.message=="string"?String(t.message):String(t),error:t});if(!window.dispatchEvent(e))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",t);return}console.error(t)};function Do(t){ru(t)}function Uo(t){console.error(t)}function Oo(t){ru(t)}function su(t,e){try{var l=t.onUncaughtError;l(e.value,{componentStack:e.stack})}catch(a){setTimeout(function(){throw a})}}function _o(t,e,l){try{var a=t.onCaughtError;a(l.value,{componentStack:l.stack,errorBoundary:e.tag===1?e.stateNode:null})}catch(n){setTimeout(function(){throw n})}}function oc(t,e,l){return l=Fe(l),l.tag=3,l.payload={element:null},l.callback=function(){su(t,e)},l}function qo(t){return t=Fe(t),t.tag=3,t}function Ro(t,e,l,a){var n=l.type.getDerivedStateFromError;if(typeof n=="function"){var u=a.value;t.payload=function(){return n(u)},t.callback=function(){_o(e,l,a)}}var c=l.stateNode;c!==null&&typeof c.componentDidCatch=="function"&&(t.callback=function(){_o(e,l,a),typeof n!="function"&&(cl===null?cl=new Set([this]):cl.add(this));var r=a.stack;this.componentDidCatch(a.value,{componentStack:r!==null?r:""})})}function mh(t,e,l,a,n){if(l.flags|=32768,a!==null&&typeof a=="object"&&typeof a.then=="function"){if(e=l.alternate,e!==null&&La(e,l,n,!0),l=de.current,l!==null){switch(l.tag){case 13:return ze===null?Cc():l.alternate===null&&xt===0&&(xt=3),l.flags&=-257,l.flags|=65536,l.lanes=n,a===Li?l.flags|=16384:(e=l.updateQueue,e===null?l.updateQueue=new Set([a]):e.add(a),Hc(t,a,n)),!1;case 22:return l.flags|=65536,a===Li?l.flags|=16384:(e=l.updateQueue,e===null?(e={transitions:null,markerInstances:null,retryQueue:new Set([a])},l.updateQueue=e):(l=e.retryQueue,l===null?e.retryQueue=new Set([a]):l.add(a)),Hc(t,a,n)),!1}throw Error(s(435,l.tag))}return Hc(t,a,n),Cc(),!1}if(it)return e=de.current,e!==null?((e.flags&65536)===0&&(e.flags|=256),e.flags|=65536,e.lanes=n,a!==qi&&(t=Error(s(422),{cause:a}),Ba(re(t,l)))):(a!==qi&&(e=Error(s(423),{cause:a}),Ba(re(e,l))),t=t.current.alternate,t.flags|=65536,n&=-n,t.lanes|=n,a=re(a,l),n=oc(t.stateNode,a,n),Yi(t,n),xt!==4&&(xt=2)),!1;var u=Error(s(520),{cause:a});if(u=re(u,l),un===null?un=[u]:un.push(u),xt!==4&&(xt=2),e===null)return!0;a=re(a,l),l=e;do{switch(l.tag){case 3:return l.flags|=65536,t=n&-n,l.lanes|=t,t=oc(l.stateNode,a,t),Yi(l,t),!1;case 1:if(e=l.type,u=l.stateNode,(l.flags&128)===0&&(typeof e.getDerivedStateFromError=="function"||u!==null&&typeof u.componentDidCatch=="function"&&(cl===null||!cl.has(u))))return l.flags|=65536,n&=-n,l.lanes|=n,n=qo(n),Ro(n,t,l,a),Yi(l,n),!1}l=l.return}while(l!==null);return!1}var Co=Error(s(461)),qt=!1;function Ht(t,e,l,a){e.child=t===null?To(e,null,l,a):ra(e,t.child,l,a)}function wo(t,e,l,a,n){l=l.render;var u=e.ref;if("ref"in a){var c={};for(var r in a)r!=="ref"&&(c[r]=a[r])}else c=a;return Ul(e),a=Ki(t,e,l,c,u,n),r=ki(),t!==null&&!qt?(Ji(t,e,n),Be(t,e,n)):(it&&r&&Oi(e),e.flags|=1,Ht(t,e,a,n),e.child)}function Ho(t,e,l,a,n){if(t===null){var u=l.type;return typeof u=="function"&&!Mi(u)&&u.defaultProps===void 0&&l.compare===null?(e.tag=15,e.type=u,No(t,e,u,a,n)):(t=Yn(l.type,null,a,e,e.mode,n),t.ref=e.ref,t.return=e,e.child=t)}if(u=t.child,!vc(t,n)){var c=u.memoizedProps;if(l=l.compare,l=l!==null?l:Ca,l(c,a)&&t.ref===e.ref)return Be(t,e,n)}return e.flags|=1,t=_e(u,a),t.ref=e.ref,t.return=e,e.child=t}function No(t,e,l,a,n){if(t!==null){var u=t.memoizedProps;if(Ca(u,a)&&t.ref===e.ref)if(qt=!1,e.pendingProps=a=u,vc(t,n))(t.flags&131072)!==0&&(qt=!0);else return e.lanes=t.lanes,Be(t,e,n)}return fc(t,e,l,a,n)}function Bo(t,e,l){var a=e.pendingProps,n=a.children,u=t!==null?t.memoizedState:null;if(a.mode==="hidden"){if((e.flags&128)!==0){if(a=u!==null?u.baseLanes|l:l,t!==null){for(n=e.child=t.child,u=0;n!==null;)u=u|n.lanes|n.childLanes,n=n.sibling;e.childLanes=u&~a}else e.childLanes=0,e.child=null;return Lo(t,e,a,l)}if((l&536870912)!==0)e.memoizedState={baseLanes:0,cachePool:null},t!==null&&Kn(e,u!==null?u.cachePool:null),u!==null?Hs(e,u):Xi(),jo(e);else return e.lanes=e.childLanes=536870912,Lo(t,e,u!==null?u.baseLanes|l:l,l)}else u!==null?(Kn(e,u.cachePool),Hs(e,u),el(),e.memoizedState=null):(t!==null&&Kn(e,null),Xi(),el());return Ht(t,e,n,l),e.child}function Lo(t,e,l,a){var n=Bi();return n=n===null?null:{parent:Mt._currentValue,pool:n},e.memoizedState={baseLanes:l,cachePool:n},t!==null&&Kn(e,null),Xi(),jo(e),t!==null&&La(t,e,a,!0),null}function ou(t,e){var l=e.ref;if(l===null)t!==null&&t.ref!==null&&(e.flags|=4194816);else{if(typeof l!="function"&&typeof l!="object")throw Error(s(284));(t===null||t.ref!==l)&&(e.flags|=4194816)}}function fc(t,e,l,a,n){return Ul(e),l=Ki(t,e,l,a,void 0,n),a=ki(),t!==null&&!qt?(Ji(t,e,n),Be(t,e,n)):(it&&a&&Oi(e),e.flags|=1,Ht(t,e,l,n),e.child)}function Qo(t,e,l,a,n,u){return Ul(e),e.updateQueue=null,l=Bs(e,a,l,n),Ns(t),a=ki(),t!==null&&!qt?(Ji(t,e,u),Be(t,e,u)):(it&&a&&Oi(e),e.flags|=1,Ht(t,e,l,u),e.child)}function Go(t,e,l,a,n){if(Ul(e),e.stateNode===null){var u=Il,c=l.contextType;typeof c=="object"&&c!==null&&(u=Qt(c)),u=new l(a,u),e.memoizedState=u.state!==null&&u.state!==void 0?u.state:null,u.updater=sc,e.stateNode=u,u._reactInternals=e,u=e.stateNode,u.props=a,u.state=e.memoizedState,u.refs={},Qi(e),c=l.contextType,u.context=typeof c=="object"&&c!==null?Qt(c):Il,u.state=e.memoizedState,c=l.getDerivedStateFromProps,typeof c=="function"&&(rc(e,l,c,a),u.state=e.memoizedState),typeof l.getDerivedStateFromProps=="function"||typeof u.getSnapshotBeforeUpdate=="function"||typeof u.UNSAFE_componentWillMount!="function"&&typeof u.componentWillMount!="function"||(c=u.state,typeof u.componentWillMount=="function"&&u.componentWillMount(),typeof u.UNSAFE_componentWillMount=="function"&&u.UNSAFE_componentWillMount(),c!==u.state&&sc.enqueueReplaceState(u,u.state,null),Va(e,a,u,n),Za(),u.state=e.memoizedState),typeof u.componentDidMount=="function"&&(e.flags|=4194308),a=!0}else if(t===null){u=e.stateNode;var r=e.memoizedProps,d=ql(l,r);u.props=d;var b=u.context,z=l.contextType;c=Il,typeof z=="object"&&z!==null&&(c=Qt(z));var E=l.getDerivedStateFromProps;z=typeof E=="function"||typeof u.getSnapshotBeforeUpdate=="function",r=e.pendingProps!==r,z||typeof u.UNSAFE_componentWillReceiveProps!="function"&&typeof u.componentWillReceiveProps!="function"||(r||b!==c)&&Mo(e,u,a,c),We=!1;var v=e.memoizedState;u.state=v,Va(e,a,u,n),Za(),b=e.memoizedState,r||v!==b||We?(typeof E=="function"&&(rc(e,l,E,a),b=e.memoizedState),(d=We||Eo(e,l,d,a,v,b,c))?(z||typeof u.UNSAFE_componentWillMount!="function"&&typeof u.componentWillMount!="function"||(typeof u.componentWillMount=="function"&&u.componentWillMount(),typeof u.UNSAFE_componentWillMount=="function"&&u.UNSAFE_componentWillMount()),typeof u.componentDidMount=="function"&&(e.flags|=4194308)):(typeof u.componentDidMount=="function"&&(e.flags|=4194308),e.memoizedProps=a,e.memoizedState=b),u.props=a,u.state=b,u.context=c,a=d):(typeof u.componentDidMount=="function"&&(e.flags|=4194308),a=!1)}else{u=e.stateNode,Gi(t,e),c=e.memoizedProps,z=ql(l,c),u.props=z,E=e.pendingProps,v=u.context,b=l.contextType,d=Il,typeof b=="object"&&b!==null&&(d=Qt(b)),r=l.getDerivedStateFromProps,(b=typeof r=="function"||typeof u.getSnapshotBeforeUpdate=="function")||typeof u.UNSAFE_componentWillReceiveProps!="function"&&typeof u.componentWillReceiveProps!="function"||(c!==E||v!==d)&&Mo(e,u,a,d),We=!1,v=e.memoizedState,u.state=v,Va(e,a,u,n),Za();var p=e.memoizedState;c!==E||v!==p||We||t!==null&&t.dependencies!==null&&Zn(t.dependencies)?(typeof r=="function"&&(rc(e,l,r,a),p=e.memoizedState),(z=We||Eo(e,l,z,a,v,p,d)||t!==null&&t.dependencies!==null&&Zn(t.dependencies))?(b||typeof u.UNSAFE_componentWillUpdate!="function"&&typeof u.componentWillUpdate!="function"||(typeof u.componentWillUpdate=="function"&&u.componentWillUpdate(a,p,d),typeof u.UNSAFE_componentWillUpdate=="function"&&u.UNSAFE_componentWillUpdate(a,p,d)),typeof u.componentDidUpdate=="function"&&(e.flags|=4),typeof u.getSnapshotBeforeUpdate=="function"&&(e.flags|=1024)):(typeof u.componentDidUpdate!="function"||c===t.memoizedProps&&v===t.memoizedState||(e.flags|=4),typeof u.getSnapshotBeforeUpdate!="function"||c===t.memoizedProps&&v===t.memoizedState||(e.flags|=1024),e.memoizedProps=a,e.memoizedState=p),u.props=a,u.state=p,u.context=d,a=z):(typeof u.componentDidUpdate!="function"||c===t.memoizedProps&&v===t.memoizedState||(e.flags|=4),typeof u.getSnapshotBeforeUpdate!="function"||c===t.memoizedProps&&v===t.memoizedState||(e.flags|=1024),a=!1)}return u=a,ou(t,e),a=(e.flags&128)!==0,u||a?(u=e.stateNode,l=a&&typeof l.getDerivedStateFromError!="function"?null:u.render(),e.flags|=1,t!==null&&a?(e.child=ra(e,t.child,null,n),e.child=ra(e,null,l,n)):Ht(t,e,l,n),e.memoizedState=u.state,t=e.child):t=Be(t,e,n),t}function Yo(t,e,l,a){return Na(),e.flags|=256,Ht(t,e,l,a),e.child}var dc={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function mc(t){return{baseLanes:t,cachePool:Ds()}}function hc(t,e,l){return t=t!==null?t.childLanes&~l:0,e&&(t|=me),t}function $o(t,e,l){var a=e.pendingProps,n=!1,u=(e.flags&128)!==0,c;if((c=u)||(c=t!==null&&t.memoizedState===null?!1:(Dt.current&2)!==0),c&&(n=!0,e.flags&=-129),c=(e.flags&32)!==0,e.flags&=-33,t===null){if(it){if(n?tl(e):el(),it){var r=pt,d;if(d=r){t:{for(d=r,r=Se;d.nodeType!==8;){if(!r){r=null;break t}if(d=be(d.nextSibling),d===null){r=null;break t}}r=d}r!==null?(e.memoizedState={dehydrated:r,treeContext:Tl!==null?{id:qe,overflow:Re}:null,retryLane:536870912,hydrationErrors:null},d=te(18,null,null,0),d.stateNode=r,d.return=e,e.child=d,Zt=e,pt=null,d=!0):d=!1}d||Ml(e)}if(r=e.memoizedState,r!==null&&(r=r.dehydrated,r!==null))return Fc(r)?e.lanes=32:e.lanes=536870912,null;Ne(e)}return r=a.children,a=a.fallback,n?(el(),n=e.mode,r=fu({mode:"hidden",children:r},n),a=Al(a,n,l,null),r.return=e,a.return=e,r.sibling=a,e.child=r,n=e.child,n.memoizedState=mc(l),n.childLanes=hc(t,c,l),e.memoizedState=dc,a):(tl(e),gc(e,r))}if(d=t.memoizedState,d!==null&&(r=d.dehydrated,r!==null)){if(u)e.flags&256?(tl(e),e.flags&=-257,e=yc(t,e,l)):e.memoizedState!==null?(el(),e.child=t.child,e.flags|=128,e=null):(el(),n=a.fallback,r=e.mode,a=fu({mode:"visible",children:a.children},r),n=Al(n,r,l,null),n.flags|=2,a.return=e,n.return=e,a.sibling=n,e.child=a,ra(e,t.child,null,l),a=e.child,a.memoizedState=mc(l),a.childLanes=hc(t,c,l),e.memoizedState=dc,e=n);else if(tl(e),Fc(r)){if(c=r.nextSibling&&r.nextSibling.dataset,c)var b=c.dgst;c=b,a=Error(s(419)),a.stack="",a.digest=c,Ba({value:a,source:null,stack:null}),e=yc(t,e,l)}else if(qt||La(t,e,l,!1),c=(l&t.childLanes)!==0,qt||c){if(c=ht,c!==null&&(a=l&-l,a=(a&42)!==0?1:Iu(a),a=(a&(c.suspendedLanes|l))!==0?0:a,a!==0&&a!==d.retryLane))throw d.retryLane=a,Fl(t,a),ue(c,t,a),Co;r.data==="$?"||Cc(),e=yc(t,e,l)}else r.data==="$?"?(e.flags|=192,e.child=t.child,e=null):(t=d.treeContext,pt=be(r.nextSibling),Zt=e,it=!0,El=null,Se=!1,t!==null&&(oe[fe++]=qe,oe[fe++]=Re,oe[fe++]=Tl,qe=t.id,Re=t.overflow,Tl=e),e=gc(e,a.children),e.flags|=4096);return e}return n?(el(),n=a.fallback,r=e.mode,d=t.child,b=d.sibling,a=_e(d,{mode:"hidden",children:a.children}),a.subtreeFlags=d.subtreeFlags&65011712,b!==null?n=_e(b,n):(n=Al(n,r,l,null),n.flags|=2),n.return=e,a.return=e,a.sibling=n,e.child=a,a=n,n=e.child,r=t.child.memoizedState,r===null?r=mc(l):(d=r.cachePool,d!==null?(b=Mt._currentValue,d=d.parent!==b?{parent:b,pool:b}:d):d=Ds(),r={baseLanes:r.baseLanes|l,cachePool:d}),n.memoizedState=r,n.childLanes=hc(t,c,l),e.memoizedState=dc,a):(tl(e),l=t.child,t=l.sibling,l=_e(l,{mode:"visible",children:a.children}),l.return=e,l.sibling=null,t!==null&&(c=e.deletions,c===null?(e.deletions=[t],e.flags|=16):c.push(t)),e.child=l,e.memoizedState=null,l)}function gc(t,e){return e=fu({mode:"visible",children:e},t.mode),e.return=t,t.child=e}function fu(t,e){return t=te(22,t,null,e),t.lanes=0,t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null},t}function yc(t,e,l){return ra(e,t.child,null,l),t=gc(e,e.pendingProps.children),t.flags|=2,e.memoizedState=null,t}function Xo(t,e,l){t.lanes|=e;var a=t.alternate;a!==null&&(a.lanes|=e),Ci(t.return,e,l)}function bc(t,e,l,a,n){var u=t.memoizedState;u===null?t.memoizedState={isBackwards:e,rendering:null,renderingStartTime:0,last:a,tail:l,tailMode:n}:(u.isBackwards=e,u.rendering=null,u.renderingStartTime=0,u.last=a,u.tail=l,u.tailMode=n)}function Zo(t,e,l){var a=e.pendingProps,n=a.revealOrder,u=a.tail;if(Ht(t,e,a.children,l),a=Dt.current,(a&2)!==0)a=a&1|2,e.flags|=128;else{if(t!==null&&(t.flags&128)!==0)t:for(t=e.child;t!==null;){if(t.tag===13)t.memoizedState!==null&&Xo(t,l,e);else if(t.tag===19)Xo(t,l,e);else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break t;for(;t.sibling===null;){if(t.return===null||t.return===e)break t;t=t.return}t.sibling.return=t.return,t=t.sibling}a&=1}switch(st(Dt,a),n){case"forwards":for(l=e.child,n=null;l!==null;)t=l.alternate,t!==null&&cu(t)===null&&(n=l),l=l.sibling;l=n,l===null?(n=e.child,e.child=null):(n=l.sibling,l.sibling=null),bc(e,!1,n,l,u);break;case"backwards":for(l=null,n=e.child,e.child=null;n!==null;){if(t=n.alternate,t!==null&&cu(t)===null){e.child=n;break}t=n.sibling,n.sibling=l,l=n,n=t}bc(e,!0,l,null,u);break;case"together":bc(e,!1,null,null,void 0);break;default:e.memoizedState=null}return e.child}function Be(t,e,l){if(t!==null&&(e.dependencies=t.dependencies),il|=e.lanes,(l&e.childLanes)===0)if(t!==null){if(La(t,e,l,!1),(l&e.childLanes)===0)return null}else return null;if(t!==null&&e.child!==t.child)throw Error(s(153));if(e.child!==null){for(t=e.child,l=_e(t,t.pendingProps),e.child=l,l.return=e;t.sibling!==null;)t=t.sibling,l=l.sibling=_e(t,t.pendingProps),l.return=e;l.sibling=null}return e.child}function vc(t,e){return(t.lanes&e)!==0?!0:(t=t.dependencies,!!(t!==null&&Zn(t)))}function hh(t,e,l){switch(e.tag){case 3:zn(e,e.stateNode.containerInfo),Je(e,Mt,t.memoizedState.cache),Na();break;case 27:case 5:Ku(e);break;case 4:zn(e,e.stateNode.containerInfo);break;case 10:Je(e,e.type,e.memoizedProps.value);break;case 13:var a=e.memoizedState;if(a!==null)return a.dehydrated!==null?(tl(e),e.flags|=128,null):(l&e.child.childLanes)!==0?$o(t,e,l):(tl(e),t=Be(t,e,l),t!==null?t.sibling:null);tl(e);break;case 19:var n=(t.flags&128)!==0;if(a=(l&e.childLanes)!==0,a||(La(t,e,l,!1),a=(l&e.childLanes)!==0),n){if(a)return Zo(t,e,l);e.flags|=128}if(n=e.memoizedState,n!==null&&(n.rendering=null,n.tail=null,n.lastEffect=null),st(Dt,Dt.current),a)break;return null;case 22:case 23:return e.lanes=0,Bo(t,e,l);case 24:Je(e,Mt,t.memoizedState.cache)}return Be(t,e,l)}function Vo(t,e,l){if(t!==null)if(t.memoizedProps!==e.pendingProps)qt=!0;else{if(!vc(t,l)&&(e.flags&128)===0)return qt=!1,hh(t,e,l);qt=(t.flags&131072)!==0}else qt=!1,it&&(e.flags&1048576)!==0&&Ss(e,Xn,e.index);switch(e.lanes=0,e.tag){case 16:t:{t=e.pendingProps;var a=e.elementType,n=a._init;if(a=n(a._payload),e.type=a,typeof a=="function")Mi(a)?(t=ql(a,t),e.tag=1,e=Go(null,e,a,t,l)):(e.tag=0,e=fc(null,e,a,t,l));else{if(a!=null){if(n=a.$$typeof,n===k){e.tag=11,e=wo(null,e,a,t,l);break t}else if(n===V){e.tag=14,e=Ho(null,e,a,t,l);break t}}throw e=De(a)||a,Error(s(306,e,""))}}return e;case 0:return fc(t,e,e.type,e.pendingProps,l);case 1:return a=e.type,n=ql(a,e.pendingProps),Go(t,e,a,n,l);case 3:t:{if(zn(e,e.stateNode.containerInfo),t===null)throw Error(s(387));a=e.pendingProps;var u=e.memoizedState;n=u.element,Gi(t,e),Va(e,a,null,l);var c=e.memoizedState;if(a=c.cache,Je(e,Mt,a),a!==u.cache&&wi(e,[Mt],l,!0),Za(),a=c.element,u.isDehydrated)if(u={element:a,isDehydrated:!1,cache:c.cache},e.updateQueue.baseState=u,e.memoizedState=u,e.flags&256){e=Yo(t,e,a,l);break t}else if(a!==n){n=re(Error(s(424)),e),Ba(n),e=Yo(t,e,a,l);break t}else{switch(t=e.stateNode.containerInfo,t.nodeType){case 9:t=t.body;break;default:t=t.nodeName==="HTML"?t.ownerDocument.body:t}for(pt=be(t.firstChild),Zt=e,it=!0,El=null,Se=!0,l=To(e,null,a,l),e.child=l;l;)l.flags=l.flags&-3|4096,l=l.sibling}else{if(Na(),a===n){e=Be(t,e,l);break t}Ht(t,e,a,l)}e=e.child}return e;case 26:return ou(t,e),t===null?(l=Ff(e.type,null,e.pendingProps,null))?e.memoizedState=l:it||(l=e.type,t=e.pendingProps,a=ju(Ze.current).createElement(l),a[Lt]=e,a[Vt]=t,Bt(a,l,t),_t(a),e.stateNode=a):e.memoizedState=Ff(e.type,t.memoizedProps,e.pendingProps,t.memoizedState),null;case 27:return Ku(e),t===null&&it&&(a=e.stateNode=kf(e.type,e.pendingProps,Ze.current),Zt=e,Se=!0,n=pt,ol(e.type)?(Ic=n,pt=be(a.firstChild)):pt=n),Ht(t,e,e.pendingProps.children,l),ou(t,e),t===null&&(e.flags|=4194304),e.child;case 5:return t===null&&it&&((n=a=pt)&&(a=Yh(a,e.type,e.pendingProps,Se),a!==null?(e.stateNode=a,Zt=e,pt=be(a.firstChild),Se=!1,n=!0):n=!1),n||Ml(e)),Ku(e),n=e.type,u=e.pendingProps,c=t!==null?t.memoizedProps:null,a=u.children,kc(n,u)?a=null:c!==null&&kc(n,c)&&(e.flags|=32),e.memoizedState!==null&&(n=Ki(t,e,ih,null,null,l),gn._currentValue=n),ou(t,e),Ht(t,e,a,l),e.child;case 6:return t===null&&it&&((t=l=pt)&&(l=$h(l,e.pendingProps,Se),l!==null?(e.stateNode=l,Zt=e,pt=null,t=!0):t=!1),t||Ml(e)),null;case 13:return $o(t,e,l);case 4:return zn(e,e.stateNode.containerInfo),a=e.pendingProps,t===null?e.child=ra(e,null,a,l):Ht(t,e,a,l),e.child;case 11:return wo(t,e,e.type,e.pendingProps,l);case 7:return Ht(t,e,e.pendingProps,l),e.child;case 8:return Ht(t,e,e.pendingProps.children,l),e.child;case 12:return Ht(t,e,e.pendingProps.children,l),e.child;case 10:return a=e.pendingProps,Je(e,e.type,a.value),Ht(t,e,a.children,l),e.child;case 9:return n=e.type._context,a=e.pendingProps.children,Ul(e),n=Qt(n),a=a(n),e.flags|=1,Ht(t,e,a,l),e.child;case 14:return Ho(t,e,e.type,e.pendingProps,l);case 15:return No(t,e,e.type,e.pendingProps,l);case 19:return Zo(t,e,l);case 31:return a=e.pendingProps,l=e.mode,a={mode:a.mode,children:a.children},t===null?(l=fu(a,l),l.ref=e.ref,e.child=l,l.return=e,e=l):(l=_e(t.child,a),l.ref=e.ref,e.child=l,l.return=e,e=l),e;case 22:return Bo(t,e,l);case 24:return Ul(e),a=Qt(Mt),t===null?(n=Bi(),n===null&&(n=ht,u=Hi(),n.pooledCache=u,u.refCount++,u!==null&&(n.pooledCacheLanes|=l),n=u),e.memoizedState={parent:a,cache:n},Qi(e),Je(e,Mt,n)):((t.lanes&l)!==0&&(Gi(t,e),Va(e,null,null,l),Za()),n=t.memoizedState,u=e.memoizedState,n.parent!==a?(n={parent:a,cache:a},e.memoizedState=n,e.lanes===0&&(e.memoizedState=e.updateQueue.baseState=n),Je(e,Mt,a)):(a=u.cache,Je(e,Mt,a),a!==n.cache&&wi(e,[Mt],l,!0))),Ht(t,e,e.pendingProps.children,l),e.child;case 29:throw e.pendingProps}throw Error(s(156,e.tag))}function Le(t){t.flags|=4}function Ko(t,e){if(e.type!=="stylesheet"||(e.state.loading&4)!==0)t.flags&=-16777217;else if(t.flags|=16777216,!ld(e)){if(e=de.current,e!==null&&((nt&4194048)===nt?ze!==null:(nt&62914560)!==nt&&(nt&536870912)===0||e!==ze))throw $a=Li,Us;t.flags|=8192}}function du(t,e){e!==null&&(t.flags|=4),t.flags&16384&&(e=t.tag!==22?Tr():536870912,t.lanes|=e,da|=e)}function Pa(t,e){if(!it)switch(t.tailMode){case"hidden":e=t.tail;for(var l=null;e!==null;)e.alternate!==null&&(l=e),e=e.sibling;l===null?t.tail=null:l.sibling=null;break;case"collapsed":l=t.tail;for(var a=null;l!==null;)l.alternate!==null&&(a=l),l=l.sibling;a===null?e||t.tail===null?t.tail=null:t.tail.sibling=null:a.sibling=null}}function vt(t){var e=t.alternate!==null&&t.alternate.child===t.child,l=0,a=0;if(e)for(var n=t.child;n!==null;)l|=n.lanes|n.childLanes,a|=n.subtreeFlags&65011712,a|=n.flags&65011712,n.return=t,n=n.sibling;else for(n=t.child;n!==null;)l|=n.lanes|n.childLanes,a|=n.subtreeFlags,a|=n.flags,n.return=t,n=n.sibling;return t.subtreeFlags|=a,t.childLanes=l,e}function gh(t,e,l){var a=e.pendingProps;switch(_i(e),e.tag){case 31:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return vt(e),null;case 1:return vt(e),null;case 3:return l=e.stateNode,a=null,t!==null&&(a=t.memoizedState.cache),e.memoizedState.cache!==a&&(e.flags|=2048),we(Mt),Hl(),l.pendingContext&&(l.context=l.pendingContext,l.pendingContext=null),(t===null||t.child===null)&&(Ha(e)?Le(e):t===null||t.memoizedState.isDehydrated&&(e.flags&256)===0||(e.flags|=1024,Ts())),vt(e),null;case 26:return l=e.memoizedState,t===null?(Le(e),l!==null?(vt(e),Ko(e,l)):(vt(e),e.flags&=-16777217)):l?l!==t.memoizedState?(Le(e),vt(e),Ko(e,l)):(vt(e),e.flags&=-16777217):(t.memoizedProps!==a&&Le(e),vt(e),e.flags&=-16777217),null;case 27:An(e),l=Ze.current;var n=e.type;if(t!==null&&e.stateNode!=null)t.memoizedProps!==a&&Le(e);else{if(!a){if(e.stateNode===null)throw Error(s(166));return vt(e),null}t=Ot.current,Ha(e)?zs(e):(t=kf(n,a,l),e.stateNode=t,Le(e))}return vt(e),null;case 5:if(An(e),l=e.type,t!==null&&e.stateNode!=null)t.memoizedProps!==a&&Le(e);else{if(!a){if(e.stateNode===null)throw Error(s(166));return vt(e),null}if(t=Ot.current,Ha(e))zs(e);else{switch(n=ju(Ze.current),t){case 1:t=n.createElementNS("http://www.w3.org/2000/svg",l);break;case 2:t=n.createElementNS("http://www.w3.org/1998/Math/MathML",l);break;default:switch(l){case"svg":t=n.createElementNS("http://www.w3.org/2000/svg",l);break;case"math":t=n.createElementNS("http://www.w3.org/1998/Math/MathML",l);break;case"script":t=n.createElement("div"),t.innerHTML="<script><\/script>",t=t.removeChild(t.firstChild);break;case"select":t=typeof a.is=="string"?n.createElement("select",{is:a.is}):n.createElement("select"),a.multiple?t.multiple=!0:a.size&&(t.size=a.size);break;default:t=typeof a.is=="string"?n.createElement(l,{is:a.is}):n.createElement(l)}}t[Lt]=e,t[Vt]=a;t:for(n=e.child;n!==null;){if(n.tag===5||n.tag===6)t.appendChild(n.stateNode);else if(n.tag!==4&&n.tag!==27&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===e)break t;for(;n.sibling===null;){if(n.return===null||n.return===e)break t;n=n.return}n.sibling.return=n.return,n=n.sibling}e.stateNode=t;t:switch(Bt(t,l,a),l){case"button":case"input":case"select":case"textarea":t=!!a.autoFocus;break t;case"img":t=!0;break t;default:t=!1}t&&Le(e)}}return vt(e),e.flags&=-16777217,null;case 6:if(t&&e.stateNode!=null)t.memoizedProps!==a&&Le(e);else{if(typeof a!="string"&&e.stateNode===null)throw Error(s(166));if(t=Ze.current,Ha(e)){if(t=e.stateNode,l=e.memoizedProps,a=null,n=Zt,n!==null)switch(n.tag){case 27:case 5:a=n.memoizedProps}t[Lt]=e,t=!!(t.nodeValue===l||a!==null&&a.suppressHydrationWarning===!0||Gf(t.nodeValue,l)),t||Ml(e)}else t=ju(t).createTextNode(a),t[Lt]=e,e.stateNode=t}return vt(e),null;case 13:if(a=e.memoizedState,t===null||t.memoizedState!==null&&t.memoizedState.dehydrated!==null){if(n=Ha(e),a!==null&&a.dehydrated!==null){if(t===null){if(!n)throw Error(s(318));if(n=e.memoizedState,n=n!==null?n.dehydrated:null,!n)throw Error(s(317));n[Lt]=e}else Na(),(e.flags&128)===0&&(e.memoizedState=null),e.flags|=4;vt(e),n=!1}else n=Ts(),t!==null&&t.memoizedState!==null&&(t.memoizedState.hydrationErrors=n),n=!0;if(!n)return e.flags&256?(Ne(e),e):(Ne(e),null)}if(Ne(e),(e.flags&128)!==0)return e.lanes=l,e;if(l=a!==null,t=t!==null&&t.memoizedState!==null,l){a=e.child,n=null,a.alternate!==null&&a.alternate.memoizedState!==null&&a.alternate.memoizedState.cachePool!==null&&(n=a.alternate.memoizedState.cachePool.pool);var u=null;a.memoizedState!==null&&a.memoizedState.cachePool!==null&&(u=a.memoizedState.cachePool.pool),u!==n&&(a.flags|=2048)}return l!==t&&l&&(e.child.flags|=8192),du(e,e.updateQueue),vt(e),null;case 4:return Hl(),t===null&&$c(e.stateNode.containerInfo),vt(e),null;case 10:return we(e.type),vt(e),null;case 19:if(bt(Dt),n=e.memoizedState,n===null)return vt(e),null;if(a=(e.flags&128)!==0,u=n.rendering,u===null)if(a)Pa(n,!1);else{if(xt!==0||t!==null&&(t.flags&128)!==0)for(t=e.child;t!==null;){if(u=cu(t),u!==null){for(e.flags|=128,Pa(n,!1),t=u.updateQueue,e.updateQueue=t,du(e,t),e.subtreeFlags=0,t=l,l=e.child;l!==null;)xs(l,t),l=l.sibling;return st(Dt,Dt.current&1|2),e.child}t=t.sibling}n.tail!==null&&xe()>gu&&(e.flags|=128,a=!0,Pa(n,!1),e.lanes=4194304)}else{if(!a)if(t=cu(u),t!==null){if(e.flags|=128,a=!0,t=t.updateQueue,e.updateQueue=t,du(e,t),Pa(n,!0),n.tail===null&&n.tailMode==="hidden"&&!u.alternate&&!it)return vt(e),null}else 2*xe()-n.renderingStartTime>gu&&l!==536870912&&(e.flags|=128,a=!0,Pa(n,!1),e.lanes=4194304);n.isBackwards?(u.sibling=e.child,e.child=u):(t=n.last,t!==null?t.sibling=u:e.child=u,n.last=u)}return n.tail!==null?(e=n.tail,n.rendering=e,n.tail=e.sibling,n.renderingStartTime=xe(),e.sibling=null,t=Dt.current,st(Dt,a?t&1|2:t&1),e):(vt(e),null);case 22:case 23:return Ne(e),Zi(),a=e.memoizedState!==null,t!==null?t.memoizedState!==null!==a&&(e.flags|=8192):a&&(e.flags|=8192),a?(l&536870912)!==0&&(e.flags&128)===0&&(vt(e),e.subtreeFlags&6&&(e.flags|=8192)):vt(e),l=e.updateQueue,l!==null&&du(e,l.retryQueue),l=null,t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(l=t.memoizedState.cachePool.pool),a=null,e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(a=e.memoizedState.cachePool.pool),a!==l&&(e.flags|=2048),t!==null&&bt(Ol),null;case 24:return l=null,t!==null&&(l=t.memoizedState.cache),e.memoizedState.cache!==l&&(e.flags|=2048),we(Mt),vt(e),null;case 25:return null;case 30:return null}throw Error(s(156,e.tag))}function yh(t,e){switch(_i(e),e.tag){case 1:return t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 3:return we(Mt),Hl(),t=e.flags,(t&65536)!==0&&(t&128)===0?(e.flags=t&-65537|128,e):null;case 26:case 27:case 5:return An(e),null;case 13:if(Ne(e),t=e.memoizedState,t!==null&&t.dehydrated!==null){if(e.alternate===null)throw Error(s(340));Na()}return t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 19:return bt(Dt),null;case 4:return Hl(),null;case 10:return we(e.type),null;case 22:case 23:return Ne(e),Zi(),t!==null&&bt(Ol),t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 24:return we(Mt),null;case 25:return null;default:return null}}function ko(t,e){switch(_i(e),e.tag){case 3:we(Mt),Hl();break;case 26:case 27:case 5:An(e);break;case 4:Hl();break;case 13:Ne(e);break;case 19:bt(Dt);break;case 10:we(e.type);break;case 22:case 23:Ne(e),Zi(),t!==null&&bt(Ol);break;case 24:we(Mt)}}function tn(t,e){try{var l=e.updateQueue,a=l!==null?l.lastEffect:null;if(a!==null){var n=a.next;l=n;do{if((l.tag&t)===t){a=void 0;var u=l.create,c=l.inst;a=u(),c.destroy=a}l=l.next}while(l!==n)}}catch(r){mt(e,e.return,r)}}function ll(t,e,l){try{var a=e.updateQueue,n=a!==null?a.lastEffect:null;if(n!==null){var u=n.next;a=u;do{if((a.tag&t)===t){var c=a.inst,r=c.destroy;if(r!==void 0){c.destroy=void 0,n=e;var d=l,b=r;try{b()}catch(z){mt(n,d,z)}}}a=a.next}while(a!==u)}}catch(z){mt(e,e.return,z)}}function Jo(t){var e=t.updateQueue;if(e!==null){var l=t.stateNode;try{ws(e,l)}catch(a){mt(t,t.return,a)}}}function Wo(t,e,l){l.props=ql(t.type,t.memoizedProps),l.state=t.memoizedState;try{l.componentWillUnmount()}catch(a){mt(t,e,a)}}function en(t,e){try{var l=t.ref;if(l!==null){switch(t.tag){case 26:case 27:case 5:var a=t.stateNode;break;case 30:a=t.stateNode;break;default:a=t.stateNode}typeof l=="function"?t.refCleanup=l(a):l.current=a}}catch(n){mt(t,e,n)}}function Ae(t,e){var l=t.ref,a=t.refCleanup;if(l!==null)if(typeof a=="function")try{a()}catch(n){mt(t,e,n)}finally{t.refCleanup=null,t=t.alternate,t!=null&&(t.refCleanup=null)}else if(typeof l=="function")try{l(null)}catch(n){mt(t,e,n)}else l.current=null}function Fo(t){var e=t.type,l=t.memoizedProps,a=t.stateNode;try{t:switch(e){case"button":case"input":case"select":case"textarea":l.autoFocus&&a.focus();break t;case"img":l.src?a.src=l.src:l.srcSet&&(a.srcset=l.srcSet)}}catch(n){mt(t,t.return,n)}}function pc(t,e,l){try{var a=t.stateNode;Nh(a,t.type,l,e),a[Vt]=e}catch(n){mt(t,t.return,n)}}function Io(t){return t.tag===5||t.tag===3||t.tag===26||t.tag===27&&ol(t.type)||t.tag===4}function xc(t){t:for(;;){for(;t.sibling===null;){if(t.return===null||Io(t.return))return null;t=t.return}for(t.sibling.return=t.return,t=t.sibling;t.tag!==5&&t.tag!==6&&t.tag!==18;){if(t.tag===27&&ol(t.type)||t.flags&2||t.child===null||t.tag===4)continue t;t.child.return=t,t=t.child}if(!(t.flags&2))return t.stateNode}}function Sc(t,e,l){var a=t.tag;if(a===5||a===6)t=t.stateNode,e?(l.nodeType===9?l.body:l.nodeName==="HTML"?l.ownerDocument.body:l).insertBefore(t,e):(e=l.nodeType===9?l.body:l.nodeName==="HTML"?l.ownerDocument.body:l,e.appendChild(t),l=l._reactRootContainer,l!=null||e.onclick!==null||(e.onclick=Tu));else if(a!==4&&(a===27&&ol(t.type)&&(l=t.stateNode,e=null),t=t.child,t!==null))for(Sc(t,e,l),t=t.sibling;t!==null;)Sc(t,e,l),t=t.sibling}function mu(t,e,l){var a=t.tag;if(a===5||a===6)t=t.stateNode,e?l.insertBefore(t,e):l.appendChild(t);else if(a!==4&&(a===27&&ol(t.type)&&(l=t.stateNode),t=t.child,t!==null))for(mu(t,e,l),t=t.sibling;t!==null;)mu(t,e,l),t=t.sibling}function Po(t){var e=t.stateNode,l=t.memoizedProps;try{for(var a=t.type,n=e.attributes;n.length;)e.removeAttributeNode(n[0]);Bt(e,a,l),e[Lt]=t,e[Vt]=l}catch(u){mt(t,t.return,u)}}var Qe=!1,At=!1,zc=!1,tf=typeof WeakSet=="function"?WeakSet:Set,Rt=null;function bh(t,e){if(t=t.containerInfo,Vc=_u,t=os(t),xi(t)){if("selectionStart"in t)var l={start:t.selectionStart,end:t.selectionEnd};else t:{l=(l=t.ownerDocument)&&l.defaultView||window;var a=l.getSelection&&l.getSelection();if(a&&a.rangeCount!==0){l=a.anchorNode;var n=a.anchorOffset,u=a.focusNode;a=a.focusOffset;try{l.nodeType,u.nodeType}catch{l=null;break t}var c=0,r=-1,d=-1,b=0,z=0,E=t,v=null;e:for(;;){for(var p;E!==l||n!==0&&E.nodeType!==3||(r=c+n),E!==u||a!==0&&E.nodeType!==3||(d=c+a),E.nodeType===3&&(c+=E.nodeValue.length),(p=E.firstChild)!==null;)v=E,E=p;for(;;){if(E===t)break e;if(v===l&&++b===n&&(r=c),v===u&&++z===a&&(d=c),(p=E.nextSibling)!==null)break;E=v,v=E.parentNode}E=p}l=r===-1||d===-1?null:{start:r,end:d}}else l=null}l=l||{start:0,end:0}}else l=null;for(Kc={focusedElem:t,selectionRange:l},_u=!1,Rt=e;Rt!==null;)if(e=Rt,t=e.child,(e.subtreeFlags&1024)!==0&&t!==null)t.return=e,Rt=t;else for(;Rt!==null;){switch(e=Rt,u=e.alternate,t=e.flags,e.tag){case 0:break;case 11:case 15:break;case 1:if((t&1024)!==0&&u!==null){t=void 0,l=e,n=u.memoizedProps,u=u.memoizedState,a=l.stateNode;try{var K=ql(l.type,n,l.elementType===l.type);t=a.getSnapshotBeforeUpdate(K,u),a.__reactInternalSnapshotBeforeUpdate=t}catch($){mt(l,l.return,$)}}break;case 3:if((t&1024)!==0){if(t=e.stateNode.containerInfo,l=t.nodeType,l===9)Wc(t);else if(l===1)switch(t.nodeName){case"HEAD":case"HTML":case"BODY":Wc(t);break;default:t.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if((t&1024)!==0)throw Error(s(163))}if(t=e.sibling,t!==null){t.return=e.return,Rt=t;break}Rt=e.return}}function ef(t,e,l){var a=l.flags;switch(l.tag){case 0:case 11:case 15:al(t,l),a&4&&tn(5,l);break;case 1:if(al(t,l),a&4)if(t=l.stateNode,e===null)try{t.componentDidMount()}catch(c){mt(l,l.return,c)}else{var n=ql(l.type,e.memoizedProps);e=e.memoizedState;try{t.componentDidUpdate(n,e,t.__reactInternalSnapshotBeforeUpdate)}catch(c){mt(l,l.return,c)}}a&64&&Jo(l),a&512&&en(l,l.return);break;case 3:if(al(t,l),a&64&&(t=l.updateQueue,t!==null)){if(e=null,l.child!==null)switch(l.child.tag){case 27:case 5:e=l.child.stateNode;break;case 1:e=l.child.stateNode}try{ws(t,e)}catch(c){mt(l,l.return,c)}}break;case 27:e===null&&a&4&&Po(l);case 26:case 5:al(t,l),e===null&&a&4&&Fo(l),a&512&&en(l,l.return);break;case 12:al(t,l);break;case 13:al(t,l),a&4&&nf(t,l),a&64&&(t=l.memoizedState,t!==null&&(t=t.dehydrated,t!==null&&(l=Eh.bind(null,l),Xh(t,l))));break;case 22:if(a=l.memoizedState!==null||Qe,!a){e=e!==null&&e.memoizedState!==null||At,n=Qe;var u=At;Qe=a,(At=e)&&!u?nl(t,l,(l.subtreeFlags&8772)!==0):al(t,l),Qe=n,At=u}break;case 30:break;default:al(t,l)}}function lf(t){var e=t.alternate;e!==null&&(t.alternate=null,lf(e)),t.child=null,t.deletions=null,t.sibling=null,t.tag===5&&(e=t.stateNode,e!==null&&ei(e)),t.stateNode=null,t.return=null,t.dependencies=null,t.memoizedProps=null,t.memoizedState=null,t.pendingProps=null,t.stateNode=null,t.updateQueue=null}var yt=null,Jt=!1;function Ge(t,e,l){for(l=l.child;l!==null;)af(t,e,l),l=l.sibling}function af(t,e,l){if(Ft&&typeof Ft.onCommitFiberUnmount=="function")try{Ft.onCommitFiberUnmount(za,l)}catch{}switch(l.tag){case 26:At||Ae(l,e),Ge(t,e,l),l.memoizedState?l.memoizedState.count--:l.stateNode&&(l=l.stateNode,l.parentNode.removeChild(l));break;case 27:At||Ae(l,e);var a=yt,n=Jt;ol(l.type)&&(yt=l.stateNode,Jt=!1),Ge(t,e,l),fn(l.stateNode),yt=a,Jt=n;break;case 5:At||Ae(l,e);case 6:if(a=yt,n=Jt,yt=null,Ge(t,e,l),yt=a,Jt=n,yt!==null)if(Jt)try{(yt.nodeType===9?yt.body:yt.nodeName==="HTML"?yt.ownerDocument.body:yt).removeChild(l.stateNode)}catch(u){mt(l,e,u)}else try{yt.removeChild(l.stateNode)}catch(u){mt(l,e,u)}break;case 18:yt!==null&&(Jt?(t=yt,Vf(t.nodeType===9?t.body:t.nodeName==="HTML"?t.ownerDocument.body:t,l.stateNode),pn(t)):Vf(yt,l.stateNode));break;case 4:a=yt,n=Jt,yt=l.stateNode.containerInfo,Jt=!0,Ge(t,e,l),yt=a,Jt=n;break;case 0:case 11:case 14:case 15:At||ll(2,l,e),At||ll(4,l,e),Ge(t,e,l);break;case 1:At||(Ae(l,e),a=l.stateNode,typeof a.componentWillUnmount=="function"&&Wo(l,e,a)),Ge(t,e,l);break;case 21:Ge(t,e,l);break;case 22:At=(a=At)||l.memoizedState!==null,Ge(t,e,l),At=a;break;default:Ge(t,e,l)}}function nf(t,e){if(e.memoizedState===null&&(t=e.alternate,t!==null&&(t=t.memoizedState,t!==null&&(t=t.dehydrated,t!==null))))try{pn(t)}catch(l){mt(e,e.return,l)}}function vh(t){switch(t.tag){case 13:case 19:var e=t.stateNode;return e===null&&(e=t.stateNode=new tf),e;case 22:return t=t.stateNode,e=t._retryCache,e===null&&(e=t._retryCache=new tf),e;default:throw Error(s(435,t.tag))}}function Ac(t,e){var l=vh(t);e.forEach(function(a){var n=Mh.bind(null,t,a);l.has(a)||(l.add(a),a.then(n,n))})}function ee(t,e){var l=e.deletions;if(l!==null)for(var a=0;a<l.length;a++){var n=l[a],u=t,c=e,r=c;t:for(;r!==null;){switch(r.tag){case 27:if(ol(r.type)){yt=r.stateNode,Jt=!1;break t}break;case 5:yt=r.stateNode,Jt=!1;break t;case 3:case 4:yt=r.stateNode.containerInfo,Jt=!0;break t}r=r.return}if(yt===null)throw Error(s(160));af(u,c,n),yt=null,Jt=!1,u=n.alternate,u!==null&&(u.return=null),n.return=null}if(e.subtreeFlags&13878)for(e=e.child;e!==null;)uf(e,t),e=e.sibling}var ye=null;function uf(t,e){var l=t.alternate,a=t.flags;switch(t.tag){case 0:case 11:case 14:case 15:ee(e,t),le(t),a&4&&(ll(3,t,t.return),tn(3,t),ll(5,t,t.return));break;case 1:ee(e,t),le(t),a&512&&(At||l===null||Ae(l,l.return)),a&64&&Qe&&(t=t.updateQueue,t!==null&&(a=t.callbacks,a!==null&&(l=t.shared.hiddenCallbacks,t.shared.hiddenCallbacks=l===null?a:l.concat(a))));break;case 26:var n=ye;if(ee(e,t),le(t),a&512&&(At||l===null||Ae(l,l.return)),a&4){var u=l!==null?l.memoizedState:null;if(a=t.memoizedState,l===null)if(a===null)if(t.stateNode===null){t:{a=t.type,l=t.memoizedProps,n=n.ownerDocument||n;e:switch(a){case"title":u=n.getElementsByTagName("title")[0],(!u||u[ja]||u[Lt]||u.namespaceURI==="http://www.w3.org/2000/svg"||u.hasAttribute("itemprop"))&&(u=n.createElement(a),n.head.insertBefore(u,n.querySelector("head > title"))),Bt(u,a,l),u[Lt]=t,_t(u),a=u;break t;case"link":var c=td("link","href",n).get(a+(l.href||""));if(c){for(var r=0;r<c.length;r++)if(u=c[r],u.getAttribute("href")===(l.href==null||l.href===""?null:l.href)&&u.getAttribute("rel")===(l.rel==null?null:l.rel)&&u.getAttribute("title")===(l.title==null?null:l.title)&&u.getAttribute("crossorigin")===(l.crossOrigin==null?null:l.crossOrigin)){c.splice(r,1);break e}}u=n.createElement(a),Bt(u,a,l),n.head.appendChild(u);break;case"meta":if(c=td("meta","content",n).get(a+(l.content||""))){for(r=0;r<c.length;r++)if(u=c[r],u.getAttribute("content")===(l.content==null?null:""+l.content)&&u.getAttribute("name")===(l.name==null?null:l.name)&&u.getAttribute("property")===(l.property==null?null:l.property)&&u.getAttribute("http-equiv")===(l.httpEquiv==null?null:l.httpEquiv)&&u.getAttribute("charset")===(l.charSet==null?null:l.charSet)){c.splice(r,1);break e}}u=n.createElement(a),Bt(u,a,l),n.head.appendChild(u);break;default:throw Error(s(468,a))}u[Lt]=t,_t(u),a=u}t.stateNode=a}else ed(n,t.type,t.stateNode);else t.stateNode=Pf(n,a,t.memoizedProps);else u!==a?(u===null?l.stateNode!==null&&(l=l.stateNode,l.parentNode.removeChild(l)):u.count--,a===null?ed(n,t.type,t.stateNode):Pf(n,a,t.memoizedProps)):a===null&&t.stateNode!==null&&pc(t,t.memoizedProps,l.memoizedProps)}break;case 27:ee(e,t),le(t),a&512&&(At||l===null||Ae(l,l.return)),l!==null&&a&4&&pc(t,t.memoizedProps,l.memoizedProps);break;case 5:if(ee(e,t),le(t),a&512&&(At||l===null||Ae(l,l.return)),t.flags&32){n=t.stateNode;try{Xl(n,"")}catch(p){mt(t,t.return,p)}}a&4&&t.stateNode!=null&&(n=t.memoizedProps,pc(t,n,l!==null?l.memoizedProps:n)),a&1024&&(zc=!0);break;case 6:if(ee(e,t),le(t),a&4){if(t.stateNode===null)throw Error(s(162));a=t.memoizedProps,l=t.stateNode;try{l.nodeValue=a}catch(p){mt(t,t.return,p)}}break;case 3:if(Du=null,n=ye,ye=Eu(e.containerInfo),ee(e,t),ye=n,le(t),a&4&&l!==null&&l.memoizedState.isDehydrated)try{pn(e.containerInfo)}catch(p){mt(t,t.return,p)}zc&&(zc=!1,cf(t));break;case 4:a=ye,ye=Eu(t.stateNode.containerInfo),ee(e,t),le(t),ye=a;break;case 12:ee(e,t),le(t);break;case 13:ee(e,t),le(t),t.child.flags&8192&&t.memoizedState!==null!=(l!==null&&l.memoizedState!==null)&&(Uc=xe()),a&4&&(a=t.updateQueue,a!==null&&(t.updateQueue=null,Ac(t,a)));break;case 22:n=t.memoizedState!==null;var d=l!==null&&l.memoizedState!==null,b=Qe,z=At;if(Qe=b||n,At=z||d,ee(e,t),At=z,Qe=b,le(t),a&8192)t:for(e=t.stateNode,e._visibility=n?e._visibility&-2:e._visibility|1,n&&(l===null||d||Qe||At||Rl(t)),l=null,e=t;;){if(e.tag===5||e.tag===26){if(l===null){d=l=e;try{if(u=d.stateNode,n)c=u.style,typeof c.setProperty=="function"?c.setProperty("display","none","important"):c.display="none";else{r=d.stateNode;var E=d.memoizedProps.style,v=E!=null&&E.hasOwnProperty("display")?E.display:null;r.style.display=v==null||typeof v=="boolean"?"":(""+v).trim()}}catch(p){mt(d,d.return,p)}}}else if(e.tag===6){if(l===null){d=e;try{d.stateNode.nodeValue=n?"":d.memoizedProps}catch(p){mt(d,d.return,p)}}}else if((e.tag!==22&&e.tag!==23||e.memoizedState===null||e===t)&&e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break t;for(;e.sibling===null;){if(e.return===null||e.return===t)break t;l===e&&(l=null),e=e.return}l===e&&(l=null),e.sibling.return=e.return,e=e.sibling}a&4&&(a=t.updateQueue,a!==null&&(l=a.retryQueue,l!==null&&(a.retryQueue=null,Ac(t,l))));break;case 19:ee(e,t),le(t),a&4&&(a=t.updateQueue,a!==null&&(t.updateQueue=null,Ac(t,a)));break;case 30:break;case 21:break;default:ee(e,t),le(t)}}function le(t){var e=t.flags;if(e&2){try{for(var l,a=t.return;a!==null;){if(Io(a)){l=a;break}a=a.return}if(l==null)throw Error(s(160));switch(l.tag){case 27:var n=l.stateNode,u=xc(t);mu(t,u,n);break;case 5:var c=l.stateNode;l.flags&32&&(Xl(c,""),l.flags&=-33);var r=xc(t);mu(t,r,c);break;case 3:case 4:var d=l.stateNode.containerInfo,b=xc(t);Sc(t,b,d);break;default:throw Error(s(161))}}catch(z){mt(t,t.return,z)}t.flags&=-3}e&4096&&(t.flags&=-4097)}function cf(t){if(t.subtreeFlags&1024)for(t=t.child;t!==null;){var e=t;cf(e),e.tag===5&&e.flags&1024&&e.stateNode.reset(),t=t.sibling}}function al(t,e){if(e.subtreeFlags&8772)for(e=e.child;e!==null;)ef(t,e.alternate,e),e=e.sibling}function Rl(t){for(t=t.child;t!==null;){var e=t;switch(e.tag){case 0:case 11:case 14:case 15:ll(4,e,e.return),Rl(e);break;case 1:Ae(e,e.return);var l=e.stateNode;typeof l.componentWillUnmount=="function"&&Wo(e,e.return,l),Rl(e);break;case 27:fn(e.stateNode);case 26:case 5:Ae(e,e.return),Rl(e);break;case 22:e.memoizedState===null&&Rl(e);break;case 30:Rl(e);break;default:Rl(e)}t=t.sibling}}function nl(t,e,l){for(l=l&&(e.subtreeFlags&8772)!==0,e=e.child;e!==null;){var a=e.alternate,n=t,u=e,c=u.flags;switch(u.tag){case 0:case 11:case 15:nl(n,u,l),tn(4,u);break;case 1:if(nl(n,u,l),a=u,n=a.stateNode,typeof n.componentDidMount=="function")try{n.componentDidMount()}catch(b){mt(a,a.return,b)}if(a=u,n=a.updateQueue,n!==null){var r=a.stateNode;try{var d=n.shared.hiddenCallbacks;if(d!==null)for(n.shared.hiddenCallbacks=null,n=0;n<d.length;n++)Cs(d[n],r)}catch(b){mt(a,a.return,b)}}l&&c&64&&Jo(u),en(u,u.return);break;case 27:Po(u);case 26:case 5:nl(n,u,l),l&&a===null&&c&4&&Fo(u),en(u,u.return);break;case 12:nl(n,u,l);break;case 13:nl(n,u,l),l&&c&4&&nf(n,u);break;case 22:u.memoizedState===null&&nl(n,u,l),en(u,u.return);break;case 30:break;default:nl(n,u,l)}e=e.sibling}}function Tc(t,e){var l=null;t!==null&&t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(l=t.memoizedState.cachePool.pool),t=null,e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(t=e.memoizedState.cachePool.pool),t!==l&&(t!=null&&t.refCount++,l!=null&&Qa(l))}function jc(t,e){t=null,e.alternate!==null&&(t=e.alternate.memoizedState.cache),e=e.memoizedState.cache,e!==t&&(e.refCount++,t!=null&&Qa(t))}function Te(t,e,l,a){if(e.subtreeFlags&10256)for(e=e.child;e!==null;)rf(t,e,l,a),e=e.sibling}function rf(t,e,l,a){var n=e.flags;switch(e.tag){case 0:case 11:case 15:Te(t,e,l,a),n&2048&&tn(9,e);break;case 1:Te(t,e,l,a);break;case 3:Te(t,e,l,a),n&2048&&(t=null,e.alternate!==null&&(t=e.alternate.memoizedState.cache),e=e.memoizedState.cache,e!==t&&(e.refCount++,t!=null&&Qa(t)));break;case 12:if(n&2048){Te(t,e,l,a),t=e.stateNode;try{var u=e.memoizedProps,c=u.id,r=u.onPostCommit;typeof r=="function"&&r(c,e.alternate===null?"mount":"update",t.passiveEffectDuration,-0)}catch(d){mt(e,e.return,d)}}else Te(t,e,l,a);break;case 13:Te(t,e,l,a);break;case 23:break;case 22:u=e.stateNode,c=e.alternate,e.memoizedState!==null?u._visibility&2?Te(t,e,l,a):ln(t,e):u._visibility&2?Te(t,e,l,a):(u._visibility|=2,sa(t,e,l,a,(e.subtreeFlags&10256)!==0)),n&2048&&Tc(c,e);break;case 24:Te(t,e,l,a),n&2048&&jc(e.alternate,e);break;default:Te(t,e,l,a)}}function sa(t,e,l,a,n){for(n=n&&(e.subtreeFlags&10256)!==0,e=e.child;e!==null;){var u=t,c=e,r=l,d=a,b=c.flags;switch(c.tag){case 0:case 11:case 15:sa(u,c,r,d,n),tn(8,c);break;case 23:break;case 22:var z=c.stateNode;c.memoizedState!==null?z._visibility&2?sa(u,c,r,d,n):ln(u,c):(z._visibility|=2,sa(u,c,r,d,n)),n&&b&2048&&Tc(c.alternate,c);break;case 24:sa(u,c,r,d,n),n&&b&2048&&jc(c.alternate,c);break;default:sa(u,c,r,d,n)}e=e.sibling}}function ln(t,e){if(e.subtreeFlags&10256)for(e=e.child;e!==null;){var l=t,a=e,n=a.flags;switch(a.tag){case 22:ln(l,a),n&2048&&Tc(a.alternate,a);break;case 24:ln(l,a),n&2048&&jc(a.alternate,a);break;default:ln(l,a)}e=e.sibling}}var an=8192;function oa(t){if(t.subtreeFlags&an)for(t=t.child;t!==null;)sf(t),t=t.sibling}function sf(t){switch(t.tag){case 26:oa(t),t.flags&an&&t.memoizedState!==null&&a0(ye,t.memoizedState,t.memoizedProps);break;case 5:oa(t);break;case 3:case 4:var e=ye;ye=Eu(t.stateNode.containerInfo),oa(t),ye=e;break;case 22:t.memoizedState===null&&(e=t.alternate,e!==null&&e.memoizedState!==null?(e=an,an=16777216,oa(t),an=e):oa(t));break;default:oa(t)}}function of(t){var e=t.alternate;if(e!==null&&(t=e.child,t!==null)){e.child=null;do e=t.sibling,t.sibling=null,t=e;while(t!==null)}}function nn(t){var e=t.deletions;if((t.flags&16)!==0){if(e!==null)for(var l=0;l<e.length;l++){var a=e[l];Rt=a,df(a,t)}of(t)}if(t.subtreeFlags&10256)for(t=t.child;t!==null;)ff(t),t=t.sibling}function ff(t){switch(t.tag){case 0:case 11:case 15:nn(t),t.flags&2048&&ll(9,t,t.return);break;case 3:nn(t);break;case 12:nn(t);break;case 22:var e=t.stateNode;t.memoizedState!==null&&e._visibility&2&&(t.return===null||t.return.tag!==13)?(e._visibility&=-3,hu(t)):nn(t);break;default:nn(t)}}function hu(t){var e=t.deletions;if((t.flags&16)!==0){if(e!==null)for(var l=0;l<e.length;l++){var a=e[l];Rt=a,df(a,t)}of(t)}for(t=t.child;t!==null;){switch(e=t,e.tag){case 0:case 11:case 15:ll(8,e,e.return),hu(e);break;case 22:l=e.stateNode,l._visibility&2&&(l._visibility&=-3,hu(e));break;default:hu(e)}t=t.sibling}}function df(t,e){for(;Rt!==null;){var l=Rt;switch(l.tag){case 0:case 11:case 15:ll(8,l,e);break;case 23:case 22:if(l.memoizedState!==null&&l.memoizedState.cachePool!==null){var a=l.memoizedState.cachePool.pool;a!=null&&a.refCount++}break;case 24:Qa(l.memoizedState.cache)}if(a=l.child,a!==null)a.return=l,Rt=a;else t:for(l=t;Rt!==null;){a=Rt;var n=a.sibling,u=a.return;if(lf(a),a===l){Rt=null;break t}if(n!==null){n.return=u,Rt=n;break t}Rt=u}}}var ph={getCacheForType:function(t){var e=Qt(Mt),l=e.data.get(t);return l===void 0&&(l=t(),e.data.set(t,l)),l}},xh=typeof WeakMap=="function"?WeakMap:Map,ct=0,ht=null,lt=null,nt=0,rt=0,ae=null,ul=!1,fa=!1,Ec=!1,Ye=0,xt=0,il=0,Cl=0,Mc=0,me=0,da=0,un=null,Wt=null,Dc=!1,Uc=0,gu=1/0,yu=null,cl=null,Nt=0,rl=null,ma=null,ha=0,Oc=0,_c=null,mf=null,cn=0,qc=null;function ne(){if((ct&2)!==0&&nt!==0)return nt&-nt;if(A.T!==null){var t=ea;return t!==0?t:Lc()}return Mr()}function hf(){me===0&&(me=(nt&536870912)===0||it?Ar():536870912);var t=de.current;return t!==null&&(t.flags|=32),me}function ue(t,e,l){(t===ht&&(rt===2||rt===9)||t.cancelPendingCommit!==null)&&(ga(t,0),sl(t,nt,me,!1)),Ta(t,l),((ct&2)===0||t!==ht)&&(t===ht&&((ct&2)===0&&(Cl|=l),xt===4&&sl(t,nt,me,!1)),je(t))}function gf(t,e,l){if((ct&6)!==0)throw Error(s(327));var a=!l&&(e&124)===0&&(e&t.expiredLanes)===0||Aa(t,e),n=a?Ah(t,e):wc(t,e,!0),u=a;do{if(n===0){fa&&!a&&sl(t,e,0,!1);break}else{if(l=t.current.alternate,u&&!Sh(l)){n=wc(t,e,!1),u=!1;continue}if(n===2){if(u=e,t.errorRecoveryDisabledLanes&u)var c=0;else c=t.pendingLanes&-536870913,c=c!==0?c:c&536870912?536870912:0;if(c!==0){e=c;t:{var r=t;n=un;var d=r.current.memoizedState.isDehydrated;if(d&&(ga(r,c).flags|=256),c=wc(r,c,!1),c!==2){if(Ec&&!d){r.errorRecoveryDisabledLanes|=u,Cl|=u,n=4;break t}u=Wt,Wt=n,u!==null&&(Wt===null?Wt=u:Wt.push.apply(Wt,u))}n=c}if(u=!1,n!==2)continue}}if(n===1){ga(t,0),sl(t,e,0,!0);break}t:{switch(a=t,u=n,u){case 0:case 1:throw Error(s(345));case 4:if((e&4194048)!==e)break;case 6:sl(a,e,me,!ul);break t;case 2:Wt=null;break;case 3:case 5:break;default:throw Error(s(329))}if((e&62914560)===e&&(n=Uc+300-xe(),10<n)){if(sl(a,e,me,!ul),Mn(a,0,!0)!==0)break t;a.timeoutHandle=Xf(yf.bind(null,a,l,Wt,yu,Dc,e,me,Cl,da,ul,u,2,-0,0),n);break t}yf(a,l,Wt,yu,Dc,e,me,Cl,da,ul,u,0,-0,0)}}break}while(!0);je(t)}function yf(t,e,l,a,n,u,c,r,d,b,z,E,v,p){if(t.timeoutHandle=-1,E=e.subtreeFlags,(E&8192||(E&16785408)===16785408)&&(hn={stylesheets:null,count:0,unsuspend:l0},sf(e),E=n0(),E!==null)){t.cancelPendingCommit=E(Af.bind(null,t,e,u,l,a,n,c,r,d,z,1,v,p)),sl(t,u,c,!b);return}Af(t,e,u,l,a,n,c,r,d)}function Sh(t){for(var e=t;;){var l=e.tag;if((l===0||l===11||l===15)&&e.flags&16384&&(l=e.updateQueue,l!==null&&(l=l.stores,l!==null)))for(var a=0;a<l.length;a++){var n=l[a],u=n.getSnapshot;n=n.value;try{if(!Pt(u(),n))return!1}catch{return!1}}if(l=e.child,e.subtreeFlags&16384&&l!==null)l.return=e,e=l;else{if(e===t)break;for(;e.sibling===null;){if(e.return===null||e.return===t)return!0;e=e.return}e.sibling.return=e.return,e=e.sibling}}return!0}function sl(t,e,l,a){e&=~Mc,e&=~Cl,t.suspendedLanes|=e,t.pingedLanes&=~e,a&&(t.warmLanes|=e),a=t.expirationTimes;for(var n=e;0<n;){var u=31-It(n),c=1<<u;a[u]=-1,n&=~c}l!==0&&jr(t,l,e)}function bu(){return(ct&6)===0?(rn(0),!1):!0}function Rc(){if(lt!==null){if(rt===0)var t=lt.return;else t=lt,Ce=Dl=null,Wi(t),ca=null,Fa=0,t=lt;for(;t!==null;)ko(t.alternate,t),t=t.return;lt=null}}function ga(t,e){var l=t.timeoutHandle;l!==-1&&(t.timeoutHandle=-1,Lh(l)),l=t.cancelPendingCommit,l!==null&&(t.cancelPendingCommit=null,l()),Rc(),ht=t,lt=l=_e(t.current,null),nt=e,rt=0,ae=null,ul=!1,fa=Aa(t,e),Ec=!1,da=me=Mc=Cl=il=xt=0,Wt=un=null,Dc=!1,(e&8)!==0&&(e|=e&32);var a=t.entangledLanes;if(a!==0)for(t=t.entanglements,a&=e;0<a;){var n=31-It(a),u=1<<n;e|=t[n],a&=~u}return Ye=e,Ln(),l}function bf(t,e){P=null,A.H=nu,e===Ya||e===kn?(e=qs(),rt=3):e===Us?(e=qs(),rt=4):rt=e===Co?8:e!==null&&typeof e=="object"&&typeof e.then=="function"?6:1,ae=e,lt===null&&(xt=1,su(t,re(e,t.current)))}function vf(){var t=A.H;return A.H=nu,t===null?nu:t}function pf(){var t=A.A;return A.A=ph,t}function Cc(){xt=4,ul||(nt&4194048)!==nt&&de.current!==null||(fa=!0),(il&134217727)===0&&(Cl&134217727)===0||ht===null||sl(ht,nt,me,!1)}function wc(t,e,l){var a=ct;ct|=2;var n=vf(),u=pf();(ht!==t||nt!==e)&&(yu=null,ga(t,e)),e=!1;var c=xt;t:do try{if(rt!==0&&lt!==null){var r=lt,d=ae;switch(rt){case 8:Rc(),c=6;break t;case 3:case 2:case 9:case 6:de.current===null&&(e=!0);var b=rt;if(rt=0,ae=null,ya(t,r,d,b),l&&fa){c=0;break t}break;default:b=rt,rt=0,ae=null,ya(t,r,d,b)}}zh(),c=xt;break}catch(z){bf(t,z)}while(!0);return e&&t.shellSuspendCounter++,Ce=Dl=null,ct=a,A.H=n,A.A=u,lt===null&&(ht=null,nt=0,Ln()),c}function zh(){for(;lt!==null;)xf(lt)}function Ah(t,e){var l=ct;ct|=2;var a=vf(),n=pf();ht!==t||nt!==e?(yu=null,gu=xe()+500,ga(t,e)):fa=Aa(t,e);t:do try{if(rt!==0&&lt!==null){e=lt;var u=ae;e:switch(rt){case 1:rt=0,ae=null,ya(t,e,u,1);break;case 2:case 9:if(Os(u)){rt=0,ae=null,Sf(e);break}e=function(){rt!==2&&rt!==9||ht!==t||(rt=7),je(t)},u.then(e,e);break t;case 3:rt=7;break t;case 4:rt=5;break t;case 7:Os(u)?(rt=0,ae=null,Sf(e)):(rt=0,ae=null,ya(t,e,u,7));break;case 5:var c=null;switch(lt.tag){case 26:c=lt.memoizedState;case 5:case 27:var r=lt;if(!c||ld(c)){rt=0,ae=null;var d=r.sibling;if(d!==null)lt=d;else{var b=r.return;b!==null?(lt=b,vu(b)):lt=null}break e}}rt=0,ae=null,ya(t,e,u,5);break;case 6:rt=0,ae=null,ya(t,e,u,6);break;case 8:Rc(),xt=6;break t;default:throw Error(s(462))}}Th();break}catch(z){bf(t,z)}while(!0);return Ce=Dl=null,A.H=a,A.A=n,ct=l,lt!==null?0:(ht=null,nt=0,Ln(),xt)}function Th(){for(;lt!==null&&!Vd();)xf(lt)}function xf(t){var e=Vo(t.alternate,t,Ye);t.memoizedProps=t.pendingProps,e===null?vu(t):lt=e}function Sf(t){var e=t,l=e.alternate;switch(e.tag){case 15:case 0:e=Qo(l,e,e.pendingProps,e.type,void 0,nt);break;case 11:e=Qo(l,e,e.pendingProps,e.type.render,e.ref,nt);break;case 5:Wi(e);default:ko(l,e),e=lt=xs(e,Ye),e=Vo(l,e,Ye)}t.memoizedProps=t.pendingProps,e===null?vu(t):lt=e}function ya(t,e,l,a){Ce=Dl=null,Wi(e),ca=null,Fa=0;var n=e.return;try{if(mh(t,n,e,l,nt)){xt=1,su(t,re(l,t.current)),lt=null;return}}catch(u){if(n!==null)throw lt=n,u;xt=1,su(t,re(l,t.current)),lt=null;return}e.flags&32768?(it||a===1?t=!0:fa||(nt&536870912)!==0?t=!1:(ul=t=!0,(a===2||a===9||a===3||a===6)&&(a=de.current,a!==null&&a.tag===13&&(a.flags|=16384))),zf(e,t)):vu(e)}function vu(t){var e=t;do{if((e.flags&32768)!==0){zf(e,ul);return}t=e.return;var l=gh(e.alternate,e,Ye);if(l!==null){lt=l;return}if(e=e.sibling,e!==null){lt=e;return}lt=e=t}while(e!==null);xt===0&&(xt=5)}function zf(t,e){do{var l=yh(t.alternate,t);if(l!==null){l.flags&=32767,lt=l;return}if(l=t.return,l!==null&&(l.flags|=32768,l.subtreeFlags=0,l.deletions=null),!e&&(t=t.sibling,t!==null)){lt=t;return}lt=t=l}while(t!==null);xt=6,lt=null}function Af(t,e,l,a,n,u,c,r,d){t.cancelPendingCommit=null;do pu();while(Nt!==0);if((ct&6)!==0)throw Error(s(327));if(e!==null){if(e===t.current)throw Error(s(177));if(u=e.lanes|e.childLanes,u|=ji,lm(t,l,u,c,r,d),t===ht&&(lt=ht=null,nt=0),ma=e,rl=t,ha=l,Oc=u,_c=n,mf=a,(e.subtreeFlags&10256)!==0||(e.flags&10256)!==0?(t.callbackNode=null,t.callbackPriority=0,Dh(Tn,function(){return Df(),null})):(t.callbackNode=null,t.callbackPriority=0),a=(e.flags&13878)!==0,(e.subtreeFlags&13878)!==0||a){a=A.T,A.T=null,n=C.p,C.p=2,c=ct,ct|=4;try{bh(t,e,l)}finally{ct=c,C.p=n,A.T=a}}Nt=1,Tf(),jf(),Ef()}}function Tf(){if(Nt===1){Nt=0;var t=rl,e=ma,l=(e.flags&13878)!==0;if((e.subtreeFlags&13878)!==0||l){l=A.T,A.T=null;var a=C.p;C.p=2;var n=ct;ct|=4;try{uf(e,t);var u=Kc,c=os(t.containerInfo),r=u.focusedElem,d=u.selectionRange;if(c!==r&&r&&r.ownerDocument&&ss(r.ownerDocument.documentElement,r)){if(d!==null&&xi(r)){var b=d.start,z=d.end;if(z===void 0&&(z=b),"selectionStart"in r)r.selectionStart=b,r.selectionEnd=Math.min(z,r.value.length);else{var E=r.ownerDocument||document,v=E&&E.defaultView||window;if(v.getSelection){var p=v.getSelection(),K=r.textContent.length,$=Math.min(d.start,K),dt=d.end===void 0?$:Math.min(d.end,K);!p.extend&&$>dt&&(c=dt,dt=$,$=c);var g=rs(r,$),h=rs(r,dt);if(g&&h&&(p.rangeCount!==1||p.anchorNode!==g.node||p.anchorOffset!==g.offset||p.focusNode!==h.node||p.focusOffset!==h.offset)){var y=E.createRange();y.setStart(g.node,g.offset),p.removeAllRanges(),$>dt?(p.addRange(y),p.extend(h.node,h.offset)):(y.setEnd(h.node,h.offset),p.addRange(y))}}}}for(E=[],p=r;p=p.parentNode;)p.nodeType===1&&E.push({element:p,left:p.scrollLeft,top:p.scrollTop});for(typeof r.focus=="function"&&r.focus(),r=0;r<E.length;r++){var j=E[r];j.element.scrollLeft=j.left,j.element.scrollTop=j.top}}_u=!!Vc,Kc=Vc=null}finally{ct=n,C.p=a,A.T=l}}t.current=e,Nt=2}}function jf(){if(Nt===2){Nt=0;var t=rl,e=ma,l=(e.flags&8772)!==0;if((e.subtreeFlags&8772)!==0||l){l=A.T,A.T=null;var a=C.p;C.p=2;var n=ct;ct|=4;try{ef(t,e.alternate,e)}finally{ct=n,C.p=a,A.T=l}}Nt=3}}function Ef(){if(Nt===4||Nt===3){Nt=0,Kd();var t=rl,e=ma,l=ha,a=mf;(e.subtreeFlags&10256)!==0||(e.flags&10256)!==0?Nt=5:(Nt=0,ma=rl=null,Mf(t,t.pendingLanes));var n=t.pendingLanes;if(n===0&&(cl=null),Pu(l),e=e.stateNode,Ft&&typeof Ft.onCommitFiberRoot=="function")try{Ft.onCommitFiberRoot(za,e,void 0,(e.current.flags&128)===128)}catch{}if(a!==null){e=A.T,n=C.p,C.p=2,A.T=null;try{for(var u=t.onRecoverableError,c=0;c<a.length;c++){var r=a[c];u(r.value,{componentStack:r.stack})}}finally{A.T=e,C.p=n}}(ha&3)!==0&&pu(),je(t),n=t.pendingLanes,(l&4194090)!==0&&(n&42)!==0?t===qc?cn++:(cn=0,qc=t):cn=0,rn(0)}}function Mf(t,e){(t.pooledCacheLanes&=e)===0&&(e=t.pooledCache,e!=null&&(t.pooledCache=null,Qa(e)))}function pu(t){return Tf(),jf(),Ef(),Df()}function Df(){if(Nt!==5)return!1;var t=rl,e=Oc;Oc=0;var l=Pu(ha),a=A.T,n=C.p;try{C.p=32>l?32:l,A.T=null,l=_c,_c=null;var u=rl,c=ha;if(Nt=0,ma=rl=null,ha=0,(ct&6)!==0)throw Error(s(331));var r=ct;if(ct|=4,ff(u.current),rf(u,u.current,c,l),ct=r,rn(0,!1),Ft&&typeof Ft.onPostCommitFiberRoot=="function")try{Ft.onPostCommitFiberRoot(za,u)}catch{}return!0}finally{C.p=n,A.T=a,Mf(t,e)}}function Uf(t,e,l){e=re(l,e),e=oc(t.stateNode,e,2),t=Ie(t,e,2),t!==null&&(Ta(t,2),je(t))}function mt(t,e,l){if(t.tag===3)Uf(t,t,l);else for(;e!==null;){if(e.tag===3){Uf(e,t,l);break}else if(e.tag===1){var a=e.stateNode;if(typeof e.type.getDerivedStateFromError=="function"||typeof a.componentDidCatch=="function"&&(cl===null||!cl.has(a))){t=re(l,t),l=qo(2),a=Ie(e,l,2),a!==null&&(Ro(l,a,e,t),Ta(a,2),je(a));break}}e=e.return}}function Hc(t,e,l){var a=t.pingCache;if(a===null){a=t.pingCache=new xh;var n=new Set;a.set(e,n)}else n=a.get(e),n===void 0&&(n=new Set,a.set(e,n));n.has(l)||(Ec=!0,n.add(l),t=jh.bind(null,t,e,l),e.then(t,t))}function jh(t,e,l){var a=t.pingCache;a!==null&&a.delete(e),t.pingedLanes|=t.suspendedLanes&l,t.warmLanes&=~l,ht===t&&(nt&l)===l&&(xt===4||xt===3&&(nt&62914560)===nt&&300>xe()-Uc?(ct&2)===0&&ga(t,0):Mc|=l,da===nt&&(da=0)),je(t)}function Of(t,e){e===0&&(e=Tr()),t=Fl(t,e),t!==null&&(Ta(t,e),je(t))}function Eh(t){var e=t.memoizedState,l=0;e!==null&&(l=e.retryLane),Of(t,l)}function Mh(t,e){var l=0;switch(t.tag){case 13:var a=t.stateNode,n=t.memoizedState;n!==null&&(l=n.retryLane);break;case 19:a=t.stateNode;break;case 22:a=t.stateNode._retryCache;break;default:throw Error(s(314))}a!==null&&a.delete(e),Of(t,l)}function Dh(t,e){return Ju(t,e)}var xu=null,ba=null,Nc=!1,Su=!1,Bc=!1,wl=0;function je(t){t!==ba&&t.next===null&&(ba===null?xu=ba=t:ba=ba.next=t),Su=!0,Nc||(Nc=!0,Oh())}function rn(t,e){if(!Bc&&Su){Bc=!0;do for(var l=!1,a=xu;a!==null;){if(t!==0){var n=a.pendingLanes;if(n===0)var u=0;else{var c=a.suspendedLanes,r=a.pingedLanes;u=(1<<31-It(42|t)+1)-1,u&=n&~(c&~r),u=u&201326741?u&201326741|1:u?u|2:0}u!==0&&(l=!0,Cf(a,u))}else u=nt,u=Mn(a,a===ht?u:0,a.cancelPendingCommit!==null||a.timeoutHandle!==-1),(u&3)===0||Aa(a,u)||(l=!0,Cf(a,u));a=a.next}while(l);Bc=!1}}function Uh(){_f()}function _f(){Su=Nc=!1;var t=0;wl!==0&&(Bh()&&(t=wl),wl=0);for(var e=xe(),l=null,a=xu;a!==null;){var n=a.next,u=qf(a,e);u===0?(a.next=null,l===null?xu=n:l.next=n,n===null&&(ba=l)):(l=a,(t!==0||(u&3)!==0)&&(Su=!0)),a=n}rn(t)}function qf(t,e){for(var l=t.suspendedLanes,a=t.pingedLanes,n=t.expirationTimes,u=t.pendingLanes&-62914561;0<u;){var c=31-It(u),r=1<<c,d=n[c];d===-1?((r&l)===0||(r&a)!==0)&&(n[c]=em(r,e)):d<=e&&(t.expiredLanes|=r),u&=~r}if(e=ht,l=nt,l=Mn(t,t===e?l:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),a=t.callbackNode,l===0||t===e&&(rt===2||rt===9)||t.cancelPendingCommit!==null)return a!==null&&a!==null&&Wu(a),t.callbackNode=null,t.callbackPriority=0;if((l&3)===0||Aa(t,l)){if(e=l&-l,e===t.callbackPriority)return e;switch(a!==null&&Wu(a),Pu(l)){case 2:case 8:l=Sr;break;case 32:l=Tn;break;case 268435456:l=zr;break;default:l=Tn}return a=Rf.bind(null,t),l=Ju(l,a),t.callbackPriority=e,t.callbackNode=l,e}return a!==null&&a!==null&&Wu(a),t.callbackPriority=2,t.callbackNode=null,2}function Rf(t,e){if(Nt!==0&&Nt!==5)return t.callbackNode=null,t.callbackPriority=0,null;var l=t.callbackNode;if(pu()&&t.callbackNode!==l)return null;var a=nt;return a=Mn(t,t===ht?a:0,t.cancelPendingCommit!==null||t.timeoutHandle!==-1),a===0?null:(gf(t,a,e),qf(t,xe()),t.callbackNode!=null&&t.callbackNode===l?Rf.bind(null,t):null)}function Cf(t,e){if(pu())return null;gf(t,e,!0)}function Oh(){Qh(function(){(ct&6)!==0?Ju(xr,Uh):_f()})}function Lc(){return wl===0&&(wl=Ar()),wl}function wf(t){return t==null||typeof t=="symbol"||typeof t=="boolean"?null:typeof t=="function"?t:qn(""+t)}function Hf(t,e){var l=e.ownerDocument.createElement("input");return l.name=e.name,l.value=e.value,t.id&&l.setAttribute("form",t.id),e.parentNode.insertBefore(l,e),t=new FormData(t),l.parentNode.removeChild(l),t}function _h(t,e,l,a,n){if(e==="submit"&&l&&l.stateNode===n){var u=wf((n[Vt]||null).action),c=a.submitter;c&&(e=(e=c[Vt]||null)?wf(e.formAction):c.getAttribute("formAction"),e!==null&&(u=e,c=null));var r=new Hn("action","action",null,a,n);t.push({event:r,listeners:[{instance:null,listener:function(){if(a.defaultPrevented){if(wl!==0){var d=c?Hf(n,c):new FormData(n);uc(l,{pending:!0,data:d,method:n.method,action:u},null,d)}}else typeof u=="function"&&(r.preventDefault(),d=c?Hf(n,c):new FormData(n),uc(l,{pending:!0,data:d,method:n.method,action:u},u,d))},currentTarget:n}]})}}for(var Qc=0;Qc<Ti.length;Qc++){var Gc=Ti[Qc],qh=Gc.toLowerCase(),Rh=Gc[0].toUpperCase()+Gc.slice(1);ge(qh,"on"+Rh)}ge(ms,"onAnimationEnd"),ge(hs,"onAnimationIteration"),ge(gs,"onAnimationStart"),ge("dblclick","onDoubleClick"),ge("focusin","onFocus"),ge("focusout","onBlur"),ge(Wm,"onTransitionRun"),ge(Fm,"onTransitionStart"),ge(Im,"onTransitionCancel"),ge(ys,"onTransitionEnd"),Gl("onMouseEnter",["mouseout","mouseover"]),Gl("onMouseLeave",["mouseout","mouseover"]),Gl("onPointerEnter",["pointerout","pointerover"]),Gl("onPointerLeave",["pointerout","pointerover"]),pl("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),pl("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),pl("onBeforeInput",["compositionend","keypress","textInput","paste"]),pl("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),pl("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),pl("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var sn="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Ch=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(sn));function Nf(t,e){e=(e&4)!==0;for(var l=0;l<t.length;l++){var a=t[l],n=a.event;a=a.listeners;t:{var u=void 0;if(e)for(var c=a.length-1;0<=c;c--){var r=a[c],d=r.instance,b=r.currentTarget;if(r=r.listener,d!==u&&n.isPropagationStopped())break t;u=r,n.currentTarget=b;try{u(n)}catch(z){ru(z)}n.currentTarget=null,u=d}else for(c=0;c<a.length;c++){if(r=a[c],d=r.instance,b=r.currentTarget,r=r.listener,d!==u&&n.isPropagationStopped())break t;u=r,n.currentTarget=b;try{u(n)}catch(z){ru(z)}n.currentTarget=null,u=d}}}}function at(t,e){var l=e[ti];l===void 0&&(l=e[ti]=new Set);var a=t+"__bubble";l.has(a)||(Bf(e,t,2,!1),l.add(a))}function Yc(t,e,l){var a=0;e&&(a|=4),Bf(l,t,a,e)}var zu="_reactListening"+Math.random().toString(36).slice(2);function $c(t){if(!t[zu]){t[zu]=!0,Ur.forEach(function(l){l!=="selectionchange"&&(Ch.has(l)||Yc(l,!1,t),Yc(l,!0,t))});var e=t.nodeType===9?t:t.ownerDocument;e===null||e[zu]||(e[zu]=!0,Yc("selectionchange",!1,e))}}function Bf(t,e,l,a){switch(rd(e)){case 2:var n=c0;break;case 8:n=r0;break;default:n=ar}l=n.bind(null,e,l,t),n=void 0,!fi||e!=="touchstart"&&e!=="touchmove"&&e!=="wheel"||(n=!0),a?n!==void 0?t.addEventListener(e,l,{capture:!0,passive:n}):t.addEventListener(e,l,!0):n!==void 0?t.addEventListener(e,l,{passive:n}):t.addEventListener(e,l,!1)}function Xc(t,e,l,a,n){var u=a;if((e&1)===0&&(e&2)===0&&a!==null)t:for(;;){if(a===null)return;var c=a.tag;if(c===3||c===4){var r=a.stateNode.containerInfo;if(r===n)break;if(c===4)for(c=a.return;c!==null;){var d=c.tag;if((d===3||d===4)&&c.stateNode.containerInfo===n)return;c=c.return}for(;r!==null;){if(c=Bl(r),c===null)return;if(d=c.tag,d===5||d===6||d===26||d===27){a=u=c;continue t}r=r.parentNode}}a=a.return}$r(function(){var b=u,z=si(l),E=[];t:{var v=bs.get(t);if(v!==void 0){var p=Hn,K=t;switch(t){case"keypress":if(Cn(l)===0)break t;case"keydown":case"keyup":p=Dm;break;case"focusin":K="focus",p=gi;break;case"focusout":K="blur",p=gi;break;case"beforeblur":case"afterblur":p=gi;break;case"click":if(l.button===2)break t;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":p=Vr;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":p=ym;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":p=_m;break;case ms:case hs:case gs:p=pm;break;case ys:p=Rm;break;case"scroll":case"scrollend":p=hm;break;case"wheel":p=wm;break;case"copy":case"cut":case"paste":p=Sm;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":p=kr;break;case"toggle":case"beforetoggle":p=Nm}var $=(e&4)!==0,dt=!$&&(t==="scroll"||t==="scrollend"),g=$?v!==null?v+"Capture":null:v;$=[];for(var h=b,y;h!==null;){var j=h;if(y=j.stateNode,j=j.tag,j!==5&&j!==26&&j!==27||y===null||g===null||(j=Ma(h,g),j!=null&&$.push(on(h,j,y))),dt)break;h=h.return}0<$.length&&(v=new p(v,K,null,l,z),E.push({event:v,listeners:$}))}}if((e&7)===0){t:{if(v=t==="mouseover"||t==="pointerover",p=t==="mouseout"||t==="pointerout",v&&l!==ri&&(K=l.relatedTarget||l.fromElement)&&(Bl(K)||K[Nl]))break t;if((p||v)&&(v=z.window===z?z:(v=z.ownerDocument)?v.defaultView||v.parentWindow:window,p?(K=l.relatedTarget||l.toElement,p=b,K=K?Bl(K):null,K!==null&&(dt=M(K),$=K.tag,K!==dt||$!==5&&$!==27&&$!==6)&&(K=null)):(p=null,K=b),p!==K)){if($=Vr,j="onMouseLeave",g="onMouseEnter",h="mouse",(t==="pointerout"||t==="pointerover")&&($=kr,j="onPointerLeave",g="onPointerEnter",h="pointer"),dt=p==null?v:Ea(p),y=K==null?v:Ea(K),v=new $(j,h+"leave",p,l,z),v.target=dt,v.relatedTarget=y,j=null,Bl(z)===b&&($=new $(g,h+"enter",K,l,z),$.target=y,$.relatedTarget=dt,j=$),dt=j,p&&K)e:{for($=p,g=K,h=0,y=$;y;y=va(y))h++;for(y=0,j=g;j;j=va(j))y++;for(;0<h-y;)$=va($),h--;for(;0<y-h;)g=va(g),y--;for(;h--;){if($===g||g!==null&&$===g.alternate)break e;$=va($),g=va(g)}$=null}else $=null;p!==null&&Lf(E,v,p,$,!1),K!==null&&dt!==null&&Lf(E,dt,K,$,!0)}}t:{if(v=b?Ea(b):window,p=v.nodeName&&v.nodeName.toLowerCase(),p==="select"||p==="input"&&v.type==="file")var L=ls;else if(ts(v))if(as)L=Km;else{L=Zm;var et=Xm}else p=v.nodeName,!p||p.toLowerCase()!=="input"||v.type!=="checkbox"&&v.type!=="radio"?b&&ci(b.elementType)&&(L=ls):L=Vm;if(L&&(L=L(t,b))){es(E,L,l,z);break t}et&&et(t,v,b),t==="focusout"&&b&&v.type==="number"&&b.memoizedProps.value!=null&&ii(v,"number",v.value)}switch(et=b?Ea(b):window,t){case"focusin":(ts(et)||et.contentEditable==="true")&&(kl=et,Si=b,wa=null);break;case"focusout":wa=Si=kl=null;break;case"mousedown":zi=!0;break;case"contextmenu":case"mouseup":case"dragend":zi=!1,fs(E,l,z);break;case"selectionchange":if(Jm)break;case"keydown":case"keyup":fs(E,l,z)}var G;if(bi)t:{switch(t){case"compositionstart":var X="onCompositionStart";break t;case"compositionend":X="onCompositionEnd";break t;case"compositionupdate":X="onCompositionUpdate";break t}X=void 0}else Kl?Ir(t,l)&&(X="onCompositionEnd"):t==="keydown"&&l.keyCode===229&&(X="onCompositionStart");X&&(Jr&&l.locale!=="ko"&&(Kl||X!=="onCompositionStart"?X==="onCompositionEnd"&&Kl&&(G=Xr()):(ke=z,di="value"in ke?ke.value:ke.textContent,Kl=!0)),et=Au(b,X),0<et.length&&(X=new Kr(X,t,null,l,z),E.push({event:X,listeners:et}),G?X.data=G:(G=Pr(l),G!==null&&(X.data=G)))),(G=Lm?Qm(t,l):Gm(t,l))&&(X=Au(b,"onBeforeInput"),0<X.length&&(et=new Kr("onBeforeInput","beforeinput",null,l,z),E.push({event:et,listeners:X}),et.data=G)),_h(E,t,b,l,z)}Nf(E,e)})}function on(t,e,l){return{instance:t,listener:e,currentTarget:l}}function Au(t,e){for(var l=e+"Capture",a=[];t!==null;){var n=t,u=n.stateNode;if(n=n.tag,n!==5&&n!==26&&n!==27||u===null||(n=Ma(t,l),n!=null&&a.unshift(on(t,n,u)),n=Ma(t,e),n!=null&&a.push(on(t,n,u))),t.tag===3)return a;t=t.return}return[]}function va(t){if(t===null)return null;do t=t.return;while(t&&t.tag!==5&&t.tag!==27);return t||null}function Lf(t,e,l,a,n){for(var u=e._reactName,c=[];l!==null&&l!==a;){var r=l,d=r.alternate,b=r.stateNode;if(r=r.tag,d!==null&&d===a)break;r!==5&&r!==26&&r!==27||b===null||(d=b,n?(b=Ma(l,u),b!=null&&c.unshift(on(l,b,d))):n||(b=Ma(l,u),b!=null&&c.push(on(l,b,d)))),l=l.return}c.length!==0&&t.push({event:e,listeners:c})}var wh=/\r\n?/g,Hh=/\u0000|\uFFFD/g;function Qf(t){return(typeof t=="string"?t:""+t).replace(wh,`
`).replace(Hh,"")}function Gf(t,e){return e=Qf(e),Qf(t)===e}function Tu(){}function ft(t,e,l,a,n,u){switch(l){case"children":typeof a=="string"?e==="body"||e==="textarea"&&a===""||Xl(t,a):(typeof a=="number"||typeof a=="bigint")&&e!=="body"&&Xl(t,""+a);break;case"className":Un(t,"class",a);break;case"tabIndex":Un(t,"tabindex",a);break;case"dir":case"role":case"viewBox":case"width":case"height":Un(t,l,a);break;case"style":Gr(t,a,u);break;case"data":if(e!=="object"){Un(t,"data",a);break}case"src":case"href":if(a===""&&(e!=="a"||l!=="href")){t.removeAttribute(l);break}if(a==null||typeof a=="function"||typeof a=="symbol"||typeof a=="boolean"){t.removeAttribute(l);break}a=qn(""+a),t.setAttribute(l,a);break;case"action":case"formAction":if(typeof a=="function"){t.setAttribute(l,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof u=="function"&&(l==="formAction"?(e!=="input"&&ft(t,e,"name",n.name,n,null),ft(t,e,"formEncType",n.formEncType,n,null),ft(t,e,"formMethod",n.formMethod,n,null),ft(t,e,"formTarget",n.formTarget,n,null)):(ft(t,e,"encType",n.encType,n,null),ft(t,e,"method",n.method,n,null),ft(t,e,"target",n.target,n,null)));if(a==null||typeof a=="symbol"||typeof a=="boolean"){t.removeAttribute(l);break}a=qn(""+a),t.setAttribute(l,a);break;case"onClick":a!=null&&(t.onclick=Tu);break;case"onScroll":a!=null&&at("scroll",t);break;case"onScrollEnd":a!=null&&at("scrollend",t);break;case"dangerouslySetInnerHTML":if(a!=null){if(typeof a!="object"||!("__html"in a))throw Error(s(61));if(l=a.__html,l!=null){if(n.children!=null)throw Error(s(60));t.innerHTML=l}}break;case"multiple":t.multiple=a&&typeof a!="function"&&typeof a!="symbol";break;case"muted":t.muted=a&&typeof a!="function"&&typeof a!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(a==null||typeof a=="function"||typeof a=="boolean"||typeof a=="symbol"){t.removeAttribute("xlink:href");break}l=qn(""+a),t.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",l);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":a!=null&&typeof a!="function"&&typeof a!="symbol"?t.setAttribute(l,""+a):t.removeAttribute(l);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":a&&typeof a!="function"&&typeof a!="symbol"?t.setAttribute(l,""):t.removeAttribute(l);break;case"capture":case"download":a===!0?t.setAttribute(l,""):a!==!1&&a!=null&&typeof a!="function"&&typeof a!="symbol"?t.setAttribute(l,a):t.removeAttribute(l);break;case"cols":case"rows":case"size":case"span":a!=null&&typeof a!="function"&&typeof a!="symbol"&&!isNaN(a)&&1<=a?t.setAttribute(l,a):t.removeAttribute(l);break;case"rowSpan":case"start":a==null||typeof a=="function"||typeof a=="symbol"||isNaN(a)?t.removeAttribute(l):t.setAttribute(l,a);break;case"popover":at("beforetoggle",t),at("toggle",t),Dn(t,"popover",a);break;case"xlinkActuate":Ue(t,"http://www.w3.org/1999/xlink","xlink:actuate",a);break;case"xlinkArcrole":Ue(t,"http://www.w3.org/1999/xlink","xlink:arcrole",a);break;case"xlinkRole":Ue(t,"http://www.w3.org/1999/xlink","xlink:role",a);break;case"xlinkShow":Ue(t,"http://www.w3.org/1999/xlink","xlink:show",a);break;case"xlinkTitle":Ue(t,"http://www.w3.org/1999/xlink","xlink:title",a);break;case"xlinkType":Ue(t,"http://www.w3.org/1999/xlink","xlink:type",a);break;case"xmlBase":Ue(t,"http://www.w3.org/XML/1998/namespace","xml:base",a);break;case"xmlLang":Ue(t,"http://www.w3.org/XML/1998/namespace","xml:lang",a);break;case"xmlSpace":Ue(t,"http://www.w3.org/XML/1998/namespace","xml:space",a);break;case"is":Dn(t,"is",a);break;case"innerText":case"textContent":break;default:(!(2<l.length)||l[0]!=="o"&&l[0]!=="O"||l[1]!=="n"&&l[1]!=="N")&&(l=dm.get(l)||l,Dn(t,l,a))}}function Zc(t,e,l,a,n,u){switch(l){case"style":Gr(t,a,u);break;case"dangerouslySetInnerHTML":if(a!=null){if(typeof a!="object"||!("__html"in a))throw Error(s(61));if(l=a.__html,l!=null){if(n.children!=null)throw Error(s(60));t.innerHTML=l}}break;case"children":typeof a=="string"?Xl(t,a):(typeof a=="number"||typeof a=="bigint")&&Xl(t,""+a);break;case"onScroll":a!=null&&at("scroll",t);break;case"onScrollEnd":a!=null&&at("scrollend",t);break;case"onClick":a!=null&&(t.onclick=Tu);break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":break;case"innerText":case"textContent":break;default:if(!Or.hasOwnProperty(l))t:{if(l[0]==="o"&&l[1]==="n"&&(n=l.endsWith("Capture"),e=l.slice(2,n?l.length-7:void 0),u=t[Vt]||null,u=u!=null?u[l]:null,typeof u=="function"&&t.removeEventListener(e,u,n),typeof a=="function")){typeof u!="function"&&u!==null&&(l in t?t[l]=null:t.hasAttribute(l)&&t.removeAttribute(l)),t.addEventListener(e,a,n);break t}l in t?t[l]=a:a===!0?t.setAttribute(l,""):Dn(t,l,a)}}}function Bt(t,e,l){switch(e){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":at("error",t),at("load",t);var a=!1,n=!1,u;for(u in l)if(l.hasOwnProperty(u)){var c=l[u];if(c!=null)switch(u){case"src":a=!0;break;case"srcSet":n=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(s(137,e));default:ft(t,e,u,c,l,null)}}n&&ft(t,e,"srcSet",l.srcSet,l,null),a&&ft(t,e,"src",l.src,l,null);return;case"input":at("invalid",t);var r=u=c=n=null,d=null,b=null;for(a in l)if(l.hasOwnProperty(a)){var z=l[a];if(z!=null)switch(a){case"name":n=z;break;case"type":c=z;break;case"checked":d=z;break;case"defaultChecked":b=z;break;case"value":u=z;break;case"defaultValue":r=z;break;case"children":case"dangerouslySetInnerHTML":if(z!=null)throw Error(s(137,e));break;default:ft(t,e,a,z,l,null)}}Nr(t,u,r,d,b,c,n,!1),On(t);return;case"select":at("invalid",t),a=c=u=null;for(n in l)if(l.hasOwnProperty(n)&&(r=l[n],r!=null))switch(n){case"value":u=r;break;case"defaultValue":c=r;break;case"multiple":a=r;default:ft(t,e,n,r,l,null)}e=u,l=c,t.multiple=!!a,e!=null?$l(t,!!a,e,!1):l!=null&&$l(t,!!a,l,!0);return;case"textarea":at("invalid",t),u=n=a=null;for(c in l)if(l.hasOwnProperty(c)&&(r=l[c],r!=null))switch(c){case"value":a=r;break;case"defaultValue":n=r;break;case"children":u=r;break;case"dangerouslySetInnerHTML":if(r!=null)throw Error(s(91));break;default:ft(t,e,c,r,l,null)}Lr(t,a,n,u),On(t);return;case"option":for(d in l)if(l.hasOwnProperty(d)&&(a=l[d],a!=null))switch(d){case"selected":t.selected=a&&typeof a!="function"&&typeof a!="symbol";break;default:ft(t,e,d,a,l,null)}return;case"dialog":at("beforetoggle",t),at("toggle",t),at("cancel",t),at("close",t);break;case"iframe":case"object":at("load",t);break;case"video":case"audio":for(a=0;a<sn.length;a++)at(sn[a],t);break;case"image":at("error",t),at("load",t);break;case"details":at("toggle",t);break;case"embed":case"source":case"link":at("error",t),at("load",t);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(b in l)if(l.hasOwnProperty(b)&&(a=l[b],a!=null))switch(b){case"children":case"dangerouslySetInnerHTML":throw Error(s(137,e));default:ft(t,e,b,a,l,null)}return;default:if(ci(e)){for(z in l)l.hasOwnProperty(z)&&(a=l[z],a!==void 0&&Zc(t,e,z,a,l,void 0));return}}for(r in l)l.hasOwnProperty(r)&&(a=l[r],a!=null&&ft(t,e,r,a,l,null))}function Nh(t,e,l,a){switch(e){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var n=null,u=null,c=null,r=null,d=null,b=null,z=null;for(p in l){var E=l[p];if(l.hasOwnProperty(p)&&E!=null)switch(p){case"checked":break;case"value":break;case"defaultValue":d=E;default:a.hasOwnProperty(p)||ft(t,e,p,null,a,E)}}for(var v in a){var p=a[v];if(E=l[v],a.hasOwnProperty(v)&&(p!=null||E!=null))switch(v){case"type":u=p;break;case"name":n=p;break;case"checked":b=p;break;case"defaultChecked":z=p;break;case"value":c=p;break;case"defaultValue":r=p;break;case"children":case"dangerouslySetInnerHTML":if(p!=null)throw Error(s(137,e));break;default:p!==E&&ft(t,e,v,p,a,E)}}ui(t,c,r,d,b,z,u,n);return;case"select":p=c=r=v=null;for(u in l)if(d=l[u],l.hasOwnProperty(u)&&d!=null)switch(u){case"value":break;case"multiple":p=d;default:a.hasOwnProperty(u)||ft(t,e,u,null,a,d)}for(n in a)if(u=a[n],d=l[n],a.hasOwnProperty(n)&&(u!=null||d!=null))switch(n){case"value":v=u;break;case"defaultValue":r=u;break;case"multiple":c=u;default:u!==d&&ft(t,e,n,u,a,d)}e=r,l=c,a=p,v!=null?$l(t,!!l,v,!1):!!a!=!!l&&(e!=null?$l(t,!!l,e,!0):$l(t,!!l,l?[]:"",!1));return;case"textarea":p=v=null;for(r in l)if(n=l[r],l.hasOwnProperty(r)&&n!=null&&!a.hasOwnProperty(r))switch(r){case"value":break;case"children":break;default:ft(t,e,r,null,a,n)}for(c in a)if(n=a[c],u=l[c],a.hasOwnProperty(c)&&(n!=null||u!=null))switch(c){case"value":v=n;break;case"defaultValue":p=n;break;case"children":break;case"dangerouslySetInnerHTML":if(n!=null)throw Error(s(91));break;default:n!==u&&ft(t,e,c,n,a,u)}Br(t,v,p);return;case"option":for(var K in l)if(v=l[K],l.hasOwnProperty(K)&&v!=null&&!a.hasOwnProperty(K))switch(K){case"selected":t.selected=!1;break;default:ft(t,e,K,null,a,v)}for(d in a)if(v=a[d],p=l[d],a.hasOwnProperty(d)&&v!==p&&(v!=null||p!=null))switch(d){case"selected":t.selected=v&&typeof v!="function"&&typeof v!="symbol";break;default:ft(t,e,d,v,a,p)}return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var $ in l)v=l[$],l.hasOwnProperty($)&&v!=null&&!a.hasOwnProperty($)&&ft(t,e,$,null,a,v);for(b in a)if(v=a[b],p=l[b],a.hasOwnProperty(b)&&v!==p&&(v!=null||p!=null))switch(b){case"children":case"dangerouslySetInnerHTML":if(v!=null)throw Error(s(137,e));break;default:ft(t,e,b,v,a,p)}return;default:if(ci(e)){for(var dt in l)v=l[dt],l.hasOwnProperty(dt)&&v!==void 0&&!a.hasOwnProperty(dt)&&Zc(t,e,dt,void 0,a,v);for(z in a)v=a[z],p=l[z],!a.hasOwnProperty(z)||v===p||v===void 0&&p===void 0||Zc(t,e,z,v,a,p);return}}for(var g in l)v=l[g],l.hasOwnProperty(g)&&v!=null&&!a.hasOwnProperty(g)&&ft(t,e,g,null,a,v);for(E in a)v=a[E],p=l[E],!a.hasOwnProperty(E)||v===p||v==null&&p==null||ft(t,e,E,v,a,p)}var Vc=null,Kc=null;function ju(t){return t.nodeType===9?t:t.ownerDocument}function Yf(t){switch(t){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function $f(t,e){if(t===0)switch(e){case"svg":return 1;case"math":return 2;default:return 0}return t===1&&e==="foreignObject"?0:t}function kc(t,e){return t==="textarea"||t==="noscript"||typeof e.children=="string"||typeof e.children=="number"||typeof e.children=="bigint"||typeof e.dangerouslySetInnerHTML=="object"&&e.dangerouslySetInnerHTML!==null&&e.dangerouslySetInnerHTML.__html!=null}var Jc=null;function Bh(){var t=window.event;return t&&t.type==="popstate"?t===Jc?!1:(Jc=t,!0):(Jc=null,!1)}var Xf=typeof setTimeout=="function"?setTimeout:void 0,Lh=typeof clearTimeout=="function"?clearTimeout:void 0,Zf=typeof Promise=="function"?Promise:void 0,Qh=typeof queueMicrotask=="function"?queueMicrotask:typeof Zf<"u"?function(t){return Zf.resolve(null).then(t).catch(Gh)}:Xf;function Gh(t){setTimeout(function(){throw t})}function ol(t){return t==="head"}function Vf(t,e){var l=e,a=0,n=0;do{var u=l.nextSibling;if(t.removeChild(l),u&&u.nodeType===8)if(l=u.data,l==="/$"){if(0<a&&8>a){l=a;var c=t.ownerDocument;if(l&1&&fn(c.documentElement),l&2&&fn(c.body),l&4)for(l=c.head,fn(l),c=l.firstChild;c;){var r=c.nextSibling,d=c.nodeName;c[ja]||d==="SCRIPT"||d==="STYLE"||d==="LINK"&&c.rel.toLowerCase()==="stylesheet"||l.removeChild(c),c=r}}if(n===0){t.removeChild(u),pn(e);return}n--}else l==="$"||l==="$?"||l==="$!"?n++:a=l.charCodeAt(0)-48;else a=0;l=u}while(l);pn(e)}function Wc(t){var e=t.firstChild;for(e&&e.nodeType===10&&(e=e.nextSibling);e;){var l=e;switch(e=e.nextSibling,l.nodeName){case"HTML":case"HEAD":case"BODY":Wc(l),ei(l);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(l.rel.toLowerCase()==="stylesheet")continue}t.removeChild(l)}}function Yh(t,e,l,a){for(;t.nodeType===1;){var n=l;if(t.nodeName.toLowerCase()!==e.toLowerCase()){if(!a&&(t.nodeName!=="INPUT"||t.type!=="hidden"))break}else if(a){if(!t[ja])switch(e){case"meta":if(!t.hasAttribute("itemprop"))break;return t;case"link":if(u=t.getAttribute("rel"),u==="stylesheet"&&t.hasAttribute("data-precedence"))break;if(u!==n.rel||t.getAttribute("href")!==(n.href==null||n.href===""?null:n.href)||t.getAttribute("crossorigin")!==(n.crossOrigin==null?null:n.crossOrigin)||t.getAttribute("title")!==(n.title==null?null:n.title))break;return t;case"style":if(t.hasAttribute("data-precedence"))break;return t;case"script":if(u=t.getAttribute("src"),(u!==(n.src==null?null:n.src)||t.getAttribute("type")!==(n.type==null?null:n.type)||t.getAttribute("crossorigin")!==(n.crossOrigin==null?null:n.crossOrigin))&&u&&t.hasAttribute("async")&&!t.hasAttribute("itemprop"))break;return t;default:return t}}else if(e==="input"&&t.type==="hidden"){var u=n.name==null?null:""+n.name;if(n.type==="hidden"&&t.getAttribute("name")===u)return t}else return t;if(t=be(t.nextSibling),t===null)break}return null}function $h(t,e,l){if(e==="")return null;for(;t.nodeType!==3;)if((t.nodeType!==1||t.nodeName!=="INPUT"||t.type!=="hidden")&&!l||(t=be(t.nextSibling),t===null))return null;return t}function Fc(t){return t.data==="$!"||t.data==="$?"&&t.ownerDocument.readyState==="complete"}function Xh(t,e){var l=t.ownerDocument;if(t.data!=="$?"||l.readyState==="complete")e();else{var a=function(){e(),l.removeEventListener("DOMContentLoaded",a)};l.addEventListener("DOMContentLoaded",a),t._reactRetry=a}}function be(t){for(;t!=null;t=t.nextSibling){var e=t.nodeType;if(e===1||e===3)break;if(e===8){if(e=t.data,e==="$"||e==="$!"||e==="$?"||e==="F!"||e==="F")break;if(e==="/$")return null}}return t}var Ic=null;function Kf(t){t=t.previousSibling;for(var e=0;t;){if(t.nodeType===8){var l=t.data;if(l==="$"||l==="$!"||l==="$?"){if(e===0)return t;e--}else l==="/$"&&e++}t=t.previousSibling}return null}function kf(t,e,l){switch(e=ju(l),t){case"html":if(t=e.documentElement,!t)throw Error(s(452));return t;case"head":if(t=e.head,!t)throw Error(s(453));return t;case"body":if(t=e.body,!t)throw Error(s(454));return t;default:throw Error(s(451))}}function fn(t){for(var e=t.attributes;e.length;)t.removeAttributeNode(e[0]);ei(t)}var he=new Map,Jf=new Set;function Eu(t){return typeof t.getRootNode=="function"?t.getRootNode():t.nodeType===9?t:t.ownerDocument}var $e=C.d;C.d={f:Zh,r:Vh,D:Kh,C:kh,L:Jh,m:Wh,X:Ih,S:Fh,M:Ph};function Zh(){var t=$e.f(),e=bu();return t||e}function Vh(t){var e=Ll(t);e!==null&&e.tag===5&&e.type==="form"?ho(e):$e.r(t)}var pa=typeof document>"u"?null:document;function Wf(t,e,l){var a=pa;if(a&&typeof e=="string"&&e){var n=ce(e);n='link[rel="'+t+'"][href="'+n+'"]',typeof l=="string"&&(n+='[crossorigin="'+l+'"]'),Jf.has(n)||(Jf.add(n),t={rel:t,crossOrigin:l,href:e},a.querySelector(n)===null&&(e=a.createElement("link"),Bt(e,"link",t),_t(e),a.head.appendChild(e)))}}function Kh(t){$e.D(t),Wf("dns-prefetch",t,null)}function kh(t,e){$e.C(t,e),Wf("preconnect",t,e)}function Jh(t,e,l){$e.L(t,e,l);var a=pa;if(a&&t&&e){var n='link[rel="preload"][as="'+ce(e)+'"]';e==="image"&&l&&l.imageSrcSet?(n+='[imagesrcset="'+ce(l.imageSrcSet)+'"]',typeof l.imageSizes=="string"&&(n+='[imagesizes="'+ce(l.imageSizes)+'"]')):n+='[href="'+ce(t)+'"]';var u=n;switch(e){case"style":u=xa(t);break;case"script":u=Sa(t)}he.has(u)||(t=q({rel:"preload",href:e==="image"&&l&&l.imageSrcSet?void 0:t,as:e},l),he.set(u,t),a.querySelector(n)!==null||e==="style"&&a.querySelector(dn(u))||e==="script"&&a.querySelector(mn(u))||(e=a.createElement("link"),Bt(e,"link",t),_t(e),a.head.appendChild(e)))}}function Wh(t,e){$e.m(t,e);var l=pa;if(l&&t){var a=e&&typeof e.as=="string"?e.as:"script",n='link[rel="modulepreload"][as="'+ce(a)+'"][href="'+ce(t)+'"]',u=n;switch(a){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":u=Sa(t)}if(!he.has(u)&&(t=q({rel:"modulepreload",href:t},e),he.set(u,t),l.querySelector(n)===null)){switch(a){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(l.querySelector(mn(u)))return}a=l.createElement("link"),Bt(a,"link",t),_t(a),l.head.appendChild(a)}}}function Fh(t,e,l){$e.S(t,e,l);var a=pa;if(a&&t){var n=Ql(a).hoistableStyles,u=xa(t);e=e||"default";var c=n.get(u);if(!c){var r={loading:0,preload:null};if(c=a.querySelector(dn(u)))r.loading=5;else{t=q({rel:"stylesheet",href:t,"data-precedence":e},l),(l=he.get(u))&&Pc(t,l);var d=c=a.createElement("link");_t(d),Bt(d,"link",t),d._p=new Promise(function(b,z){d.onload=b,d.onerror=z}),d.addEventListener("load",function(){r.loading|=1}),d.addEventListener("error",function(){r.loading|=2}),r.loading|=4,Mu(c,e,a)}c={type:"stylesheet",instance:c,count:1,state:r},n.set(u,c)}}}function Ih(t,e){$e.X(t,e);var l=pa;if(l&&t){var a=Ql(l).hoistableScripts,n=Sa(t),u=a.get(n);u||(u=l.querySelector(mn(n)),u||(t=q({src:t,async:!0},e),(e=he.get(n))&&tr(t,e),u=l.createElement("script"),_t(u),Bt(u,"link",t),l.head.appendChild(u)),u={type:"script",instance:u,count:1,state:null},a.set(n,u))}}function Ph(t,e){$e.M(t,e);var l=pa;if(l&&t){var a=Ql(l).hoistableScripts,n=Sa(t),u=a.get(n);u||(u=l.querySelector(mn(n)),u||(t=q({src:t,async:!0,type:"module"},e),(e=he.get(n))&&tr(t,e),u=l.createElement("script"),_t(u),Bt(u,"link",t),l.head.appendChild(u)),u={type:"script",instance:u,count:1,state:null},a.set(n,u))}}function Ff(t,e,l,a){var n=(n=Ze.current)?Eu(n):null;if(!n)throw Error(s(446));switch(t){case"meta":case"title":return null;case"style":return typeof l.precedence=="string"&&typeof l.href=="string"?(e=xa(l.href),l=Ql(n).hoistableStyles,a=l.get(e),a||(a={type:"style",instance:null,count:0,state:null},l.set(e,a)),a):{type:"void",instance:null,count:0,state:null};case"link":if(l.rel==="stylesheet"&&typeof l.href=="string"&&typeof l.precedence=="string"){t=xa(l.href);var u=Ql(n).hoistableStyles,c=u.get(t);if(c||(n=n.ownerDocument||n,c={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},u.set(t,c),(u=n.querySelector(dn(t)))&&!u._p&&(c.instance=u,c.state.loading=5),he.has(t)||(l={rel:"preload",as:"style",href:l.href,crossOrigin:l.crossOrigin,integrity:l.integrity,media:l.media,hrefLang:l.hrefLang,referrerPolicy:l.referrerPolicy},he.set(t,l),u||t0(n,t,l,c.state))),e&&a===null)throw Error(s(528,""));return c}if(e&&a!==null)throw Error(s(529,""));return null;case"script":return e=l.async,l=l.src,typeof l=="string"&&e&&typeof e!="function"&&typeof e!="symbol"?(e=Sa(l),l=Ql(n).hoistableScripts,a=l.get(e),a||(a={type:"script",instance:null,count:0,state:null},l.set(e,a)),a):{type:"void",instance:null,count:0,state:null};default:throw Error(s(444,t))}}function xa(t){return'href="'+ce(t)+'"'}function dn(t){return'link[rel="stylesheet"]['+t+"]"}function If(t){return q({},t,{"data-precedence":t.precedence,precedence:null})}function t0(t,e,l,a){t.querySelector('link[rel="preload"][as="style"]['+e+"]")?a.loading=1:(e=t.createElement("link"),a.preload=e,e.addEventListener("load",function(){return a.loading|=1}),e.addEventListener("error",function(){return a.loading|=2}),Bt(e,"link",l),_t(e),t.head.appendChild(e))}function Sa(t){return'[src="'+ce(t)+'"]'}function mn(t){return"script[async]"+t}function Pf(t,e,l){if(e.count++,e.instance===null)switch(e.type){case"style":var a=t.querySelector('style[data-href~="'+ce(l.href)+'"]');if(a)return e.instance=a,_t(a),a;var n=q({},l,{"data-href":l.href,"data-precedence":l.precedence,href:null,precedence:null});return a=(t.ownerDocument||t).createElement("style"),_t(a),Bt(a,"style",n),Mu(a,l.precedence,t),e.instance=a;case"stylesheet":n=xa(l.href);var u=t.querySelector(dn(n));if(u)return e.state.loading|=4,e.instance=u,_t(u),u;a=If(l),(n=he.get(n))&&Pc(a,n),u=(t.ownerDocument||t).createElement("link"),_t(u);var c=u;return c._p=new Promise(function(r,d){c.onload=r,c.onerror=d}),Bt(u,"link",a),e.state.loading|=4,Mu(u,l.precedence,t),e.instance=u;case"script":return u=Sa(l.src),(n=t.querySelector(mn(u)))?(e.instance=n,_t(n),n):(a=l,(n=he.get(u))&&(a=q({},l),tr(a,n)),t=t.ownerDocument||t,n=t.createElement("script"),_t(n),Bt(n,"link",a),t.head.appendChild(n),e.instance=n);case"void":return null;default:throw Error(s(443,e.type))}else e.type==="stylesheet"&&(e.state.loading&4)===0&&(a=e.instance,e.state.loading|=4,Mu(a,l.precedence,t));return e.instance}function Mu(t,e,l){for(var a=l.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),n=a.length?a[a.length-1]:null,u=n,c=0;c<a.length;c++){var r=a[c];if(r.dataset.precedence===e)u=r;else if(u!==n)break}u?u.parentNode.insertBefore(t,u.nextSibling):(e=l.nodeType===9?l.head:l,e.insertBefore(t,e.firstChild))}function Pc(t,e){t.crossOrigin==null&&(t.crossOrigin=e.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=e.referrerPolicy),t.title==null&&(t.title=e.title)}function tr(t,e){t.crossOrigin==null&&(t.crossOrigin=e.crossOrigin),t.referrerPolicy==null&&(t.referrerPolicy=e.referrerPolicy),t.integrity==null&&(t.integrity=e.integrity)}var Du=null;function td(t,e,l){if(Du===null){var a=new Map,n=Du=new Map;n.set(l,a)}else n=Du,a=n.get(l),a||(a=new Map,n.set(l,a));if(a.has(t))return a;for(a.set(t,null),l=l.getElementsByTagName(t),n=0;n<l.length;n++){var u=l[n];if(!(u[ja]||u[Lt]||t==="link"&&u.getAttribute("rel")==="stylesheet")&&u.namespaceURI!=="http://www.w3.org/2000/svg"){var c=u.getAttribute(e)||"";c=t+c;var r=a.get(c);r?r.push(u):a.set(c,[u])}}return a}function ed(t,e,l){t=t.ownerDocument||t,t.head.insertBefore(l,e==="title"?t.querySelector("head > title"):null)}function e0(t,e,l){if(l===1||e.itemProp!=null)return!1;switch(t){case"meta":case"title":return!0;case"style":if(typeof e.precedence!="string"||typeof e.href!="string"||e.href==="")break;return!0;case"link":if(typeof e.rel!="string"||typeof e.href!="string"||e.href===""||e.onLoad||e.onError)break;switch(e.rel){case"stylesheet":return t=e.disabled,typeof e.precedence=="string"&&t==null;default:return!0}case"script":if(e.async&&typeof e.async!="function"&&typeof e.async!="symbol"&&!e.onLoad&&!e.onError&&e.src&&typeof e.src=="string")return!0}return!1}function ld(t){return!(t.type==="stylesheet"&&(t.state.loading&3)===0)}var hn=null;function l0(){}function a0(t,e,l){if(hn===null)throw Error(s(475));var a=hn;if(e.type==="stylesheet"&&(typeof l.media!="string"||matchMedia(l.media).matches!==!1)&&(e.state.loading&4)===0){if(e.instance===null){var n=xa(l.href),u=t.querySelector(dn(n));if(u){t=u._p,t!==null&&typeof t=="object"&&typeof t.then=="function"&&(a.count++,a=Uu.bind(a),t.then(a,a)),e.state.loading|=4,e.instance=u,_t(u);return}u=t.ownerDocument||t,l=If(l),(n=he.get(n))&&Pc(l,n),u=u.createElement("link"),_t(u);var c=u;c._p=new Promise(function(r,d){c.onload=r,c.onerror=d}),Bt(u,"link",l),e.instance=u}a.stylesheets===null&&(a.stylesheets=new Map),a.stylesheets.set(e,t),(t=e.state.preload)&&(e.state.loading&3)===0&&(a.count++,e=Uu.bind(a),t.addEventListener("load",e),t.addEventListener("error",e))}}function n0(){if(hn===null)throw Error(s(475));var t=hn;return t.stylesheets&&t.count===0&&er(t,t.stylesheets),0<t.count?function(e){var l=setTimeout(function(){if(t.stylesheets&&er(t,t.stylesheets),t.unsuspend){var a=t.unsuspend;t.unsuspend=null,a()}},6e4);return t.unsuspend=e,function(){t.unsuspend=null,clearTimeout(l)}}:null}function Uu(){if(this.count--,this.count===0){if(this.stylesheets)er(this,this.stylesheets);else if(this.unsuspend){var t=this.unsuspend;this.unsuspend=null,t()}}}var Ou=null;function er(t,e){t.stylesheets=null,t.unsuspend!==null&&(t.count++,Ou=new Map,e.forEach(u0,t),Ou=null,Uu.call(t))}function u0(t,e){if(!(e.state.loading&4)){var l=Ou.get(t);if(l)var a=l.get(null);else{l=new Map,Ou.set(t,l);for(var n=t.querySelectorAll("link[data-precedence],style[data-precedence]"),u=0;u<n.length;u++){var c=n[u];(c.nodeName==="LINK"||c.getAttribute("media")!=="not all")&&(l.set(c.dataset.precedence,c),a=c)}a&&l.set(null,a)}n=e.instance,c=n.getAttribute("data-precedence"),u=l.get(c)||a,u===a&&l.set(null,n),l.set(c,n),this.count++,a=Uu.bind(this),n.addEventListener("load",a),n.addEventListener("error",a),u?u.parentNode.insertBefore(n,u.nextSibling):(t=t.nodeType===9?t.head:t,t.insertBefore(n,t.firstChild)),e.state.loading|=4}}var gn={$$typeof:F,Provider:null,Consumer:null,_currentValue:Z,_currentValue2:Z,_threadCount:0};function i0(t,e,l,a,n,u,c,r){this.tag=1,this.containerInfo=t,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=Fu(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Fu(0),this.hiddenUpdates=Fu(null),this.identifierPrefix=a,this.onUncaughtError=n,this.onCaughtError=u,this.onRecoverableError=c,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=r,this.incompleteTransitions=new Map}function ad(t,e,l,a,n,u,c,r,d,b,z,E){return t=new i0(t,e,l,c,r,d,b,E),e=1,u===!0&&(e|=24),u=te(3,null,null,e),t.current=u,u.stateNode=t,e=Hi(),e.refCount++,t.pooledCache=e,e.refCount++,u.memoizedState={element:a,isDehydrated:l,cache:e},Qi(u),t}function nd(t){return t?(t=Il,t):Il}function ud(t,e,l,a,n,u){n=nd(n),a.context===null?a.context=n:a.pendingContext=n,a=Fe(e),a.payload={element:l},u=u===void 0?null:u,u!==null&&(a.callback=u),l=Ie(t,a,e),l!==null&&(ue(l,t,e),Xa(l,t,e))}function id(t,e){if(t=t.memoizedState,t!==null&&t.dehydrated!==null){var l=t.retryLane;t.retryLane=l!==0&&l<e?l:e}}function lr(t,e){id(t,e),(t=t.alternate)&&id(t,e)}function cd(t){if(t.tag===13){var e=Fl(t,67108864);e!==null&&ue(e,t,67108864),lr(t,67108864)}}var _u=!0;function c0(t,e,l,a){var n=A.T;A.T=null;var u=C.p;try{C.p=2,ar(t,e,l,a)}finally{C.p=u,A.T=n}}function r0(t,e,l,a){var n=A.T;A.T=null;var u=C.p;try{C.p=8,ar(t,e,l,a)}finally{C.p=u,A.T=n}}function ar(t,e,l,a){if(_u){var n=nr(a);if(n===null)Xc(t,e,a,qu,l),sd(t,a);else if(o0(n,t,e,l,a))a.stopPropagation();else if(sd(t,a),e&4&&-1<s0.indexOf(t)){for(;n!==null;){var u=Ll(n);if(u!==null)switch(u.tag){case 3:if(u=u.stateNode,u.current.memoizedState.isDehydrated){var c=vl(u.pendingLanes);if(c!==0){var r=u;for(r.pendingLanes|=2,r.entangledLanes|=2;c;){var d=1<<31-It(c);r.entanglements[1]|=d,c&=~d}je(u),(ct&6)===0&&(gu=xe()+500,rn(0))}}break;case 13:r=Fl(u,2),r!==null&&ue(r,u,2),bu(),lr(u,2)}if(u=nr(a),u===null&&Xc(t,e,a,qu,l),u===n)break;n=u}n!==null&&a.stopPropagation()}else Xc(t,e,a,null,l)}}function nr(t){return t=si(t),ur(t)}var qu=null;function ur(t){if(qu=null,t=Bl(t),t!==null){var e=M(t);if(e===null)t=null;else{var l=e.tag;if(l===13){if(t=T(e),t!==null)return t;t=null}else if(l===3){if(e.stateNode.current.memoizedState.isDehydrated)return e.tag===3?e.stateNode.containerInfo:null;t=null}else e!==t&&(t=null)}}return qu=t,null}function rd(t){switch(t){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(kd()){case xr:return 2;case Sr:return 8;case Tn:case Jd:return 32;case zr:return 268435456;default:return 32}default:return 32}}var ir=!1,fl=null,dl=null,ml=null,yn=new Map,bn=new Map,hl=[],s0="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function sd(t,e){switch(t){case"focusin":case"focusout":fl=null;break;case"dragenter":case"dragleave":dl=null;break;case"mouseover":case"mouseout":ml=null;break;case"pointerover":case"pointerout":yn.delete(e.pointerId);break;case"gotpointercapture":case"lostpointercapture":bn.delete(e.pointerId)}}function vn(t,e,l,a,n,u){return t===null||t.nativeEvent!==u?(t={blockedOn:e,domEventName:l,eventSystemFlags:a,nativeEvent:u,targetContainers:[n]},e!==null&&(e=Ll(e),e!==null&&cd(e)),t):(t.eventSystemFlags|=a,e=t.targetContainers,n!==null&&e.indexOf(n)===-1&&e.push(n),t)}function o0(t,e,l,a,n){switch(e){case"focusin":return fl=vn(fl,t,e,l,a,n),!0;case"dragenter":return dl=vn(dl,t,e,l,a,n),!0;case"mouseover":return ml=vn(ml,t,e,l,a,n),!0;case"pointerover":var u=n.pointerId;return yn.set(u,vn(yn.get(u)||null,t,e,l,a,n)),!0;case"gotpointercapture":return u=n.pointerId,bn.set(u,vn(bn.get(u)||null,t,e,l,a,n)),!0}return!1}function od(t){var e=Bl(t.target);if(e!==null){var l=M(e);if(l!==null){if(e=l.tag,e===13){if(e=T(l),e!==null){t.blockedOn=e,am(t.priority,function(){if(l.tag===13){var a=ne();a=Iu(a);var n=Fl(l,a);n!==null&&ue(n,l,a),lr(l,a)}});return}}else if(e===3&&l.stateNode.current.memoizedState.isDehydrated){t.blockedOn=l.tag===3?l.stateNode.containerInfo:null;return}}}t.blockedOn=null}function Ru(t){if(t.blockedOn!==null)return!1;for(var e=t.targetContainers;0<e.length;){var l=nr(t.nativeEvent);if(l===null){l=t.nativeEvent;var a=new l.constructor(l.type,l);ri=a,l.target.dispatchEvent(a),ri=null}else return e=Ll(l),e!==null&&cd(e),t.blockedOn=l,!1;e.shift()}return!0}function fd(t,e,l){Ru(t)&&l.delete(e)}function f0(){ir=!1,fl!==null&&Ru(fl)&&(fl=null),dl!==null&&Ru(dl)&&(dl=null),ml!==null&&Ru(ml)&&(ml=null),yn.forEach(fd),bn.forEach(fd)}function Cu(t,e){t.blockedOn===e&&(t.blockedOn=null,ir||(ir=!0,i.unstable_scheduleCallback(i.unstable_NormalPriority,f0)))}var wu=null;function dd(t){wu!==t&&(wu=t,i.unstable_scheduleCallback(i.unstable_NormalPriority,function(){wu===t&&(wu=null);for(var e=0;e<t.length;e+=3){var l=t[e],a=t[e+1],n=t[e+2];if(typeof a!="function"){if(ur(a||l)===null)continue;break}var u=Ll(l);u!==null&&(t.splice(e,3),e-=3,uc(u,{pending:!0,data:n,method:l.method,action:a},a,n))}}))}function pn(t){function e(d){return Cu(d,t)}fl!==null&&Cu(fl,t),dl!==null&&Cu(dl,t),ml!==null&&Cu(ml,t),yn.forEach(e),bn.forEach(e);for(var l=0;l<hl.length;l++){var a=hl[l];a.blockedOn===t&&(a.blockedOn=null)}for(;0<hl.length&&(l=hl[0],l.blockedOn===null);)od(l),l.blockedOn===null&&hl.shift();if(l=(t.ownerDocument||t).$$reactFormReplay,l!=null)for(a=0;a<l.length;a+=3){var n=l[a],u=l[a+1],c=n[Vt]||null;if(typeof u=="function")c||dd(l);else if(c){var r=null;if(u&&u.hasAttribute("formAction")){if(n=u,c=u[Vt]||null)r=c.formAction;else if(ur(n)!==null)continue}else r=c.action;typeof r=="function"?l[a+1]=r:(l.splice(a,3),a-=3),dd(l)}}}function cr(t){this._internalRoot=t}Hu.prototype.render=cr.prototype.render=function(t){var e=this._internalRoot;if(e===null)throw Error(s(409));var l=e.current,a=ne();ud(l,a,t,e,null,null)},Hu.prototype.unmount=cr.prototype.unmount=function(){var t=this._internalRoot;if(t!==null){this._internalRoot=null;var e=t.containerInfo;ud(t.current,2,null,t,null,null),bu(),e[Nl]=null}};function Hu(t){this._internalRoot=t}Hu.prototype.unstable_scheduleHydration=function(t){if(t){var e=Mr();t={blockedOn:null,target:t,priority:e};for(var l=0;l<hl.length&&e!==0&&e<hl[l].priority;l++);hl.splice(l,0,t),l===0&&od(t)}};var md=o.version;if(md!=="19.1.0")throw Error(s(527,md,"19.1.0"));C.findDOMNode=function(t){var e=t._reactInternals;if(e===void 0)throw typeof t.render=="function"?Error(s(188)):(t=Object.keys(t).join(","),Error(s(268,t)));return t=H(e),t=t!==null?N(t):null,t=t===null?null:t.stateNode,t};var d0={bundleType:0,version:"19.1.0",rendererPackageName:"react-dom",currentDispatcherRef:A,reconcilerVersion:"19.1.0"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Nu=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Nu.isDisabled&&Nu.supportsFiber)try{za=Nu.inject(d0),Ft=Nu}catch{}}return xn.createRoot=function(t,e){if(!S(t))throw Error(s(299));var l=!1,a="",n=Do,u=Uo,c=Oo,r=null;return e!=null&&(e.unstable_strictMode===!0&&(l=!0),e.identifierPrefix!==void 0&&(a=e.identifierPrefix),e.onUncaughtError!==void 0&&(n=e.onUncaughtError),e.onCaughtError!==void 0&&(u=e.onCaughtError),e.onRecoverableError!==void 0&&(c=e.onRecoverableError),e.unstable_transitionCallbacks!==void 0&&(r=e.unstable_transitionCallbacks)),e=ad(t,1,!1,null,null,l,a,n,u,c,r,null),t[Nl]=e.current,$c(t),new cr(e)},xn.hydrateRoot=function(t,e,l){if(!S(t))throw Error(s(299));var a=!1,n="",u=Do,c=Uo,r=Oo,d=null,b=null;return l!=null&&(l.unstable_strictMode===!0&&(a=!0),l.identifierPrefix!==void 0&&(n=l.identifierPrefix),l.onUncaughtError!==void 0&&(u=l.onUncaughtError),l.onCaughtError!==void 0&&(c=l.onCaughtError),l.onRecoverableError!==void 0&&(r=l.onRecoverableError),l.unstable_transitionCallbacks!==void 0&&(d=l.unstable_transitionCallbacks),l.formState!==void 0&&(b=l.formState)),e=ad(t,1,!0,e,l??null,a,n,u,c,r,d,b),e.context=nd(null),l=e.current,a=ne(),a=Iu(a),n=Fe(a),n.callback=null,Ie(l,n,a),l=a,e.current.lanes=l,Ta(e,l),je(e),t[Nl]=e.current,$c(t),new Hu(e)},xn.version="19.1.0",xn}var vd;function U0(){if(vd)return rr.exports;vd=1;function i(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(i)}catch(o){console.error(o)}}return i(),rr.exports=D0(),rr.exports}var O0=U0(),_0=function(){return null};const q0=h0`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    height: 100%;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: ${({theme:i})=>i.colors.text.primary};
    background-color: ${({theme:i})=>i.colors.background.primary};
    line-height: 1.5;
    height: 100%;
    overflow-x: hidden;
  }

  #root {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.25;
    margin-bottom: ${({theme:i})=>i.spacing.sm};
  }

  h1 {
    font-size: 2.5rem;
  }

  h2 {
    font-size: 2rem;
  }

  h3 {
    font-size: 1.75rem;
  }

  h4 {
    font-size: 1.5rem;
  }

  h5 {
    font-size: 1.25rem;
  }

  h6 {
    font-size: 1rem;
  }

  p {
    margin-bottom: ${({theme:i})=>i.spacing.md};
  }

  a {
    color: ${({theme:i})=>i.colors.primary};
    text-decoration: none;
    transition: color ${({theme:i})=>i.transitions.fast};

    &:hover {
      color: ${({theme:i})=>i.colors.primary};
      text-decoration: underline;
    }
  }

  button {
    font-family: inherit;
    font-size: inherit;
    border: none;
    cursor: pointer;
    transition: all ${({theme:i})=>i.transitions.fast};

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    border: 1px solid ${({theme:i})=>i.colors.border};
    border-radius: 0.25rem;
    padding: ${({theme:i})=>i.spacing.sm} ${({theme:i})=>i.spacing.md};
    transition: border-color ${({theme:i})=>i.transitions.fast};

    &:focus {
      outline: none;
      border-color: ${({theme:i})=>i.colors.primary};
      box-shadow: 0 0 0 0.2rem ${({theme:i})=>i.colors.primary}25;
    }

    &:disabled {
      background-color: ${({theme:i})=>i.colors.background.secondary};
      cursor: not-allowed;
    }
  }

  /* Scrollbar styles */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({theme:i})=>i.colors.background.secondary};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({theme:i})=>i.colors.border};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({theme:i})=>i.colors.text.secondary};
  }

  /* Focus visible styles for accessibility */
  :focus-visible {
    outline: 2px solid ${({theme:i})=>i.colors.primary};
    outline-offset: 2px;
  }

  /* Selection styles */
  ::selection {
    background-color: ${({theme:i})=>i.colors.primary}33;
    color: ${({theme:i})=>i.colors.text.primary};
  }

  /* Utility classes */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Responsive typography */
  @media (max-width: ${({theme:i})=>i.breakpoints.mobile}) {
    html {
      font-size: 14px;
    }

    h1 {
      font-size: 2rem;
    }

    h2 {
      font-size: 1.75rem;
    }

    h3 {
      font-size: 1.5rem;
    }
  }

  /* Animation classes */
  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }

  .fade-out {
    animation: fadeOut 0.3s ease-in-out;
  }

  .slide-in-up {
    animation: slideInUp 0.3s ease-out;
  }

  .slide-in-down {
    animation: slideInDown 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @keyframes slideInUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideInDown {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  /* Loading spinner */
  .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid ${({theme:i})=>i.colors.border};
    border-radius: 50%;
    border-top-color: ${({theme:i})=>i.colors.primary};
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`,vr={colors:{primary:"#007bff",secondary:"#6c757d",success:"#28a745",warning:"#ffc107",error:"#dc3545",info:"#17a2b8",surface:"#ffffff",text:{primary:"#212529",secondary:"#6c757d",disabled:"#adb5bd"},background:{primary:"#ffffff",secondary:"#f8f9fa",paper:"#ffffff"},border:"#dee2e6"},borderRadius:{sm:"0.25rem",md:"0.5rem",lg:"0.75rem",xl:"1rem"},shadows:{sm:"0 1px 2px 0 rgba(0, 0, 0, 0.05)",md:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",lg:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",xl:"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"},spacing:{xs:"0.25rem",sm:"0.5rem",md:"1rem",lg:"1.5rem",xl:"3rem"},breakpoints:{mobile:"576px",tablet:"768px",desktop:"992px"},transitions:{fast:"0.15s ease-in-out",normal:"0.3s ease-in-out",slow:"0.5s ease-in-out"}};({...vr,colors:{...vr.colors}});function R0({children:i}){return f.jsx(f.Fragment,{children:i})}const C0=x.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`,w0=x.header`
  background-color: ${({theme:i})=>i.colors.primary};
  color: white;
  padding: ${({theme:i})=>i.spacing.md};
  text-align: center;
`,H0=x.main`
  flex: 1;
  padding: ${({theme:i})=>i.spacing.md};
`;function N0({children:i}){return f.jsxs(C0,{children:[f.jsx(w0,{children:f.jsx("h1",{children:"Learn2Play"})}),f.jsx(H0,{children:i})]})}const pd=i=>{let o;const m=new Set,s=(N,q)=>{const U=typeof N=="function"?N(o):N;if(!Object.is(U,o)){const _=o;o=q??(typeof U!="object"||U===null)?U:Object.assign({},o,U),m.forEach(D=>D(o,_))}},S=()=>o,O={setState:s,getState:S,getInitialState:()=>H,subscribe:N=>(m.add(N),()=>m.delete(N))},H=o=i(s,S,O);return O},B0=i=>i?pd(i):pd,L0=i=>i;function Q0(i,o=L0){const m=hd.useSyncExternalStore(i.subscribe,()=>o(i.getState()),()=>o(i.getInitialState()));return hd.useDebugValue(m),m}const G0=i=>{const o=B0(i),m=s=>Q0(o,s);return Object.assign(m,o),m},Yd=i=>G0,Y0=i=>(o,m,s)=>{const S=s.subscribe;return s.subscribe=(T,O,H)=>{let N=T;if(O){const q=H?.equalityFn||Object.is;let U=T(s.getState());N=_=>{const D=T(_);if(!q(U,D)){const Q=U;O(U=D,Q)}},H?.fireImmediately&&O(U,U)}return S(N)},i(o,m,s)},$0=Y0;function X0(i,o){let m;try{m=i()}catch{return}return{getItem:S=>{var M;const T=H=>H===null?null:JSON.parse(H,void 0),O=(M=m.getItem(S))!=null?M:null;return O instanceof Promise?O.then(T):T(O)},setItem:(S,M)=>m.setItem(S,JSON.stringify(M,void 0)),removeItem:S=>m.removeItem(S)}}const pr=i=>o=>{try{const m=i(o);return m instanceof Promise?m:{then(s){return pr(s)(m)},catch(s){return this}}}catch(m){return{then(s){return this},catch(s){return pr(s)(m)}}}},Z0=(i,o)=>(m,s,S)=>{let M={storage:X0(()=>localStorage),partialize:w=>w,version:0,merge:(w,J)=>({...J,...w}),...o},T=!1;const O=new Set,H=new Set;let N=M.storage;if(!N)return i((...w)=>{console.warn(`[zustand persist middleware] Unable to update item '${M.name}', the given storage is currently unavailable.`),m(...w)},s,S);const q=()=>{const w=M.partialize({...s()});return N.setItem(M.name,{state:w,version:M.version})},U=S.setState;S.setState=(w,J)=>{U(w,J),q()};const _=i((...w)=>{m(...w),q()},s,S);S.getInitialState=()=>_;let D;const Q=()=>{var w,J;if(!N)return;T=!1,O.forEach(Y=>{var F;return Y((F=s())!=null?F:_)});const I=((J=M.onRehydrateStorage)==null?void 0:J.call(M,(w=s())!=null?w:_))||void 0;return pr(N.getItem.bind(N))(M.name).then(Y=>{if(Y)if(typeof Y.version=="number"&&Y.version!==M.version){if(M.migrate){const F=M.migrate(Y.state,Y.version);return F instanceof Promise?F.then(k=>[!0,k]):[!0,F]}console.error("State loaded from storage couldn't be migrated since no migrate function was provided")}else return[!1,Y.state];return[!1,void 0]}).then(Y=>{var F;const[k,R]=Y;if(D=M.merge(R,(F=s())!=null?F:_),m(D,!0),k)return q()}).then(()=>{I?.(D,void 0),D=s(),T=!0,H.forEach(Y=>Y(D))}).catch(Y=>{I?.(void 0,Y)})};return S.persist={setOptions:w=>{M={...M,...w},w.storage&&(N=w.storage)},clearStorage:()=>{N?.removeItem(M.name)},getOptions:()=>M,rehydrate:()=>Q(),hasHydrated:()=>T,onHydrate:w=>(O.add(w),()=>{O.delete(w)}),onFinishHydration:w=>(H.add(w),()=>{H.delete(w)})},M.skipHydration||Q(),D||_},V0=Z0,K0="http://10.0.0.44/api",k0=3e4,J0=2,W0=1e3,F0=[502,503,504],I0=[429];class P0{client;token=null;constructor(){this.client=S0.create({baseURL:K0,timeout:k0,headers:{"Content-Type":"application/json"}}),this.token=localStorage.getItem("jwtToken"),this.token&&this.setAuthHeader(this.token),this.client.interceptors.request.use(o=>(console.log(`Making ${o.method?.toUpperCase()} request to ${o.url}`),o),o=>Promise.reject(o)),this.client.interceptors.response.use(o=>o,async o=>{const m=o.config;if(o.response?.status===401&&!m._retry)return this.clearToken(),window.location.href="/login",Promise.reject(o);if(m&&!m._retry&&o.response&&(F0.includes(o.response.status)||I0.includes(o.response.status))&&(m._retry=!0,m._retryCount=(m._retryCount||0)+1,m._retryCount<=J0)){const s=o.response.status===429?Math.min(15e3,5e3*m._retryCount):W0*m._retryCount;return console.warn(`Request failed with ${o.response.status}, retrying in ${s}ms`),await this.sleep(s),this.client(m)}return Promise.reject(this.handleError(o))})}async sleep(o){return new Promise(m=>setTimeout(m,o))}setAuthHeader(o){this.client.defaults.headers.common.Authorization=`Bearer ${o}`}removeAuthHeader(){delete this.client.defaults.headers.common.Authorization}handleError(o){const m=o.response;let s="An unexpected error occurred",S="UNKNOWN_ERROR",M="Please try again";if(m?.data){const T=m.data;T.error?(s=T.error.message||s,S=T.error.code||S,M=T.error.recovery||M):T.message&&(s=T.message,S=T.code||S)}else o.message&&(o.code==="ECONNABORTED"||o.message.includes("timeout")?(s="Request timed out",M="Please check your connection and try again"):o.message.includes("Network Error")?(s="Cannot connect to the server",M="Please check your network connection"):s=o.message);return{message:s,status:m?.status,code:S,recovery:M,data:m?.data,requestId:m?.headers?.["x-request-id"]}}setToken(o){this.token=o,localStorage.setItem("jwtToken",o),this.setAuthHeader(o)}getToken(){return this.token||localStorage.getItem("jwtToken")}clearToken(){this.token=null,localStorage.removeItem("jwtToken"),this.removeAuthHeader()}async login(o){if(!o.username||!o.password)throw new Error("Username and password are required");try{const m=await this.client.post("/auth/login",o);return m.data.token&&this.setToken(m.data.token),m.data}catch(m){throw console.error("Login failed:",m),this.clearToken(),m}}async register(o){if(!o.username||!o.password||!o.character)throw new Error("Username, password, and character are required");try{const m=await this.client.post("/auth/register",o);return m.data.token&&this.setToken(m.data.token),m.data}catch(m){throw console.error("Registration failed:",m),m}}async logout(){try{await this.client.post("/auth/logout")}catch(o){console.warn("Logout endpoint failed:",o)}finally{this.clearToken()}}async getCurrentUser(){try{return(await this.client.get("/auth/me")).data}catch(o){throw o.status===401?(this.clearToken(),new Error("Session expired. Please log in again.")):o}}async healthCheck(){try{return(await this.client.get("/health")).data}catch(o){throw console.error("Health check failed:",o),o}}async getHallOfFame(o,m=10){const s=new URLSearchParams;o&&s.append("catalog",o),m&&s.append("limit",m.toString());const S=`/hall-of-fame${s.toString()?"?"+s.toString():""}`;return(await this.client.get(S)).data}async addHallOfFameEntry(o){return(await this.client.post("/hall-of-fame",o)).data}async getCatalogs(o=50){const m=new URLSearchParams;o&&m.append("limit",o.toString());const s=`/hall-of-fame/catalogs${m.toString()?"?"+m.toString():""}`;return(await this.client.get(s)).data}async createLobby(o){return(await this.client.post("/lobbies/create",o)).data}async joinLobby(o,m){return(await this.client.post(`/lobbies/${o}/join`,m)).data}async leaveLobby(o,m){await this.client.post(`/lobbies/${o}/leave`,{username:m})}async getLobby(o){return(await this.client.get(`/lobbies/${o}`)).data}async getLobbies(){return(await this.client.get("/lobbies/list")).data}async updateLobby(o,m){return(await this.client.put(`/lobbies/${o}`,m)).data}async returnToLobby(o){return(await this.client.post(`/lobbies/${o}/return-to-lobby`)).data}async rejoinLobby(o){return(await this.client.post(`/lobbies/${o}/rejoin-lobby`)).data}async get(o){return(await this.client.get(o)).data}async post(o,m){return(await this.client.post(o,m)).data}async put(o,m){return(await this.client.put(o,m)).data}async delete(o){return(await this.client.delete(o)).data}}const Ee=new P0,Me=Yd()(V0((i,o)=>({user:null,token:null,isAuthenticated:!1,isLoading:!1,error:null,login:async m=>{i({isLoading:!0,error:null});try{const s=await Ee.login(m);i({user:s.user,token:s.token,isAuthenticated:!0,isLoading:!1,error:null})}catch(s){const S=s instanceof Error?s.message:"Login failed";throw i({user:null,token:null,isAuthenticated:!1,isLoading:!1,error:S}),s}},register:async m=>{i({isLoading:!0,error:null});try{const s=await Ee.register(m);i({user:s.user,token:s.token,isAuthenticated:!0,isLoading:!1,error:null})}catch(s){const S=s instanceof Error?s.message:"Registration failed";throw i({user:null,token:null,isAuthenticated:!1,isLoading:!1,error:S}),s}},logout:async()=>{i({isLoading:!0});try{await Ee.logout()}catch(m){console.warn("Logout API call failed:",m)}finally{i({user:null,token:null,isAuthenticated:!1,isLoading:!1,error:null})}},getCurrentUser:async()=>{const{token:m}=o();if(m){i({isLoading:!0,error:null});try{const s=await Ee.getCurrentUser();i({user:s,isAuthenticated:!0,isLoading:!1,error:null})}catch(s){const S=s instanceof Error?s.message:"Failed to get user";S.includes("Session expired")||S.includes("401")?i({user:null,token:null,isAuthenticated:!1,isLoading:!1,error:S}):i({isLoading:!1,error:S})}}},clearError:()=>{i({error:null})},setLoading:m=>{i({isLoading:m})}}),{name:"auth-storage",partialize:i=>({user:i.user,token:i.token,isAuthenticated:i.isAuthenticated}),onRehydrateStorage:()=>i=>{i?.token&&i?.isAuthenticated&&i.getCurrentUser().catch(()=>{i.logout()})}})),tg=x.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
  
  &:focus {
    outline: 2px solid ${({theme:i})=>i.colors.primary};
    outline-offset: 2px;
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  ${({fullWidth:i})=>i&&Ut`
    width: 100%;
  `}
  
  /* Size variants */
  ${({size:i})=>{switch(i){case"small":return Ut`
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          min-height: 2rem;
        `;case"large":return Ut`
          padding: 0.875rem 1.5rem;
          font-size: 1.125rem;
          min-height: 3rem;
        `;default:return Ut`
          padding: 0.75rem 1.25rem;
          font-size: 1rem;
          min-height: 2.5rem;
        `}}}
  
  /* Variant styles */
  ${({variant:i,theme:o})=>{switch(i){case"secondary":return Ut`
          background: ${o.colors.secondary};
          color: ${o.colors.text.primary};
          
          &:hover:not(:disabled) {
            background: ${o.colors.secondary}dd;
          }
        `;case"outline":return Ut`
          background: transparent;
          color: ${o.colors.primary};
          border: 2px solid ${o.colors.primary};
          
          &:hover:not(:disabled) {
            background: ${o.colors.primary};
            color: white;
          }
        `;case"ghost":return Ut`
          background: transparent;
          color: ${o.colors.text.primary};
          
          &:hover:not(:disabled) {
            background: ${o.colors.background.secondary};
          }
        `;case"danger":return Ut`
          background: ${o.colors.error};
          color: white;
          
          &:hover:not(:disabled) {
            background: ${o.colors.error}dd;
          }
        `;default:return Ut`
          background: ${o.colors.primary};
          color: white;
          
          &:hover:not(:disabled) {
            background: ${o.colors.primary}dd;
          }
        `}}}
`,eg=x.div`
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`,Et=({variant:i="primary",size:o="medium",disabled:m=!1,loading:s=!1,fullWidth:S=!1,onClick:M,type:T="button",children:O,className:H,testId:N,...q})=>{const U=_=>{s||m||M?.(_)};return f.jsxs(tg,{variant:i,size:o,disabled:m||s,fullWidth:S,onClick:U,type:T,className:H,"data-testid":N,...q,children:[s&&f.jsx(eg,{}),O]})},lg=x.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: ${({theme:i})=>i.spacing.xl};
  text-align: center;
`,ag=x.h1`
  color: ${({theme:i})=>i.colors.primary};
  margin-bottom: ${({theme:i})=>i.spacing.lg};
`,ng=x.p`
  font-size: 1.2rem;
  color: ${({theme:i})=>i.colors.text.secondary};
  margin-bottom: ${({theme:i})=>i.spacing.xl};
  max-width: 600px;
`,ug=x.div`
  display: flex;
  gap: ${({theme:i})=>i.spacing.md};
  flex-wrap: wrap;
  justify-content: center;
`,Bu=x(Et)`
  padding: ${({theme:i})=>i.spacing.md} ${({theme:i})=>i.spacing.xl};
  font-size: 1rem;
  min-width: 180px;
`;function ig(){const i=Zu(),{user:o}=Me();return f.jsxs(lg,{children:[f.jsx(ag,{children:"Welcome to Learn2Play!"}),f.jsx(ng,{children:"A feature-rich, real-time multiplayer quiz game with advanced scoring, leaderboards, and comprehensive localization support."}),f.jsxs(ug,{children:[f.jsxs(Bu,{onClick:()=>i("/lobby"),children:["🎮 ",o?"Create/Join Game":"Play as Guest"]}),f.jsx(Bu,{variant:"outline",onClick:()=>i("/hall-of-fame"),children:"🏆 Hall of Fame"}),o?f.jsxs(Bu,{variant:"ghost",onClick:()=>i("/lobby"),children:["👋 Welcome, ",o.username,"!"]}):f.jsx(Bu,{variant:"secondary",onClick:()=>i("/login"),children:"🔐 Login"})]})]})}const cg=x.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  ${({fullWidth:i})=>i&&Ut`width: 100%;`}
`,rg=x.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({theme:i})=>i.colors.text.primary};
  margin-bottom: 0.25rem;
`,sg=x.div`
  position: relative;
  display: flex;
  align-items: center;
  border: 2px solid ${({theme:i,hasError:o})=>o?i.colors.error:i.colors.border};
  border-radius: 8px;
  background: ${({theme:i,disabled:o})=>o?i.colors.background.secondary:i.colors.background.paper};
  transition: all 0.2s ease-in-out;
  
  &:focus-within {
    border-color: ${({theme:i,hasError:o})=>o?i.colors.error:i.colors.primary};
    box-shadow: 0 0 0 3px ${({theme:i,hasError:o})=>o?`${i.colors.error}20`:`${i.colors.primary}20`};
  }
  
  ${({size:i})=>{switch(i){case"small":return Ut`
          min-height: 2rem;
          padding: 0.25rem 0.5rem;
        `;case"large":return Ut`
          min-height: 3rem;
          padding: 0.75rem 1rem;
        `;default:return Ut`
          min-height: 2.5rem;
          padding: 0.5rem 0.75rem;
        `}}}
  
  ${({hasStartIcon:i})=>i&&Ut`
    padding-left: 2.5rem;
  `}
  
  ${({hasEndIcon:i})=>i&&Ut`
    padding-right: 2.5rem;
  `}
`,og=x.input`
  border: none;
  outline: none;
  background: transparent;
  color: ${({theme:i})=>i.colors.text.primary};
  font-size: 1rem;
  width: 100%;
  
  &::placeholder {
    color: ${({theme:i})=>i.colors.text.secondary};
  }
  
  &:disabled {
    cursor: not-allowed;
    color: ${({theme:i})=>i.colors.text.disabled};
  }
`,xd=x.div`
  position: absolute;
  ${({position:i})=>i==="start"?"left: 0.75rem;":"right: 0.75rem;"}
  display: flex;
  align-items: center;
  color: ${({theme:i})=>i.colors.text.secondary};
  pointer-events: none;
`,fg=x.div`
  font-size: 0.75rem;
  color: ${({theme:i,isError:o})=>o?i.colors.error:i.colors.text.secondary};
  margin-top: 0.25rem;
`,bl=W.forwardRef(({type:i="text",placeholder:o,value:m,defaultValue:s,onChange:S,onBlur:M,onFocus:T,disabled:O=!1,required:H=!1,error:N,label:q,helperText:U,size:_="medium",fullWidth:D=!1,startIcon:Q,endIcon:w,name:J,id:I,className:Y,testId:F,autoComplete:k,autoFocus:R,maxLength:B,minLength:V,pattern:St,min:Gt,max:Xe,...Yt},wt)=>{const ve=!!N,$t=(typeof N=="string"?N:"")||U;return f.jsxs(cg,{fullWidth:D,className:Y,children:[q&&f.jsxs(rg,{htmlFor:I,children:[q,H&&f.jsx("span",{style:{color:"red",marginLeft:"0.25rem"},children:"*"})]}),f.jsxs(sg,{hasError:ve,disabled:O,size:_,hasStartIcon:!!Q,hasEndIcon:!!w,children:[Q&&f.jsx(xd,{position:"start",children:Q}),f.jsx(og,{ref:wt,type:i,placeholder:o,value:m,defaultValue:s,onChange:S,onBlur:M,onFocus:T,disabled:O,required:H,name:J,id:I,"data-testid":F,autoComplete:k,autoFocus:R,maxLength:B,minLength:V,pattern:St,min:Gt,max:Xe,...Yt}),w&&f.jsx(xd,{position:"end",children:w})]}),$t&&f.jsx(fg,{isError:ve,children:$t})]})});bl.displayName="Input";const dg=Xu`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`,mg=Xu`
  from {
    opacity: 0;
    transform: translateY(-2rem) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`,hg=x.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: ${dg} 0.2s ease-out;
`,gg=x.div`
  background: ${({theme:i})=>i.colors.background.paper};
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: ${mg} 0.2s ease-out;
  
  ${({size:i})=>{switch(i){case"small":return Ut`
          width: 100%;
          max-width: 400px;
        `;case"large":return Ut`
          width: 100%;
          max-width: 800px;
        `;case"fullscreen":return Ut`
          width: 100vw;
          height: 100vh;
          max-width: none;
          max-height: none;
          border-radius: 0;
        `;default:return Ut`
          width: 100%;
          max-width: 600px;
        `}}}
`,yg=x.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid ${({theme:i})=>i.colors.border};
`,bg=x.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({theme:i})=>i.colors.text.primary};
`,vg=x.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${({theme:i})=>i.colors.text.secondary};
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    color: ${({theme:i})=>i.colors.text.primary};
    background: ${({theme:i})=>i.colors.background.secondary};
  }
  
  &:focus {
    outline: 2px solid ${({theme:i})=>i.colors.primary};
    outline-offset: 2px;
  }
`,pg=x.div`
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
`,xg=({isOpen:i,onClose:o,title:m,children:s,size:S="medium",closeOnBackdropClick:M=!0,closeOnEscape:T=!0,showCloseButton:O=!0,className:H,testId:N})=>{const q=W.useRef(null);W.useEffect(()=>{const D=Q=>{Q.key==="Escape"&&T&&o()};return i&&(document.addEventListener("keydown",D),document.body.style.overflow="hidden"),()=>{document.removeEventListener("keydown",D),document.body.style.overflow="unset"}},[i,T,o]);const U=D=>{D.target===D.currentTarget&&M&&o()};if(!i)return null;const _=f.jsx(hg,{onClick:U,"data-testid":N,children:f.jsxs(gg,{ref:q,size:S,className:H,role:"dialog","aria-modal":"true","aria-labelledby":m?"modal-title":void 0,children:[(m||O)&&f.jsxs(yg,{children:[m&&f.jsx(bg,{id:"modal-title",children:m}),O&&f.jsx(vg,{onClick:o,"aria-label":"Close modal",type:"button",children:"×"})]}),f.jsx(pg,{children:s})]})});return y0.createPortal(_,document.body)};x.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid ${({theme:i})=>i.colors.border};
  margin-top: auto;
`;const Sg=Xu`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`,zg=x.div`
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${({fullPage:i})=>i&&`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    z-index: 999;
  `}
`,Ag=x.div`
  border-radius: 50%;
  animation: ${Sg} 1s linear infinite;
  
  ${({size:i})=>{switch(i){case"small":return`
          width: 1rem;
          height: 1rem;
          border-width: 2px;
        `;case"large":return`
          width: 3rem;
          height: 3rem;
          border-width: 4px;
        `;default:return`
          width: 1.5rem;
          height: 1.5rem;
          border-width: 3px;
        `}}}
  
  ${({variant:i,theme:o})=>{switch(i){case"secondary":return`
          border: 3px solid ${o.colors.secondary}20;
          border-top-color: ${o.colors.secondary};
        `;case"white":return`
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top-color: white;
        `;default:return`
          border: 3px solid ${o.colors.primary}20;
          border-top-color: ${o.colors.primary};
        `}}}
`,Vu=({size:i="medium",variant:o="primary",fullPage:m=!1,className:s,testId:S})=>f.jsx(zg,{fullPage:m,className:s,"data-testid":S,children:f.jsx(Ag,{size:i,variant:o})}),Tg=x.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background: ${({theme:i})=>i.colors.background.paper};
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`,jg=x.h2`
  text-align: center;
  margin-bottom: 1rem;
  color: ${({theme:i})=>i.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
`,Eg=x.div`
  background: ${({theme:i})=>i.colors.error}10;
  color: ${({theme:i})=>i.colors.error};
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  border-left: 4px solid ${({theme:i})=>i.colors.error};
`,Mg=x.button`
  background: none;
  border: none;
  color: ${({theme:i})=>i.colors.primary};
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.875rem;
  text-align: center;
  padding: 0.5rem 0;
  
  &:hover {
    color: ${({theme:i})=>i.colors.primary}dd;
  }
`,Sd=i=>i.trim()?i.length<3?"Username must be at least 3 characters":i.length>20?"Username must be less than 20 characters":/^[a-zA-Z0-9_-]+$/.test(i)?null:"Username can only contain letters, numbers, hyphens, and underscores":"Username is required",zd=i=>i?i.length<6?"Password must be at least 6 characters":null:"Password is required",Dg=({onSwitchToRegister:i,onSuccess:o})=>{const{login:m,isLoading:s,error:S,clearError:M}=Me(),[T,O]=W.useState({username:{value:"",error:null,touched:!1,valid:!1},password:{value:"",error:null,touched:!1,valid:!1}}),H=_=>D=>{const Q=D.target.value;let w=null;_==="username"?w=Sd(Q):_==="password"&&(w=zd(Q)),O(J=>({...J,[_]:{value:Q,error:w,touched:!0,valid:!w}})),w&&M()},N=_=>()=>{O(D=>({...D,[_]:{...D[_],touched:!0}}))},q=async _=>{_.preventDefault();const D=Sd(T.username.value),Q=zd(T.password.value),w={username:{...T.username,error:D,touched:!0,valid:!D},password:{...T.password,error:Q,touched:!0,valid:!Q}};if(O(w),!(D||Q))try{await m({username:T.username.value,password:T.password.value}),o?.()}catch(J){console.error("Login failed:",J)}},U=T.username.valid&&T.password.valid;return f.jsxs(Tg,{onSubmit:q,children:[f.jsx(jg,{children:"Welcome Back"}),S&&f.jsx(Eg,{children:S}),f.jsx(bl,{type:"text",label:"Username",placeholder:"Enter your username",value:T.username.value,onChange:H("username"),onBlur:N("username"),error:T.username.touched&&T.username.error||!1,required:!0,autoComplete:"username",disabled:s,fullWidth:!0}),f.jsx(bl,{type:"password",label:"Password",placeholder:"Enter your password",value:T.password.value,onChange:H("password"),onBlur:N("password"),error:T.password.touched&&T.password.error||!1,required:!0,autoComplete:"current-password",disabled:s,fullWidth:!0}),f.jsx(Et,{type:"submit",loading:s,disabled:!U,fullWidth:!0,size:"large",children:"Sign In"}),i&&f.jsx(Mg,{type:"button",onClick:i,disabled:s,children:"Don't have an account? Sign up"})]})},Ug=x.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background: ${({theme:i})=>i.colors.background.paper};
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`,Og=x.h2`
  text-align: center;
  margin-bottom: 1rem;
  color: ${({theme:i})=>i.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
`,_g=x.div`
  background: ${({theme:i})=>i.colors.error}10;
  color: ${({theme:i})=>i.colors.error};
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  border-left: 4px solid ${({theme:i})=>i.colors.error};
`,qg=x.button`
  background: none;
  border: none;
  color: ${({theme:i})=>i.colors.primary};
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.875rem;
  text-align: center;
  padding: 0.5rem 0;
  
  &:hover {
    color: ${({theme:i})=>i.colors.primary}dd;
  }
`,Rg=x.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`,Cg=x.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({theme:i})=>i.colors.text.primary};
`,wg=x.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
`,Hg=x.button`
  aspect-ratio: 1;
  border: 2px solid ${({theme:i,selected:o})=>o?i.colors.primary:i.colors.border};
  border-radius: 8px;
  background: ${({theme:i,selected:o})=>o?`${i.colors.primary}10`:i.colors.background.secondary};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    border-color: ${({theme:i})=>i.colors.primary};
    background: ${({theme:i})=>`${i.colors.primary}10`};
  }
  
  &:focus {
    outline: 2px solid ${({theme:i})=>i.colors.primary};
    outline-offset: 2px;
  }
`,Ng=x.div`
  color: ${({theme:i})=>i.colors.error};
  font-size: 0.75rem;
  margin-top: 0.25rem;
`,Bg=["👨","👩","🧑","👦","👧","🧓","👴","👵"],Ad=i=>i.trim()?i.length<3?"Username must be at least 3 characters":i.length>20?"Username must be less than 20 characters":/^[a-zA-Z0-9_-]+$/.test(i)?null:"Username can only contain letters, numbers, hyphens, and underscores":"Username is required",Td=i=>i?i.length<6?"Password must be at least 6 characters":null:"Password is required",fr=(i,o)=>o?i!==o?"Passwords do not match":null:"Please confirm your password",jd=i=>i?null:"Please select a character",Lg=({onSwitchToLogin:i,onSuccess:o})=>{const{register:m,isLoading:s,error:S,clearError:M}=Me(),[T,O]=W.useState({username:{value:"",error:null,touched:!1,valid:!1},password:{value:"",error:null,touched:!1,valid:!1},confirmPassword:{value:"",error:null,touched:!1,valid:!1},character:{value:"",error:null,touched:!1,valid:!1}}),H=D=>Q=>{const w=Q.target.value;let J=null;switch(D){case"username":J=Ad(w);break;case"password":if(J=Td(w),T.confirmPassword.touched){const I=fr(w,T.confirmPassword.value);O(Y=>({...Y,confirmPassword:{...Y.confirmPassword,error:I,valid:!I}}))}break;case"confirmPassword":J=fr(T.password.value,w);break}O(I=>({...I,[D]:{value:w,error:J,touched:!0,valid:!J}})),J&&M()},N=D=>{const Q=jd(D);O(w=>({...w,character:{value:D,error:Q,touched:!0,valid:!Q}})),M()},q=D=>()=>{O(Q=>({...Q,[D]:{...Q[D],touched:!0}}))},U=async D=>{D.preventDefault();const Q=Ad(T.username.value),w=Td(T.password.value),J=fr(T.password.value,T.confirmPassword.value),I=jd(T.character.value),Y={username:{...T.username,error:Q,touched:!0,valid:!Q},password:{...T.password,error:w,touched:!0,valid:!w},confirmPassword:{...T.confirmPassword,error:J,touched:!0,valid:!J},character:{...T.character,error:I,touched:!0,valid:!I}};if(O(Y),!(Q||w||J||I))try{await m({username:T.username.value,password:T.password.value,character:T.character.value}),o?.()}catch(F){console.error("Registration failed:",F)}},_=T.username.valid&&T.password.valid&&T.confirmPassword.valid&&T.character.valid;return f.jsxs(Ug,{onSubmit:U,children:[f.jsx(Og,{children:"Create Account"}),S&&f.jsx(_g,{children:S}),f.jsx(bl,{type:"text",label:"Username",placeholder:"Choose a username",value:T.username.value,onChange:H("username"),onBlur:q("username"),error:T.username.touched&&T.username.error||!1,required:!0,autoComplete:"username",disabled:s,fullWidth:!0}),f.jsx(bl,{type:"password",label:"Password",placeholder:"Create a password",value:T.password.value,onChange:H("password"),onBlur:q("password"),error:T.password.touched&&T.password.error||!1,required:!0,autoComplete:"new-password",disabled:s,fullWidth:!0}),f.jsx(bl,{type:"password",label:"Confirm Password",placeholder:"Confirm your password",value:T.confirmPassword.value,onChange:H("confirmPassword"),onBlur:q("confirmPassword"),error:T.confirmPassword.touched&&T.confirmPassword.error||!1,required:!0,autoComplete:"new-password",disabled:s,fullWidth:!0}),f.jsxs(Rg,{children:[f.jsx(Cg,{children:"Choose your character *"}),f.jsx(wg,{children:Bg.map(D=>f.jsx(Hg,{type:"button",selected:T.character.value===D,onClick:()=>N(D),disabled:s,children:D},D))}),T.character.touched&&T.character.error&&f.jsx(Ng,{children:T.character.error})]}),f.jsx(Et,{type:"submit",loading:s,disabled:!_,fullWidth:!0,size:"large",children:"Create Account"}),i&&f.jsx(qg,{type:"button",onClick:i,disabled:s,children:"Already have an account? Sign in"})]})},$d=({isOpen:i,onClose:o,initialMode:m="login",onSuccess:s})=>{const[S,M]=W.useState(m),T=()=>{s?.(),o()},O=()=>M("login"),H=()=>M("register");return f.jsx(xg,{isOpen:i,onClose:o,size:"small",showCloseButton:!1,children:S==="login"?f.jsx(Dg,{onSwitchToRegister:H,onSuccess:T}):f.jsx(Lg,{onSwitchToLogin:O,onSuccess:T})})},Qg=x.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: ${({theme:i})=>i.spacing.xl};
`,Gg=x.div`
  background: ${({theme:i})=>i.colors.surface};
  border-radius: ${({theme:i})=>i.borderRadius.lg};
  box-shadow: ${({theme:i})=>i.shadows.lg};
  padding: ${({theme:i})=>i.spacing.xl};
  width: 100%;
  max-width: 400px;
`,Yg=x.h1`
  color: ${({theme:i})=>i.colors.text.primary};
  text-align: center;
  margin-bottom: ${({theme:i})=>i.spacing.lg};
  font-size: 2rem;
  font-weight: 700;
`,$g=x.p`
  color: ${({theme:i})=>i.colors.text.secondary};
  text-align: center;
  margin-bottom: ${({theme:i})=>i.spacing.xl};
  font-size: 1rem;
`;function Xg(){const{user:i}=Me();return i?f.jsx(Qd,{to:"/",replace:!0}):f.jsx(Qg,{children:f.jsxs(Gg,{children:[f.jsx(Yg,{children:"Welcome Back!"}),f.jsx($g,{children:"Log in to join multiplayer games and track your progress"}),f.jsx($d,{isOpen:!0,onClose:()=>{},initialMode:"login"})]})})}const Zg=x.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: ${({theme:i})=>i.spacing.xl};
`,Vg=x.div`
  background: ${({theme:i})=>i.colors.surface};
  border-radius: ${({theme:i})=>i.borderRadius.lg};
  box-shadow: ${({theme:i})=>i.shadows.lg};
  padding: ${({theme:i})=>i.spacing.xl};
  width: 100%;
  max-width: 400px;
`,Kg=x.h1`
  color: ${({theme:i})=>i.colors.text.primary};
  text-align: center;
  margin-bottom: ${({theme:i})=>i.spacing.lg};
  font-size: 2rem;
  font-weight: 700;
`,kg=x.p`
  color: ${({theme:i})=>i.colors.text.secondary};
  text-align: center;
  margin-bottom: ${({theme:i})=>i.spacing.xl};
  font-size: 1rem;
`;function Jg(){const{user:i}=Me();return i?f.jsx(Qd,{to:"/",replace:!0}):f.jsx(Zg,{children:f.jsxs(Vg,{children:[f.jsx(Kg,{children:"Join Learn2Play!"}),f.jsx(kg,{children:"Create your account to start playing multiplayer quiz games"}),f.jsx($d,{isOpen:!0,onClose:()=>{},initialMode:"register"})]})})}const Lu={isRunning:!1,timeRemaining:0,totalTime:0,startTime:null,endTime:null},Xd=Yd()($0((i,o)=>({currentLobby:null,joinedLobbies:[],gameState:null,currentQuestion:null,questionNumber:0,totalQuestions:0,timer:Lu,hasAnswered:!1,selectedAnswer:null,playerScore:0,playerMultiplier:1,gameResults:null,isLoading:!1,error:null,isConnected:!1,reconnectAttempts:0,createLobby:async(m,s=8)=>{i({isLoading:!0,error:null});try{const S={host:{username:"current-user",character:"default",score:0,multiplier:1,is_ready:!0,is_host:!0,connected:!0},question_set:m,max_players:s,is_private:!1},M=await Ee.createLobby(S);return i({currentLobby:M,joinedLobbies:[...o().joinedLobbies,M.code],isLoading:!1}),M}catch(S){const M=S instanceof Error?S.message:"Failed to create lobby";throw i({error:M,isLoading:!1}),S}},joinLobby:async(m,s)=>{i({isLoading:!0,error:null});try{const S=await Ee.joinLobby(m,s);return i({currentLobby:S,joinedLobbies:[...o().joinedLobbies,m],isLoading:!1}),S}catch(S){const M=S instanceof Error?S.message:"Failed to join lobby";throw i({error:M,isLoading:!1}),S}},leaveLobby:async(m,s)=>{i({isLoading:!0,error:null});try{await Ee.leaveLobby(m,s),i({currentLobby:null,joinedLobbies:o().joinedLobbies.filter(S=>S!==m),isLoading:!1})}catch(S){const M=S instanceof Error?S.message:"Failed to leave lobby";throw i({error:M,isLoading:!1}),S}},updateLobby:m=>{i({currentLobby:m})},startGame:async m=>{i({isLoading:!0,error:null});try{const s=await Ee.getLobby(m);if(s.questions&&s.questions.length>0){const S={lobbyCode:m,phase:"starting",currentQuestion:0,scores:{},playerMultipliers:{},playerAnswers:{},hasAnswered:!1,questionStartTime:null,questionEndTime:null,playerStreaks:{},playerCorrectAnswers:{},totalQuestions:s.questions.length};s.players.forEach(M=>{S.scores[M.username]=M.score,S.playerMultipliers[M.username]=M.multiplier,S.playerStreaks[M.username]=0,S.playerCorrectAnswers[M.username]=0}),i({gameState:S,currentQuestion:s.questions[0],questionNumber:1,totalQuestions:s.questions.length,hasAnswered:!1,selectedAnswer:null,isLoading:!1})}}catch(s){const S=s instanceof Error?s.message:"Failed to start game";throw i({error:S,isLoading:!1}),s}},submitAnswer:async m=>{const{currentLobby:s,currentQuestion:S}=o();if(!s||!S)throw new Error("No active game or question");i({hasAnswered:!0,selectedAnswer:m}),console.log(`Submitted answer: ${m} for question: ${S.question}`)},nextQuestion:()=>{const{gameState:m,currentLobby:s,questionNumber:S}=o();if(!(!m||!s))if(S<m.totalQuestions){const M=S,T=s.questions[M];i({currentQuestion:T,questionNumber:S+1,hasAnswered:!1,selectedAnswer:null,timer:Lu})}else i({gameState:{...m,phase:"finished"}})},endGame:async()=>{const{gameState:m}=o();m&&i({gameState:{...m,phase:"finished"},timer:Lu})},startTimer:m=>{const s=new Date;i({timer:{isRunning:!0,timeRemaining:m,totalTime:m,startTime:s,endTime:new Date(s.getTime()+m*1e3)}})},stopTimer:()=>{i({timer:{...o().timer,isRunning:!1}})},updateTimer:m=>{i({timer:{...o().timer,timeRemaining:Math.max(0,m)}})},setAnswer:m=>{i({selectedAnswer:m})},clearAnswer:()=>{i({selectedAnswer:null,hasAnswered:!1})},updateScore:m=>{i({playerScore:m})},updateMultiplier:m=>{i({playerMultiplier:m})},clearError:()=>{i({error:null})},setLoading:m=>{i({isLoading:m})},reset:()=>{i({currentLobby:null,gameState:null,currentQuestion:null,questionNumber:0,totalQuestions:0,timer:Lu,hasAnswered:!1,selectedAnswer:null,playerScore:0,playerMultiplier:1,gameResults:null,error:null,isConnected:!1,reconnectAttempts:0})},setConnected:m=>{i({isConnected:m}),m&&i({reconnectAttempts:0})},incrementReconnectAttempts:()=>{i({reconnectAttempts:o().reconnectAttempts+1})},resetReconnectAttempts:()=>{i({reconnectAttempts:0})}}))),Zd=(i={})=>{const{url:o="ws://10.0.0.44",autoConnect:m=!0,reconnectAttempts:s=5,reconnectDelay:S=1e3}=i,{token:M,isAuthenticated:T}=Me(),O=W.useRef(null),H=W.useRef(null),N=W.useRef(new Map),[q,U]=W.useState({connected:!1,connecting:!1,error:null,lastMessage:null,reconnectAttempts:0}),_=W.useCallback(()=>{H.current&&(clearTimeout(H.current),H.current=null)},[]),D=W.useCallback(()=>{U(R=>({...R,connected:!0,connecting:!1,error:null,reconnectAttempts:0})),_()},[_]),Q=W.useCallback(R=>{U(B=>({...B,connected:!1,connecting:!1,error:R==="io client disconnect"?null:`Disconnected: ${R}`})),R!=="io client disconnect"&&q.reconnectAttempts<s&&(U(B=>({...B,connecting:!0})),H.current=setTimeout(()=>{O.current&&!O.current.connected&&(U(B=>({...B,reconnectAttempts:B.reconnectAttempts+1})),O.current.connect())},S*Math.pow(2,q.reconnectAttempts)))},[q.reconnectAttempts,s,S]),w=W.useCallback(R=>{U(B=>({...B,error:R.message,connecting:!1}))},[]),J=W.useCallback((R,B)=>{const V={type:R,data:B,timestamp:new Date().toISOString()};U(Gt=>({...Gt,lastMessage:V}));const St=N.current.get(R);St&&St.forEach(Gt=>Gt(B))},[]),I=W.useCallback(()=>{if(!(O.current?.connected||!T)){U(R=>({...R,connecting:!0,error:null}));try{const R=j0(o,{auth:{token:M},transports:["websocket","polling"],timeout:1e4,forceNew:!0});R.on("connect",D),R.on("disconnect",Q),R.on("connect_error",w),R.onAny((B,...V)=>{J(B,V.length===1?V[0]:V)}),O.current=R}catch(R){w(R)}}},[o,M,T,D,Q,w,J]),Y=W.useCallback(()=>{_(),O.current&&(O.current.disconnect(),O.current=null),U(R=>({...R,connected:!1,connecting:!1,error:null,reconnectAttempts:0}))},[_]),F=W.useCallback((R,B)=>{O.current?.connected?O.current.emit(R,B):console.warn(`Cannot emit ${R}: WebSocket not connected`)},[]),k=W.useCallback((R,B)=>(N.current.has(R)||N.current.set(R,new Set),N.current.get(R).add(B),()=>{const V=N.current.get(R);V&&(V.delete(B),V.size===0&&N.current.delete(R))}),[]);return W.useEffect(()=>{T&&m&&!O.current?I():!T&&O.current&&Y()},[T,m,I,Y]),W.useEffect(()=>()=>{_(),O.current&&O.current.disconnect()},[_]),W.useEffect(()=>{if(!O.current?.connected)return;const R=setInterval(()=>{O.current?.connected&&O.current.emit("ping")},3e4);return()=>clearInterval(R)},[q.connected]),{...q,socket:O.current,connect:I,disconnect:Y,emit:F,subscribe:k,isConnected:q.connected}},Wg=x.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: ${({theme:i})=>i.colors.background.paper};
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`,Fg=x.div`
  text-align: center;
  margin-bottom: 2rem;
`,Ig=x.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${({theme:i})=>i.colors.primary};
  margin-bottom: 0.5rem;
  letter-spacing: 0.2em;
`,Pg=x.div`
  color: ${({theme:i})=>i.colors.text.secondary};
  font-size: 0.875rem;
`,Ed=x.div`
  margin-bottom: 2rem;
`,Md=x.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({theme:i})=>i.colors.text.primary};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,ty=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`,ey=x.div`
  padding: 1rem;
  border: 2px solid ${({theme:i,isHost:o,isCurrentUser:m})=>m?i.colors.primary:o?i.colors.secondary:i.colors.border};
  border-radius: 8px;
  background: ${({theme:i,isHost:o,isCurrentUser:m})=>m?`${i.colors.primary}10`:o?`${i.colors.secondary}10`:i.colors.background.secondary};
  position: relative;
`,ly=x.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`,ay=x.div`
  font-size: 2rem;
`,ny=x.div`
  flex: 1;
`,uy=x.div`
  font-weight: 600;
  color: ${({theme:i})=>i.colors.text.primary};
`,iy=x.div`
  font-size: 0.75rem;
  color: ${({theme:i})=>i.colors.text.secondary};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`,cy=x.div`
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  ${({status:i,theme:o})=>{switch(i){case"ready":return`
          background: ${o.colors.success}20;
          color: ${o.colors.success};
        `;case"not-ready":return`
          background: ${o.colors.warning}20;
          color: ${o.colors.warning};
        `;case"host":return`
          background: ${o.colors.primary}20;
          color: ${o.colors.primary};
        `;case"disconnected":return`
          background: ${o.colors.error}20;
          color: ${o.colors.error};
        `;default:return`
          background: ${o.colors.background.secondary};
          color: ${o.colors.text.secondary};
        `}}}
`,ry=x.div`
  background: ${({theme:i})=>i.colors.background.secondary};
  padding: 1rem;
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
`,Qu=x.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`,Gu=x.div`
  font-size: 0.75rem;
  color: ${({theme:i})=>i.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Yu=x.div`
  font-weight: 600;
  color: ${({theme:i})=>i.colors.text.primary};
`,sy=x.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
`,oy=x.div`
  padding: 1rem;
  border: 2px dashed ${({theme:i})=>i.colors.border};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({theme:i})=>i.colors.text.secondary};
  font-size: 0.875rem;
`,fy=({lobby:i,currentUsername:o,onReady:m,onStart:s,onLeave:S,onCopyCode:M})=>{const T=i.players.find(U=>U.username===o),O=T?.is_host||!1,H=O&&i.players.every(U=>U.is_ready)&&i.players.length>=2,N=U=>U.connected?U.is_host?"host":U.is_ready?"ready":"not-ready":"disconnected",q=Array.from({length:Math.max(0,i.max_players-i.players.length)});return f.jsxs(Wg,{children:[f.jsxs(Fg,{children:[f.jsx(Ig,{onClick:M,style:{cursor:"pointer"},children:i.code}),f.jsxs(Pg,{children:["Click to copy lobby code • ",i.players.length,"/",i.max_players," players"]})]}),f.jsxs(Ed,{children:[f.jsxs(Md,{children:["👥 Players (",i.players.length,"/",i.max_players,")"]}),f.jsxs(ty,{children:[i.players.map(U=>f.jsx(ey,{isHost:U.is_host,isCurrentUser:U.username===o,children:f.jsxs(ly,{children:[f.jsx(ay,{children:U.character}),f.jsxs(ny,{children:[f.jsx(uy,{children:U.username}),f.jsxs(iy,{children:[f.jsx(cy,{status:N(U),children:N(U)}),U.score>0&&f.jsxs("span",{children:["Score: ",U.score]})]})]})]})},U.username)),q.map((U,_)=>f.jsx(oy,{children:"Waiting for player..."},`empty-${_}`))]})]}),f.jsxs(Ed,{children:[f.jsx(Md,{children:"⚙️ Game Settings"}),f.jsxs(ry,{children:[f.jsxs(Qu,{children:[f.jsx(Gu,{children:"Question Set"}),f.jsx(Yu,{children:i.question_set})]}),f.jsxs(Qu,{children:[f.jsx(Gu,{children:"Time Limit"}),f.jsxs(Yu,{children:[i.settings?.question_time_limit||30,"s"]})]}),f.jsxs(Qu,{children:[f.jsx(Gu,{children:"Difficulty"}),f.jsx(Yu,{children:i.settings?.difficulty||"Mixed"})]}),f.jsxs(Qu,{children:[f.jsx(Gu,{children:"Privacy"}),f.jsx(Yu,{children:i.is_private?"Private":"Public"})]})]})]}),f.jsxs(sy,{children:[S&&f.jsx(Et,{variant:"outline",onClick:S,children:"Leave Lobby"}),T&&!T.is_ready&&m&&f.jsx(Et,{onClick:m,children:"Ready Up"}),O&&H&&s&&f.jsx(Et,{variant:"primary",size:"large",onClick:s,children:"Start Game"}),O&&!H&&f.jsx(Et,{variant:"secondary",disabled:!0,children:i.players.length<2?"Need at least 2 players":"Waiting for all players to be ready"})]})]})},Dd=x.div`
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  background: ${({theme:i})=>i.colors.background.paper};
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`,dy=x.h2`
  text-align: center;
  margin-bottom: 2rem;
  color: ${({theme:i})=>i.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
`,dr=x.div`
  margin-bottom: 1.5rem;
`,mr=x.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${({theme:i})=>i.colors.text.primary};
  margin-bottom: 0.75rem;
`,my=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
`,hy=x.button`
  padding: 1rem;
  border: 2px solid ${({theme:i,selected:o})=>o?i.colors.primary:i.colors.border};
  border-radius: 8px;
  background: ${({theme:i,selected:o})=>o?`${i.colors.primary}10`:i.colors.background.secondary};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-align: left;
  
  &:hover {
    border-color: ${({theme:i})=>i.colors.primary};
    background: ${({theme:i})=>`${i.colors.primary}10`};
  }
  
  &:focus {
    outline: 2px solid ${({theme:i})=>i.colors.primary};
    outline-offset: 2px;
  }
`,gy=x.div`
  font-weight: 600;
  color: ${({theme:i})=>i.colors.text.primary};
  margin-bottom: 0.25rem;
`,yy=x.div`
  font-size: 0.875rem;
  color: ${({theme:i})=>i.colors.text.secondary};
`,by=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
`,hr=x.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: ${({theme:i})=>i.colors.text.primary};
  font-size: 0.875rem;
`,gr=x.input`
  width: 1rem;
  height: 1rem;
  accent-color: ${({theme:i})=>i.colors.primary};
`,vy=x.div`
  background: ${({theme:i})=>i.colors.error}10;
  color: ${({theme:i})=>i.colors.error};
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  border-left: 4px solid ${({theme:i})=>i.colors.error};
  margin-bottom: 1rem;
`,py=({onLobbyCreated:i,onCancel:o})=>{const{user:m}=Me(),[s,S]=W.useState([]),[M,T]=W.useState(!0),[O,H]=W.useState(!1),[N,q]=W.useState(null),[U,_]=W.useState(""),[D,Q]=W.useState("4"),[w,J]=W.useState(!1),[I,Y]=W.useState({question_time_limit:30,difficulty:"mixed",shuffle_questions:!0,shuffle_answers:!0});W.useEffect(()=>{(async()=>{try{T(!0);const R=await Ee.getCatalogs();S(R),R.length>0&&_(R[0].name)}catch(R){q("Failed to load question sets"),console.error("Failed to fetch catalogs:",R)}finally{T(!1)}})()},[]);const F=async()=>{if(!(!m||!U))try{H(!0),q(null);const k={host:{username:m.username,character:m.character,score:0,multiplier:1,is_ready:!0,is_host:!0,connected:!0},question_set:U,max_players:parseInt(D,10),is_private:w,settings:{...I,max_players:parseInt(D,10)}},R=await Ee.createLobby(k);i?.(R.code)}catch(k){const R=k instanceof Error?k.message:"Failed to create lobby";q(R),console.error("Failed to create lobby:",k)}finally{H(!1)}};return M?f.jsx(Dd,{children:f.jsx(Vu,{size:"large"})}):f.jsxs(Dd,{children:[f.jsx(dy,{children:"Create New Game"}),N&&f.jsx(vy,{children:N}),f.jsxs(dr,{children:[f.jsx(mr,{children:"Question Set"}),f.jsx(my,{children:s.map(k=>f.jsxs(hy,{selected:U===k.name,onClick:()=>_(k.name),disabled:O,type:"button",children:[f.jsx(gy,{children:k.display_name}),f.jsxs(yy,{children:[k.question_count," questions"]})]},k.name))})]}),f.jsxs(dr,{children:[f.jsx(mr,{children:"Game Settings"}),f.jsxs(by,{children:[f.jsx(bl,{type:"number",label:"Max Players",value:D,onChange:k=>Q(k.target.value),min:"2",max:"8",disabled:O}),f.jsx(bl,{type:"number",label:"Time per Question",value:I.question_time_limit?.toString()||"30",onChange:k=>Y(R=>({...R,question_time_limit:parseInt(k.target.value,10)||30})),min:"10",max:"120",disabled:O,helperText:"seconds"})]})]}),f.jsxs(dr,{children:[f.jsx(mr,{children:"Options"}),f.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.75rem"},children:[f.jsxs(hr,{children:[f.jsx(gr,{type:"checkbox",checked:w,onChange:k=>J(k.target.checked),disabled:O}),"Private lobby (invite only)"]}),f.jsxs(hr,{children:[f.jsx(gr,{type:"checkbox",checked:I.shuffle_questions||!1,onChange:k=>Y(R=>({...R,shuffle_questions:k.target.checked})),disabled:O}),"Shuffle questions"]}),f.jsxs(hr,{children:[f.jsx(gr,{type:"checkbox",checked:I.shuffle_answers||!1,onChange:k=>Y(R=>({...R,shuffle_answers:k.target.checked})),disabled:O}),"Shuffle answer options"]})]})]}),f.jsxs("div",{style:{display:"flex",gap:"1rem",marginTop:"2rem"},children:[o&&f.jsx(Et,{variant:"secondary",onClick:o,disabled:O,fullWidth:!0,children:"Cancel"}),f.jsx(Et,{onClick:F,loading:O,disabled:!U,fullWidth:!0,children:"Create Lobby"})]})]})},Ud=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({theme:i})=>i.spacing.xl};
`,xy=x.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: ${({theme:i})=>i.spacing.xl};
  flex-wrap: wrap;
  gap: ${({theme:i})=>i.spacing.md};
`,Sy=x.h1`
  color: ${({theme:i})=>i.colors.text.primary};
  font-size: 2rem;
  font-weight: 700;
`,Od=x.div`
  background: ${({theme:i})=>i.colors.error}15;
  border: 1px solid ${({theme:i})=>i.colors.error};
  color: ${({theme:i})=>i.colors.error};
  padding: ${({theme:i})=>i.spacing.md};
  border-radius: ${({theme:i})=>i.borderRadius.md};
  margin-bottom: ${({theme:i})=>i.spacing.lg};
`,zy=x.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;function _d(){const{code:i}=Gd(),o=Zu(),{user:m}=Me(),{currentLobby:s,joinLobby:S,leaveLobby:M,startGame:T}=Xd(),[O,H]=W.useState(!i),[N,q]=W.useState(null),[U,_]=W.useState(!1),{socket:D,isConnected:Q}=Zd();W.useEffect(()=>{i&&!s&&w(i)},[i,s]),W.useEffect(()=>{if(!D||!Q)return;const Y=V=>{console.log("Lobby updated:",V)},F=V=>{console.log("Player joined:",V)},k=V=>{console.log("Player left:",V)},R=V=>{o(`/game/${V.code}`)},B=V=>{q(V.message||"An error occurred"),_(!1)};return D.on("lobby:updated",Y),D.on("player:joined",F),D.on("player:left",k),D.on("game:start",R),D.on("lobby:error",B),()=>{D.off("lobby:updated",Y),D.off("player:joined",F),D.off("player:left",k),D.off("game:start",R),D.off("lobby:error",B)}},[D,Q,s,o]);const w=async Y=>{if(m){_(!0),q(null);try{await S(Y,{username:m.username,character:m.character}),H(!1),D&&Q&&D.emit("lobby:join",{code:Y,player:m})}catch(F){q(F.message||"Failed to join lobby")}finally{_(!1)}}},J=async()=>{if(!(!s||!m))try{await M(s.code,m.username),D&&Q&&D.emit("lobby:leave",{code:s.code,playerId:m.username}),o("/lobby",{replace:!0}),H(!0)}catch(Y){q(Y.message||"Failed to leave lobby")}},I=async()=>{if(!(!s||!m))try{await T(s.code),D&&Q&&D.emit("game:start",{code:s.code})}catch(Y){q(Y.message||"Failed to start game")}};return U?f.jsx(Ud,{children:f.jsx(zy,{children:f.jsx(Vu,{size:"large"})})}):f.jsxs(Ud,{children:[f.jsxs(xy,{children:[f.jsx(Sy,{children:s?`Lobby: ${s.code}`:"Game Lobby"}),s&&f.jsx(Et,{variant:"outline",onClick:J,children:"Leave Lobby"})]}),N&&f.jsx(Od,{children:N}),!Q&&f.jsx(Od,{children:"Connecting to game server..."}),O&&f.jsx(py,{onLobbyCreated:Y=>w(Y),onCancel:()=>H(!1)}),s&&f.jsx(fy,{lobby:s,currentUsername:m?.username,onStart:I,onLeave:J})]})}const Ay=Xu`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`,Ty=x.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: ${({theme:i})=>i.colors.background.paper};
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`,jy=x.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
`,Ey=x.div`
  font-size: 0.875rem;
  color: ${({theme:i})=>i.colors.text.secondary};
  font-weight: 500;
`,My=x.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`,Dy=x.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({theme:i,urgent:o})=>o?i.colors.error:i.colors.primary};
  background: ${({theme:i,urgent:o})=>o?`${i.colors.error}10`:`${i.colors.primary}10`};
  padding: 0.75rem 1.5rem;
  border-radius: 24px;
  border: 2px solid ${({theme:i,urgent:o})=>o?i.colors.error:i.colors.primary};
  min-width: 100px;
  text-align: center;
  
  ${({urgent:i})=>i&&`
    animation: ${Ay} 1s infinite;
  `}
`,Uy=x.div`
  text-align: right;
  font-size: 0.875rem;
  color: ${({theme:i})=>i.colors.text.secondary};
`,Oy=x.div`
  margin-bottom: 2rem;
`,_y=x.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({theme:i})=>i.colors.text.primary};
  line-height: 1.4;
  margin-bottom: 1.5rem;
  text-align: center;
`,qy=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`,Ry=x(Et)`
  padding: 1.5rem;
  text-align: left;
  height: auto;
  min-height: 4rem;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
  
  ${({selected:i,theme:o})=>i&&`
    border: 2px solid ${o.colors.primary};
    background: ${o.colors.primary}20;
  `}
  
  ${({correct:i,theme:o})=>i&&`
    background: ${o.colors.success};
    border-color: ${o.colors.success};
    color: white;
    
    &:hover {
      background: ${o.colors.success};
    }
  `}
  
  ${({incorrect:i,theme:o})=>i&&`
    background: ${o.colors.error};
    border-color: ${o.colors.error};
    color: white;
    
    &:hover {
      background: ${o.colors.error};
    }
  `}
  
  &:disabled {
    cursor: default;
  }
`,Cy=x.span`
  font-weight: 700;
  margin-right: 0.75rem;
  opacity: 0.7;
`,wy=x.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
`,Hy=x.div`
  text-align: center;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 500;
  
  ${({type:i,theme:o})=>{switch(i){case"answered":return`
          background: ${o.colors.success}10;
          color: ${o.colors.success};
          border: 1px solid ${o.colors.success}30;
        `;case"timeout":return`
          background: ${o.colors.warning}10;
          color: ${o.colors.warning};
          border: 1px solid ${o.colors.warning}30;
        `;default:return`
          background: ${o.colors.primary}10;
          color: ${o.colors.primary};
          border: 1px solid ${o.colors.primary}30;
        `}}}
`,Ny=["A","B","C","D","E","F"],By=({question:i,questionNumber:o,totalQuestions:m,timeRemaining:s,totalTime:S=30,selectedAnswer:M,hasAnswered:T=!1,showResults:O=!1,correctAnswer:H,currentScore:N=0,onAnswerSelect:q,onSubmitAnswer:U,onNextQuestion:_,disabled:D=!1})=>{const[Q,w]=W.useState(s||S),J=Q<=10,I=M!==void 0&&!T&&!D;W.useEffect(()=>{s!==void 0&&w(s)},[s]);const Y=B=>{D||T||O||q?.(B)},F=B=>{const V=M===B;if(O&&H!==void 0){const St=B===H;return{selected:V&&!O,correct:St,incorrect:V&&!St,disabled:!0}}return{selected:V,disabled:D||T}},R=O?M===H?{type:"answered",message:"🎉 Correct! Well done!"}:M!==void 0?{type:"timeout",message:"❌ Incorrect. Better luck next time!"}:{type:"timeout",message:"⏰ Time's up! No answer submitted."}:T?{type:"answered",message:"✅ Answer submitted! Waiting for other players..."}:null;return f.jsxs(Ty,{children:[f.jsxs(jy,{children:[f.jsxs(Ey,{children:["Question ",o," of ",m]}),f.jsx(My,{children:f.jsxs(Dy,{urgent:J,children:[Math.max(0,Math.ceil(Q)),"s"]})}),f.jsxs(Uy,{children:["Score: ",N]})]}),f.jsxs(Oy,{children:[f.jsx(_y,{children:i.question}),f.jsx(qy,{children:i.answers.map((B,V)=>f.jsxs(Ry,{onClick:()=>Y(V),variant:"outline",...F(V),children:[f.jsxs(Cy,{children:[Ny[V],")"]}),B]},V))})]}),R&&f.jsx(Hy,{type:R.type,children:R.message}),f.jsxs(wy,{children:[I&&U&&f.jsx(Et,{onClick:U,size:"large",variant:"primary",children:"Submit Answer"}),O&&_&&f.jsx(Et,{onClick:_,size:"large",variant:"primary",children:"Next Question"})]})]})},yr=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({theme:i})=>i.spacing.xl};
`,Ly=x.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({theme:i})=>i.spacing.xl};
  flex-wrap: wrap;
  gap: ${({theme:i})=>i.spacing.md};
`,Qy=x.div`
  display: flex;
  flex-direction: column;
  gap: ${({theme:i})=>i.spacing.sm};
`,Gy=x.h1`
  color: ${({theme:i})=>i.colors.text.primary};
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
`,Yy=x.p`
  color: ${({theme:i})=>i.colors.text.secondary};
  font-size: 1rem;
  margin: 0;
`,$y=x.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({theme:i})=>i.spacing.sm};
`,qd=x.div`
  background: ${({theme:i})=>i.colors.background.paper};
  padding: ${({theme:i})=>i.spacing.md};
  border-radius: ${({theme:i})=>i.borderRadius.md};
  box-shadow: ${({theme:i})=>i.shadows.sm};
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
`,Rd=x.span`
  color: ${({theme:i})=>i.colors.text.secondary};
  font-size: 0.875rem;
  font-weight: 500;
`,Cd=x.span`
  color: ${({theme:i})=>i.colors.primary};
  font-size: 1.5rem;
  font-weight: 700;
`,Xy=x.div`
  background: ${({theme:i,active:o})=>o?i.colors.warning:i.colors.background.secondary};
  color: ${({theme:i,active:o})=>o?"#000":i.colors.text.secondary};
  padding: ${({theme:i})=>i.spacing.sm} ${({theme:i})=>i.spacing.md};
  border-radius: ${({theme:i})=>i.borderRadius.sm};
  font-size: 0.875rem;
  font-weight: 600;
  transition: all ${({theme:i})=>i.transitions.fast};
`,wd=x.div`
  background: ${({theme:i})=>i.colors.error}15;
  border: 1px solid ${({theme:i})=>i.colors.error};
  color: ${({theme:i})=>i.colors.error};
  padding: ${({theme:i})=>i.spacing.md};
  border-radius: ${({theme:i})=>i.borderRadius.md};
  margin-bottom: ${({theme:i})=>i.spacing.lg};
`,Zy=x.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  flex-direction: column;
  gap: ${({theme:i})=>i.spacing.lg};
`,Vy=x.p`
  color: ${({theme:i})=>i.colors.text.secondary};
  font-size: 1.125rem;
`,Ky=x.div`
  text-align: center;
  padding: ${({theme:i})=>i.spacing.xl};
  background: ${({theme:i})=>i.colors.background.paper};
  border-radius: ${({theme:i})=>i.borderRadius.lg};
  box-shadow: ${({theme:i})=>i.shadows.lg};
`,ky=x.h2`
  color: ${({theme:i})=>i.colors.text.primary};
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: ${({theme:i})=>i.spacing.lg};
`;function Jy(){const{code:i}=Gd(),o=Zu(),{user:m}=Me(),{currentQuestion:s,questionNumber:S,totalQuestions:M,timer:T,hasAnswered:O,selectedAnswer:H,playerScore:N,playerMultiplier:q,gameResults:U,isLoading:_,error:D,submitAnswer:Q,setAnswer:w,updateTimer:J,setLoading:I}=Xd(),[Y,F]=W.useState(null),[k,R]=W.useState("waiting"),{socket:B,isConnected:V}=Zd();W.useEffect(()=>{if(!i||!m){o("/lobby");return}I(!0),B&&V&&B.emit("game:join",{code:i,player:m})},[i,m,B,V,o,I]),W.useEffect(()=>{if(!B||!V)return;const Yt=tt=>{R("playing"),I(!1),F(null)},wt=tt=>{R("playing")},ve=tt=>{J(tt.timeRemaining)},De=tt=>{console.log("Player answered:",tt)},$t=tt=>{console.log("Question ended:",tt)},A=tt=>{R("finished"),o(`/lobby/${i}?game=finished`)},C=tt=>{F(tt.message||"Game error occurred"),I(!1)},Z=tt=>{console.log("Player disconnected:",tt)};return B.on("game:state",Yt),B.on("question:start",wt),B.on("timer:update",ve),B.on("player:answered",De),B.on("question:end",$t),B.on("game:end",A),B.on("game:error",C),B.on("player:disconnected",Z),()=>{B.off("game:state",Yt),B.off("question:start",wt),B.off("timer:update",ve),B.off("player:answered",De),B.off("question:end",$t),B.off("game:end",A),B.off("game:error",C),B.off("player:disconnected",Z)}},[B,V,i,o,J,I]);const St=Yt=>{O||!s||w(Yt)},Gt=async()=>{if(!(H===null||O||!s))try{await Q(H),B&&V&&B.emit("player:answer",{code:i,questionId:s.id,answer:H,timeElapsed:T.totalTime-T.timeRemaining})}catch(Yt){F(Yt.message||"Failed to submit answer")}},Xe=()=>{B&&V&&B.emit("game:leave",{code:i}),o("/lobby")};return _?f.jsx(yr,{children:f.jsxs(Zy,{children:[f.jsx(Vu,{size:"large"}),f.jsx(Vy,{children:k==="waiting"?"Connecting to game...":"Loading question..."})]})}):k==="finished"||U?f.jsx(yr,{children:f.jsxs(Ky,{children:[f.jsx(ky,{children:"Game Over!"}),f.jsxs(qd,{children:[f.jsx(Rd,{children:"Final Score"}),f.jsx(Cd,{children:N})]}),f.jsxs("div",{style:{marginTop:"2rem",display:"flex",gap:"1rem",justifyContent:"center"},children:[f.jsx(Et,{onClick:()=>o("/lobby"),children:"Back to Lobby"}),f.jsx(Et,{variant:"outline",onClick:()=>o("/hall-of-fame"),children:"View Hall of Fame"})]})]})}):f.jsxs(yr,{children:[f.jsxs(Ly,{children:[f.jsxs(Qy,{children:[f.jsxs(Gy,{children:["Game: ",i]}),f.jsxs(Yy,{children:["Question ",S," of ",M]})]}),f.jsxs($y,{children:[f.jsxs(qd,{children:[f.jsx(Rd,{children:"Score"}),f.jsx(Cd,{children:N})]}),f.jsxs(Xy,{active:q>1,children:[q,"x Multiplier"]}),f.jsx(Et,{variant:"outline",size:"small",onClick:Xe,children:"Leave Game"})]})]}),(D||Y)&&f.jsx(wd,{children:D||Y}),!V&&f.jsx(wd,{children:"Connection lost. Attempting to reconnect..."}),s&&k==="playing"&&f.jsx(By,{question:s,questionNumber:S,totalQuestions:M,selectedAnswer:H??void 0,hasAnswered:O,timeRemaining:T.timeRemaining,totalTime:T.totalTime,currentScore:N,onAnswerSelect:St,onSubmitAnswer:Gt})]})}const Hd=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({theme:i})=>i.spacing.xl};
`,Nd=x.div`
  text-align: center;
  margin-bottom: ${({theme:i})=>i.spacing.xl};
`,Bd=x.h1`
  color: ${({theme:i})=>i.colors.text.primary};
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: ${({theme:i})=>i.spacing.md};
`,Wy=x.p`
  color: ${({theme:i})=>i.colors.text.secondary};
  font-size: 1.125rem;
  margin-bottom: ${({theme:i})=>i.spacing.lg};
`,Fy=x.div`
  display: flex;
  justify-content: center;
  gap: ${({theme:i})=>i.spacing.md};
  margin-bottom: ${({theme:i})=>i.spacing.xl};
  flex-wrap: wrap;
`,$u=x(Et)`
  ${({active:i,theme:o})=>i&&`
    background: ${o.colors.primary};
    color: white;
    border-color: ${o.colors.primary};
  `}
`,Iy=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: ${({theme:i})=>i.spacing.xl};
`,Py=x.div`
  background: ${({theme:i})=>i.colors.background.paper};
  border-radius: ${({theme:i})=>i.borderRadius.lg};
  box-shadow: ${({theme:i})=>i.shadows.lg};
  overflow: hidden;
`,tb=x.div`
  background: ${({theme:i})=>i.colors.primary};
  color: white;
  padding: ${({theme:i})=>i.spacing.lg};
  text-align: center;
`,eb=x.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`,lb=x.p`
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 0.5rem 0 0 0;
`,ab=x.div`
  padding: ${({theme:i})=>i.spacing.lg};
`,nb=x.div`
  display: flex;
  align-items: center;
  padding: ${({theme:i})=>i.spacing.md};
  border-radius: ${({theme:i})=>i.borderRadius.md};
  margin-bottom: ${({theme:i})=>i.spacing.sm};
  transition: all ${({theme:i})=>i.transitions.fast};
  
  ${({isCurrentUser:i,theme:o})=>i&&`
    background: ${o.colors.primary}10;
    border: 1px solid ${o.colors.primary}30;
  `}
  
  &:hover {
    background: ${({theme:i})=>i.colors.background.secondary};
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`,ub=x.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  margin-right: ${({theme:i})=>i.spacing.md};
  
  ${({rank:i,theme:o})=>i===1?"background: #FFD700; color: #000;":i===2?"background: #C0C0C0; color: #000;":i===3?"background: #CD7F32; color: #000;":`background: ${o.colors.background.secondary}; color: ${o.colors.text.primary};`}
`,ib=x.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`,cb=x.span`
  font-weight: 600;
  color: ${({theme:i})=>i.colors.text.primary};
`,rb=x.span`
  font-size: 0.875rem;
  color: ${({theme:i})=>i.colors.text.secondary};
`,sb=x.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
`,ob=x.span`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({theme:i})=>i.colors.primary};
`,fb=x.span`
  font-size: 0.75rem;
  color: ${({theme:i})=>i.colors.text.secondary};
`,Ld=x.div`
  text-align: center;
  padding: ${({theme:i})=>i.spacing.xl};
  color: ${({theme:i})=>i.colors.text.secondary};
`,db=x.div`
  background: ${({theme:i})=>i.colors.error}15;
  border: 1px solid ${({theme:i})=>i.colors.error};
  color: ${({theme:i})=>i.colors.error};
  padding: ${({theme:i})=>i.spacing.md};
  border-radius: ${({theme:i})=>i.borderRadius.md};
  margin-bottom: ${({theme:i})=>i.spacing.lg};
  text-align: center;
`,mb=x.div`
  display: flex;
  justify-content: center;
  gap: ${({theme:i})=>i.spacing.md};
  margin-top: ${({theme:i})=>i.spacing.xl};
`;function hb(){const i=Zu(),{user:o}=Me(),[m,s]=W.useState("all"),{data:S,isLoading:M,error:T,refetch:O}=z0({queryKey:["leaderboards",m],queryFn:async()=>[{questionSet:"General Knowledge",lastUpdated:new Date().toISOString(),entries:[{username:"Player1",character:"wizard",score:1250,questionsCorrect:8,totalQuestions:10},{username:"Player2",character:"knight",score:1100,questionsCorrect:7,totalQuestions:10},{username:"Player3",character:"archer",score:950,questionsCorrect:6,totalQuestions:10}]},{questionSet:"Science & Technology",lastUpdated:new Date().toISOString(),entries:[{username:"TechGuru",character:"robot",score:1400,questionsCorrect:9,totalQuestions:10},{username:"CodeMaster",character:"wizard",score:1200,questionsCorrect:8,totalQuestions:10}]}],refetchInterval:3e4}),H=U=>U.toLocaleString(),N=U=>new Date(U).toLocaleDateString(),q=U=>f.jsxs(Py,{children:[f.jsxs(tb,{children:[f.jsx(eb,{children:U.questionSet}),f.jsxs(lb,{children:[U.entries.length," players • Updated ",N(U.lastUpdated)]})]}),f.jsx(ab,{children:U.entries.length===0?f.jsx(Ld,{children:"No scores yet. Be the first to play!"}):U.entries.map((_,D)=>f.jsxs(nb,{isCurrentUser:o?.username===_.username,children:[f.jsx(ub,{rank:D+1,children:D+1}),f.jsxs(ib,{children:[f.jsx(cb,{children:_.username}),f.jsxs(rb,{children:["Character: ",_.character]})]}),f.jsxs(sb,{children:[f.jsx(ob,{children:H(_.score)}),f.jsxs(fb,{children:[_.questionsCorrect||0,"/",_.totalQuestions||0," correct"]})]})]},`${_.username}-${D}`))})]},U.questionSet);return M?f.jsx(Hd,{children:f.jsxs(Nd,{children:[f.jsx(Bd,{children:"Hall of Fame"}),f.jsx(Vu,{size:"large"})]})}):f.jsxs(Hd,{children:[f.jsxs(Nd,{children:[f.jsx(Bd,{children:"🏆 Hall of Fame"}),f.jsx(Wy,{children:"Top players and their achievements across all game modes"})]}),f.jsxs(Fy,{children:[f.jsx($u,{active:m==="all",onClick:()=>s("all"),variant:m==="all"?"primary":"outline",children:"All Time"}),f.jsx($u,{active:m==="month",onClick:()=>s("month"),variant:m==="month"?"primary":"outline",children:"This Month"}),f.jsx($u,{active:m==="week",onClick:()=>s("week"),variant:m==="week"?"primary":"outline",children:"This Week"}),f.jsx($u,{active:m==="today",onClick:()=>s("today"),variant:m==="today"?"primary":"outline",children:"Today"})]}),T&&f.jsxs(db,{children:[f.jsx("div",{children:"Failed to load leaderboards. Please try again."}),f.jsx("div",{style:{marginTop:"1rem"},children:f.jsx(Et,{variant:"outline",size:"small",onClick:()=>O(),children:"Retry"})})]}),S&&S.length>0?f.jsx(Iy,{children:S.map(q)}):!M&&!T&&f.jsxs(Ld,{children:[f.jsx("h3",{children:"No leaderboards available"}),f.jsx("p",{children:"Start playing to see your scores here!"})]}),f.jsxs(mb,{children:[f.jsx(Et,{onClick:()=>i("/lobby"),children:"Play Game"}),f.jsx(Et,{variant:"outline",onClick:()=>i("/"),children:"Back to Home"})]})]})}function br({children:i}){return f.jsx(f.Fragment,{children:i})}function gb({children:i}){return f.jsx(f.Fragment,{children:i})}function yb({children:i}){return f.jsx(f.Fragment,{children:i})}const bb=new A0({defaultOptions:{queries:{retry:1,refetchOnWindowFocus:!1,staleTime:5*60*1e3},mutations:{retry:1}}});function vb(){return f.jsx(gb,{children:f.jsxs(T0,{client:bb,children:[f.jsxs(g0,{theme:vr,children:[f.jsx(q0,{}),f.jsx(yb,{children:f.jsx(R0,{children:f.jsx(b0,{children:f.jsx(N0,{children:f.jsxs(v0,{children:[f.jsx(yl,{path:"/",element:f.jsx(ig,{})}),f.jsx(yl,{path:"/login",element:f.jsx(Xg,{})}),f.jsx(yl,{path:"/register",element:f.jsx(Jg,{})}),f.jsx(yl,{path:"/hall-of-fame",element:f.jsx(hb,{})}),f.jsx(yl,{path:"/lobby",element:f.jsx(br,{children:f.jsx(_d,{})})}),f.jsx(yl,{path:"/lobby/:code",element:f.jsx(br,{children:f.jsx(_d,{})})}),f.jsx(yl,{path:"/game/:code",element:f.jsx(br,{children:f.jsx(Jy,{})})}),f.jsx(yl,{path:"*",element:f.jsx("div",{children:"Page not found"})})]})})})})})]}),f.jsx(_0,{initialIsOpen:!1})]})})}O0.createRoot(document.getElementById("root")).render(f.jsx(W.StrictMode,{children:f.jsx(vb,{})}));
