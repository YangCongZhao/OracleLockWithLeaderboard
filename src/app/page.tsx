"use client";

import { motion } from "framer-motion";
export default function Home() {


    return (
        <main className="w-full h-full overflow-x-hidden text-white">
            <section className="h-screen flex flex-col justify-center items-center text-center relative overflow-hidden bg-gradient-to-br from-purple-900 via-black to-black">
                {/* 背景呼吸光圈 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 0.5, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-3xl"
                />

                {/* 标题 */}
                <motion.h1
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                    className="text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 drop-shadow-lg"
                >
                    预言锁 ⚡
                </motion.h1>

                {/* 副标题 */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut", delay: 1 }}
                    className="mt-6 text-2xl text-gray-300 max-w-2xl"
                >
                    预测加密货币未来价格，锁定你的预言，链上见证真相。
                </motion.p>

                {/* CTA按钮 */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12, delay: 1.5 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => document.getElementById("form")?.scrollIntoView({ behavior: "smooth" })}
                    className="mt-10 px-10 py-4 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-xl font-bold shadow-lg"
                >
                    开始体验 🚀
                </motion.button>
            </section>
            <section
                id="intro"
                className="h-screen flex flex-col justify-center items-center px-6 relative overflow-hidden bg-gradient-to-b from-black via-purple-950/30 to-black"
            >
                {/* 背景模糊光斑 */}
                <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-pink-500/30 rounded-full blur-3xl"></div>

                {/* 标题 */}
                <h2 className="text-5xl md:text-6xl font-extrabold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 drop-shadow-lg">
                    为什么选择预言锁？
                </h2>

                {/* 卡片容器 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl z-10">
                    {[
                        { title: "预测玩法", desc: "选择币种和时间，AI Agents 自动为你预测未来价格并上链。" },
                        { title: "链上安全", desc: "基于 Monad 区块链，数据不可篡改，预言机实时验证价格。" },
                        { title: "奖励机制", desc: "预测最接近真实价格者上榜，解锁更多特权和收益。" },
                    ].map((card, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0px 0px 25px rgba(236,72,153,0.6)",
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 15,
                                duration: 0.4,
                                delay: idx * 0.15,
                            }}
                            viewport={{ once: true }}
                            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 shadow-lg
                   hover:border-pink-400/50 transition-colors duration-300"
                        >
                            <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">
                                {card.title}
                            </h3>
                            <p className="text-gray-300 leading-relaxed">{card.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </main>
    );
}
