import PropTypes from 'prop-types';
import styles from './completion.module.css';

const defaultIcon = '🎉';

const defaultContent = {
  title: '蒸馒头任务完成！',
  message:
    '经过一番探究，总算真相大白，原来是发酵时间过长，导致了小明蒸的馒头过度发酵。感谢你对小明的帮助！',
  detail: '接下来，我们还有一份简短的问卷调查，用于了解你的学习体验。',
  tip: '问卷大约需要10分钟时间。',
  ctaLabel: '继续完成问卷调查',
};

export function CompletionPage({
  title = defaultContent.title,
  message = defaultContent.message,
  detail = defaultContent.detail,
  tip = defaultContent.tip,
  ctaLabel = defaultContent.ctaLabel,
  onPrimary,
  icon = defaultIcon,
}) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.underline} aria-hidden="true" />
        </div>

        <div className={styles.body}>
          <div className={styles.emoji} aria-hidden="true">
            {icon}
          </div>
          <p className={styles.message}>{message}</p>
          <p className={styles.detail}>{detail}</p>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onPrimary}>
            {ctaLabel}
          </button>
        </div>

        {tip && <div className={styles.tip}>{tip}</div>}
      </div>
    </div>
  );
}

CompletionPage.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  detail: PropTypes.string,
  tip: PropTypes.string,
  ctaLabel: PropTypes.string,
  icon: PropTypes.node,
  onPrimary: PropTypes.func,
};

export default CompletionPage;
