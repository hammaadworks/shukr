import React from 'react';

interface ScreenFlashesProps {
  showYes: boolean;
  showNo: boolean;
}

export const ScreenFlashes: React.FC<ScreenFlashesProps> = ({ showYes, showNo }) => {
  return (
    <>
      {showYes && <div className="screen-flash flash-green" />}
      {showNo && <div className="screen-flash flash-red" />}
    </>
  );
};
