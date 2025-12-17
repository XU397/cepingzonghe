
import styles from './TrainScheduleTable.module.css';

export function TrainScheduleTable({
  trains,
  selectedTrains = [],
  onToggleSelect,
  showSelection = true,
}) {
  const handleRowClick = (trainNo) => {
    if (onToggleSelect) {
      onToggleSelect(trainNo);
    }
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {showSelection && <th className={styles.selectCol}></th>}
            <th>车次</th>
            <th>出发时间</th>
            <th>到达时间</th>
            <th>用时</th>
            <th>二等座</th>
            <th>学生票</th>
          </tr>
        </thead>
        <tbody>
          {trains.map((train) => {
            const isSelected = selectedTrains.includes(train.trainNo);
            return (
              <tr
                key={train.trainNo}
                className={[styles.row, isSelected ? styles.selected : ''].join(' ')}
                onClick={() => handleRowClick(train.trainNo)}
              >
                {showSelection && (
                  <td className={styles.selectCol}>
                    <span className={[styles.checkbox, isSelected ? styles.checked : ''].join(' ')}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </td>
                )}
                <td className={styles.trainNo}>{train.trainNo}</td>
                <td>{train.departure}</td>
                <td>{train.arrival}</td>
                <td>{train.duration}</td>
                <td>
                  <span className={styles.price}>¥{train.adultPrice}</span>
                  <span className={styles.seats}>余{train.adultSeats}张</span>
                </td>
                <td>
                  {train.studentSeats > 0 ? (
                    <>
                      <span className={styles.price}>¥{train.studentPrice}</span>
                      <span className={styles.seats}>余{train.studentSeats}张</span>
                    </>
                  ) : (
                    <span className={styles.noSeat}>无</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TrainScheduleTable;
