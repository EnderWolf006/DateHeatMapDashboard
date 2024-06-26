import { ReactElement, useEffect, useState } from "react"
import { bitable } from "@lark-base-open/js-sdk"
import './style.css'
import '../../locales/i18n';
import { LocaleProvider } from '@douyinfe/semi-ui';
import dayjs from 'dayjs';
import zh_CN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';
import en_US from '@douyinfe/semi-ui/lib/es/locale/source/en_US';
import ja_JP from '@douyinfe/semi-ui/lib/es/locale/source/ja_JP';


dayjs.locale('en-us');

export default function LoadApp(props: { children: ReactElement }): ReactElement {
  const [locale, setLocale] = useState(en_US);

  useEffect(() => {
    bitable.bridge.getLanguage().then((v) => {
      if (v === 'zh') {
        setLocale(zh_CN);
        dayjs.locale('zh-cn');
      }

      if (v === 'ja') {
        setLocale(ja_JP);
      }

    }).catch((e) => {
      console.error(e);
    })
  }, [])

  return <>
    <LocaleProvider locale={locale}>
      {props.children}
    </LocaleProvider>
  </>
}

