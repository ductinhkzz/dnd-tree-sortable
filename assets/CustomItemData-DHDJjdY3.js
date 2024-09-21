import{p as u}from"./_-CJuvOKf9.js";import{j as n,u as d}from"./index-D28AmRkY.js";import{g as p,S as f}from"./utils-B-x3hG9C.js";const m=(e,t,o,a)=>{const s=[];if(o.toString().split("-").length===t)return[];for(let r=1;r<=(a??e);r++){const l={id:`${o}-${r}`,children:m(p(0,e),t,`${o}-${r}`),text:`${o}-${r}`};s.push(l)}return s},g=m(10,6,"Node",20),h=e=>n.jsxs("div",{children:[e.text," ",n.jsxs("span",{style:{color:"#1976d2"},children:["(",e.children.length,")"]})]}),I=()=>n.jsx(f,{defaultItems:g,height:600,collapsible:!0,indicator:!0,components:{ItemContent:h}}),x=`import { SortableTree, TreeItem as BaseTreeItem } from 'dnd-tree-sortable';

import { getRandomInRange } from '../utils';

type CustomItemType = {
  text: string;
};

type TreeItem = BaseTreeItem<CustomItemType>;

const generateTree = (childPerNode: number, deep: number, parentId: TreeItem['id'], totalRoot?: number) => {
  const nodes: TreeItem[] = [];
  const currDeep = parentId.toString().split('-').length;
  if (currDeep === deep) {
    return [];
  }
  for (let i = 1; i <= (totalRoot ?? childPerNode); i++) {
    const node: TreeItem = {
      id: \`\${parentId}-\${i}\`,
      children: generateTree(getRandomInRange(0, childPerNode), deep, \`\${parentId}-\${i}\`),
      text: \`\${parentId}-\${i}\`,
    };
    nodes.push(node);
  }

  return nodes;
};

const tree = generateTree(10, 6, 'Node', 20);

const ItemContent = (props: TreeItem) => {
  return (
    <div>
      {props.text} <span style={{ color: '#1976d2' }}>({props.children.length})</span>
    </div>
  );
};

const CustomItemData = () => {
  return (
    <SortableTree<CustomItemType>
      defaultItems={tree}
      height={600}
      collapsible
      indicator
      components={{
        ItemContent,
      }}
    />
  );
};

export default CustomItemData;
`,T=void 0,b=void 0,j={code:x,title:T,desc:b},y=!0,_=Object.freeze(Object.defineProperty({__proto__:null,default:I,demoMeta:j,isDemo:y},Symbol.toStringTag,{value:"Module"}));function i(e){const t={h1:"h1",...d(),...e.components},{Demo:o}=t;return o||D("Demo"),n.jsxs(n.Fragment,{children:[n.jsx(t.h1,{id:"custom-item-data",children:"Custom item data"}),`
`,n.jsx(o,{..._})]})}function C(e={}){const{wrapper:t}={...d(),...e.components};return t?n.jsx(t,{...e,children:n.jsx(i,{...e})}):i(e)}function D(e,t){throw new Error("Expected component `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}const $=Object.freeze(Object.defineProperty({__proto__:null,default:C},Symbol.toStringTag,{value:"Module"})),c={};c.outlineInfo=u;c.main=$;export{c as default};
