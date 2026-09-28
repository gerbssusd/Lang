import { defineAppSetup } from '@slidev/types'
// Self-hosted fonts (SIL OFL) so builds, exports and deck2video renders work offline.
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'

export default defineAppSetup(() => {})
