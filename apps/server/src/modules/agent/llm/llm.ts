import { v4 as uuidv4 } from "uuid";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AIMessage, AIMessageChunk, HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { START, END, StateGraph, MessagesAnnotation, MemorySaver } from "@langchain/langgraph";
import { LLM as BaseLLM, LLMStream as BaseStream } from "./utils.js";
import { salesCopilotPrompt } from "@/config/prompt.js";

export interface LLMOptions {
    model: string;
    apiKey?: string;
}

const defaultLLMOptions: LLMOptions = {
    model: "gemini-2.0-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
};

export class LLM extends BaseLLM {
    private threadId: string;
    private options: LLMOptions;
    private client: ChatGoogleGenerativeAI;
    private prompt: string;
    private promptTemplate: ChatPromptTemplate;
    private memory: MemorySaver; // MemorySaver

    constructor(prompt: string, opts: Partial<LLMOptions> = {}) {
        super();
        this.options = { ...defaultLLMOptions, ...opts };
        this.prompt = prompt;
        this.memory = new MemorySaver();

        this.promptTemplate = this.createPromptTemplate(this.prompt);
        this.threadId = uuidv4();

        this.client = new ChatGoogleGenerativeAI({
            model: this.options.model,
            temperature: 0.7,
            apiKey: this.options.apiKey,
        });
    }

    chat(): LLMStream {
        return new LLMStream(this, this.client, this.memory, this.promptTemplate, this.threadId);
    }

    private createPromptTemplate(prompt: string) {
        return ChatPromptTemplate.fromMessages([
            ["system", salesCopilotPrompt],
            ["user", prompt],
            ["placeholder", "{messages}"],
        ]);
    }
}

export class LLMStream extends BaseStream {
    private client: ChatGoogleGenerativeAI;
    private threadId: string;
    private memory: any;
    private promptTemplate: ChatPromptTemplate
    private app: any;
    private interrupted: boolean = false

    constructor(llm: LLM, client: ChatGoogleGenerativeAI, memory: any, promptTemplate: ChatPromptTemplate, threadId: string) {
        super(llm);
    
        this.client = client;
        this.threadId = threadId
        this.memory = memory
        this.promptTemplate = promptTemplate
        this.app = this.initializeWorkflow();
    }

    async sendChat(userMessage: string) {
        const trimmed = userMessage?.trim();
        if (this.interrupted || !trimmed) return;
        try {
            if(userMessage.length > 0) {
                await this.app.invoke({
                    messages: [new HumanMessage(userMessage)],
                }, {
                    configurable: { thread_id: this.threadId }
                });
            }
        } catch (error) {
            console.error("LLM response error:", error);
        }
    }

    private async callModel(state: typeof MessagesAnnotation.State) {
        try {
            const prompt = await this.promptTemplate.invoke(state);
            const stream = await this.client.stream(prompt);

            let buffer = "";
            const chunks: AIMessageChunk[] = [];

            for await (const chunk of stream) {
                chunks.push(chunk);
                buffer += chunk.content;

                const sentences = buffer.split(".");
                for (let i = 0; i < sentences.length - 1; i++) {
                    const sentence = sentences[i]?.trim();
                    if (sentence) {
                        if(this.interrupted) return
                        this.output.put(sentence + ".");
                    }
                }
                buffer = sentences[sentences.length - 1] || "";
            }

            if (buffer.trim()) {
                if(this.interrupted) return
                this.output.put(buffer.trim());
            }

            const fullResponse = new AIMessage({
                content: chunks.map(chunk => chunk.content).join(""),
              });

            return { messages: [fullResponse] };
        } catch (error) {
            console.error("Error in callModel:", error);
            return { messages: [] };
        }
    }

    private initializeWorkflow() {
        return new StateGraph(MessagesAnnotation)
            .addNode("model", this.callModel.bind(this))
            .addEdge(START, "model")
            .addEdge("model", END)
            .compile({ checkpointer: this.memory });
    }

    interrupt() {
        this.interrupted = true
    }

}
