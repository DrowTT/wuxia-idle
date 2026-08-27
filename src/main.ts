import { createApp } from 'vue'
import {
  ElBadge,
  ElButton,
  ElCard,
  ElDialog,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElMenu,
  ElMenuItem,
  ElOption,
  ElPopover,
  ElProgress,
  ElSelect,
  ElTabPane,
  ElTabs,
  ElTag,
  ElTooltip,
} from 'element-plus'
import 'element-plus/es/components/badge/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/card/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/dropdown/style/css'
import 'element-plus/es/components/dropdown-item/style/css'
import 'element-plus/es/components/dropdown-menu/style/css'
import 'element-plus/es/components/menu/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/popover/style/css'
import 'element-plus/es/components/progress/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/tab-pane/style/css'
import 'element-plus/es/components/tabs/style/css'
import 'element-plus/es/components/tag/style/css'
import 'element-plus/es/components/tooltip/style/css'
import App from './App.vue'
import './styles.css'

createApp(App)
  .use(ElBadge)
  .use(ElButton)
  .use(ElCard)
  .use(ElDialog)
  .use(ElDropdown)
  .use(ElDropdownItem)
  .use(ElDropdownMenu)
  .use(ElMenu)
  .use(ElMenuItem)
  .use(ElOption)
  .use(ElPopover)
  .use(ElProgress)
  .use(ElSelect)
  .use(ElTabPane)
  .use(ElTabs)
  .use(ElTag)
  .use(ElTooltip)
  .mount('#app')
