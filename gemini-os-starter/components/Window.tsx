/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React from 'react';

interface WindowProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void; // This prop remains, though its direct trigger (the X button) is removed.
  isAppOpen: boolean;
  appId?: string | null;
  onToggleParameters: () => void;
  onExitToDesktop: () => void;
  isParametersPanelOpen?: boolean;
}

const MenuItem: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({children, onClick, className}) => (
  <span
    className={`menu-item cursor-pointer hover:text-blue-600 ${className}`}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onClick?.();
    }}
    tabIndex={0}
    role="button">
    {children}
  </span>
);

export const Window: React.FC<WindowProps> = ({
  title,
  children,
  onClose,
  isAppOpen,
  onToggleParameters,
  onExitToDesktop,
  isParametersPanelOpen,
}) => {
  return (
    <div className="w-screen h-screen bg-gray-900 flex flex-col relative overflow-hidden font-sans">
      {/* Title Bar */}
      <div className="bg-gray-800 text-white py-2 px-4 font-semibold text-base flex justify-between items-center select-none cursor-default flex-shrink-0">
        <span className="title-bar-text">{title}</span>
      </div>

      {/* Content - Full height minus title bar */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
};
