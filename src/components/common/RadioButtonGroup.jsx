/**
 * @file RadioButtonGroup.jsx
 * @description 通用单选按钮组组件。
 */
import PropTypes from 'prop-types';
import styles from './RadioButtonGroup.module.css';

/**
 * 通用单选按钮组
 * @param {object} props - 组件属性
 * @param {string} props.name - Radio group的HTML name属性
 * @param {Array<object>} props.options - 选项数组, e.g., [{ label: 'Option 1', value: 'opt1' }, ...]
 * @param {*} props.selectedValue - 当前选中的值
 * @param {function} props.onChange - 选项改变时的回调函数，参数为新选中的value
 * @param {string} [props.layout] - 布局方向, 'horizontal' 或 'vertical' (默认)
 */
const RadioButtonGroup = ({ name, options, selectedValue, onChange, layout = 'vertical' }) => {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <div className={`${styles.radioButtonGroupContainer} ${layout === 'horizontal' ? styles.horizontal : styles.vertical}`}>
      {options.map((option) => (
        <label key={option.value} className={styles.radioLabel}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={String(selectedValue) === String(option.value)} // 确保比较的是字符串以避免类型问题
            onChange={handleChange}
            className={styles.radioInput}
          />
          <span className={styles.radioText}>{option.label}</span>
        </label>
      ))}
    </div>
  );
};

RadioButtonGroup.propTypes = {
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]).isRequired,
    })
  ).isRequired,
  selectedValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  onChange: PropTypes.func.isRequired,
  layout: PropTypes.oneOf(['horizontal', 'vertical']),
};

RadioButtonGroup.defaultProps = {
  selectedValue: null,
  layout: 'vertical',
};

export default RadioButtonGroup; 