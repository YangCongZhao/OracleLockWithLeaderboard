"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
    useAccount,
    useReadContract,
    useWriteContract,
    usePublicClient,
    useChainId,
} from "wagmi";
import contractABI from "../../ABI/PredictionLock.json";

// ---------- 纯工具 ----------
function mulberry32(a: number) {
    return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ---------- 业务类型 ----------
interface Seal {
    id: number;
    unlockTime: number;
    agentIds: number[];
    predictions: number[];
    creator: string;
    isUnlocked: boolean;
}

// ---------- 常量 ----------
const agentsList = [
    { id: 1, name: "AlphaBot", avatar: "🤖" },
    { id: 2, name: "CryptoEye", avatar: "🦾" },
    { id: 3, name: "ChainBrain", avatar: "🧠" },
    { id: 4, name: "PriceGuru", avatar: "🔮" },
    { id: 5, name: "MoonWatcher", avatar: "🌙" },
];

// 使用你部署的合约地址
const CONTRACT_ADDRESS = "0x8489De072a046190957eC5F137663e35bDD45C62";
const DEFAULT_TOKEN_TYPE = 1; // 0=BTC, 1=ETH

// ---------- 数据解析（纯函数） ----------
function parseSealTuple(t: any) {
    // 解析合约返回的 Seal struct
    if (Array.isArray(t)) {
        return {
            id: Number(t[0] || 0),
            creator: String(t[1] || "0x0000000000000000000000000000000000000000") as `0x${string}`,
            targetTime: Number(t[2] || 0),
            actualPrice: Number(t[3] || 0),
            revealed: Boolean(t[4] || false),
            createdAt: Number(t[5] || 0),
        };
    } else {
        return {
            id: Number(t?.id || 0),
            creator: String(t?.creator || "0x0000000000000000000000000000000000000000") as `0x${string}`,
            targetTime: Number(t?.targetTime || 0),
            actualPrice: Number(t?.actualPrice || 0),
            revealed: Boolean(t?.revealed || false),
            createdAt: Number(t?.createdAt || 0),
        };
    }
}

function parsePredictionTuple(p: any) {
    // 解析合约返回的 Prediction struct
    if (Array.isArray(p)) {
        return {
            name: String(p[0] || ""),
            price: Number(p[1] || 0), // 合约 1e8 精度
            deviation: Number(p[2] || 0),
            rank: Number(p[3] || 0)
        };
    } else {
        return {
            name: String(p?.name || ""),
            price: Number(p?.price || 0),
            deviation: Number(p?.deviation || 0),
            rank: Number(p?.rank || 0)
        };
    }
}

function nameToAgentId(name: string) {
    const n = name.toLowerCase();
    const found = agentsList.find((a) => a.name.toLowerCase() === n);
    return found ? found.id : 0;
}

// ---------- Hook：读取和管理封印数据（不使用 multicall） ----------
function useSealsData() {
    const { isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();

    const {
        data: sealCount,
        isLoading: isCountLoading,
        error: countError,
        refetch: refetchCount,
    } = useReadContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: contractABI,
        functionName: "sealCount",
        query: { enabled: isConnected },
    });

    const [seals, setSeals] = useState<Seal[]>([]);
    const [loadingSeals, setLoadingSeals] = useState<boolean>(false);

    const loadAll = useCallback(async () => {
        if (!publicClient) return;
        const raw = Number(sealCount || 0);
        if (!Number.isFinite(raw) || raw <= 0) {
            setSeals([]);
            return;
        }

        setLoadingSeals(true);
        try {
            // 生成所有封印ID
            const ids = Array.from({ length: raw }, (_, i) => i + 1);
            const assembled: Seal[] = [];

            // 逐个读取封印数据（避免 multicall）
            for (const id of ids) {
                try {
                    // 1. 读取封印基本信息
                    const sealData = await publicClient.readContract({
                        address: CONTRACT_ADDRESS as `0x${string}`,
                        abi: contractABI,
                        functionName: "seals",
                        args: [BigInt(id)],
                    });

                    const s = parseSealTuple(sealData);

                    // 2. 读取预测数量
                    const predCount = await publicClient.readContract({
                        address: CONTRACT_ADDRESS as `0x${string}`,
                        abi: contractABI,
                        functionName: "getPredictionCount",
                        args: [BigInt(id)],
                    });

                    const count = Number(predCount || 0);

                    // 3. 读取每个预测
                    const preds: Array<{ name: string; price: number; deviation: number; rank: number }> = [];
                    for (let j = 0; j < count; j++) {
                        try {
                            const predData = await publicClient.readContract({
                                address: CONTRACT_ADDRESS as `0x${string}`,
                                abi: contractABI,
                                functionName: "predictions",
                                args: [BigInt(id), BigInt(j)],
                            });
                            preds.push(parsePredictionTuple(predData));
                        } catch (e) {
                            console.error(`读取预测失败 [${id}][${j}]:`, e);
                            preds.push({ name: "", price: 0, deviation: 0, rank: 0 });
                        }
                    }

                    const agentIds = preds.map((p) => nameToAgentId(p.name));
                    const prices = preds.map((p) => p.price / 1e8); // 转换为正常价格

                    assembled.push({
                        id,
                        unlockTime: s.targetTime,
                        agentIds,
                        predictions: prices,
                        creator: s.creator,
                        isUnlocked: s.revealed,
                    });
                } catch (e) {
                    console.error(`读取封印 ${id} 失败:`, e);
                }
            }

            setSeals(assembled);
        } catch (error) {
            console.error("加载封印数据失败:", error);
        } finally {
            setLoadingSeals(false);
        }
    }, [publicClient, sealCount]);

    // 自动加载
    useEffect(() => {
        if (!isConnected) {
            setSeals([]);
            return;
        }
        if (sealCount === undefined) return;
        loadAll();
    }, [isConnected, sealCount, loadAll]);

    // 刷新函数
    const refresh = useCallback(async () => {
        await refetchCount();
        await loadAll();
    }, [refetchCount, loadAll]);

    // 开启封印函数
    const openSeal = useCallback(
        async (sealId: number) => {
            if (!publicClient) throw new Error("No public client");

            try {
                // 调用合约的 revealSeal 函数
                const txHash = await writeContractAsync({
                    address: CONTRACT_ADDRESS as `0x${string}`,
                    abi: contractABI,
                    functionName: "revealSeal",
                    args: [BigInt(sealId), BigInt(DEFAULT_TOKEN_TYPE)],
                });

                // 乐观更新UI
                setSeals((prev) =>
                    prev.map((s) => (s.id === sealId ? { ...s, isUnlocked: true } : s))
                );

                // 等待交易确认
                await publicClient.waitForTransactionReceipt({ hash: txHash });

                // 重新加载数据确保状态同步
                await refresh();

                return txHash;
            } catch (error) {
                console.error("开启封印失败:", error);
                // 如果失败，重新加载数据恢复真实状态
                await refresh();
                throw error;
            }
        },
        [publicClient, writeContractAsync, refresh]
    );

    return {
        seals,
        isCountLoading,
        loadingSeals,
        sealCount: sealCount ? Number(sealCount) : 0,
        countError,
        refresh,
        openSeal,
    };
}

// ---------- 页面组件 ----------
export default function SealsPage() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();

    const {
        seals,
        isCountLoading,
        loadingSeals,
        sealCount,
        countError,
        refresh,
        openSeal,
    } = useSealsData();

    // UI 状态
    const [mounted, setMounted] = useState(false);
    const [viewport, setViewport] = useState({ w: 1000, h: 800 });
    const seed = 20250816;
    const rng = useMemo(() => mulberry32(seed), []);
    const [particles, setParticles] = useState<
        { x: number; y: number; duration: number }[]
    >([]);
    const [currentTime, setCurrentTime] = useState(
        Math.floor(Date.now() / 1000)
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
        const w = window.innerWidth;
        const h = window.innerHeight;
        setViewport({ w, h });
        const localRng = mulberry32(seed + 1);
        const arr = Array.from({ length: 20 }).map(() => ({
            x: Math.floor(localRng() * w),
            y: Math.floor(localRng() * h),
            duration: 10 + Math.floor(localRng() * 10),
        }));
        setParticles(arr);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Math.floor(Date.now() / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTimeRemaining = (unlockTime: number) => {
        const remaining = unlockTime - currentTime;
        if (remaining <= 0) return "可开启";
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        if (hours > 0) return `${hours}小时 ${minutes}分钟`;
        if (minutes > 0) return `${minutes}分 ${seconds}秒`;
        return `${seconds}秒`;
    };

    const canUnlock = (seal: Seal) =>
        seal.unlockTime <= currentTime && !seal.isUnlocked;

    const handleOpenSeal = async (sealId: number) => {
        if (!isConnected || loading) return;
        setLoading(true);
        try {
            const tx = await openSeal(sealId);
            console.log("开启封印交易哈希:", tx);
            alert("封印已开启！查看预测结果吧！");
        } catch (e) {
            console.error(e);
            alert("开启封印失败，请重试");
        } finally {
            setLoading(false);
        }
    };

    // 获取网络名称
    const getNetworkName = (id: number) => {
        switch(id) {
            case 1: return "Ethereum Mainnet";
            case 11155111: return "Sepolia Testnet";
            case 5: return "Goerli Testnet";
            case 31337: return "Hardhat Local";
            case 1337: return "Ganache Local";
            default: return `Local Network (${id})`;
        }
    };

    if (!isConnected) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔐</div>
                    <h2 className="text-2xl font-bold mb-2">请连接钱包</h2>
                    <p className="text-gray-400">连接钱包后查看您的预言封印</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white">
            {/* 背景动画效果 */}
            {mounted && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    {particles.map((p, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
                            initial={{ x: p.x, y: p.y }}
                            animate={{ y: [-100, viewport.h + 100] }}
                            transition={{ duration: p.duration, repeat: Infinity, ease: "linear" }}
                        />
                    ))}
                </div>
            )}

            {/* 导航栏 */}
            <nav className="relative z-10 p-6 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <span className="text-2xl">📮</span>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        预言封印
                    </h1>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={refresh}
                        className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg border border-purple-400/50 text-sm transition-all"
                    >
                        🔄 刷新
                    </button>
                    <div className="px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full border border-white/20">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                    </div>
                </div>
            </nav>

            {/*/!* 调试信息 *!/*/}
            {/*<div className="relative z-10 container mx-auto px-6 py-4">*/}
            {/*    <div className="bg-black/20 p-4 rounded-lg mb-6">*/}
            {/*        <h3 className="text-lg font-bold mb-2">调试信息</h3>*/}
            {/*        <div className="grid grid-cols-2 gap-4 text-sm">*/}
            {/*            <div>封印总数: {isCountLoading ? "Loading..." : sealCount}</div>*/}
            {/*            <div>当前网络: {getNetworkName(chainId)}</div>*/}
            {/*            <div>合约地址: {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}</div>*/}
            {/*            <div>已加载封印: {seals.length}</div>*/}
            {/*        </div>*/}
            {/*        {countError && (*/}
            {/*            <div className="mt-2 text-red-400">*/}
            {/*                错误: {countError.message}*/}
            {/*            </div>*/}
            {/*        )}*/}
            {/*        {(chainId === 31337 || chainId === 1337) && (*/}
            {/*            <div className="mt-2 text-green-400">*/}
            {/*                ✅ 已连接到本地网络，不使用 Multicall*/}
            {/*            </div>*/}
            {/*        )}*/}
            {/*    </div>*/}
            {/*</div>*/}

            {/* 主内容 */}
            <div className="relative z-10 container mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl font-bold mb-4">我的预言封印</h2>
                    <p className="text-gray-300 text-lg">时间到了就可以开启，查看AI预测结果</p>
                </motion.div>

                {(isCountLoading || loadingSeals) && (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"
                            />
                        </div>
                        <p className="text-gray-400">正在加载封印数据...</p>
                        <p className="text-xs text-gray-500 mt-2">本地网络加载可能较慢，请稍候...</p>
                    </div>
                )}

                {!isCountLoading && !loadingSeals && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.1 } },
                            hidden: {},
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
                    >
                        {seals.map((seal) => {
                            const isUnlockable = canUnlock(seal);
                            return (
                                <motion.div
                                    key={seal.id}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.8, y: 50 },
                                        visible: { opacity: 1, scale: 1, y: 0 },
                                    }}
                                    whileHover={{
                                        y: -10,
                                        rotateY: 5,
                                        boxShadow: "0px 20px 40px rgba(236,72,153,0.3)",
                                    }}
                                    className="relative group cursor-pointer"
                                >
                                    <div
                                        className={`relative p-8 rounded-2xl border-2 transition-all duration-500
                      ${
                                            isUnlockable
                                                ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/50 shadow-yellow-400/20"
                                                : seal.isUnlocked
                                                    ? "bg-gradient-to-br from-green-500/20 to-blue-500/20 border-green-400/50"
                                                    : "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/50"
                                        }
                      backdrop-blur-lg shadow-2xl`}
                                    >
                                        <div className="relative text-center mb-6">
                                            <motion.div
                                                animate={
                                                    isUnlockable
                                                        ? { rotateY: [0, 10, -10, 0], scale: [1, 1.05, 1] }
                                                        : {}
                                                }
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="text-6xl mb-2"
                                            >
                                                {seal.isUnlocked ? "📭" : isUnlockable ? "📬" : "📮"}
                                            </motion.div>
                                            <div className="text-sm font-medium text-gray-300">
                                                封印 #{seal.id}
                                            </div>
                                        </div>

                                        <div className="text-center mb-6">
                                            <div
                                                className={`text-2xl font-bold mb-2 ${
                                                    seal.isUnlocked
                                                        ? "text-green-400"
                                                        : isUnlockable
                                                            ? "text-yellow-400"
                                                            : "text-purple-300"
                                                }`}
                                            >
                                                {seal.isUnlocked
                                                    ? "已开启"
                                                    : formatTimeRemaining(seal.unlockTime)}
                                            </div>
                                            {!seal.isUnlocked && !isUnlockable && (
                                                <div className="text-sm text-gray-400">
                                                    解锁时间:{" "}
                                                    {new Date(seal.unlockTime * 1000).toLocaleString()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            <div className="text-sm text-gray-300">
                                                包含 {seal.agentIds.length} 个AI预测
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {seal.agentIds.slice(0, 3).map((agentId, index) => {
                                                    const agent = agentsList.find((a) => a.id === agentId);
                                                    return agent ? (
                                                        <div key={`${agentId}-${index}`} className="text-lg">
                                                            {agent.avatar}
                                                        </div>
                                                    ) : null;
                                                })}
                                                {seal.agentIds.length > 3 && (
                                                    <div className="text-sm text-gray-400">
                                                        +{seal.agentIds.length - 3}
                                                    </div>
                                                )}
                                            </div>

                                            {seal.isUnlocked && seal.predictions.length > 0 && (
                                                <div className="mt-4 p-3 bg-black/30 rounded-lg">
                                                    <div className="text-sm text-gray-400 mb-2">
                                                        预测结果:
                                                    </div>
                                                    {seal.agentIds.map((agentId, index) => {
                                                        const agent = agentsList.find((a) => a.id === agentId);
                                                        const price = seal.predictions[index];
                                                        return agent && price ? (
                                                            <div
                                                                key={`${agentId}-${index}`}
                                                                className="flex justify-between text-sm"
                                                            >
                                                                <span>
                                                                    {agent.avatar} {agent.name}
                                                                </span>
                                                                <span className="text-yellow-400">
                                                                    ${price.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        ) : null;
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {isUnlockable ? (
                                            <motion.button
                                                whileHover={{ scale: loading ? 1 : 1.05 }}
                                                whileTap={{ scale: loading ? 1 : 0.95 }}
                                                onClick={() => handleOpenSeal(seal.id)}
                                                disabled={loading}
                                                className={`w-full py-3 rounded-lg font-bold shadow-lg transition-all ${
                                                    loading
                                                        ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                                                        : "bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:shadow-yellow-500/50"
                                                }`}
                                            >
                                                {loading ? "⏳ 处理中..." : "🔓 开启封印"}
                                            </motion.button>
                                        ) : seal.isUnlocked ? (
                                            <div className="w-full py-3 rounded-lg bg-green-600/30 text-green-400 text-center font-bold">
                                                ✅ 已开启
                                            </div>
                                        ) : (
                                            <div className="w-full py-3 rounded-lg bg-gray-600/50 text-gray-400 text-center font-bold">
                                                🔒 等待解锁
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {!isCountLoading && !loadingSeals && seals.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                        <div className="text-6xl mb-4">📪</div>
                        <h3 className="text-2xl font-bold mb-2">暂无封印</h3>
                        <p className="text-gray-400">去创建你的第一个预言封印吧！</p>
                        <button
                            onClick={refresh}
                            className="mt-4 px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg border border-purple-400/50 transition-all"
                        >
                            🔄 重新加载
                        </button>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
