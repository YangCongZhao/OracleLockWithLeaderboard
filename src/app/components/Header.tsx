"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {useAccount, useConnect, useDisconnect} from 'wagmi'

export default function Header() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { connectors, connect,isLoading } = useConnect()
    const { isConnected,address } = useAccount();
    const { disconnect } = useDisconnect()
    const pathname = usePathname();

    const navItems = [
        { href: "/", label: "首页" },
        { href: "/predict", label: "预测" },
        {href:"/SealsPage",label: "封印"},
        { href: "/leaderboard", label: "排行榜" }

    ];

    // // 模拟连接钱包（后面可替换 wagmi / viem）
    const connectWallet = async () => {
        // connect({connector})
        const metaMaskConnector = connectors.find(c => c.name === "MetaMask");
        console.log(metaMaskConnector,connectors);
        if (metaMaskConnector) {
            connect({connector:metaMaskConnector})
        }

    };
    const disconnectWallet = async()=>{
        disconnect()
    }

    function shortAddr(a: `0x${string}` | undefined) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return `${a.slice(0, 6)}...${a.slice(-4)}`;
    }

    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-black/60 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                {/* 左边 Logo */}
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400">
                    预言锁 ⚡
                </h1>

                {/* 中间导航 */}
                <nav className="flex gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`transition-colors ${
                                pathname === item.href
                                    ? "text-pink-400 font-bold"
                                    : "text-gray-300 hover:text-pink-400"
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* 右边连接钱包按钮 */}
                <div className="relative inline-block text-left">
                    {isConnected ? (
                        <div className="group">
                            <button
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 font-bold shadow-lg hover:scale-105 transition-transform"
                            >
                                {shortAddr(address)}
                            </button>

                            {/* 下拉菜单 */}
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={disconnectWallet}
                                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    退出钱包
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={connectWallet}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 font-bold shadow-lg hover:scale-105 transition-transform"
                        >
                            {isLoading ? '连接中...' : '连接钱包'}
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
