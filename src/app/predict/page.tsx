"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import PriceChart from "@/app/components/PriceChart";
import { useAccount, useWriteContract } from 'wagmi';
import contractABI from '../../ABI/PredictionLock.json'; // 编译后的 ABI

// 定义 Agent 类型
interface Agent {
    id: number;
    name: string;
    avatar: string;
}

// 定义预测结果类型
interface Prediction {
    id: number;
    price: number;
}

// 定义币种类型
type CoinType = "ETH" | "BTC";

// 模拟 Agents 数据
const agentsList: Agent[] = [
    { id: 1, name: "AlphaBot", avatar: "🤖" },
    { id: 2, name: "CryptoEye", avatar: "🦾" },
    { id: 3, name: "ChainBrain", avatar: "🧠" },
    { id: 4, name: "PriceGuru", avatar: "🔮" },
    { id: 5, name: "MoonWatcher", avatar: "🌙" },
];

export default function Home() {
    const { isConnected } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const [coin, setCoin] = useState<CoinType>("ETH");
    const [time, setTime] = useState<string>("");
    const [showAgents, setShowAgents] = useState<boolean>(false);
    const [predictions, setPredictions] = useState<{ id: number; price: number }[]>([]);
    const [selectedAgents, setSelectedAgents] = useState<number[]>([]);

    const toggleAgentSelection = (id: number) => {
        setSelectedAgents((prev) =>
            prev.includes(id) ? prev.filter((agentId) => agentId !== id) : [...prev, id]
        );
    };

    const sealPrediction = async () => {
        if (isConnected) {
            const targetTs = Math.floor(new Date(time).getTime() / 1000);
            try {
                // 获取预测价格 - 转换为合约需要的格式（精度1e8）
                const predictionPrices = selectedAgents.map(agentId => {
                    const prediction = predictions.find(p => p.id === agentId);
                    if (prediction) {
                        // 将小数价格转换为整数（乘以1e8）
                        const priceInWei = Math.floor(prediction.price * 1e8);
                        return BigInt(priceInWei);
                    }
                    return BigInt(0);
                });

                // 获取选中的代理名称
                const selectedAgentNames = selectedAgents.map(agentId => {
                    const agent = agentsList.find(a => a.id === agentId);
                    return agent ? agent.name : "";
                });

                console.log("Target timestamp:", targetTs);
                console.log("Agent names:", selectedAgentNames);
                console.log("Prediction prices:", predictionPrices.map(p => p.toString()));

                const txHash = await writeContractAsync({
                    address: '0x8489De072a046190957eC5F137663e35bDD45C62' as `0x${string}`,
                    abi: contractABI as never,
                    functionName: 'createSeal',
                    args: [
                        targetTs,               // 目标时间
                        selectedAgentNames,     // agents名称数组
                        predictionPrices        // 预测价格数组（BigInt格式，精度1e8）
                    ]
                });

                console.log("Transaction hash:", txHash);
                alert("封印成功创建！");

            } catch (err) {
                console.error("交易失败:", err);
                alert("交易失败，请检查控制台");
            }
        } else {
            alert("请先连接钱包");
        }
    };

    const startPrediction = () => {
        if (!time) {
            alert("请选择预测截止时间");
            return;
        }
        if (selectedAgents.length === 0) {
            alert("请先选择至少一个 Agent");
            return;
        }
        // 随机生成预测价格，只为已选择的 agents
        const newPredictions = selectedAgents.map((agentId) => ({
            id: agentId,
            price: +(Math.random() * (coin === "ETH" ? 4000 : 80000) + (coin === "ETH" ? 1000 : 20000)).toFixed(2)
        }));
        console.log(newPredictions);
        setPredictions(newPredictions);
        setShowAgents(true);
    };

    return (
        <main className="w-full h-full overflow-x-hidden text-white">
            {/* 第三屏 - 表单 */}
            <section id="form" className="h-screen flex flex-col justify-center items-center bg-black px-6">
                {/* 新增价格曲线图 */}
                <PriceChart coin={coin} />
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-lg shadow-xl">
                    <h2 className="text-3xl font-bold mb-6">选择预测条件</h2>

                    {/* 币种 */}
                    <label className="block mb-3 font-semibold">选择币种</label>
                    <div className="flex gap-4 mb-6">
                        {["ETH", "BTC"].map((c) => (
                            <motion.button
                                key={c}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setCoin(c as CoinType)}
                                className={`px-4 py-2 rounded-lg border ${
                                    coin === c
                                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent"
                                        : "border-gray-500 text-gray-300 hover:border-white"
                                }`}
                            >
                                {c}
                            </motion.button>
                        ))}
                    </div>

                    {/* 时间 */}
                    <label className="block mb-3 font-semibold">预测截止时间</label>
                    <input
                        type="datetime-local"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full p-2 rounded-lg bg-black/30 border border-gray-500 mb-6 focus:border-pink-400 outline-none"
                    />

                    {/* 选择 Agents */}
                    <label className="block mb-3 font-semibold">选择 Agents</label>
                    <div className="flex flex-wrap gap-3 mb-6">
                        {agentsList.map((agent) => (
                            <button
                                key={agent.id}
                                type="button"
                                onClick={() => toggleAgentSelection(agent.id)}
                                className={`px-4 py-2 rounded-lg border cursor-pointer select-none ${
                                    selectedAgents.includes(agent.id)
                                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent"
                                        : "border-gray-500 text-gray-300 hover:border-white"
                                }`}
                            >
                                {agent.avatar} {agent.name}
                            </button>
                        ))}
                    </div>

                    {/* 提交按钮 */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={startPrediction}
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-lg font-bold shadow-lg"
                    >
                        开始预测
                    </motion.button>
                </div>
            </section>

            {showAgents && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center px-6"
                >
                    {/* 关闭按钮 */}
                    <button
                        onClick={() => setShowAgents(false)}
                        className="absolute top-6 right-6 text-gray-300 hover:text-white text-2xl"
                    >
                        ✖
                    </button>

                    {/* 舞台光效 */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0.5 }}
                        animate={{ scale: 3, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute w-40 h-40 bg-purple-500/30 rounded-full blur-3xl"
                    />

                    {/* 标题 */}
                    <h2 className="text-4xl font-bold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400 drop-shadow-lg">
                        Agents 预测结果
                    </h2>

                    {/* 卡片网格 */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.2 } },
                            hidden: {},
                        }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl"
                    >
                        {selectedAgents.map((agentId) => {
                            const agent = agentsList.find((a) => a.id === agentId);
                            const p = predictions.find((pr) => pr.id === agentId);
                            if (!agent) return null;
                            return (
                                <motion.div
                                    key={agent.id}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.5, y: 50 },
                                        visible: { opacity: 1, scale: 1, y: 0 },
                                    }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    whileHover={{ y: -5, boxShadow: "0px 0px 20px rgba(236,72,153,0.6)" }}
                                    className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg flex flex-col items-center border border-white/20 hover:border-pink-400/40"
                                >
                                    <div className="text-5xl mb-4">{agent.avatar}</div>
                                    <h3 className="text-xl font-bold mb-2">{agent.name}</h3>
                                    {/* 数字显示 */}
                                    <p className="text-2xl font-mono text-yellow-300">
                                        {p ? `${p.price}` : "$0"}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={sealPrediction}
                        className="w-1/4 py-3 mt-20 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-lg font-bold shadow-lg"
                    >
                        封印
                    </motion.button>
                </motion.div>
            )}
        </main>
    );
}
