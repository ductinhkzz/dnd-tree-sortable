import{p as m}from"./_-CK41x3r9.js";import{j as t,u as i}from"./index-DDlfjPP1.js";import{S as s,t as a}from"./utils-CSpyAWCy.js";const d=()=>t.jsx(s,{defaultItems:a,height:600,collapsible:!0,indicator:!0,removable:!0,onRemove:e=>alert(`Remove id: ${e}`)}),c=`import { SortableTree } from 'dnd-tree-sortable';

import { tree } from '../utils';

const Removable = () => {
  return (
    <SortableTree
      defaultItems={tree}
      height={600}
      collapsible
      indicator
      removable
      onRemove={(id) => alert(\`Remove id: \${id}\`)}
    />
  );
};

export default Removable;
`,u=void 0,f=void 0,p={code:c,title:u,desc:f},b=!0,v=Object.freeze(Object.defineProperty({__proto__:null,default:d,demoMeta:p,isDemo:b},Symbol.toStringTag,{value:"Module"}));function r(e){const o={h1:"h1",...i(),...e.components},{Demo:n}=o;return n||x("Demo"),t.jsxs(t.Fragment,{children:[t.jsx(o.h1,{id:"removable",children:"Removable"}),`
`,t.jsx(n,{...v})]})}function _(e={}){const{wrapper:o}={...i(),...e.components};return o?t.jsx(o,{...e,children:t.jsx(r,{...e})}):r(e)}function x(e,o){throw new Error("Expected component `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}const j=Object.freeze(Object.defineProperty({__proto__:null,default:_},Symbol.toStringTag,{value:"Module"})),l={};l.outlineInfo=m;l.main=j;export{l as default};
