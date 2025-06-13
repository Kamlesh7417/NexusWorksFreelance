// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ProjectEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public workToken;
    
    enum ProjectStatus { Created, InProgress, Completed, Disputed, Cancelled }
    enum MilestoneStatus { Pending, Completed, Disputed }

    struct Milestone {
        uint256 amount;
        string description;
        MilestoneStatus status;
        uint256 dueDate;
        bool paid;
    }

    struct Project {
        address client;
        address freelancer;
        uint256 totalAmount;
        ProjectStatus status;
        uint256 createdAt;
        uint256 completedAt;
        Milestone[] milestones;
        uint256 disputeDeadline;
    }

    mapping(uint256 => Project) public projects;
    mapping(address => uint256[]) public clientProjects;
    mapping(address => uint256[]) public freelancerProjects;
    
    uint256 public nextProjectId = 1;
    uint256 public platformFee = 250; // 2.5% (250 basis points)
    uint256 public disputePeriod = 7 days;
    
    address public feeRecipient;

    event ProjectCreated(uint256 indexed projectId, address indexed client, address indexed freelancer, uint256 amount);
    event MilestoneCompleted(uint256 indexed projectId, uint256 milestoneIndex);
    event PaymentReleased(uint256 indexed projectId, uint256 milestoneIndex, uint256 amount);
    event ProjectCompleted(uint256 indexed projectId);
    event DisputeRaised(uint256 indexed projectId, uint256 milestoneIndex);
    event DisputeResolved(uint256 indexed projectId, uint256 milestoneIndex, bool favorClient);

    constructor(address _workToken, address _feeRecipient) {
        workToken = IERC20(_workToken);
        feeRecipient = _feeRecipient;
    }

    function createProject(
        address _freelancer,
        uint256 _totalAmount,
        string[] memory _milestoneDescriptions,
        uint256[] memory _milestoneAmounts,
        uint256[] memory _milestoneDueDates
    ) external nonReentrant {
        require(_freelancer != address(0), "Invalid freelancer address");
        require(_totalAmount > 0, "Amount must be greater than 0");
        require(_milestoneDescriptions.length == _milestoneAmounts.length, "Mismatched arrays");
        require(_milestoneDescriptions.length == _milestoneDueDates.length, "Mismatched arrays");
        
        uint256 totalMilestoneAmount = 0;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            totalMilestoneAmount += _milestoneAmounts[i];
        }
        require(totalMilestoneAmount == _totalAmount, "Milestone amounts don't match total");

        // Transfer tokens to escrow
        workToken.safeTransferFrom(msg.sender, address(this), _totalAmount);

        uint256 projectId = nextProjectId++;
        Project storage project = projects[projectId];
        
        project.client = msg.sender;
        project.freelancer = _freelancer;
        project.totalAmount = _totalAmount;
        project.status = ProjectStatus.Created;
        project.createdAt = block.timestamp;

        // Create milestones
        for (uint256 i = 0; i < _milestoneDescriptions.length; i++) {
            project.milestones.push(Milestone({
                amount: _milestoneAmounts[i],
                description: _milestoneDescriptions[i],
                status: MilestoneStatus.Pending,
                dueDate: _milestoneDueDates[i],
                paid: false
            }));
        }

        clientProjects[msg.sender].push(projectId);
        freelancerProjects[_freelancer].push(projectId);

        emit ProjectCreated(projectId, msg.sender, _freelancer, _totalAmount);
    }

    function startProject(uint256 _projectId) external {
        Project storage project = projects[_projectId];
        require(msg.sender == project.freelancer, "Only freelancer can start project");
        require(project.status == ProjectStatus.Created, "Project already started");
        
        project.status = ProjectStatus.InProgress;
    }

    function completeMilestone(uint256 _projectId, uint256 _milestoneIndex) external {
        Project storage project = projects[_projectId];
        require(msg.sender == project.freelancer, "Only freelancer can complete milestones");
        require(project.status == ProjectStatus.InProgress, "Project not in progress");
        require(_milestoneIndex < project.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = project.milestones[_milestoneIndex];
        require(milestone.status == MilestoneStatus.Pending, "Milestone already completed");
        
        milestone.status = MilestoneStatus.Completed;
        project.disputeDeadline = block.timestamp + disputePeriod;
        
        emit MilestoneCompleted(_projectId, _milestoneIndex);
    }

    function approveMilestone(uint256 _projectId, uint256 _milestoneIndex) external nonReentrant {
        Project storage project = projects[_projectId];
        require(msg.sender == project.client, "Only client can approve milestones");
        require(_milestoneIndex < project.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = project.milestones[_milestoneIndex];
        require(milestone.status == MilestoneStatus.Completed, "Milestone not completed");
        require(!milestone.paid, "Milestone already paid");
        
        _releaseMilestonePayment(_projectId, _milestoneIndex);
    }

    function autoReleaseMilestone(uint256 _projectId, uint256 _milestoneIndex) external nonReentrant {
        Project storage project = projects[_projectId];
        require(_milestoneIndex < project.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = project.milestones[_milestoneIndex];
        require(milestone.status == MilestoneStatus.Completed, "Milestone not completed");
        require(!milestone.paid, "Milestone already paid");
        require(block.timestamp > project.disputeDeadline, "Dispute period not over");
        
        _releaseMilestonePayment(_projectId, _milestoneIndex);
    }

    function _releaseMilestonePayment(uint256 _projectId, uint256 _milestoneIndex) internal {
        Project storage project = projects[_projectId];
        Milestone storage milestone = project.milestones[_milestoneIndex];
        
        uint256 feeAmount = (milestone.amount * platformFee) / 10000;
        uint256 freelancerAmount = milestone.amount - feeAmount;
        
        milestone.paid = true;
        
        // Transfer payment to freelancer
        workToken.safeTransfer(project.freelancer, freelancerAmount);
        
        // Transfer fee to platform
        workToken.safeTransfer(feeRecipient, feeAmount);
        
        emit PaymentReleased(_projectId, _milestoneIndex, freelancerAmount);
        
        // Check if all milestones are completed
        bool allCompleted = true;
        for (uint256 i = 0; i < project.milestones.length; i++) {
            if (!project.milestones[i].paid) {
                allCompleted = false;
                break;
            }
        }
        
        if (allCompleted) {
            project.status = ProjectStatus.Completed;
            project.completedAt = block.timestamp;
            emit ProjectCompleted(_projectId);
        }
    }

    function raiseDispute(uint256 _projectId, uint256 _milestoneIndex) external {
        Project storage project = projects[_projectId];
        require(msg.sender == project.client, "Only client can raise disputes");
        require(_milestoneIndex < project.milestones.length, "Invalid milestone index");
        require(block.timestamp <= project.disputeDeadline, "Dispute period expired");
        
        Milestone storage milestone = project.milestones[_milestoneIndex];
        require(milestone.status == MilestoneStatus.Completed, "Milestone not completed");
        require(!milestone.paid, "Milestone already paid");
        
        milestone.status = MilestoneStatus.Disputed;
        project.status = ProjectStatus.Disputed;
        
        emit DisputeRaised(_projectId, _milestoneIndex);
    }

    function resolveDispute(
        uint256 _projectId, 
        uint256 _milestoneIndex, 
        bool _favorClient
    ) external onlyOwner nonReentrant {
        Project storage project = projects[_projectId];
        require(_milestoneIndex < project.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = project.milestones[_milestoneIndex];
        require(milestone.status == MilestoneStatus.Disputed, "Milestone not disputed");
        
        if (_favorClient) {
            // Refund to client
            workToken.safeTransfer(project.client, milestone.amount);
            milestone.paid = true;
        } else {
            // Pay freelancer
            _releaseMilestonePayment(_projectId, _milestoneIndex);
        }
        
        milestone.status = MilestoneStatus.Completed;
        project.status = ProjectStatus.InProgress;
        
        emit DisputeResolved(_projectId, _milestoneIndex, _favorClient);
    }

    function getProject(uint256 _projectId) external view returns (
        address client,
        address freelancer,
        uint256 totalAmount,
        ProjectStatus status,
        uint256 createdAt,
        uint256 completedAt
    ) {
        Project storage project = projects[_projectId];
        return (
            project.client,
            project.freelancer,
            project.totalAmount,
            project.status,
            project.createdAt,
            project.completedAt
        );
    }

    function getMilestone(uint256 _projectId, uint256 _milestoneIndex) external view returns (
        uint256 amount,
        string memory description,
        MilestoneStatus status,
        uint256 dueDate,
        bool paid
    ) {
        require(_milestoneIndex < projects[_projectId].milestones.length, "Invalid milestone index");
        Milestone storage milestone = projects[_projectId].milestones[_milestoneIndex];
        return (
            milestone.amount,
            milestone.description,
            milestone.status,
            milestone.dueDate,
            milestone.paid
        );
    }

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = _newFee;
    }

    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid address");
        feeRecipient = _newRecipient;
    }
}