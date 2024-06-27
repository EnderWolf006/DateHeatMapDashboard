import React, { useEffect, useState } from "react";
import "./style.css";
import { bitable, dashboard } from '@lark-base-open/js-sdk';
import { Tooltip } from "@douyinfe/semi-ui";

function getDates(months: number): { dates: string[], firstDayIndices: { index: number, month: number }[] } {
  const dates: string[] = [];
  const firstDayIndices: { index: number, month: number }[] = [];
  const currentDate = new Date();

  // 获取当月的最后一天
  const getLastDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  // 获取指定月份的第一天
  const getFirstDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // 获取给定日期的字符串格式
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // 设置目标日期为当前日期减去月份数后的月份第一天
  const targetDate = new Date(currentDate);
  targetDate.setMonth(currentDate.getMonth() - months + 1);
  const targetFirstDay = getFirstDayOfMonth(targetDate);

  // 获取当前月份的最后一天
  let currentLastDay = getLastDayOfMonth(currentDate);

  // 从当前月份的最后一天遍历到目标月份的第一天
  while (currentLastDay >= targetFirstDay) {
    dates.push(formatDate(currentLastDay));
    currentLastDay.setDate(currentLastDay.getDate() - 1);
  }

  // 反转输出数组
  dates.reverse();

  // 标记每个月的第一天的下标
  let previousMonth = -1;
  dates.forEach((date, index) => {
    const dateObj = new Date(date);
    const month = dateObj.getMonth() + 1;
    if (month !== previousMonth) {
      firstDayIndices.push({ index, month });
      previousMonth = month;
    }
  });
  return { dates, firstDayIndices };
}


function handleData(data: any) {
  /* 二维数组
  实际完成  Bitable_Dashboard_Count
  2024/01/26 2
  2024/05/07 1
  ...
  */
  const d = {} as any
  for (let i = 1; i < data.length; i++) {
    const date = data[i][0].text;
    const count = data[i][1].value;
    d[date] = count
  }
  return d
}

export function DashboardView(props: any) {
  const { config, isConfig, t } = props;
  const customConfig = config.customConfig
  const dataConditions = config.dataConditions
  const { dates, firstDayIndices } = getDates(customConfig.dateRange) as any
  const [data, setData] = useState<any>({})

  useEffect(() => {
    (async () => {
      setData(handleData(isConfig ? (await dashboard.getPreviewData(dataConditions) as any) : (await dashboard.getData() as any)))
    })()
  }, [dataConditions])



  return (

    <>
      <div className="space">
        <div className="squareContainer" style={isConfig ? {
          '--h': '16vh',
          '--a': '2vh',
        } as any : {}}>
          {
            (() => {
              const jsx = [];
              for (let i = 0; i < dates.length; i += 7) {

                jsx.push(
                  <div className="squareColumnContainer" key={i}>
                    {
                      (() => {
                        const jsx2 = [] as any;
                        for (let j = 0; j < 7 && i + j < dates.length; j++) {
                          jsx2.push(
                            <Tooltip content={t('tooltip.text', { date: dates[i + j], count: dates[i + j] in data ? data[dates[i + j]] : 0 })}>
                              <div className="square" style={(dates[i + j] in data) ? {
                                backgroundColor: (() => {
                                  for (let n = 1; n < customConfig.heatmapColorList.length - 1; n++) {
                                    const front = customConfig.heatmapColorList[n - 1].frequency
                                    const current = customConfig.heatmapColorList[n].frequency
                                    // console.log(front, data[dates[i + j]], current);
                                    if (front < data[dates[i + j]] && data[dates[i + j]] <= current) {
                                      return customConfig.heatmapColorList[n].color
                                    }
                                  }
                                  return customConfig.heatmapColorList[customConfig.heatmapColorList.length - 1].color
                                })()
                              } as any : (customConfig.heatmapColorList.length > 0 ? { backgroundColor: customConfig.heatmapColorList[0].color } : {})} key={i + j}>
                              </div>
                            </Tooltip>
                          )
                        }
                        return jsx2
                      })()
                    }
                    {
                      (() => {
                        for (let k = 0; k < firstDayIndices.length; k++) {
                          if (i <= firstDayIndices[k].index && firstDayIndices[k].index < i + 7) {
                            return <div className="monthLabel" key={i}>{t('month.' + firstDayIndices[k].month)}</div>
                          }
                        }
                      })()
                    }
                  </div>
                )
              }
              return jsx
            })()
          }
        </div>
      </div >
    </>
  )
}