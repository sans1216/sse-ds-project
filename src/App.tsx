import { useState } from "react";
import styles from './App.module.less';
import Portal from "./components/portal";
import ChatBox from "./components/chatBox";

function App() {
  const grids = new Array(8).fill(0).map((_,index:number) => {return { id: index }});
  return (
    <div className={styles.main}>
      <ChatBox />
    </div>
  );
}

export default App;
