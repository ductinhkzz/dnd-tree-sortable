import{p as m}from"./_-D3YUpm37.js";import{j as n,u as i}from"./index-K8_tGMbn.js";import{S as p,t as u}from"./utils-dO17kJrV.js";const f=({childCount:e,clone:t,depth:o,disableSelection:v,disableInteraction:M,ghost:P,handleProps:R,indentationWidth:a,indicator:T,collapsed:D,onCollapse:w,onRemove:O,style:E,value:r,components:L,wrapperRef:c,...d})=>n.jsxs("li",{ref:c,style:{"--spacing":`${a*o}px`,paddingLeft:"var(--spacing)"},...d,children:[r.id," ",n.jsxs("span",{style:{color:"#1976d2"},children:["(",r.children.length,")"]})]}),h=()=>n.jsx(p,{defaultItems:u,height:600,collapsible:!0,indicator:!0,renderItemContent:f}),g=`import { SortableTree, SortableTreeProps } from 'dnd-tree-sortable';

import { tree } from '../utils';

const ItemContent: SortableTreeProps<{}>['renderItemContent'] = ({
  childCount,
  clone,
  depth,
  disableSelection,
  disableInteraction,
  ghost,
  handleProps,
  indentationWidth,
  indicator,
  collapsed,
  onCollapse,
  onRemove,
  style,
  value,
  components,
  wrapperRef,
  ...rest
}) => {
  return (
    <li
      ref={wrapperRef}
      style={
        {
          '--spacing': \`\${indentationWidth * depth}px\`,
          paddingLeft: 'var(--spacing)',
        } as React.CSSProperties
      }
      {...rest}
    >
      {value.id} <span style={{ color: '#1976d2' }}>({value.children.length})</span>
    </li>
  );
};

const CustomItem = () => {
  return <SortableTree defaultItems={tree} height={600} collapsible indicator renderItemContent={ItemContent} />;
};

export default CustomItem;
`,b=void 0,C=void 0,x={code:g,title:b,desc:C},j=!0,I=Object.freeze(Object.defineProperty({__proto__:null,default:h,demoMeta:x,isDemo:j},Symbol.toStringTag,{value:"Module"}));function s(e){const t={h1:"h1",...i(),...e.components},{Demo:o}=t;return o||_("Demo"),n.jsxs(n.Fragment,{children:[n.jsx(t.h1,{id:"custom-components",children:"Custom components"}),`
`,n.jsx(o,{...I})]})}function S(e={}){const{wrapper:t}={...i(),...e.components};return t?n.jsx(t,{...e,children:n.jsx(s,{...e})}):s(e)}function _(e,t){throw new Error("Expected component `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}const y=Object.freeze(Object.defineProperty({__proto__:null,default:S},Symbol.toStringTag,{value:"Module"})),l={};l.outlineInfo=m;l.main=y;export{l as default};
