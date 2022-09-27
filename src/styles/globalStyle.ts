import { createGlobalStyle } from 'styled-components'
import reset from './reset'

const GlobalStyle = createGlobalStyle`
    ${reset}

    body {
        background-color: ${({ theme }) => theme.colors.background.main};
    }

    * {
        -webkit-tap-highlight-color: transparent;
    }

    #__next {
        width: 100vw;
        height: 100vh;
    }

    .fade-enter {
        opacity: 0;
    }

    .fade-enter-active {
        opacity: 1;
        transition: opacity 200ms;
    }

    .fade-exit {
        opacity: 1;
    }

    .fade-exit-active {
        opacity: 0;
        transition: opacity 200ms;
    }
`

export default GlobalStyle
