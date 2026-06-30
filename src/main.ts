import { createApp } from 'vue'
// 品牌色单源主题，须在 Element Plus 组件样式之后参与级联（main 顶部导入即可覆盖默认 token）。
import './styles/tokens.css'

import App from './App.vue'
import { pinia } from './stores'
import { router } from './router'
import { i18n } from './locales'
import { permissionDirective } from './foundation/permission'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(i18n)
app.directive('perm', permissionDirective)

app.mount('#app')
