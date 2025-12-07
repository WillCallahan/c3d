import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root {
    min-height: 100%;
  }

  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      Helvetica, Arial, sans-serif;
    background: ${({ theme }) => theme.pageBackground};
    color: ${({ theme }) => theme.text};
    transition: background 0.35s ease, color 0.35s ease;
    -webkit-font-smoothing: antialiased;
  }

  a {
    color: inherit;
  }

  ::selection {
    background: ${({ theme }) => theme.primarySoft};
    color: ${({ theme }) => theme.primary};
  }
`;
