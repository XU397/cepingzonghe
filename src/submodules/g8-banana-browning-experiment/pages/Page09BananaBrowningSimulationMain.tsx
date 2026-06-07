import React from 'react';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import type { PageId } from '../mapping';
import SimulationPanel from '../components/SimulationPanel';
import styles from '../styles/Page09BananaBrowningSimulationMain.module.css';
import { useTracePageStart } from '../trace/useTracePageStart';

const Page09BananaBrowningSimulationMain: React.FC = () => {
  const { getPagePrefix } = useG8BananaBrowningContext();
  const traceLogger = useTracePageStart({
    pageId: 'banana_browning_simulation_main' as PageId,
    pageNumber: getPagePrefix().replace(/^P/, '').replace(/_$/, ''),
    flowContext: undefined,
    metadata: {
      initial_state: { days: 0 },
    },
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.badge}>9</div>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>香蕉变黑：模拟实验</h1>
        </div>
      </header>

      <div className={styles.contentLayout}>
        {/* 左侧：说明面板 */}
        <div className={styles.instructionsPanel}>
          <h2 className={styles.instructionsTitle}>模拟实验步骤如下：</h2>
          <ol className={styles.stepsList}>
            <li>
              准备产自菲律宾和海南的香蕉各3根，确保成熟度相近、表皮完好，分别放入6个恒温箱中；
            </li>
            <li>
              将恒温箱分为三组，温度分别设为2℃、10℃、18℃，每组各放一根菲律宾香蕉和一根海南香蕉；
            </li>
            <li>每隔三天为香蕉拍照，用软件计算并记录香蕉黑变比例。</li>
          </ol>

          <hr className={styles.divider} />

          <h3 className={styles.instructionsSectionTitle}>【说明】右侧为实验互动界面：</h3>
          <ul className={styles.instructionsList}>
            <li>
              单击<span className={styles.inlineBtnDayAdjust}>+</span>
              <span className={styles.inlineBtnDayAdjust}>−</span>按钮可调整香蕉储存天数。
            </li>
            <li>
              设好天数后，单击<span className={styles.inlineBtnStart}>开始实验</span>
              ，恒温箱下方框内显示黑变百分比。
            </li>
            <li>
              单击<span className={styles.inlineBtnReset}>重置</span>可重新开始。
            </li>
          </ul>
        </div>

        {/* 右侧：模拟实验面板 */}
        <div className={styles.simulationPanel}>
          <SimulationPanel traceLogger={traceLogger} />
        </div>
      </div>
    </div>
  );
};

export default Page09BananaBrowningSimulationMain;
