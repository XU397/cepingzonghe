
import React from 'react';

const ModuleFallback = ({ url }) => (
  <div className="module-not-found">
    <h2>模块未找到</h2>
    <p>请求的模块 "{url}" 不存在或尚未实现。</p>
  </div>
);

export default ModuleFallback;
