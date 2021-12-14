//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract VestingToken is ERC20, Ownable, AccessControl {
    using SafeMath for uint256;

    uint256 public constant BASE_DENOMINATOR = 100;
    uint256 public constant ANGEL_FACTOR = 40;
    uint256 public constant SALE_FACTOR = 30;
    uint256 public totalSupplyAngelInventors;
    uint256 public totalSupplyPrivateSale;
    uint256 public totalSupplyPublicSale;

    struct User {
        uint256 granted;
        uint256 locked;
        uint256 unlocked;
        uint256 cliffBlock;
        uint256 vestingBlock;
        uint256 lastBlockUpdate;
        uint256 tokenUnlockPerBlock;
        bool isOutVesting;
    }

    mapping(address => User) public userInfo;

    constructor(
        string memory name,
        string memory symbol,
        uint256 supply
    ) public ERC20(name, symbol) {
        _mint(msg.sender, supply);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        totalSupplyAngelInventors = 0;
        totalSupplyPrivateSale = 0;
        totalSupplyPublicSale = 0;
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not admin");
        _;
    }

    function setVestingScheduleForAngelInventors(
        uint256 _cliff_duration,
        uint256 _vesting_duration,
        address[] memory users,
        uint256 _amount
    ) external onlyAdmin {
        for (uint256 i = 0; i < users.length; i++) {
            require(
                totalSupplyAngelInventors <
                    totalSupply().mul(ANGEL_FACTOR).div(BASE_DENOMINATOR),
                "Excess liquidity for angel investors"
            );
            User storage user = userInfo[users[i]];
            user.granted = _amount;
            user.locked = _amount;
            user.cliffBlock = _cliff_duration.add(block.number);
            user.vestingBlock = _vesting_duration.add(user.cliffBlock);
            user.tokenUnlockPerBlock = user.granted.div(
                user.vestingBlock.sub(user.cliffBlock)
            );
            user.lastBlockUpdate = user.cliffBlock;
            totalSupplyAngelInventors = totalSupplyAngelInventors.add(_amount);
            _transfer(_msgSender(), users[i], _amount);
        }
    }

    function setVestingScheduleForPrivateSale(
        uint256 _cliff_duration,
        uint256 _vesting_duration,
        address[] memory users,
        uint256 _amount
    ) external onlyAdmin {
        for (uint256 i = 0; i < users.length; i++) {
            require(
                totalSupplyAngelInventors <
                    totalSupply().mul(SALE_FACTOR).div(BASE_DENOMINATOR),
                "Excess liquidity for private sale"
            );
            User storage user = userInfo[users[i]];
            user.granted = _amount;
            user.locked = _amount;
            user.cliffBlock = _cliff_duration.add(block.number);
            user.vestingBlock = _vesting_duration.add(user.cliffBlock);
            user.tokenUnlockPerBlock = user.granted.div(_vesting_duration);
            user.lastBlockUpdate = user.cliffBlock;
            totalSupplyAngelInventors = totalSupplyAngelInventors.add(_amount);
            _transfer(_msgSender(), users[i], _amount);
        }
    }

    function setVestingScheduleForPublicSale(
        address[] memory users,
        uint256 _amount
    ) external onlyAdmin {
        for (uint256 i = 0; i < users.length; i++) {
            require(
                totalSupplyAngelInventors <
                    totalSupply().mul(SALE_FACTOR).div(BASE_DENOMINATOR),
                "Excess liquidity for public sale"
            );
            User storage user = userInfo[users[i]];
            user.granted = _amount;
            user.unlocked = _amount;
            totalSupplyAngelInventors = totalSupplyAngelInventors.add(_amount);
            _transfer(_msgSender(), users[i], _amount);
        }
    }

    function pendingVesting(address _user)
        external
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        User storage user = userInfo[_user];
        if (user.isOutVesting || user.cliffBlock == 0) {
            return (user.granted, user.locked, user.unlocked);
        }
        uint256 blockCurrent = block.number;
        uint256 pendingLocked;
        uint256 pendingUnlocked;
        if (blockCurrent < user.cliffBlock) {
            pendingLocked = user.granted;
            pendingUnlocked = user.unlocked;
        } else if (blockCurrent < user.vestingBlock) {
            uint256 blockDeltaUpdate = blockCurrent.sub(user.lastBlockUpdate);
            uint256 blockDeltaUnlocked = blockCurrent.sub(user.cliffBlock);
            uint256 unlockUpdate = blockDeltaUpdate.mul(
                user.tokenUnlockPerBlock
            );
            uint256 unlock = blockDeltaUnlocked.mul(user.tokenUnlockPerBlock);
            pendingLocked = user.granted.sub(unlock);
            pendingUnlocked = user.unlocked.add(unlockUpdate);
        } else {
            pendingLocked = 0;
            uint256 blockDeltaUpdate = user.vestingBlock.sub(
                user.lastBlockUpdate
            );
            uint256 unlockUpdate = blockDeltaUpdate.mul(
                user.tokenUnlockPerBlock
            );
            pendingUnlocked = user.unlocked.add(unlockUpdate);
        }
        return (user.granted, pendingLocked, pendingUnlocked);
    }

    function transfer(address recipient, uint256 amount)
        public
        override
        returns (bool)
    {
        User storage user = userInfo[msg.sender];
        uint256 blockCurrent = block.number;
        if (!user.isOutVesting && user.cliffBlock != 0) {
            if (blockCurrent < user.vestingBlock) {
                uint256 blockDeltaUpdate = blockCurrent.sub(
                    user.lastBlockUpdate
                );
                uint256 blockDeltaUnlocked = blockCurrent.sub(user.cliffBlock);
                uint256 unlockUpdate = blockDeltaUpdate.mul(
                    user.tokenUnlockPerBlock
                );
                uint256 unlock = blockDeltaUnlocked.mul(
                    user.tokenUnlockPerBlock
                );
                user.locked = user.granted.sub(unlock);
                user.unlocked = user.unlocked.add(unlockUpdate);
            } else {
                user.locked = 0;
                uint256 blockDeltaUpdate = user.vestingBlock.sub(
                    user.lastBlockUpdate
                );
                uint256 unlockUpdate = blockDeltaUpdate.mul(
                    user.tokenUnlockPerBlock
                );
                user.unlocked = user.unlocked.add(unlockUpdate);
                user.isOutVesting = true;
            }
        }

        require(
            amount <= user.unlocked,
            "Can not send more than unlock balance"
        );

        _transfer(_msgSender(), recipient, amount);
        user.unlocked = user.unlocked.sub(amount);
        user.lastBlockUpdate = blockCurrent;
        userInfo[recipient].unlocked = userInfo[recipient].unlocked.add(amount);

        return true;
    }
}
