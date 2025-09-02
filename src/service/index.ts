import OpenAI from "openai"
const BASE_URL = 'https://api.deepseek.com'

const openai = new OpenAI({
    baseURL: BASE_URL,
    apiKey: import.meta.env.VITE_API_KEY,
    dangerouslyAllowBrowser: true
})
export const getMsgReply =  (prompt:string) => {
    // return fetch(`${BASE_URL}`)
    const completion =  openai.chat.completions.create({
        messages: [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
          ],
        model:"deepseek-chat",
        stream: true,
    });
    return completion;
    // console.log('---completion---', completion)
    // return {
    //     "model": "deepseek-chat",
    //     "choices": [
    //         {
    //             "index": 0,
    //             "message": {
    //                 "role": "assistant",
    //                 "content": "您好！您输入的是“1231”，请问您是想询问某个具体的信息、需要帮助，还是这只是随意输入？如果您有具体问题或需要协助，请提供更多细节，我会尽力帮您解答！ 😊"
    //             },
    //             "logprobs": null,
    //             "finish_reason": "stop"
    //         }
    //     ],
    // };
}