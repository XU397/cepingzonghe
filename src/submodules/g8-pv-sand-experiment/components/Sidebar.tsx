import React from 'react';
import styles from '../styles/Sidebar.module.css';

interface SidebarProps {
  currentStep: number;
  totalSteps?: number;
  variant?: 'background' | 'experiment';
}

const Sidebar: React.FC<SidebarProps> = ({
  currentStep,
  totalSteps = 6,
  variant = 'experiment'
}) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className={`${styles.sidebar} ${styles[variant]}`}>
      {steps.map((step) => (
        <div
          key={step}
          className={`${styles.sidebarItem} ${step === currentStep ? styles.active : ''}`}
        >
          {step}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
