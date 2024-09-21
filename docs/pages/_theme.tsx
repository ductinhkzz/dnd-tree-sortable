import { createTheme, defaultSideNavs } from 'vite-pages-theme-doc';

import Component404 from './404';

const theme = createTheme({
  logo: <div style={{ fontSize: '20px' }}>Dnd Tree Sortable</div>,
  topNavs: [
    {
      label: 'Home',
      path: '/',
      activeIfMatch: {
        // match all first-level paths
        path: '/:foo',
        end: true,
      },
    },
    {
      label: 'Examples',
      path: '/examples/Basic',
      activeIfMatch: '/examples',
    },
    {
      label: 'Github',
      href: 'https://github.com/',
    },
  ],
  Component404,
  sideNavs: (ctx) => {
    return defaultSideNavs(ctx, {
      groupConfig: {
        examples: {
          demos: {
            label: 'Demos (dev only)',
            order: 1,
          },
        },
      },
    });
  },
});

export default theme;
