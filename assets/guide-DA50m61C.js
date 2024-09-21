import{p as i}from"./guide_-BJb2ZrK9.js";import{u as r,j as e}from"./index-K8_tGMbn.js";function t(d){const n={a:"a",code:"code",h1:"h1",h2:"h2",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...r(),...d.components};return e.jsxs(e.Fragment,{children:[e.jsx(n.h1,{id:"api",children:"API"}),`
`,e.jsx(n.h2,{id:"sortabletreeprops",children:e.jsx(n.code,{children:"SortableTreeProps"})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`interface SortableTreeProps<T extends object> {
  collapsible?: boolean;
  defaultItems?: TreeItem<T>[];
  indentationWidth?: number;
  indicator?: boolean;
  removable?: boolean;
  components?: SortableTreeItemProps<TreeItem<T>>['components'];
  height?: string | number;
  renderItemContent?: SortableTreeItemProps<TreeItem<T>>['renderItem'];
  onChange?: (currentItem: FlattenedItem<T>, changeItem: FlattenedItem<T>) => void;
  onRemove?: (id: UniqueIdentifier) => void;
}
`})}),`
`,e.jsx(n.h2,{id:"treeitem",children:e.jsx(n.code,{children:"TreeItem"})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`type TreeItem<T extends object = {}> = T & {
  id: UniqueIdentifier;
  collapsed?: boolean;
  children: TreeItem<T>[];
};
`})}),`
`,e.jsx(n.h2,{id:"flatteneditem",children:e.jsx(n.code,{children:"FlattenedItem"})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`type FlattenedItem<T extends object = {}> = TreeItem<T> & {
  parentId: UniqueIdentifier | null;
  depth: number;
  index: number;
};
`})}),`
`,e.jsx(n.h2,{id:"rendercomponenttype",children:e.jsx(n.code,{children:"RenderComponentType"})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`type RenderComponentType<T extends TreeItem> = {
  Handle?: (props: ActionProps) => JSX.Element;
  Collapse?: (props: ActionProps) => JSX.Element;
  Remove?: (props: ActionProps) => JSX.Element;
  ItemContent?: (props: T) => JSX.Element;
  Badge?: (props: BadgeProps) => JSX.Element;
};
`})}),`
`,e.jsx(n.h2,{id:"sortabletree",children:e.jsx(n.code,{children:"SortableTree"})}),`
`,e.jsxs(n.table,{children:[e.jsx(n.thead,{children:e.jsxs(n.tr,{children:[e.jsx(n.th,{children:"Property"}),e.jsx(n.th,{children:"Description"}),e.jsx(n.th,{children:"Type"}),e.jsx(n.th,{children:"Default"})]})}),e.jsxs(n.tbody,{children:[e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"collapsible"}),e.jsx(n.td,{children:"Enable collapsible mode."}),e.jsx(n.td,{children:e.jsx(n.code,{children:"boolean"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"false"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"indicator"}),e.jsx(n.td,{children:"Enable indicator mode."}),e.jsx(n.td,{children:e.jsx(n.code,{children:"boolean"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"false"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"removable"}),e.jsx(n.td,{children:"Enable removable mode."}),e.jsx(n.td,{children:e.jsx(n.code,{children:"boolean"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"false"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"indentationWidth"}),e.jsx(n.td,{children:"Set indentationWidth."}),e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"50"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"height"}),e.jsx(n.td,{children:"Set view height."}),e.jsxs(n.td,{children:[e.jsx(n.code,{children:"string"})," or ",e.jsx(n.code,{children:"number"})]}),e.jsx(n.td,{children:e.jsx(n.code,{children:"undefined"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"defaultItems"}),e.jsx(n.td,{children:"Item data"}),e.jsx(n.td,{children:e.jsx(n.code,{children:"TreeItem<T>[]"})}),e.jsx(n.td,{children:"[]"})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"components"}),e.jsx(n.td,{children:"Custom components of item"}),e.jsx(n.td,{children:e.jsx(n.a,{href:"#rendercomponenttype",children:"RenderComponentType"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"undefined"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"renderItemContent"}),e.jsx(n.td,{children:"Custom render content"}),e.jsx(n.td,{children:e.jsx(n.code,{children:'(props: Omit<SortableTreeItemProps<TreeItem<T>>, "id">) => JSX.Element'})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"undefined"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"onChange"}),e.jsx(n.td,{children:"Handle change item"}),e.jsx(n.td,{children:e.jsx(n.code,{children:"(currentItem: FlattenedItem<T>, changeItem: FlattenedItem<T>) => void"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"undefined"})})]}),e.jsxs(n.tr,{children:[e.jsx(n.td,{children:"onRemove"}),e.jsx(n.td,{children:"Handle remove item"}),e.jsx(n.td,{children:e.jsx(n.code,{children:"(id: UniqueIdentifier) => void"})}),e.jsx(n.td,{children:e.jsx(n.code,{children:"undefined"})})]})]})]})]})}function l(d={}){const{wrapper:n}={...r(),...d.components};return n?e.jsx(n,{...d,children:e.jsx(t,{...d})}):t(d)}const c=Object.freeze(Object.defineProperty({__proto__:null,default:l},Symbol.toStringTag,{value:"Module"})),s={};s.outlineInfo=i;s.main=c;export{s as default};
