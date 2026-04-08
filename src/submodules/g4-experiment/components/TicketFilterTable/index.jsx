import styles from './TicketFilterTable.module.css';

export function TicketFilterTable({ trains, selectedTrains = [], onToggleSelect }) {
  const handleStarClick = trainNo => {
    if (onToggleSelect) {
      onToggleSelect(trainNo);
    }
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.starCol}></th>
            <th className={styles.trainCol}>车次</th>
            <th className={styles.timeCol}>
              出发时间
              <br />
              (到达时间)
            </th>
            <th className={styles.durationCol}>乘车时长</th>
            <th className={styles.priceCol}>
              一等座票价
              <br />
              (剩余票数)
            </th>
            <th className={styles.priceCol}>
              二等座票价
              <br />
              (剩余票数)
            </th>
          </tr>
        </thead>
        <tbody>
          {trains.map(train => {
            const isSelected = selectedTrains.includes(train.trainNo);
            const firstClassPrice = train.adultPrice;
            const firstClassSeats = train.adultSeats;
            const secondClassPrice = train.studentPrice;
            const secondClassSeats = train.studentSeats;

            return (
              <tr
                key={train.trainNo}
                className={`${styles.row} ${isSelected ? styles.selected : ''}`}
              >
                <td className={styles.starCol}>
                  <button
                    type="button"
                    className={`${styles.starButton} ${isSelected ? styles.starActive : ''}`}
                    onClick={() => handleStarClick(train.trainNo)}
                    aria-label={
                      isSelected ? `取消选择车次${train.trainNo}` : `选择车次${train.trainNo}`
                    }
                    aria-pressed={isSelected}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className={styles.starIcon}
                      fill={isSelected ? '#ffce6b' : 'none'}
                      stroke={isSelected ? '#ffce6b' : '#ccc'}
                      strokeWidth="2"
                    >
                      <title>{isSelected ? '已选中' : '未选中'}</title>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                </td>
                <td className={styles.trainCol}>
                  <span className={styles.trainNo}>{train.trainNo}</span>
                </td>
                <td className={styles.timeCol}>
                  <span className={styles.timeInline}>
                    {train.departure} <span className={styles.timeSeparator}>→</span>{' '}
                    {train.arrival}
                  </span>
                </td>
                <td className={styles.durationCol}>{train.duration}</td>
                <td className={styles.priceCol}>
                  <span className={styles.price}>{firstClassPrice}元</span>
                  <span className={styles.seats}>
                    ({firstClassSeats > 0 ? `${firstClassSeats}张` : '无'})
                  </span>
                </td>
                <td className={styles.priceCol}>
                  <span className={styles.price}>{secondClassPrice}元</span>
                  <span className={styles.seats}>
                    ({secondClassSeats > 0 ? `${secondClassSeats}张` : '无'})
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TicketFilterTable;
