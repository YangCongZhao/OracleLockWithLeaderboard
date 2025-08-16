import {
    createConfig,
    http,
    cookieStorage,
    createStorage, injected
} from 'wagmi'
import { mainnet, sepolia,monadTestnet } from 'wagmi/chains'

// 定义本地链配置
const localChain = {
    id: 31337, // Hardhat 默认链 ID
    name: 'Localhost',
    network: 'localhost',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['http://127.0.0.1:7545'], // Hardhat 默认 RPC
            // 如果使用 Ganache，改为 http://127.0.0.1:7545
        },
        public: {
            http: ['http://127.0.0.1:7545'],
        },
    },
    testnet: true,
}


export function getConfig() {
    return createConfig({
        // chains: [mainnet, sepolia],
        chains:[monadTestnet],
        ssr: true,
        connectors: [
            injected(), // MetaMask
        ],
        storage: createStorage({
            storage: cookieStorage,
        }),
        transports: {
            // [localChain.id]: http('http://127.0.0.1:7545'),
            //
            [monadTestnet.id]: http(),
            // [mainnet.id]: http(),
            // [sepolia.id]: http(),
        },
    })
}
