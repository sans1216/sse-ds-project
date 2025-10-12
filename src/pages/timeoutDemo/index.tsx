import { useState } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // 1. 触发状态更新（异步）
    setCount(1);
    
    // 2. 同步代码中仍为旧值（0）
    console.log('同步代码中：', count); // 输出 0
    
    // 3. 用 setTimeout(cb, 0) 等待状态更新完成
    setTimeout(() => {
      console.log('setTimeout 中：', count); // 输出 1（已更新）
    }, 0);
  };

  return <button onClick={handleClick}>点击</button>;
}
export default Example;