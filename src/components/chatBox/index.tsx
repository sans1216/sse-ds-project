import { useEffect, useState } from 'react';
import styles from './index.module.less';
import { useDebounceFn } from 'ahooks';
import { getMsgReply } from '../../service';
const ChatBox = () => {
    const [loading, setLoading] = useState(false);
    let [msgList, setMsgList] = useState([
        {
            from: 'user',
            content: "hello"
        },
        {
            from: "bot",
            content: "hi, what can I help you?"
        }
    ]);
    const [currChat, setCurrChat] = useState("")
    useEffect(() => {
        window.scrollTo(0, document.body.scrollHeight)
    }, [msgList])
    const handleSend = useDebounceFn(async () => {
        setMsgList((prev: { from: string, content: string }[]) => {
            return [
                ...prev, {
                    from: "user",
                    content: currChat
                }
            ]
        })
        try {
            setLoading(true)
            let signal;
            const stream = await getMsgReply(currChat);
            signal = stream.controller;
            // 初始化机器人回复（用于增量拼接流式内容）
            let botReply = "";
            setCurrChat("");
            setLoading(false)
            // 关键：用 for await...of 迭代流式数据
            for await (const chunk of stream) {
                // OpenAI 流式 chunk 格式：每个 chunk 含 choices[0].delta
                const delta = chunk.choices[0]?.delta;
                if (!delta) continue;

                // 提取当前 chunk 的内容（可能是 content 或空对象）
                const chunkContent = delta.content || "";
                if (chunkContent) {
                    botReply += chunkContent; // 增量拼接内容

                    // 实时更新消息列表（让机器人回复逐字显示）
                    setMsgList(prev => {
                        // 找到最后一条机器人消息（如果已存在则更新，不存在则新增）
                        const lastMsg = prev[prev.length - 1];
                        if (lastMsg?.from === "bot") {
                            return prev.map((msg, idx) =>
                                idx === prev.length - 1 ? { ...msg, content: botReply } : msg
                            );
                        } else {
                            // 首次收到机器人流时，新增一条消息
                            return [...prev, { from: "bot", content: botReply }];
                        }
                    });
                }

                // 如果流结束（delta.finish_reason 存在），可做收尾处理
                if (chunk.choices[0].finish_reason) {
                    console.log("流式响应结束");
                    break;
                }
            }
        } catch (error) {
            console.error("流式请求失败：", error);
            // 错误时添加失败提示
            setMsgList(prev => [
                ...prev,
                { from: "bot", content: "抱歉，请求失败，请重试~" }
            ]);
        }

        //    setMsgList((prev:{from:string,content:string}[]) => {
        //     return [
        //         ...prev, {
        //             from:"bot",
        //             content:res.choices[0].message.content
        //         }
        //     ]
        // })
    }, { wait: 300 }).run;

    const handleTextChange = (e) => {
        setCurrChat(e.target.value);
    }
    return (
        <div className={styles.container}>
            {msgList.map(item => {
                return (<div className={styles.chatItem}>
                    {item.from}
                    <p>{item.content}</p>
                </div>)
            })}
            {loading && (
                <p className='animate-spin'>loading</p>
            )}
            <section className='flex w-full h-20 p-2 rounded-t-lg px-10 flex-row flex-1 justify-center items-center fixed bottom-0 bg-white width-100% border-t border-gray-200 shadow-lg'>
                <input className="h-full flex-1 p-0" onChange={handleTextChange} type="text" />
                <button onClick={handleSend}>发送</button>
            </section>
        </div>
    )
}
export default ChatBox;