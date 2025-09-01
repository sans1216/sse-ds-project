import { createPortal } from "react-dom";

const Portal = () => {
  const renderDialog = () => {
    return (
      <div>
        <h3>title</h3>
        <img />
      </div>
    );
  };
  return <div>{createPortal(renderDialog(), document.body)}</div>;
};
export default Portal;
