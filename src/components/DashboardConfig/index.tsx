import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import "./style.css";
import { DashboardState, FieldType, IDataRange, Rollup, SourceType, base, bitable, dashboard } from '@lark-base-open/js-sdk';
import { Button, Checkbox, Input, Select, Toast } from "@douyinfe/semi-ui";
import { defaultConfig } from "../Dashboard/index"
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { deepCopy } from '@gby/deep-copy'

let hasError = false;

function ColorPicker({ onChange, value }: any) {
  value = value || "#808080";
  return (
    <div className="colorSelectItem-colorPicker-display" style={{ backgroundColor: value }}>
      <input type="color" value={value} className="colorSelectItem-colorPicker-input" onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function ColorSelectItem({ startNum, value, onChange, onDelete }: any) {
  return (
    <div className="colorSelectItem">
      <div className="colorSelectItem-dragger">
        <img src={(value.frequency === 0 || value.frequency == 'end') ? "./none.svg" : "./dragger.svg"}></img>
      </div>
      <div className="colorSelectItem-frequency">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="colorSelectItem-frequency-text">
            {value.frequency === 0 ? 0 : startNum}
            {value.frequency === 0 || '\u00A0\u00A0~\u00A0\u00A0'}
            {value.frequency == 'end' ? '∞' : ''}
          </div>
          {(value.frequency === 0 || value.frequency == 'end') ? <></> : <Input validateStatus={value.warning ? 'error' : 'default'} style={{ width: 51 }} value={value.frequency} onChange={(e) => { onChange({ ...value, frequency: e === '' ? '' : Number(e) }) }}></Input>}
        </div>
      </div>
      <div className="colorSelectItem-colorPicker">
        <ColorPicker value={value.color} onChange={(e: any) => { onChange({ ...value, color: e }) }}></ColorPicker>
      </div>
      <div className="colorSelectItem-delete">
        {(value.frequency === 0 || value.frequency == 'end') ? <div /> : <img src="./delete.svg" onClick={(e) => { onDelete() }}></img>}
      </div>
    </div>
  )
}

function ButtonSelect({ optionList, onChange, value }: any) {
  return <>
    <div className="buttonSelectContainer">
      {
        optionList.map((item: any) => {
          if (item.value === value)
            return (
              <div className="buttonSelectItem selected" onClick={(e) => onChange(item.value)}>
                {item.label}
              </div>
            )
          return (
            <div className="buttonSelectItem" onClick={(e) => onChange(item.value)}>
              {item.label}
            </div>
          )
        })
      }
    </div>
  </>
}

function DashboardConfig(props: any, ref: any) {
  const { config, setConfig, t } = props;
  const isCreate = dashboard.state === DashboardState.Create;
  const { customConfig, dataConditions } = config as typeof defaultConfig;
  const setCustomConfig = (cfg: typeof customConfig) => {
    hasError = false;
    for (let i = 0; i < cfg.heatmapColorList.length; i++) {
      if (cfg.heatmapColorList[i].frequency != 'end' &&
        (
          (Number.isNaN(cfg.heatmapColorList[i].frequency) && cfg.heatmapColorList[i].frequency !== '') ||
          (cfg.heatmapColorList[i].frequency === 0 && i != 0)
        )) {
        // 重置至符合要求
        cfg.heatmapColorList[i].frequency = customConfig.heatmapColorList[i].frequency;
      }
      if (i > 0 && (
        cfg.heatmapColorList[i].frequency === '' ||
        cfg.heatmapColorList[i].frequency <= cfg.heatmapColorList[i - 1].frequency
      )) {
        cfg.heatmapColorList[i].warning = true;
        hasError = true;
      } else {
        cfg.heatmapColorList[i].warning = false;
      }
    }
    if (cfg !== customConfig)
      setConfig({ ...config, customConfig: cfg })
  }
  const setDataConditions = (cfg: typeof dataConditions) => {
    if (cfg !== dataConditions)
      setConfig({ ...config, dataConditions: cfg })
  }

  const [tableList, setTableList] = useState([]) as any

  const [viewList, setViewList] = useState([]) as any

  const [fieldList, setFieldList] = useState([]) as any // 日期字段列表

  const [numFieldList, setNumFieldList] = useState([]) as any // 数字字段列表

  const [dragging, setDragging] = useState(false) as any

  const displayRangeOptionList = [
    {
      value: 12,
      label: t("displayRange.year")
    },
    {
      value: 6,
      label: t("displayRange.semester")
    },
    {
      value: 1,
      label: t("displayRange.month")
    },
  ]

  useEffect(() => {
    // tableList 初始化
    (async () => {
      const tables = await bitable.base.getTableList();
      const tbl = await Promise.all(
        tables.map(
          async table => {
            const name = await table.getName();
            return {
              value: table.id,
              label: name
            }
          }
        )
      )
      setTableList(tbl)
      if (tbl.length > 0 && isCreate) {
        setDataConditions({ ...dataConditions, tableId: tbl[0].value })
      }
    })();
  }, [])

  useEffect(() => {
    (async () => {
      const l = (await dashboard.getTableDataRange(dataConditions.tableId)).map(view => {
        if (view.type == SourceType.ALL)
          return {
            value: 'all',
            label: t('sourceType.all'),
            view
          }
        return {
          value: view.viewId,
          label: t('prefix.view') + view.viewName,
          view
        }
      })
      setViewList(l)
      if (l.length > 0 && isCreate) {
        setDataConditions({ ...dataConditions, dataRange: l[0].view })
      }
    })()
  }, [dataConditions.tableId])

  useEffect(() => {
    (async () => {
      const fl = ((await dashboard.getCategories(dataConditions.tableId)).filter((v: any) => {
        return v.fieldType == FieldType.DateTime
      }).map(category => {
        return {
          value: category.fieldId,
          label: category.fieldName
        }
      }))
      setFieldList(fl)
      if (fl.length > 0 && !dataConditions.groups[0].fieldId) {
        setDataConditions({ ...dataConditions, groups: [{ fieldId: fl[0].value }] })
      }
      const nfl = ((await dashboard.getCategories(dataConditions.tableId)).filter((v: any) => {
        return v.fieldType == FieldType.Number
      }).map(category => {
        return {
          value: category.fieldId,
          label: category.fieldName
        }
      }))
      setNumFieldList(nfl)
      if (fl.length > 1 && dataConditions.series !== 'COUNTA' && !dataConditions.series[0].fieldId) {        
        setDataConditions({ ...dataConditions, series: [{ ...dataConditions.series[0], fieldId: nfl[0].value }] })
      }
    })()
  }, [dataConditions.tableId, dataConditions.series])

  useEffect(() => { 
    if (dataConditions.groups[0].fieldId == dataConditions.series[0].fieldId){
      setDataConditions({ ...dataConditions, series: [{ ...dataConditions.series[0], fieldId: null }] })
    }
  }, [dataConditions.groups[0].fieldId])

  useImperativeHandle(ref, () => ({
    handleSetConfig() {
      // 当确认按钮点击时被Dashboard调用
      if (hasError) {
        Toast.warning({
          content: t('error.text1'),
          duration: 3,
        })
        return false
      }
      if (!(dataConditions.tableId && (dataConditions.dataRange.viewId || dataConditions.dataRange.type == 'ALL') && dataConditions.groups[0].fieldId)) {
        Toast.warning({
          content: t('error.text2'),
          duration: 3,
        })
        return false
      }
      return config
    }
  }));

  const items = [] as any
  for (let i = 0; i < customConfig.heatmapColorList.length; i++) {
    const item = customConfig.heatmapColorList[i];
    const csi = (
      <ColorSelectItem startNum={i > 0 ? (customConfig.heatmapColorList[i - 1].frequency === '' ? '?' : customConfig.heatmapColorList[i - 1].frequency + 1) : null} value={item} onChange={(e: any) => {
        let tl = deepCopy(customConfig.heatmapColorList)
        tl[i] = e
        setCustomConfig({ ...customConfig, heatmapColorList: tl })
      }} onDelete={() => {
        let tl = deepCopy(customConfig.heatmapColorList)
        tl.splice(i, 1);
        setCustomConfig({ ...customConfig, heatmapColorList: tl })
      }}>
      </ColorSelectItem>
    )
    if (item.frequency === 'end' || item.frequency === 0) {
      items.push(<div style={(item.frequency === 'end' && dragging) ? { opacity: 0 } : { opacity: 1 }}>{csi}</div>)
      continue
    }
    items.push(
      <Draggable key={i} draggableId={i.toString()} index={i}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style, }}>
            {csi}
          </div>
        )
        }
      </Draggable>
    )
  }

  return (
    <>
      <div className="prompt">{t('prompt.dataSource')}</div>
      <Select placeholder={t('placeholder.pleaseSelectTable')} className="select" optionList={tableList} onChange={(e) => { setDataConditions({ ...dataConditions, tableId: e as string }) }} value={dataConditions.tableId}></Select>

      <div className="prompt">{t('prompt.dataRange')}</div>
      <Select placeholder={t('placeholder.pleaseSelectView')} className="select" optionList={viewList} onSelect={(v, option) => { setDataConditions({ ...dataConditions, dataRange: option.view }) }} value={viewList.length ? (dataConditions.dataRange.type == 'ALL' ? 'all' : dataConditions.dataRange.viewId) : null}></Select>

      <div className="prompt">{t('prompt.dateField')}</div>
      <Select placeholder={t('placeholder.pleaseSelectDateField')} className="select" optionList={fieldList} onChange={(e) => { setDataConditions({ ...dataConditions, groups: dataConditions.groups.map((v, i) => { if (i == 0) return { ...v, fieldId: e }; return v }) }) }} value={dataConditions.groups[0].fieldId}></Select>

      <div className="prompt">{t('prompt.displayRange')}</div>
      <ButtonSelect optionList={displayRangeOptionList} value={customConfig.dateRange} onChange={(e: any) => setCustomConfig({ ...customConfig, dateRange: e })} ></ButtonSelect>


      <div className="prompt">{t('prompt.field')}</div>
      <Select placeholder={'error???'} className="select" optionList={[{
        value: 'COUNTA',
        label: t('sourceType.counta')
      },
      {
        value: 'value',
        label: t('sourceType.value')
      }]} onChange={(e) => {
        if (e !== 'COUNTA') {
          setDataConditions({
            ...dataConditions, series: [{
              fieldId: null,
              rollup: Rollup.SUM
            }]
          })
          return
        }
        setDataConditions({ ...dataConditions, series: 'COUNTA' })
      }} value={dataConditions.series == 'COUNTA' ? 'COUNTA' : 'value'}
      ></Select>

      {
        <>
          {
            dataConditions.series == 'COUNTA' || <>
              <div className="prompt">{t('prompt.calcField')}</div>
              <div className="select">
                <Select placeholder={t('placeholder.pleaseSelectField')} style={{
                  width: "calc(70% - 4px)"
                }} optionList={numFieldList} onChange={(e) => {
                  if (dataConditions.series === 'COUNTA') return
                  setDataConditions({
                    ...dataConditions, series: [{ ...dataConditions.series[0], fieldId: e }]
                  })
                }} value={dataConditions.series == 'COUNTA' ? null : dataConditions.series[0].fieldId}></Select>

                <Select placeholder={t('placeholder.pleaseSelectField')} style={{
                  width: "calc(30% - 4px)",
                  marginLeft: "8px"
                }} optionList={[
                  {
                    value: Rollup.SUM,
                    label: t('rollup.sum')
                  },
                  {
                    value: Rollup.AVERAGE,
                    label: t('rollup.avg')
                  },
                  {
                    value: Rollup.MAX,
                    label: t('rollup.max')
                  },
                  {
                    value: Rollup.MIN,
                    label: t('rollup.min')
                  },
                ]} onChange={(e) => {
                  if (dataConditions.series === 'COUNTA') return
                  setDataConditions({
                    ...dataConditions, series: [{ ...dataConditions.series[0], rollup: e }]
                  })
                }} value={dataConditions.series == 'COUNTA' ? null : dataConditions.series[0].rollup}></Select>
              </div>
            </>
          }
        </>
      }
      <div className="prompt">{t('prompt.colorConfig')}</div>
      <div className="colorSelectContainer">
        <div className="header">
          <div className="header1">{t('header.repeatNum')}</div>
          <div className="header2">{t('header.color')}</div>
        </div>
        <DragDropContext
          onDragEnd={(e) => {
            setDragging(false)
            if (e.destination) {
              const items = deepCopy(customConfig.heatmapColorList)
              const [reorderedItem] = items.splice(e.source.index, 1)
              items.splice(e.destination.index, 0, reorderedItem)
              setCustomConfig({ ...customConfig, heatmapColorList: items })
            }
          }}
          onDragStart={() => { setDragging(true) }}>
          <Droppable droppableId="sortable-list" direction="vertical">
            {(provided, snapshot) => <div ref={provided.innerRef} {...provided.droppableProps}>{items}</div>}
          </Droppable>
        </DragDropContext>
        {
          <div style={dragging ? { opacity: 0 } : { opacity: 1 }} className="addRow" onClick={() => {
            let tl = deepCopy(customConfig.heatmapColorList)
            tl.splice(tl.length - 1, 0, {
              frequency: tl.length === 0 ? 1 : tl[tl.length - 2].frequency + 1,
              color: '#808080'
            });
            setCustomConfig({ ...customConfig, heatmapColorList: tl })
          }}>
            <img src="./add.svg"></img>
            <div className="addRowText">{t('footer.addRow')}</div>
          </div>
        }
      </div>

    </>
  )
}

export default React.forwardRef(DashboardConfig)