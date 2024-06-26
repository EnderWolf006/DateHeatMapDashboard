import './style.css';
import React, { useLayoutEffect, useMemo } from 'react';
import { dashboard, bitable, DashboardState, IConfig, SourceType, IDataCondition } from "@lark-base-open/js-sdk";
import { Button, DatePicker, ConfigProvider, Checkbox, Row, Col, Input, Switch, Select } from '@douyinfe/semi-ui';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useConfig } from '../../hooks';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next/typescript/t';
import DashboardConfig from '../DashboardConfig';
import { DashboardView } from '../DashboardView';

// 默认配置
export const defaultConfig = {
  customConfig: {
    dateRange: 12 as any,
    previewData: {} as any,
    heatmapColorList: [
      {
        frequency: 0,
        color: '#F4F5F5' as any,
      },
      {
        frequency: 1 as any,
        color: '#daf6ea' as any,
        warning: false as any,
      },
      {
        frequency: 2 as any,
        color: '#c7f0df' as any,
        warning: false as any,
      },
      {
        frequency: 3 as any,
        color: '#82edc0' as any,
        warning: false as any,
      },
      {
        frequency: 5 as any,
        color: '#0bd07d' as any,
        warning: false as any,
      },
      {
        frequency: 8 as any,
        color: '#00663b' as any,
        warning: false as any,
      },
      {
        frequency: 'end',
        color: '#00361b' as any,
      }
    ] as any
  },
  dataConditions: {
    tableId: null as any,
    dataRange: {
      type: SourceType.ALL,
    } as any,
    groups: [
      {
        fieldId: null as any,
      }
    ]
  }
}

export default function Dashboard() {

  const { t, i18n } = useTranslation();

  // create时的默认配置
  const [config, setConfig] = useState(defaultConfig)

  const isCreate = dashboard.state === DashboardState.Create

  useEffect(() => {
    if (isCreate) setConfig(defaultConfig)
  }, [i18n.language, isCreate])

  /** 是否配置/创建模式下 */
  const isConfig = dashboard.state === DashboardState.Config || isCreate;

  const timer = useRef<any>()

  /** 配置用户配置 */
  const updateConfig = (res: IConfig) => {

    if (timer.current) {
      clearTimeout(timer.current)
    }
    const { customConfig, dataConditions } = res as any;
    if (customConfig) {
      setConfig({ customConfig, dataConditions: dataConditions[0] });
      timer.current = setTimeout(() => {
        //自动化发送截图。 预留3s给浏览器进行渲染，3s后告知服务端可以进行截图了（对域名进行了拦截，此功能仅上架部署后可用）。
        dashboard.setRendered();
      }, 3000);

    }

  }

  useConfig(updateConfig)

  return (
    <main style={isConfig ? {} : { borderTop: 'none' }}>
      <div className='layout-view' >
        <_DashboardView
          t={t}
          config={config}
          isConfig={isConfig}
        />
      </div>
      {
        isConfig && (
          <div className='layout-cfg'>
            <ConfigPanel t={t} config={config} setConfig={setConfig} />
          </div>
        )
      }
    </main>
  )
}


interface IDashboardView {
  config: any,
  isConfig: boolean,
  t: TFunction<"translation", undefined>,
}
function _DashboardView({ config, isConfig, t }: IDashboardView) {
  return (
    <>
      <div className="view">
        <DashboardView config={config} isConfig={isConfig} t={t}></DashboardView>
      </div>
    </>
  );
}

function ConfigPanel(props: {
  config: any,
  setConfig: any,
  t: TFunction<"translation", undefined>,
}) {
  const { config, setConfig, t } = props;
  const configRef = useRef(null) as any;
  /**保存配置 */
  const onSaveConfig = () => {
    const cfg = configRef.current.handleSetConfig()

    if (!cfg) return
    console.log(cfg);

    dashboard.saveConfig(cfg as any)
  }

  return (
    <>
      <div className="layout-cfg-main">
        <DashboardConfig config={config} setConfig={setConfig} t={t} ref={configRef}></DashboardConfig>
      </div>
      <div className="layout-cfg-btn">
        <Button type='primary' theme='solid' size='large' className='confirmButton' onClick={onSaveConfig}>{t('button.confirm')}</Button>
      </div>
    </>
  )
}