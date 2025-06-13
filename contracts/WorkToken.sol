// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract WorkToken is ERC20, ERC20Burnable, Pausable, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    uint256 public constant INITIAL_SUPPLY = 100000000 * 10**18; // 100 million tokens
    
    // Staking variables
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakingTimestamp;
    mapping(address => uint256) public rewardsEarned;
    
    uint256 public stakingAPY = 500; // 5% APY (500 basis points)
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    
    // Project completion rewards
    mapping(address => uint256) public projectRewards;
    mapping(address => uint256) public learningRewards;
    
    // Events
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event ProjectCompleted(address indexed freelancer, uint256 reward);
    event LearningCompleted(address indexed user, uint256 reward);

    constructor() ERC20("NexusWorks Token", "WORK") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    // Staking functions
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Claim pending rewards before staking more
        if (stakedBalance[msg.sender] > 0) {
            claimRewards();
        }
        
        _transfer(msg.sender, address(this), amount);
        stakedBalance[msg.sender] += amount;
        stakingTimestamp[msg.sender] = block.timestamp;
        
        emit TokensStaked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");
        
        // Claim rewards before unstaking
        claimRewards();
        
        stakedBalance[msg.sender] -= amount;
        _transfer(address(this), msg.sender, amount);
        
        if (stakedBalance[msg.sender] == 0) {
            stakingTimestamp[msg.sender] = 0;
        } else {
            stakingTimestamp[msg.sender] = block.timestamp;
        }
        
        emit TokensUnstaked(msg.sender, amount);
    }

    function calculateRewards(address user) public view returns (uint256) {
        if (stakedBalance[user] == 0 || stakingTimestamp[user] == 0) {
            return 0;
        }
        
        uint256 stakingDuration = block.timestamp - stakingTimestamp[user];
        uint256 rewards = (stakedBalance[user] * stakingAPY * stakingDuration) / 
                         (10000 * SECONDS_PER_YEAR);
        
        return rewards;
    }

    function claimRewards() public nonReentrant whenNotPaused {
        uint256 rewards = calculateRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");
        
        rewardsEarned[msg.sender] += rewards;
        stakingTimestamp[msg.sender] = block.timestamp;
        
        // Mint new tokens as rewards
        require(totalSupply() + rewards <= MAX_SUPPLY, "Exceeds max supply");
        _mint(msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, rewards);
    }

    function rewardProjectCompletion(address freelancer, uint256 amount) external onlyOwner {
        require(freelancer != address(0), "Invalid address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        projectRewards[freelancer] += amount;
        _mint(freelancer, amount);
        
        emit ProjectCompleted(freelancer, amount);
    }

    function rewardLearningCompletion(address user, uint256 amount) external onlyOwner {
        require(user != address(0), "Invalid address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        learningRewards[user] += amount;
        _mint(user, amount);
        
        emit LearningCompleted(user, amount);
    }

    function setStakingAPY(uint256 newAPY) external onlyOwner {
        require(newAPY <= 2000, "APY too high"); // Max 20%
        stakingAPY = newAPY;
    }

    function getStakingInfo(address user) external view returns (
        uint256 staked,
        uint256 pendingRewards,
        uint256 totalRewards,
        uint256 stakingTime
    ) {
        return (
            stakedBalance[user],
            calculateRewards(user),
            rewardsEarned[user],
            stakingTimestamp[user]
        );
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}