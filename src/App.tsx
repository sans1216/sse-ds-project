import { useState } from "react";
import styles from './App.module.less';
import Portal from "./components/portal";

function App() {
  const grids = new Array(8).fill(0).map((_,index:number) => {return { id: index }});
  console.log('grid', grids)
  return (
    <div className={styles.gridBox}>
      {grids.map((item) => (
        <div className={styles.box} id={item.id}>{item.id}</div>
      ))}
      <Portal />
    </div>
  );
}

export default App;
