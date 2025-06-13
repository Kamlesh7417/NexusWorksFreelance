// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ReputationSystem is Ownable, ReentrancyGuard {
    struct UserReputation {
        uint256 totalScore;
        uint256 projectsCompleted;
        uint256 totalEarnings;
        uint256 averageRating;
        uint256 totalRatings;
        bool isVerified;
        uint256 lastUpdated;
    }

    struct Review {
        address reviewer;
        address reviewee;
        uint256 projectId;
        uint256 rating; // 1-5 stars
        string comment;
        uint256 timestamp;
        bool isClient; // true if reviewer is client, false if freelancer
    }

    mapping(address => UserReputation) public userReputations;
    mapping(uint256 => Review[]) public projectReviews; // projectId => reviews
    mapping(address => Review[]) public userReviews; // user => reviews received
    
    address public projectEscrow;
    
    uint256 public constant MIN_RATING = 1;
    uint256 public constant MAX_RATING = 5;
    uint256 public constant VERIFICATION_THRESHOLD = 10; // Projects needed for verification

    event ReviewSubmitted(
        address indexed reviewer,
        address indexed reviewee,
        uint256 indexed projectId,
        uint256 rating
    );
    event ReputationUpdated(address indexed user, uint256 newScore);
    event UserVerified(address indexed user);

    modifier onlyEscrow() {
        require(msg.sender == projectEscrow, "Only escrow contract can call this");
        _;
    }

    constructor(address _projectEscrow) {
        projectEscrow = _projectEscrow;
    }

    function submitReview(
        address _reviewee,
        uint256 _projectId,
        uint256 _rating,
        string memory _comment,
        bool _isClient
    ) external nonReentrant {
        require(_reviewee != address(0), "Invalid reviewee address");
        require(_reviewee != msg.sender, "Cannot review yourself");
        require(_rating >= MIN_RATING && _rating <= MAX_RATING, "Invalid rating");
        
        Review memory newReview = Review({
            reviewer: msg.sender,
            reviewee: _reviewee,
            projectId: _projectId,
            rating: _rating,
            comment: _comment,
            timestamp: block.timestamp,
            isClient: _isClient
        });

        projectReviews[_projectId].push(newReview);
        userReviews[_reviewee].push(newReview);

        _updateReputation(_reviewee, _rating);

        emit ReviewSubmitted(msg.sender, _reviewee, _projectId, _rating);
    }

    function updateProjectCompletion(
        address _freelancer,
        uint256 _earnings
    ) external onlyEscrow {
        UserReputation storage reputation = userReputations[_freelancer];
        reputation.projectsCompleted++;
        reputation.totalEarnings += _earnings;
        reputation.lastUpdated = block.timestamp;

        // Check for verification
        if (!reputation.isVerified && reputation.projectsCompleted >= VERIFICATION_THRESHOLD) {
            reputation.isVerified = true;
            emit UserVerified(_freelancer);
        }

        _calculateReputationScore(_freelancer);
    }

    function _updateReputation(address _user, uint256 _rating) internal {
        UserReputation storage reputation = userReputations[_user];
        
        // Update average rating
        uint256 totalRatingPoints = reputation.averageRating * reputation.totalRatings + _rating;
        reputation.totalRatings++;
        reputation.averageRating = totalRatingPoints / reputation.totalRatings;
        reputation.lastUpdated = block.timestamp;

        _calculateReputationScore(_user);
    }

    function _calculateReputationScore(address _user) internal {
        UserReputation storage reputation = userReputations[_user];
        
        uint256 score = 0;
        
        // Base score from average rating (0-500 points)
        score += reputation.averageRating * 100;
        
        // Projects completed bonus (up to 300 points)
        uint256 projectBonus = reputation.projectsCompleted * 10;
        if (projectBonus > 300) projectBonus = 300;
        score += projectBonus;
        
        // Earnings bonus (up to 200 points)
        uint256 earningsBonus = reputation.totalEarnings / 1000; // 1 point per 1000 tokens
        if (earningsBonus > 200) earningsBonus = 200;
        score += earningsBonus;
        
        // Verification bonus
        if (reputation.isVerified) {
            score += 100;
        }
        
        // Activity bonus (recent activity)
        if (block.timestamp - reputation.lastUpdated < 30 days) {
            score += 50;
        }

        reputation.totalScore = score;
        emit ReputationUpdated(_user, score);
    }

    function getUserReputation(address _user) external view returns (
        uint256 totalScore,
        uint256 projectsCompleted,
        uint256 totalEarnings,
        uint256 averageRating,
        uint256 totalRatings,
        bool isVerified,
        string memory tier
    ) {
        UserReputation storage reputation = userReputations[_user];
        return (
            reputation.totalScore,
            reputation.projectsCompleted,
            reputation.totalEarnings,
            reputation.averageRating,
            reputation.totalRatings,
            reputation.isVerified,
            _getReputationTier(reputation.totalScore)
        );
    }

    function _getReputationTier(uint256 _score) internal pure returns (string memory) {
        if (_score >= 900) return "Quantum Master";
        if (_score >= 700) return "Neural Expert";
        if (_score >= 500) return "Cyber Professional";
        if (_score >= 300) return "Digital Specialist";
        if (_score >= 100) return "Code Apprentice";
        return "New Freelancer";
    }

    function getProjectReviews(uint256 _projectId) external view returns (Review[] memory) {
        return projectReviews[_projectId];
    }

    function getUserReviews(address _user) external view returns (Review[] memory) {
        return userReviews[_user];
    }

    function setProjectEscrow(address _newEscrow) external onlyOwner {
        require(_newEscrow != address(0), "Invalid address");
        projectEscrow = _newEscrow;
    }
}