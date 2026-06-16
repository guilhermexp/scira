import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Inicializa com `false` (não `undefined`) pra garantir que server e client 1ª render
  // retornem exatamente o mesmo boolean — evita hydration mismatch em React 19 + Next 16.
  // O useEffect abaixo corrige pro valor real após mount.
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
