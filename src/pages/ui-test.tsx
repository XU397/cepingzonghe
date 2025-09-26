// 文件路径: pages/ui-test.tsx

import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal'; // 请根据您的项目结构调整路径

const UITestPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">新Modal组件测试页面</h1>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold"
      >
        打开玻璃拟态模态框
      </button>

      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Radix UI Modal"
        description="这是一个使用Radix UI构建并应用了玻璃拟态效果的模态框。"
      >
        <div className="mt-4">
          <p className="text-gray-300">这是模态框的内容区域。</p>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white"
            >
              确认
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UITestPage;