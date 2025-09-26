/**
 * @file RouteCalculator.jsx
 * @description 路程计算器组件，显示路线表格并支持路线1和路线5的数字输入
 * 基于PDF第6页的实际表格设计，包含数值验证和错误提示
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import './RouteCalculator.css';

/**
 * 路程计算器组件
 * @param {Object} props - 组件属性
 * @param {string} props.route1Distance - 路线1距离输入值
 * @param {string} props.route5Distance - 路线5距离输入值
 * @param {function} props.onRoute1Change - 路线1输入变更回调
 * @param {function} props.onRoute5Change - 路线5输入变更回调
 * @param {function} props.isValidInput - 输入验证函数
 * @returns {JSX.Element} 路程计算器组件
 */
const RouteCalculator = ({ 
  route1Distance, 
  route5Distance, 
  onRoute1Change, 
  onRoute5Change, 
  isValidInput 
}) => {
  
  // 处理输入变更，只允许数字和小数点
  const handleInputChange = useCallback((routeId, event) => {
    const value = event.target.value;
    
    // 只允许数字和小数点
    const numericRegex = /^[0-9]*\.?[0-9]*$/;
    if (numericRegex.test(value) || value === '') {
      // 防止多个小数点
      const decimalCount = (value.match(/\./g) || []).length;
      if (decimalCount <= 1) {
        if (routeId === 1) {
          onRoute1Change(value);
        } else if (routeId === 5) {
          onRoute5Change(value);
        }
      }
    }
  }, [onRoute1Change, onRoute5Change]);

  // 路线数据 - 与PDF完全一致
  const routeData = [
    { id: 1, name: '路线1', distance: route1Distance, editable: true },
    { id: 2, name: '路线2', distance: '8.65', editable: false },
    { id: 3, name: '路线3', distance: '10.2', editable: false },
    { id: 4, name: '路线4', distance: '9.63', editable: false },
    { id: 5, name: '路线5', distance: route5Distance, editable: true }
  ];

  return (
    <div className="route-calculator">
      <div className="calculator-header">
        <h3>路程表格</h3>
      </div>
      
      <table className="route-table">
        <thead>
          <tr>
            <th>路线</th>
            <th>路程 (km)</th>
          </tr>
        </thead>
        <tbody>
          {routeData.map((route) => (
            <tr key={route.id}>
              <td className="route-name">{route.name}</td>
              <td className="route-distance">
                {route.editable ? (
                  <div className="input-container">
                    <input
                      type="text"
                      value={route.distance}
                      onChange={(e) => handleInputChange(route.id, e)}
                      placeholder="请输入"
                      className={`distance-input ${
                        route.distance && !isValidInput(route.distance) ? 'invalid' : ''
                      }`}
                      id={`route_${route.id}_distance_input`}
                    />
                    {route.distance && !isValidInput(route.distance) && (
                      <span className="error-hint">请输入有效数字</span>
                    )}
                  </div>
                ) : (
                  <span className="static-distance">{route.distance}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="calculator-footer">
        <p className="instruction-text">
          请计算<strong>路线1</strong>和<strong>路线5</strong>的路程，并填入上表相应位置
        </p>
      </div>
    </div>
  );
};

RouteCalculator.propTypes = {
  route1Distance: PropTypes.string.isRequired,
  route5Distance: PropTypes.string.isRequired,
  onRoute1Change: PropTypes.func.isRequired,
  onRoute5Change: PropTypes.func.isRequired,
  isValidInput: PropTypes.func.isRequired
};

export default RouteCalculator;