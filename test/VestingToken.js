const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");
const { BigNumber } = require("@ethersproject/bignumber");
const ethersJS = require("ethers");
const { time, expectRevert } = require("@openzeppelin/test-helpers");
describe("Vesting Token contract", function () {
  let token;
  let owner;
  let alice;
  let bob;
  let carol;
  let dog;
  let egg;
  let fomo;

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {
    const Token = await ethers.getContractFactory("VestingToken");
    [owner, alice, bob, carol, dog, egg, fomo] = await ethers.getSigners();
    token = await Token.deploy(
      "Vesting Token",
      "VEST",
      ethersJS.ethers.utils.parseEther("100000000")
    );
  });

  // You can nest describe calls to create subsections.
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });
  });

  // You can nest describe calls to create subsections.
  describe("setup", function () {
    it("setVestingScheduleForAngelInventors", async function () {
      await token.setVestingScheduleForAngelInventors(
        5000,
        123400,
        [alice.address, bob.address],
        ethersJS.ethers.utils.parseEther("12")
      );
      expect(await token.balanceOf(alice.address)).to.equal(
        ethersJS.ethers.utils.parseEther("12")
      );
      expect(await token.balanceOf(bob.address)).to.equal(
        ethersJS.ethers.utils.parseEther("12")
      );
    });

    it("setVestingScheduleForPrivateSale", async function () {
      await token.setVestingScheduleForPrivateSale(
        5000,
        123400,
        [alice.address, bob.address],
        ethersJS.ethers.utils.parseEther("12")
      );
      expect(await token.balanceOf(alice.address)).to.equal(
        ethersJS.ethers.utils.parseEther("12")
      );
      expect(await token.balanceOf(bob.address)).to.equal(
        ethersJS.ethers.utils.parseEther("12")
      );
    });

    it("setVestingScheduleForPublicSale", async function () {
      await token.setVestingScheduleForPublicSale(
        [alice.address, bob.address],
        ethersJS.ethers.utils.parseEther("12")
      );
      expect(await token.balanceOf(alice.address)).to.equal(
        ethersJS.ethers.utils.parseEther("12")
      );
      expect(await token.balanceOf(bob.address)).to.equal(
        ethersJS.ethers.utils.parseEther("12")
      );
    });
  });

  describe("Check pending", function () {
    it("Check pending", async function () {
      //setup angel
      await time.advanceBlockTo("50");
      await token.setVestingScheduleForAngelInventors(
        5000,
        10000,
        [alice.address, bob.address],
        ethersJS.ethers.utils.parseEther("100")
      );
      expect(await token.balanceOf(alice.address)).to.equal(
        ethersJS.ethers.utils.parseEther("100")
      );
      expect(await token.balanceOf(bob.address)).to.equal(
        ethersJS.ethers.utils.parseEther("100")
      );
      //setup private sale
      await time.advanceBlockTo("60");
      await token.setVestingScheduleForPrivateSale(
        1000,
        2000,
        [carol.address, dog.address],
        ethersJS.ethers.utils.parseEther("50")
      );
      expect(await token.balanceOf(carol.address)).to.equal(
        ethersJS.ethers.utils.parseEther("50")
      );
      expect(await token.balanceOf(dog.address)).to.equal(
        ethersJS.ethers.utils.parseEther("50")
      );
      //setup public sale
      await time.advanceBlockTo("70");
      await token.setVestingScheduleForPublicSale(
        [egg.address, fomo.address],
        ethersJS.ethers.utils.parseEther("10")
      );
      expect(await token.balanceOf(egg.address)).to.equal(
        ethersJS.ethers.utils.parseEther("10")
      );
      expect(await token.balanceOf(fomo.address)).to.equal(
        ethersJS.ethers.utils.parseEther("10")
      );
      // check pending
      await time.advanceBlockTo("500");
      let amount;
      // check angle
      amount = await token.pendingVesting(alice.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("100"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("100"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("0"));
      // check private
      amount = await token.pendingVesting(carol.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("50"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("50"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("0"));
      // check public
      amount = await token.pendingVesting(egg.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("10"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("0"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("10"));

      await time.advanceBlockTo("2000");
      // check angle
      amount = await token.pendingVesting(alice.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("100"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("100"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("0"));
      // check private
      await time.advanceBlockTo("2061");
      amount = await token.pendingVesting(carol.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("50"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("25"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("25"));
      // check public
      amount = await token.pendingVesting(egg.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("10"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("0"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("10"));

      await time.advanceBlockTo("7551");
      // check angle
      amount = await token.pendingVesting(alice.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("100"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("75"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("25"));
      // check private
      amount = await token.pendingVesting(carol.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("50"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("0"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("50"));
      // check public
      amount = await token.pendingVesting(egg.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("10"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("0"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("10"));

      await time.advanceBlockTo("15051");
      // check angle
      amount = await token.pendingVesting(alice.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("100"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("0"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("100"));
      // check private
      amount = await token.pendingVesting(carol.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("50"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("0"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("50"));
      // check public
      amount = await token.pendingVesting(egg.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("10"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("0"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("10"));
    });
  });

  describe("Check transfer", function () {
    it("Check transfer", async function () {
      await time.advanceBlockTo("16000");
      await token.setVestingScheduleForAngelInventors(
        500,
        1000,
        [alice.address, bob.address],
        ethersJS.ethers.utils.parseEther("100")
      );
      expect(await token.balanceOf(alice.address)).to.equal(
        ethersJS.ethers.utils.parseEther("100")
      );
      expect(await token.balanceOf(bob.address)).to.equal(
        ethersJS.ethers.utils.parseEther("100")
      );
      //setup private sale
      await time.advanceBlockTo("16010");
      await token.setVestingScheduleForPrivateSale(
        100,
        200,
        [carol.address, dog.address],
        ethersJS.ethers.utils.parseEther("50")
      );
      expect(await token.balanceOf(carol.address)).to.equal(
        ethersJS.ethers.utils.parseEther("50")
      );
      expect(await token.balanceOf(dog.address)).to.equal(
        ethersJS.ethers.utils.parseEther("50")
      );
      //setup public sale
      await time.advanceBlockTo("16020");
      await token.setVestingScheduleForPublicSale(
        [egg.address, fomo.address],
        ethersJS.ethers.utils.parseEther("10")
      );
      expect(await token.balanceOf(egg.address)).to.equal(
        ethersJS.ethers.utils.parseEther("10")
      );
      expect(await token.balanceOf(fomo.address)).to.equal(
        ethersJS.ethers.utils.parseEther("10")
      );

      await time.advanceBlockTo("16050");
      //transfer public => private
      await token
        .connect(egg)
        .transfer(carol.address, ethersJS.ethers.utils.parseEther("2"));
      expect(await token.balanceOf(carol.address)).to.equal(
        ethersJS.ethers.utils.parseEther("52")
      );

      // check pending private sale
      amount = await token.pendingVesting(carol.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("50"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("50"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("2"));
      // check pending public sale
      amount = await token.pendingVesting(egg.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("10"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("0"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("8"));

      await time.advanceBlockTo("16211");
      // check pending private sale
      amount = await token.pendingVesting(carol.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("50"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("25"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("27"));
      //transfer private => angle
      await token
        .connect(carol)
        .transfer(alice.address, ethersJS.ethers.utils.parseEther("20"));
      expect(await token.balanceOf(carol.address)).to.equal(
        ethersJS.ethers.utils.parseEther("32")
      );
      expect(await token.balanceOf(alice.address)).to.equal(
        ethersJS.ethers.utils.parseEther("120")
      );
      // check pending private
      amount = await token.pendingVesting(carol.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("50"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("24.75"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("7.25"));

      // check pending angle
      amount = await token.pendingVesting(alice.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("100"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("100"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("20"));

      await time.advanceBlockTo("17501");
      // check pending angle
      amount = await token.pendingVesting(alice.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("100"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("0"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("120"));

      //transfer angle => public sale
      await token
        .connect(alice)
        .transfer(egg.address, ethersJS.ethers.utils.parseEther("120"));
      expect(await token.balanceOf(alice.address)).to.equal(
        ethersJS.ethers.utils.parseEther("0")
      );
      expect(await token.balanceOf(egg.address)).to.equal(
        ethersJS.ethers.utils.parseEther("128")
      );
      
      // check pending angle
      amount = await token.pendingVesting(alice.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("100"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("0"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("0"));

      // check pending private
      amount = await token.pendingVesting(carol.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("50"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("0"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("32"));

      // check pending angle
      amount = await token.pendingVesting(egg.address);
      expect(amount[0]).to.equal(ethersJS.ethers.utils.parseEther("10"));
      expect(amount[1]).to.equal(ethersJS.ethers.utils.parseEther("0"));
      expect(amount[2]).to.equal(ethersJS.ethers.utils.parseEther("128"));

    });
  });
});
