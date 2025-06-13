import { ethers } from 'ethers';

// Contract ABIs (simplified for demo)
const WORK_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function stake(uint256 amount)",
  "function unstake(uint256 amount)",
  "function claimRewards()",
  "function calculateRewards(address user) view returns (uint256)",
  "function getStakingInfo(address user) view returns (uint256, uint256, uint256, uint256)",
  "function stakingAPY() view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event TokensStaked(address indexed user, uint256 amount)",
  "event TokensUnstaked(address indexed user, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 amount)"
];

const PROJECT_ESCROW_ABI = [
  "function createProject(address freelancer, uint256 totalAmount, string[] milestoneDescriptions, uint256[] milestoneAmounts, uint256[] milestoneDueDates)",
  "function startProject(uint256 projectId)",
  "function completeMilestone(uint256 projectId, uint256 milestoneIndex)",
  "function approveMilestone(uint256 projectId, uint256 milestoneIndex)",
  "function getProject(uint256 projectId) view returns (address, address, uint256, uint8, uint256, uint256)",
  "function getMilestone(uint256 projectId, uint256 milestoneIndex) view returns (uint256, string, uint8, uint256, bool)",
  "event ProjectCreated(uint256 indexed projectId, address indexed client, address indexed freelancer, uint256 amount)",
  "event MilestoneCompleted(uint256 indexed projectId, uint256 milestoneIndex)",
  "event PaymentReleased(uint256 indexed projectId, uint256 milestoneIndex, uint256 amount)"
];

const REPUTATION_ABI = [
  "function submitReview(address reviewee, uint256 projectId, uint256 rating, string comment, bool isClient)",
  "function getUserReputation(address user) view returns (uint256, uint256, uint256, uint256, uint256, bool, string)",
  "function getProjectReviews(uint256 projectId) view returns (tuple(address reviewer, address reviewee, uint256 projectId, uint256 rating, string comment, uint256 timestamp, bool isClient)[])",
  "event ReviewSubmitted(address indexed reviewer, address indexed reviewee, uint256 indexed projectId, uint256 rating)"
];

// Contract addresses (these would be deployed contract addresses)
export const CONTRACT_ADDRESSES = {
  WORK_TOKEN: process.env.NEXT_PUBLIC_WORK_TOKEN_ADDRESS || '0x1234567890123456789012345678901234567890',
  PROJECT_ESCROW: process.env.NEXT_PUBLIC_PROJECT_ESCROW_ADDRESS || '0x2345678901234567890123456789012345678901',
  REPUTATION_SYSTEM: process.env.NEXT_PUBLIC_REPUTATION_ADDRESS || '0x3456789012345678901234567890123456789012'
};

export interface WalletInfo {
  address: string;
  balance: string;
  workBalance: string;
  stakedBalance: string;
  pendingRewards: string;
  chainId: number;
  isConnected: boolean;
}

export interface StakingInfo {
  stakedAmount: string;
  pendingRewards: string;
  totalRewards: string;
  stakingTime: number;
  apy: number;
}

export interface ProjectEscrowInfo {
  projectId: number;
  client: string;
  freelancer: string;
  totalAmount: string;
  status: number;
  createdAt: number;
  completedAt: number;
}

export class BlockchainService {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private workTokenContract: ethers.Contract | null = null;
  private escrowContract: ethers.Contract | null = null;
  private reputationContract: ethers.Contract | null = null;

  async connectWallet(): Promise<WalletInfo | null> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();

      // Initialize contracts
      this.workTokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.WORK_TOKEN,
        WORK_TOKEN_ABI,
        this.signer
      );

      this.escrowContract = new ethers.Contract(
        CONTRACT_ADDRESSES.PROJECT_ESCROW,
        PROJECT_ESCROW_ABI,
        this.signer
      );

      this.reputationContract = new ethers.Contract(
        CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
        REPUTATION_ABI,
        this.signer
      );

      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const workBalance = await this.workTokenContract.balanceOf(address);
      const stakingInfo = await this.workTokenContract.getStakingInfo(address);
      const network = await this.provider.getNetwork();

      return {
        address,
        balance: ethers.utils.formatEther(balance),
        workBalance: ethers.utils.formatEther(workBalance),
        stakedBalance: ethers.utils.formatEther(stakingInfo[0]),
        pendingRewards: ethers.utils.formatEther(stakingInfo[1]),
        chainId: network.chainId,
        isConnected: true
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      return null;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.workTokenContract = null;
    this.escrowContract = null;
    this.reputationContract = null;
  }

  async getWalletInfo(): Promise<WalletInfo | null> {
    if (!this.provider || !this.signer || !this.workTokenContract) {
      return null;
    }

    try {
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const workBalance = await this.workTokenContract.balanceOf(address);
      const stakingInfo = await this.workTokenContract.getStakingInfo(address);
      const network = await this.provider.getNetwork();

      return {
        address,
        balance: ethers.utils.formatEther(balance),
        workBalance: ethers.utils.formatEther(workBalance),
        stakedBalance: ethers.utils.formatEther(stakingInfo[0]),
        pendingRewards: ethers.utils.formatEther(stakingInfo[1]),
        chainId: network.chainId,
        isConnected: true
      };
    } catch (error) {
      console.error('Get wallet info error:', error);
      return null;
    }
  }

  async getStakingInfo(): Promise<StakingInfo | null> {
    if (!this.workTokenContract || !this.signer) return null;

    try {
      const address = await this.signer.getAddress();
      const stakingInfo = await this.workTokenContract.getStakingInfo(address);
      const apy = await this.workTokenContract.stakingAPY();

      return {
        stakedAmount: ethers.utils.formatEther(stakingInfo[0]),
        pendingRewards: ethers.utils.formatEther(stakingInfo[1]),
        totalRewards: ethers.utils.formatEther(stakingInfo[2]),
        stakingTime: stakingInfo[3].toNumber(),
        apy: apy.toNumber() / 100 // Convert from basis points
      };
    } catch (error) {
      console.error('Get staking info error:', error);
      return null;
    }
  }

  async stakeTokens(amount: string): Promise<boolean> {
    if (!this.workTokenContract) return false;

    try {
      const amountWei = ethers.utils.parseEther(amount);
      const tx = await this.workTokenContract.stake(amountWei);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Stake tokens error:', error);
      return false;
    }
  }

  async unstakeTokens(amount: string): Promise<boolean> {
    if (!this.workTokenContract) return false;

    try {
      const amountWei = ethers.utils.parseEther(amount);
      const tx = await this.workTokenContract.unstake(amountWei);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Unstake tokens error:', error);
      return false;
    }
  }

  async claimRewards(): Promise<boolean> {
    if (!this.workTokenContract) return false;

    try {
      const tx = await this.workTokenContract.claimRewards();
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Claim rewards error:', error);
      return false;
    }
  }

  async createProject(
    freelancer: string,
    totalAmount: string,
    milestoneDescriptions: string[],
    milestoneAmounts: string[],
    milestoneDueDates: number[]
  ): Promise<number | null> {
    if (!this.escrowContract || !this.workTokenContract) return null;

    try {
      // First approve the escrow contract to spend tokens
      const totalAmountWei = ethers.utils.parseEther(totalAmount);
      const approveTx = await this.workTokenContract.approve(
        CONTRACT_ADDRESSES.PROJECT_ESCROW,
        totalAmountWei
      );
      await approveTx.wait();

      // Convert milestone amounts to wei
      const milestoneAmountsWei = milestoneAmounts.map(amount => 
        ethers.utils.parseEther(amount)
      );

      // Create the project
      const tx = await this.escrowContract.createProject(
        freelancer,
        totalAmountWei,
        milestoneDescriptions,
        milestoneAmountsWei,
        milestoneDueDates
      );

      const receipt = await tx.wait();
      
      // Extract project ID from events
      const event = receipt.events?.find((e: any) => e.event === 'ProjectCreated');
      return event?.args?.projectId?.toNumber() || null;
    } catch (error) {
      console.error('Create project error:', error);
      return null;
    }
  }

  async getProjectInfo(projectId: number): Promise<ProjectEscrowInfo | null> {
    if (!this.escrowContract) return null;

    try {
      const projectInfo = await this.escrowContract.getProject(projectId);
      
      return {
        projectId,
        client: projectInfo[0],
        freelancer: projectInfo[1],
        totalAmount: ethers.utils.formatEther(projectInfo[2]),
        status: projectInfo[3],
        createdAt: projectInfo[4].toNumber(),
        completedAt: projectInfo[5].toNumber()
      };
    } catch (error) {
      console.error('Get project info error:', error);
      return null;
    }
  }

  async completeMilestone(projectId: number, milestoneIndex: number): Promise<boolean> {
    if (!this.escrowContract) return false;

    try {
      const tx = await this.escrowContract.completeMilestone(projectId, milestoneIndex);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Complete milestone error:', error);
      return false;
    }
  }

  async approveMilestone(projectId: number, milestoneIndex: number): Promise<boolean> {
    if (!this.escrowContract) return false;

    try {
      const tx = await this.escrowContract.approveMilestone(projectId, milestoneIndex);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Approve milestone error:', error);
      return false;
    }
  }

  async submitReview(
    reviewee: string,
    projectId: number,
    rating: number,
    comment: string,
    isClient: boolean
  ): Promise<boolean> {
    if (!this.reputationContract) return false;

    try {
      const tx = await this.reputationContract.submitReview(
        reviewee,
        projectId,
        rating,
        comment,
        isClient
      );
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Submit review error:', error);
      return false;
    }
  }

  async getUserReputation(address: string): Promise<any> {
    if (!this.reputationContract) return null;

    try {
      const reputation = await this.reputationContract.getUserReputation(address);
      return {
        totalScore: reputation[0].toNumber(),
        projectsCompleted: reputation[1].toNumber(),
        totalEarnings: ethers.utils.formatEther(reputation[2]),
        averageRating: reputation[3].toNumber(),
        totalRatings: reputation[4].toNumber(),
        isVerified: reputation[5],
        tier: reputation[6]
      };
    } catch (error) {
      console.error('Get user reputation error:', error);
      return null;
    }
  }

  // Event listeners
  onTokenTransfer(callback: (from: string, to: string, amount: string) => void) {
    if (!this.workTokenContract) return;

    this.workTokenContract.on('Transfer', (from, to, amount) => {
      callback(from, to, ethers.utils.formatEther(amount));
    });
  }

  onTokensStaked(callback: (user: string, amount: string) => void) {
    if (!this.workTokenContract) return;

    this.workTokenContract.on('TokensStaked', (user, amount) => {
      callback(user, ethers.utils.formatEther(amount));
    });
  }

  onProjectCreated(callback: (projectId: number, client: string, freelancer: string, amount: string) => void) {
    if (!this.escrowContract) return;

    this.escrowContract.on('ProjectCreated', (projectId, client, freelancer, amount) => {
      callback(projectId.toNumber(), client, freelancer, ethers.utils.formatEther(amount));
    });
  }

  onMilestoneCompleted(callback: (projectId: number, milestoneIndex: number) => void) {
    if (!this.escrowContract) return;

    this.escrowContract.on('MilestoneCompleted', (projectId, milestoneIndex) => {
      callback(projectId.toNumber(), milestoneIndex.toNumber());
    });
  }

  removeAllListeners() {
    this.workTokenContract?.removeAllListeners();
    this.escrowContract?.removeAllListeners();
    this.reputationContract?.removeAllListeners();
  }
}

// Singleton instance
export const blockchainService = new BlockchainService();

// Price feed simulation (in production, use Chainlink or similar)
export class PriceFeedService {
  private static workTokenPrice = 0.25; // $0.25 per WORK token
  private static priceHistory: { timestamp: number; price: number }[] = [];

  static async getWorkTokenPrice(): Promise<number> {
    // Simulate price fluctuation
    const fluctuation = (Math.random() - 0.5) * 0.02; // ±1% fluctuation
    this.workTokenPrice = Math.max(0.1, this.workTokenPrice * (1 + fluctuation));
    
    // Store price history
    this.priceHistory.push({
      timestamp: Date.now(),
      price: this.workTokenPrice
    });

    // Keep only last 100 entries
    if (this.priceHistory.length > 100) {
      this.priceHistory = this.priceHistory.slice(-100);
    }

    return this.workTokenPrice;
  }

  static getPriceHistory(): { timestamp: number; price: number }[] {
    return this.priceHistory;
  }

  static convertToFiat(workAmount: number, currency: string = 'USD'): number {
    const rates = { USD: 1, EUR: 0.85, GBP: 0.73, JPY: 110 };
    return workAmount * this.workTokenPrice * (rates[currency as keyof typeof rates] || 1);
  }
}

// Declare global ethereum object
declare global {
  interface Window {
    ethereum?: any;
  }
}