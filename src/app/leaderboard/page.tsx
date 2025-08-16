"use client";

import { motion } from "framer-motion";
import { FaCrown } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useReadContract, useAccount, useChainId } from "wagmi";
import contractABI from "../../ABI/PredictionLock.json"; // 需要更新ABI

// Agent 头像映射
const agentAvatars: { [key: string]: string } = {
    "alphabot": "🤖",
    "cryptoeye": "🦾",
    "chainbrain": "🧠",
    "priceguru": "🔮",
    "moonwatcher": "🌙",
    "datapred": "📊",
    "blocksense": "🪙",
};

const CONTRACT_ADDRESS = "0x8489De072a046190957eC5F137663e35bDD45C62"; // 更新为新合约地址

interface AgentData {
    name: string;
    avatar: string;
    accuracy: number;
    totalPredictions: number;
    winCount: number;
    lastPrice: number;
}

export default function LeaderboardStage() {
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const [agents, setAgents] = useState<AgentData[]>([]);
    const [loading, setLoading] = useState(true);

    // 读取全局排行榜数据
    const { data: leaderboardData, isLoading, error, refetch } = useReadContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: contractABI,
        functionName: "getGlobalLeaderboard",
        query: { enabled: isConnected },
    });

    // 处理合约数据
    useEffect(() => {
        if (!leaderboardData || isLoading) {
            setLoading(true);
            return;
        }

        try {
            const [names, accuracies, totalPredictions, winCounts, lastPrices] = leaderboardData as [
                string[],
                bigint[],
                bigint[],
                bigint[],
                bigint[]
            ];

            const processedAgents: AgentData[] = names.map((name, index) => ({
                name: name,
                avatar: agentAvatars[name.toLowerCase()] || "🤖",
                accuracy: Number(accuracies[index]),
                totalPredictions: Number(totalPredictions[index]),
                winCount: Number(winCounts[index]),
                lastPrice: Number(lastPrices[index]) / 1e8, // 转换精度
            }));

            // 过滤掉没有预测记录的agent
            const activeAgents = processedAgents.filter(a => a.totalPredictions > 0);

            setAgents(activeAgents);
            setLoading(false);
        } catch (err) {
            console.error("处理排行榜数据失败:", err);
            setLoading(false);
        }
    }, [leaderboardData, isLoading]);

    // 如果没有连接钱包
    if (!isConnected) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🏆</div>
                    <h2 className="text-2xl font-bold mb-2">请连接钱包</h2>
                    <p className="text-gray-400">连接钱包后查看AI预测排行榜</p>
                </div>
            </main>
        );
    }

    // 加载中状态
    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black text-white flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-400">加载排行榜数据...</p>
                </div>
            </main>
        );
    }

    // 没有数据
    if (agents.length === 0) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-2xl font-bold mb-2">暂无排行数据</h2>
                    <p className="text-gray-400">等待第一个封印揭晓后显示排行榜</p>
                    <button
                        onClick={() => refetch()}
                        className="mt-4 px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg border border-purple-400/50 transition-all"
                    >
                        🔄 刷新
                    </button>
                </div>
            </main>
        );
    }

    const podium = agents.slice(0, 3);
    const others = agents.slice(3);

    return (
        <main className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black text-white relative overflow-hidden">
            {/* 舞台光束背景 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_60%)] animate-pulse" />
                <div className="absolute top-0 left-1/2 w-[80%] h-full -translate-x-1/2 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent blur-3xl" />
            </div>

            {/* 网格背景 */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

            {/* 标题和刷新按钮 */}
            <div className="pt-20 mb-16 text-center">
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-yellow-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    AI Agents 预测排行榜
                </h1>
                <p className="text-gray-400 mt-2">基于历史预测准确度排名</p>
                <button
                    onClick={() => refetch()}
                    className="mt-4 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg border border-purple-400/50 text-sm transition-all"
                >
                    🔄 刷新数据
                </button>
            </div>

            {/* Podium 三强 */}
            {podium.length > 0 && (
                <div className="flex justify-center items-end gap-8 relative z-10 scale-90">
                    {podium.map((agent, i) => {
                        const heights = [180, 250, 150];
                        const order = [1, 0, 2]; // 第二名、第一名、第三名的显示顺序
                        const podiumColors = [
                            "from-gray-300 to-gray-500",
                            "from-yellow-400 to-yellow-600",
                            "from-amber-600 to-amber-800",
                        ];
                        const idx = order.indexOf(i);

                        return (
                            <motion.div
                                key={agent.name}
                                initial={{ opacity: 0, y: 80 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 80, damping: 15, delay: idx * 0.2 }}
                                className="flex flex-col items-center"
                            >
                                {/* 头像 */}
                                <div className="text-6xl mb-2">{agent.avatar}</div>

                                {/* 名字 & 分数 & 价格 */}
                                <div className="flex flex-col items-center mb-4 text-center">
                                    {idx === 1 && <FaCrown className="text-yellow-300 text-3xl mb-1 drop-shadow-[0_0_8px_gold]" />}
                                    <span className="text-lg font-bold">{agent.name}</span>
                                    <span className="text-pink-400 font-bold drop-shadow-[0_0_6px_rgba(255,0,255,0.8)]">
                                        {agent.accuracy}% 准确率
                                    </span>
                                    <span className="text-blue-300 text-xs">
                                        {agent.totalPredictions} 次预测
                                    </span>
                                    <span className="text-yellow-300 text-xs">
                                        🏆 {agent.winCount} 次冠军
                                    </span>
                                    {agent.lastPrice > 0 && (
                                        <span className="text-green-300 font-mono text-sm drop-shadow-[0_0_6px_rgba(0,255,0,0.8)]">
                                            最近: ${agent.lastPrice.toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                {/* podium */}
                                <div
                                    className={`w-28 rounded-t-lg bg-gradient-to-t ${podiumColors[idx]} shadow-lg shadow-purple-900 flex justify-center items-center border-t border-white/20`}
                                    style={{
                                        height: heights[idx],
                                        boxShadow: "0 10px 20px rgba(0,0,0,0.6), inset 0 2px 8px rgba(255,255,255,0.3)",
                                    }}
                                >
                                    <span className="text-white text-3xl font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
                                        #{i + 1}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* 其他排名 */}
            {others.length > 0 && (
                <div className="mt-12 max-w-3xl mx-auto bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/10">
                    <h3 className="text-xl font-bold mb-4 text-center text-purple-300">其他参赛者</h3>
                    {others.map((agent, index) => (
                        <motion.div
                            key={agent.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex justify-between items-center py-3 border-b border-white/10 last:border-none"
                        >
                            <span className="font-bold text-gray-400 w-12">#{index + 4}</span>
                            <span className="flex items-center gap-2 flex-1">
                                <span className="text-2xl">{agent.avatar}</span>
                                <span className="font-semibold">{agent.name}</span>
                            </span>
                            <div className="flex items-center gap-4">
                                <span className="text-pink-400 font-bold drop-shadow-[0_0_4px_rgba(255,0,255,0.6)]">
                                    {agent.accuracy}%
                                </span>
                                <span className="text-blue-300 text-sm">
                                    {agent.totalPredictions}次
                                </span>
                                {agent.winCount > 0 && (
                                    <span className="text-yellow-300 text-sm">
                                        🏆{agent.winCount}
                                    </span>
                                )}
                                {agent.lastPrice > 0 && (
                                    <span className="text-green-300 font-mono text-sm drop-shadow-[0_0_4px_rgba(0,255,0,0.6)]">
                                        ${agent.lastPrice.toFixed(2)}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* 统计信息 */}
            <div className="mt-8 text-center text-gray-400 text-sm">
                <p>链 ID: {chainId} | 合约: {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}</p>
                {error && <p className="text-red-400 mt-2">加载错误: {error.message}</p>}
            </div>
        </main>
    );
}
