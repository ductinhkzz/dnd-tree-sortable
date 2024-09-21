import{p as c}from"./_-FNA1FZbS.js";import{j as t,u as i}from"./index-OH96i1TA.js";import{S as d,t as a}from"./utils-DZMyeeWn.js";const l=()=>t.jsx(d,{defaultItems:a,height:600,collapsible:!0,indicator:!0}),u=`import { SortableTree } from 'dnd-tree-sortable';

import { tree } from '../utils';

const Indicator = () => {
  return <SortableTree defaultItems={tree} height={600} collapsible indicator />;
};

export default Indicator;
`,m=void 0,f=void 0,p={code:u,title:m,desc:f},_=!0,b=Object.freeze(Object.defineProperty({__proto__:null,default:l,demoMeta:p,isDemo:_},Symbol.toStringTag,{value:"Module"}));function r(e){const o={h1:"h1",...i(),...e.components},{Demo:n}=o;return n||j("Demo"),t.jsxs(t.Fragment,{children:[t.jsx(o.h1,{id:"indicator",children:"Indicator"}),`
`,t.jsx(n,{...b})]})}function x(e={}){const{wrapper:o}={...i(),...e.components};return o?t.jsx(o,{...e,children:t.jsx(r,{...e})}):r(e)}function j(e,o){throw new Error("Expected component `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}const h=Object.freeze(Object.defineProperty({__proto__:null,default:x},Symbol.toStringTag,{value:"Module"})),s={};s.outlineInfo=c;s.main=h;export{s as default};
