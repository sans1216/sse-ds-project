import { useEffect, useState } from 'react';
import styles from './index.module.less';
import { useDebounceFn } from 'ahooks';
import { getMsgReply } from '../../service';
const ChatBox = () => {
    let [msgList, setMsgList] = useState([
        {
            from: 'user',
            content: "hello"
        },
        {
            from:"bot",
            content:"hi, what can I help you?"
        }
    ]);
    const [currChat, setCurrChat] = useState("")
    useEffect(() => {
        window.scrollTo(0, document.body.scrollHeight)
    }, [msgList])
    const handleSend = useDebounceFn(async ( ) => {
        setMsgList((prev:{from:string,content:string}[]) => {
            return [
                ...prev, {
                    from:"user",
                    content:currChat
                }
            ]
        })
       const res = await getMsgReply(currChat);
       console.log('answer:', res.choices);
       setMsgList((prev:{from:string,content:string}[]) => {
        return [
            ...prev, {
                from:"bot",
                content:res.choices[0].message.content
            }
        ]
    })
    },{wait:300}).run;

    const handleTextChange = (e) => {
        setCurrChat(e.target.value);
    }
    return (
        <div className={styles.container}>
            {msgList.map(item =>
             {
                return (<div className={styles.chatItem}>
            {item.from}
            <p>{item.content}</p>
                </div>)
            })}
        <section className='flex w-full h-20 p-2 rounded-t-lg px-10 flex-row flex-1 justify-center items-center fixed bottom-0 bg-white width-100% border-t border-gray-200 shadow-lg'>
           <input className="h-full flex-1 p-0" onChange={handleTextChange} type="text"  />
           <button onClick={handleSend}>发送</button>
        </section>
        </div>
    )
}
export default ChatBox;