//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20.sol";
import "./access/AccessControl.sol";

contract VToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER");
    bool public pause;

    constructor(
        string memory name,
        string memory symbol
    ) public ERC20(name, symbol) {
        pause = false;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyMinter(address account) {
        require(
            hasRole(MINTER_ROLE, account),
            "DToken: caller is not the minter"
        );
        _;
    }

    modifier onlyBurnner(address account) {
        require(
            hasRole(BURNER_ROLE, account),
            "DToken: caller is not the burner"
        );
        _;
    }

    modifier onlyAdmin(address account) {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, account),
            "DToken: caller is not the admin"
        );
        _;
    }

    function mint(address _to, uint256 _amount) public onlyMinter(msg.sender) {
        require(totalSupply() < 1e27, "Tokens can not mint access capped at 1 billion supplies");
        _mint(_to, _amount);
    }

    function burn(uint256 _amount) public onlyMinter(msg.sender) {
        _burn(msg.sender, _amount);
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        require(!pause, "Can't transfer in this moment");
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function pauseTransfer() external onlyAdmin(msg.sender){
        _pause(true);
    }

    function unpauseTransfer() external onlyAdmin(msg.sender){
        _pause(false);
    }

    function _pause(bool pau) private {
         pause = pau;
    }
}