  

import { Context, storage, logging, env, u128, ContractPromise, ContractPromiseBatch, PersistentVector } from "near-sdk-as"
import { 
  AccountId, 
  Amount, 
  periodDuration, 
  votingPeriodLength, 
  gracePeriodLength, 
  proposalDeposit, 
  dilutionBound, 
  processingReward,
  minSharePrice
} from './dao-types'
import { 

  userTokenBalances,
  members,
  memberAddressByDelegatekey,
  tokenWhiteList,
  Member,
  TransferFromArgs,
  IncAllowanceArgs,
  BalanceArgs,
  Proposal,
  proposals,
  proposalQueue,
  proposedToWhiteList,
  proposedToKick,
  ReentrancyGuard,
  approvedTokens,
  TokenBalances, 
  userTokenBalanceInfo,
  UserVote,
  votesByMember,
  Votes
 } from './dao-models'

import {
  ERR_DAO_ALREADY_INITIALIZED,
  ERR_MUSTBE_GREATERTHAN_ZERO,
  ERR_MUSTBELESSTHAN_MAX_VOTING_PERIOD_LENGTH,
  ERR_MUSTBELESSTHAN_MAX_GRACE_PERIOD_LENGTH,
  ERR_DILUTIONBOUND_ZERO,
  ERR_DILUTIONBOUND_LIMIT,
  ERR_APPROVEDTOKENS,
  ERR_TOO_MANY_TOKENS,
  ERR_PROPOSAL_DEPOSIT,
  ERR_DUPLICATE_TOKEN,
  ERR_TOO_MANY_SHARES,
  ERR_NOT_WHITELISTED,
  ERR_NOT_WHITELISTED_PT,
  ERR_ALREADY_WHITELISTED,
  ERR_TOO_MANY_WHITELISTED,
  ERR_WHITELIST_PROPOSED,
  ERR_PROPOSED_KICK,
  ERR_NOT_SHAREHOLDER,
  ERR_CANNOT_SPONSOR_MORE,
  ERR_RESERVED,
  ERR_CANNOT_RAGEQUIT,
  ERR_JAILED,
  ERR_MUST_MATCH,
  ERR_DUPLICATE_PROPOSAL,
  ERR_ALREADY_SPONSORED,
  ERR_FULL_GUILD_BANK,
  ERR_ALREADY_MEMBER,
  ERR_GREATER_ZERO_TOTALSHARES,
  ERR_TRIBUTE_TRANSFER_FAILED,
  ERR_PROPOSALDEPOSIT_TRANSFER_FAILED,
  ERR_NOT_RIGHT_PROPOSAL,
  ERR_NO_OVERWRITE_KEY,
  ERR_NO_OVERWRITE_MEMBER,
  ERR_PROPOSAL_PROCESSED,
  ERR_PREVIOUS_PROPOSAL,
  ERR_SHAREORLOOT,
  ERR_INSUFFICIENT_SHARES,
  ERR_INSUFFICIENT_LOOT,
  ERR_WHITELIST_PROPOSAL,
  ERR_PROPOSAL_NO,
  ERR_PROPOSAL_CANCELLED,
  ERR_NOT_DELEGATE,
  ERR_VOTE_INVALID,
  ERR_ALREADY_VOTED,
  ERR_ALREADY_CANCELLED,
  ERR_ONLY_PROPOSER,
  ERR_VOTING_PERIOD_EXPIRED,
  ERR_VOTING_NOT_STARTED,
  ERR_STANDARD_PROPOSAL,
  ERR_GUILD_PROPOSAL,
  ERR_HAVE_LOOT,
  ERR_IN_JAIL,
  ERR_NOT_READY,
  ERR_INVALID_ACCOUNT_ID,
  ERR_INSUFFICIENT_BALANCE,
  ERR_NOT_A_MEMBER
} from './dao-error-messages'

import {
  summonCompleteEvent,
  submitProposalEvent,
  SubmitProposalEvent,
  submitProposalEvents,
  sponsorProposalEvent,
  submitVoteEvent,
  processProposalEvent,
  processWhiteListProposalEvent,
  processGuildKickProposalEvent,
  rageQuitEvent,
  RageQuitEvent,
  tokensCollectedEvent,
  cancelProposalEvent,
  CancelProposalEvent,
  updateDelegateKeyEvent,
  withdrawlEvent,
} from './dao-events'


// HARD-CODED LIMITS
// These numbers are quite arbitrary; they are small enough to avoid overflows when doing calculations
// with periods or shares, yet big enough to not limit reasonable use cases.
const MAX_VOTING_PERIOD_LENGTH = 10**18 // maximum length of voting period
const MAX_GRACE_PERIOD_LENGTH = 10**18; // maximum length of grace period
const MAX_DILUTION_BOUND = 10**18; // maximum dilution bound
const MAX_NUMBER_OF_SHARES_AND_LOOT = 10**18; // maximum number of shares that can be minted
const MAX_TOKEN_WHITELIST_COUNT = 400; // maximum number of whitelisted tokens
const MAX_TOKEN_GUILDBANK_COUNT = 200; // maximum number of tokens with non-zero balance in guildbank
const MOLOCH_CONTRACT_ACCOUNT: string = 'dao.vitalpointai.testnet'; // DAO accountId
const REENTRANTGUARD = new ReentrancyGuard()

// *******************
// INTERNAL ACCOUNTING
// *******************
let proposalCount: i32 = 0; // total proposals submitted
let totalShares: u128 = u128.Zero; // total shares across all members
let totalLoot: u128 = u128.Zero; // total loot across all members

let totalGuildBankTokens: u128 = u128.Zero; // total tokens with non-zero balance in guild bank

let depositToken: string

const GUILD = 'guild.vitalpointai.testnet';
const ESCROW = 'escrow.vitalpointai.testnet';
const TOTAL = 'total.vitalpointai.testnet';

// ********************
// MODIFIERS
// ********************

/**
* Returns the owner (summoner) which we use in multiple places to confirm user has access to 
* do whatever they are trying to do.
* @param owner 
*/
export function isOwner(summoner: AccountId): boolean {
  assert(env.isValidAccountID(summoner), ERR_INVALID_ACCOUNT_ID)
  return summoner == storage.getPrimitive<string>("summoner", '')
}

/**
* Returns the shareholder which we use in multiple places to confirm user has access to 
* do whatever they are trying to do.
* @param shareholder
*/
export function onlyShareholder(shareholder: AccountId): boolean {
  assert(env.isValidAccountID(shareholder), ERR_INVALID_ACCOUNT_ID)
  assert(members.get(shareholder)!=null, ERR_NOT_A_MEMBER)
  let shareholderExists = members.getSome(shareholder)
  return shareholderExists.shares > u128.Zero ? true : false
}

/**
* Returns the member which we use in multiple places to confirm user has access to 
* do whatever they are trying to do.
* @param member 
*/
export function onlyMember(member: AccountId): boolean {
  assert(env.isValidAccountID(member), ERR_INVALID_ACCOUNT_ID)
  assert(members.get(member)!=null, ERR_NOT_A_MEMBER)
  let memberExists = members.getSome(member);
  return memberExists.shares > u128.Zero || memberExists.loot > u128.Zero ? true : false
}

/**
* Returns the delegate which we use in multiple places to confirm user has access to 
* do whatever they are trying to do.
* @param delegate
*/
export function onlyDelegate(delegate: AccountId): boolean {
  assert(env.isValidAccountID(delegate), ERR_INVALID_ACCOUNT_ID)
  assert(memberAddressByDelegatekey.get(delegate)!=null, ERR_NOT_DELEGATE)
  let memberDelegateExists = members.getSome(delegate)
  return memberDelegateExists.shares > u128.Zero ? true : false
}

/**
 * Init function that summons a new DAO into existence
 * @param summoner 
 * @param approvedTokens
 * @param periodDuration
 * @param votingPeriodLength
 * @param gracePeriodLength
 * @param proposalDeposit
 * @param dilutionBound
 * @param processingReward
 * @param minSharePrice
 */

export function init(
    _approvedTokens: Array<string>,
    periodDuration: periodDuration,
    votingPeriodLength: votingPeriodLength,
    gracePeriodLength: gracePeriodLength,
    proposalDeposit: proposalDeposit,
    dilutionBound: dilutionBound,
    processingReward: processingReward,
    minSharePrice: minSharePrice
): boolean {
  logging.log("initial Owner: " + Context.predecessor)
  logging.log("_approvedTokens: " + _approvedTokens.toString())
  assert(storage.get<string>("init") == null, ERR_DAO_ALREADY_INITIALIZED)
  assert(u128.gt(new u128(periodDuration), u128.Zero), ERR_MUSTBE_GREATERTHAN_ZERO)
  assert(u128.gt(votingPeriodLength, u128.Zero), ERR_MUSTBE_GREATERTHAN_ZERO)
  assert(u128.le(votingPeriodLength, new u128(MAX_VOTING_PERIOD_LENGTH)), ERR_MUSTBELESSTHAN_MAX_VOTING_PERIOD_LENGTH)
  assert(u128.le(gracePeriodLength, new u128(MAX_GRACE_PERIOD_LENGTH)), ERR_MUSTBELESSTHAN_MAX_GRACE_PERIOD_LENGTH)
  assert(dilutionBound > u128.Zero, ERR_DILUTIONBOUND_ZERO)
  assert(u128.le(dilutionBound, new u128(MAX_DILUTION_BOUND)), ERR_DILUTIONBOUND_LIMIT)
  assert(u128.gt(new u128(_approvedTokens.length), u128.Zero), ERR_APPROVEDTOKENS)
  assert(u128.le(new u128(_approvedTokens.length), new u128(MAX_TOKEN_WHITELIST_COUNT)), ERR_TOO_MANY_TOKENS)
  assert(u128.ge(proposalDeposit, processingReward), ERR_PROPOSAL_DEPOSIT)
  assert(minSharePrice > 0, ERR_MUSTBE_GREATERTHAN_ZERO)

  depositToken = _approvedTokens[0]
  logging.log("deposit token: " + depositToken)
  storage.set<string>('depositToken', depositToken)

  for (let i: i32 = 0; i < _approvedTokens.length; i++) {
    logging.log("approvedTokens[i]: " + _approvedTokens[i])
    assert(env.isValidAccountID(_approvedTokens[i]), ERR_INVALID_ACCOUNT_ID)
    logging.log("passed accountId check")
    if(tokenWhiteList.contains(_approvedTokens[i])) {
      assert(!tokenWhiteList.getSome(_approvedTokens[i]), ERR_DUPLICATE_TOKEN)
    } else {
      logging.log('token is not whitelisted yet')
      tokenWhiteList.set(_approvedTokens[i], true)
      logging.log('token is now whitelisted')
    }
    logging.log("tokenWhiteList: " + tokenWhiteList.getSome(_approvedTokens[i]).toString())
    approvedTokens.push(_approvedTokens[i])
      logging.log("_approvedTokens[i]:" + _approvedTokens[i])
      logging.log("new approved tokens 1: " + approvedTokens[i])
  }
  
  logging.log("made it here")
  //set Summoner
  storage.set<string>('summoner', Context.predecessor)

  //set periodDuration
  storage.set<u64>("periodDuration", periodDuration)

  //set votingPeriodLength
  storage.set<u128>('votingPeriodLength', votingPeriodLength)

  //set gracePeriodLength
  storage.set<u128>('gracePeriodLength', gracePeriodLength)

  //set proposalDeposit
  storage.set<u128>('proposalDeposit', proposalDeposit)

  //set dilutionBound
  storage.set<u128>('dilutionBound', dilutionBound)

  //set processingReward
  storage.set<u128>('processingReward', processingReward)

  //set summoning Time
  storage.set<u64>('summoningTime', Context.blockIndex)

  //set minimum share price
  storage.set<u64>('minSharePrice', minSharePrice)

  //set initial Guild/Escrow/Total address balances

  userTokenBalances.push({user: GUILD, token: depositToken, balance:u128.Zero})
  userTokenBalances.push({user: ESCROW, token: depositToken, balance:u128.Zero})
  userTokenBalances.push({user: TOTAL, token: depositToken, balance:u128.Zero})

  // makes member object for summoner and puts it into the members storage
  members.set(Context.predecessor, new Member(Context.predecessor, new u128(1), u128.Zero, true, 0, u128.Zero))

  memberAddressByDelegatekey.set(Context.predecessor, Context.predecessor)

  totalShares = new u128(1)

  //set init to done
  storage.set<string>("init", "done")

  summonCompleteEvent(Context.predecessor, _approvedTokens, <u64>Context.blockIndex, periodDuration, votingPeriodLength, gracePeriodLength, proposalDeposit, dilutionBound, processingReward)

  return true
}


/*********************/ 
/* UTILITY FUNCTIONS */
/*********************/

function _unsafeAddToBalance(account: AccountId, token: AccountId, amount: Amount): void {
  for(let i: i32 = 0; i < userTokenBalances.length; i++) {
    if(userTokenBalances[i].user == account && userTokenBalances[i].token == token) {
      let userCurrent = userTokenBalances[i].balance
      let newUserAmount = u128.add(userCurrent, amount)
      userTokenBalances.replace(i, {user: account, token: token, balance: newUserAmount})
    } else if(userTokenBalances[i].user == TOTAL && userTokenBalances[i].token == token) {
      let totalCurrent = userTokenBalances[i].balance
      let newTotalAmount = u128.add(totalCurrent, amount)
      userTokenBalances.replace(i, {user: TOTAL, token: token, balance: newTotalAmount})
    } else {
      userTokenBalances.push({user: account, token: token, balance: amount})
    }
  }
}

function _unsafeSubtractFromBalance(account: AccountId, token: AccountId, amount: Amount): void {
  for(let i: i32 = 0; i < userTokenBalances.length; i++) {
    if(userTokenBalances[i].user == account && userTokenBalances[i].token == token) {
      let userCurrent = userTokenBalances[i].balance
      let newUserAmount = u128.sub(userCurrent, amount)
      userTokenBalances.replace(i, {user: account, token: token, balance: newUserAmount})
    }
    if(userTokenBalances[i].user == TOTAL && userTokenBalances[i].token == token) {
      let totalCurrent = userTokenBalances[i].balance
      let newTotalAmount = u128.sub(totalCurrent, amount)
      userTokenBalances.replace(i, {user: TOTAL, token: token, balance: newTotalAmount})
    }
  }
}


function _unsafeInternalTransfer(from: AccountId, to: AccountId, token: AccountId, amount: Amount): void {
  _unsafeSubtractFromBalance(from, token, amount)
  _unsafeAddToBalance(to, token, amount)
}


function _fairShare(balance: u128, shares: u128, totalShares: u128): u128 {
  assert(totalShares != u128.Zero, ERR_GREATER_ZERO_TOTALSHARES)
  if(balance = u128.Zero) { return u128.Zero }
  let prod = u128.mul(balance, shares)
  if(u128.div(prod, balance) == shares) { return u128.div(prod, totalShares) }
  return u128.mul(u128.div(balance, totalShares), shares)
}


function hasVotingPeriodExpired(startingPeriod: u128): bool {
  return u128.ge(new u128(getCurrentPeriod()), u128.add(startingPeriod, storage.get<u128>('votingPeriodLength', u128.Zero)!))
}


function _validateProposalForProcessing(proposalIndex: i32): void {
  assert(proposalIndex < proposalQueue.length, ERR_PROPOSAL_NO)
  let proposal = proposals[proposalQueue[proposalIndex]]
  let firstAdd = u128.add(proposal.startingPeriod, storage.get<u128>('votingPeriodLength', u128.Zero)!)
  assert(u128.ge(new u128(getCurrentPeriod()), u128.add(firstAdd, storage.get<u128>('gracePeriodLength', u128.Zero)!)), ERR_NOT_READY)
  assert(proposal.flags[1] == false, ERR_PROPOSAL_PROCESSED)
  assert(proposalIndex == 0 || proposals[proposalQueue[proposalIndex - 1]].flags[1], ERR_PREVIOUS_PROPOSAL)
}

function _didPass(proposalIndex: i32): bool {
  let proposal = proposals[proposalQueue[proposalIndex]]

  let didPass = proposal.yesVotes > proposal.noVotes

  // Make the proposal fail if the dilutionBound is exceeded
  let firstAdd = u128.add(totalShares, totalLoot)
  let multiplied = u128.mul(firstAdd, storage.get<u128>('dilutionBound', u128.Zero)!)
 
  if(u128.lt(multiplied, proposal.maxTotalSharesAndLootAtYesVote)) {
    didPass = false
  }

  // Make the proposal fail if the applicant is jailed
  // - for standard proposals, we don't want the applicant to get any shares/loot/payment
  // - for guild kick proposals, we should never be able to propose to kick a jailed member (or have two kick proposals active), so it doesn't matter
  
  if(members.get(proposal.applicant) != null) {
    if(members.getSome(proposal.applicant).jailed != u128.Zero) {
      didPass = false
    }
  }
  return didPass
}


function _returnDeposit(sponsor: AccountId): void {
  _unsafeInternalTransfer(ESCROW, Context.predecessor, depositToken, (storage.get<u128>('processingReward'), u128.Zero))
  _unsafeInternalTransfer(ESCROW, sponsor, depositToken, u128.sub((storage.get<u128>('proposalDeposit'), u128.Zero), (storage.get<u128>('processingReward'), u128.Zero)))
}

export function ragequit(sharesToBurn: u128, lootToBurn: u128): void {
  REENTRANTGUARD.nonReentrantOpen()
  assert(onlyMember(Context.predecessor), ERR_NOT_A_MEMBER)

  _ragequit(Context.predecessor, sharesToBurn, lootToBurn)

  REENTRANTGUARD.nonReentrantClose()
}

function _ragequit(memberAddress: AccountId, sharesToBurn: u128, lootToBurn: u128): void {
  let initialTotalSharesAndLoot = u128.add(totalShares, totalLoot)

  let member = members.getSome(memberAddress)

  assert(u128.ge(member.shares, sharesToBurn), ERR_INSUFFICIENT_SHARES)
  assert(u128.ge(member.loot, lootToBurn), ERR_INSUFFICIENT_LOOT)

  assert(canRageQuit(member.highestIndexYesVote), ERR_CANNOT_RAGEQUIT)

  let sharesAndLootToBurn = u128.add(sharesToBurn, lootToBurn)

  // burn shares and loot
  member.shares = u128.sub(member.shares, sharesToBurn)
  member.loot = u128.sub(member.loot, lootToBurn)
  totalShares = u128.sub(totalShares, sharesToBurn)
  totalLoot = u128.sub(totalLoot, lootToBurn)

  for(let i: i32 = 0; i < approvedTokens.length; i++) {
    let amountToRagequit = _fairShare(getUserTokenBalance(GUILD, approvedTokens[i]), sharesAndLootToBurn, initialTotalSharesAndLoot)
    if (u128.gt(amountToRagequit, u128.Zero)) { //gas optimization to allow a higher maximum token limit
      //deliberately not using safemath here to keep overflows from preventing the function execution (which would break ragekicks)
      //if a token overflows, it is because the supply was artificially inflated to oblivion, so we probably don't care about it anyways
      let current =  getUserTokenBalance(GUILD, approvedTokens[i])
      let modifiedDown = u128.sub(current, amountToRagequit)
      let modifiedUp = u128.add(current, amountToRagequit)

      let newTokenBalance = new userTokenBalanceInfo()
      newTokenBalance.user = GUILD
      newTokenBalance.token = approvedTokens[i]
      newTokenBalance.balance = modifiedDown
      let downUserIndex = getUserTokenBalanceIndex(GUILD)
      if(downUserIndex >= 0) {
        let replacedTokenBalance = userTokenBalances.replace(downUserIndex, newTokenBalance)
      }

      let upTokenBalance = new userTokenBalanceInfo()
      upTokenBalance.user = memberAddress
      upTokenBalance.token = approvedTokens[i]
      upTokenBalance.balance = modifiedUp
      let upUserIndex = getUserTokenBalanceIndex(memberAddress)
      if(upUserIndex >= 0) {
        let replacedTokenBalance = userTokenBalances.replace(upUserIndex, newTokenBalance)
      }
    }
  }
  rageQuitEvent(Context.predecessor, sharesToBurn, lootToBurn)
}

function ragekick(memberToKick: AccountId): void {
  REENTRANTGUARD.nonReentrantOpen()

  let member = members.getSome(memberToKick)

  assert(member.jailed != u128.Zero, ERR_IN_JAIL)
  assert(member.loot > u128.Zero, ERR_HAVE_LOOT) // note - should be impossible for jailed member to have shares
  assert(canRageQuit(member.highestIndexYesVote), ERR_CANNOT_RAGEQUIT)

  _ragequit(memberToKick, u128.Zero, member.loot)

  REENTRANTGUARD.nonReentrantClose()
}


function canRageQuit(highestIndexYesVote: i32): bool {
  assert(highestIndexYesVote > proposalQueue.length, ERR_PROPOSAL_NO)
  return proposals[proposalQueue[highestIndexYesVote]].flags[1]
}


export function withdrawBalance(token: AccountId, amount: Amount): void {
  REENTRANTGUARD.nonReentrantOpen()

  _withdrawBalance(token, amount)

  REENTRANTGUARD.nonReentrantClose()
}


export function withdrawBalances(tokens: Array<AccountId>, amounts: Array<Amount>, all: bool = false): void {
  REENTRANTGUARD.nonReentrantOpen()

  assert(tokens.length == amounts.length, ERR_MUST_MATCH)

  for(let i: i32 = 0; i < tokens.length; i++) {
    let withdrawAmount = amounts[i]
    if(all) { // withdraw maximum balance
      withdrawAmount = getUserTokenBalance(Context.predecessor, tokens[i])
    }

    _withdrawBalance(tokens[i], withdrawAmount)
  }

  REENTRANTGUARD.nonReentrantClose()
}

function _withdrawBalance(token: AccountId, amount: Amount): void {
  assert(u128.ge(getUserTokenBalance(Context.predecessor, token), amount), ERR_INSUFFICIENT_BALANCE)
  _unsafeSubtractFromBalance(Context.predecessor, token, amount)
  let contract = 'dao.vitalpointai.testnet'
  let ftAPI = new tokenAPI()
  ftAPI.transferFrom(contract, Context.predecessor, amount, token)
  
  withdrawlEvent(Context.predecessor, token, amount)
}

export function getTokenName(): void {
  logging.log('approvedTokens in getTokenName ' + approvedTokens[0].toString())
  logging.log('length approvedTokens '+ approvedTokens.length.toString())
  if(approvedTokens.length > 0) {
  logging.log("approvedTokens gettokenname:" + approvedTokens[0].toString())
  //let token = approvedTokens[0]
  //logging.log("token :" + token)
  let ftAPI = new tokenAPI()
  ftAPI.callGetToken(approvedTokens[0])
  } else {
    logging.log('no approved tokens still')
  }
}

export function getInitSettings(): Array<Array<string>> {
  let settings = new Array<Array<string>>()
  //get Summoner
  let summoner = storage.getSome<string>("summoner")
  logging.log('summoner ' + summoner)

  //get periodDuration
  let periodDuration = storage.getSome<u64>('periodDuration')

  //set votingPeriodLength
  let votingPeriodLength = storage.getSome<u128>('votingPeriodLength')

  //set gracePeriodLength
  let gracePeriodLength = storage.getSome<u128>('gracePeriodLength')

  //set proposalDeposit
  let proposalDeposit = storage.getSome<u128>('proposalDeposit')

  //set dilutionBound
  let dilutionBound = storage.getSome<u128>('dilutionBound')

  //set processingReward
  let processingReward = storage.getSome<u128>('processingReward')

  //set summoning Time
  let summoningTime = storage.getSome<u64>('summoningTime')

  //set minimum share price
  let minSharePrice = storage.getSome<u64>('minSharePrice')
 
  settings.push([
    summoner, 
    periodDuration.toString(), 
   votingPeriodLength.toString(),
   gracePeriodLength.toString(),
   proposalDeposit.toString(),
   dilutionBound.toString(),
   processingReward.toString(),
   summoningTime.toString(),
   minSharePrice.toString(),
   depositToken.toString()
  ])

  logging.log('settings array ' + settings.toString())

  return settings
}


// export function collectTokens(token: AccountId): void {
//   REENTRANTGUARD.nonReentrantOpen()
//   assert(onlyDelegate(Context.predecessor), ERR_NOT_DELEGATE)

//   let ftAPI = new tokenAPI()
//   ftAPI.callBalanceOf(token, Context.predecessor)
  
//   let amountToCollect = u128.sub(balance, getUserTokenBalance(TOTAL, token))
  
//   only collect if 1) there are tokens to collect 2) token is whitelisted 3) token has non-zero balance
//   assert(amountToCollect > u128.Zero, ERR_NO_TOKENS)
//   assert(tokenWhiteList.getSome(token), ERR_TOKEN_NOT_WHITELISTED)
//   assert(getUserTokenBalance(GUILD, token) > u128.Zero, ERR_NONZERO_BANK)

//   _unsafeAddToBalance(GUILD, token, amountToCollect)
//   tokensCollectedEvent(token, amountToCollect)

//   REENTRANTGUARD.nonReentrantClose()
// }


// NOTE: requires that delegate key which sent the original proposal cancels, Context.predecessor == proposal.owner
export function cancelProposal(proposalIdentifier: string): void {
  REENTRANTGUARD.nonReentrantOpen()
  
  let proposalId = getProposalIndex(proposalIdentifier)
 
  let proposal = proposals[proposalId]
  
  assert(!proposal.flags[0], ERR_ALREADY_SPONSORED)
  assert(!proposal.flags[3], ERR_ALREADY_CANCELLED)
  assert(Context.predecessor == proposal.proposer, ERR_ONLY_PROPOSER)

  let flags = proposal.flags // [sponsored, processed, didPass, cancelled, whitelist, guildkick]
  flags[3] = true; //cancelled
  logging.log('proposal flags ' + flags.toString())

  proposals.replace(proposalId, new Proposal(
    proposal.proposalIdentifier,
    proposal.applicant,
    proposal.proposer,
    proposal.sponsor,
    proposal.sharesRequested,
    proposal.lootRequested,
    proposal.tributeOffered,
    proposal.tributeToken,
    proposal.paymentRequested,
    proposal.paymentToken,
    proposal.proposalId,
    proposal.startingPeriod,
    proposal.yesVotes,
    proposal.noVotes,
    flags,
    proposal.maxTotalSharesAndLootAtYesVote,
    proposal.proposalSubmission
  ))

  _unsafeInternalTransfer(ESCROW, proposal.proposer, proposal.tributeToken, proposal.tributeOffered)
  cancelProposalEvent(proposalId, Context.predecessor)

  REENTRANTGUARD.nonReentrantClose()
}


export function updateDelegateKey(newDelegateKey: AccountId): void {
  REENTRANTGUARD.nonReentrantOpen()

  assert(onlyShareholder(Context.predecessor), ERR_NOT_SHAREHOLDER)
  assert(env.isValidAccountID(newDelegateKey), ERR_INVALID_ACCOUNT_ID)

  // skip checks if member is setting the delegate key to their member address
  if(newDelegateKey != Context.predecessor) {
    assert(!members.getSome(newDelegateKey).existing, ERR_NO_OVERWRITE_MEMBER)
    assert(!members.getSome(memberAddressByDelegatekey.getSome(newDelegateKey)).existing, ERR_NO_OVERWRITE_KEY)
  }

  let member = members.getSome(Context.predecessor)
  memberAddressByDelegatekey.set(member.delegateKey, '')
  memberAddressByDelegatekey.set(newDelegateKey, Context.predecessor)
  member.delegateKey = newDelegateKey

  updateDelegateKeyEvent(Context.predecessor, newDelegateKey)

  REENTRANTGUARD.nonReentrantClose()
}

/********************************/ 
/* GETTER FUNCTIONS             */
/********************************/

/**
 * returns DAO init status
 */
export function getInit(): string {
  return storage.getSome<string>("init")
}

/**
 * returns current token owner
 */
export function getSummoner(): string {
  return storage.getSome<string>("summoner")
}

/**
 * returns deposit token type
 */
export function getDepositToken(): string {
  return storage.getSome<string>("depositToken")
}

export function getProposalDeposit(): u128 {
  return storage.getSome<u128>("proposalDeposit")
}

function _max(x: u128, y: u128): u128 {
  return u128.gt(x, y) ? x : y
}

export function getMemberStatus(member: AccountId): bool {
  if(members.get(member)){
    return true
  }
  return false
}

export function getMemberInfo(member: AccountId): Array<Member> {
  let thisMember = new Array<Member>()
  let aMember = members.get(member, new Member('', u128.Zero, u128.Zero, false, 0, u128.Zero))!
  thisMember.push(aMember)
  return thisMember
}

export function getCurrentPeriod(): u64 {
  let summonTime = storage.getPrimitive<u64>('summoningTime', 0)
  let pd = storage.getPrimitive<u64>('periodDuration', 0)
  if(pd != 0) {
    return ((Context.blockIndex - summonTime) / pd)
  }
  return 0
}

export function isVotingPeriod(proposalIdentifier: string): bool {
  let proposalIndex = getProposalIndex(proposalIdentifier) 
  let proposal = proposals[proposalIndex]
  let currentPeriod = u128.from(getCurrentPeriod())
  let lastVotingPeriod = u128.add(proposal.startingPeriod, storage.get<u128>('votingPeriodLength', u128.Zero)!)
  if (u128.le(currentPeriod, lastVotingPeriod)) {
    return true
  } else {
    return false
  }
}

export function isGracePeriod(proposalIdentifier: string): bool {
  let proposalIndex = getProposalIndex(proposalIdentifier) 
  let proposal = proposals[proposalIndex]
  let currentPeriod = u128.from(getCurrentPeriod())
  let votingPeriod = u128.add(proposal.startingPeriod, storage.get<u128>('votingPeriodLength', u128.Zero)!)
  let endGracePeriod = u128.add(votingPeriod, storage.get<u128>('gracePeriodLength', u128.Zero)!)
  if (u128.le(currentPeriod, endGracePeriod) && u128.gt(currentPeriod, votingPeriod)) {
    return true
  } else {
    return false
  }
}

export function getProposalQueueLength(): u64 {
  return proposalQueue.length
}

export function getProposalFlags(proposalIdentifier: string): bool[] {
  let proposalId = getProposalIndex(proposalIdentifier)
  return proposals[proposalId].flags
}

export function getUserTokenBalance(user: AccountId, token: AccountId): u128 {
  for(let i: i32 = 0; i < userTokenBalances.length; i++) {
    if(userTokenBalances[i].user == user && userTokenBalances[i].token == token) {
      return userTokenBalances[i].balance
    }
  }
  return u128.Zero
}

export function getUserTokenBalanceObject(): PersistentVector<userTokenBalanceInfo> {
  return userTokenBalances
}

export function getGuildTokenBalances(): Array<TokenBalances> {
  logging.log('approvedtoken ' + approvedTokens[0].toString())
  logging.log('approvedtoken length ' + approvedTokens.length.toString())
  let balances = new Array<TokenBalances>()
  for (let i: i32 = 0; i < approvedTokens.length; i++) {
    let balance = _getGuildIndivTokenBalances(approvedTokens[i])
    logging.log('token ' + approvedTokens[i])
    logging.log('balance ' + balance.toString())
    balances.push({token: approvedTokens[i], balance: balance})
  }
  return balances
}

function _getGuildIndivTokenBalances(token: AccountId): u128 {
  return getUserTokenBalance(GUILD, token)
}

export function getEscrowTokenBalances(): Array<TokenBalances> {
  logging.log('approvedtoken ' + approvedTokens[0])
  logging.log('approvedtoken length ' + approvedTokens.length.toString())
  let balances = new Array<TokenBalances>()
  for (let i: i32 = 0; i < approvedTokens.length; i++) {
    let balance = _getEscrowIndivTokenBalances(approvedTokens[i])
    logging.log('token for ' + approvedTokens[i])
    logging.log('balance ' + balance.toString())
    balances.push({token: approvedTokens[i], balance: balance})
  }
  return balances
}

function _getEscrowIndivTokenBalances(token: AccountId): u128 {
  return getUserTokenBalance(ESCROW, token)
}

export function getMemberProposalVote(memberAddress: AccountId, proposalIdentifier: string): string {
  let proposalIndex = getProposalIndex(proposalIdentifier)
  logging.log('proposal Index member vote ' + proposalIndex.toString())
  let theseVotes = proposals[proposalIndex].votesByMember

  assert(members.get(memberAddress)!=null, ERR_NOT_A_MEMBER) 
  assert(proposalIndex < proposalQueue.length, ERR_PROPOSAL_NO)
  for(let i: i32 = 0; i < theseVotes.length; i++) {
    if(theseVotes[i].user == memberAddress && theseVotes[i].proposalIdentifier == proposalIdentifier) {
      return theseVotes[i].vote
    }
  }
  return 'no vote yet'
}

export function getProposalVotes(proposalIdentifier: string): Array<Votes> {
  let proposalIndex = getProposalIndex(proposalIdentifier)
  let yesVotes = proposals[proposalIndex].yesVotes.toString()
  let noVotes = proposals[proposalIndex].noVotes.toString()
  let voteArray = new Array<Votes>()

  let newVotes = new Votes()
  newVotes.yes = yesVotes
  newVotes.no = noVotes
  voteArray.push(newVotes)

  return voteArray
}

export function getTokenCount(): u128 {
  return new u128(approvedTokens.length)
}

export function getProposalIndex(proposalIdentifier: string): i32 {
  for (let i: i32 = 0; i < proposals.length; i++) {
    if (proposals[i].proposalIdentifier == proposalIdentifier) {
      return i
    }
  }
  return -1
}

export function getUserTokenBalanceIndex(user: AccountId): i32 {
  for (let i: i32 = 0; i < userTokenBalances.length; i++) {
    if (userTokenBalances[i].user == user) {
      return i
    }
  }
  return -1
}

/**
 * returns all Funding Request Events
 */
export function getAllFundingRequestEvents(): Array<SubmitProposalEvent> {
  let _frList = new Array<SubmitProposalEvent>();
  if(submitProposalEvents.length != 0) {
    for(let i: i32 = 0; i < submitProposalEvents.length; i++) {
      _frList.push(submitProposalEvents[i]);
    }
  }
  return _frList;
}

/*****************
PROPOSAL FUNCTIONS
*****************/

export function submitProposal (
    proposalIdentifier: string,
    applicant: AccountId,
    sharesRequested: u128,
    lootRequested: u128,
    tributeOffered: u128,
    tributeToken: AccountId,
    paymentRequested: u128,
    paymentToken: AccountId
): u64 {
 // REENTRANTGUARD.nonReentrantOpen()
  
  assert(u128.le(u128.add(sharesRequested, lootRequested), new u128(MAX_NUMBER_OF_SHARES_AND_LOOT)), ERR_TOO_MANY_SHARES)
  assert(tokenWhiteList.getSome(tributeToken), ERR_NOT_WHITELISTED)
  assert(tokenWhiteList.getSome(paymentToken), ERR_NOT_WHITELISTED_PT)
  assert(env.isValidAccountID(applicant), ERR_INVALID_ACCOUNT_ID)
  assert(applicant != GUILD && applicant != ESCROW && applicant != TOTAL, ERR_RESERVED)
  if(members.get(applicant)!=null) {
    assert(members.getSome(applicant).jailed == u128.Zero, ERR_JAILED)
  }
  
  if(tributeOffered > u128.Zero && getUserTokenBalance(GUILD, tributeToken) == u128.Zero) {
    assert(u128.lt(totalGuildBankTokens, new u128(MAX_TOKEN_GUILDBANK_COUNT)), ERR_FULL_GUILD_BANK)
  }

  _submitTransfers(tributeOffered, tributeToken)  

  let flags = new Array<bool>(7) // [sponsored, processed, didPass, cancelled, whitelist, guildkick, member]
  if(sharesRequested > u128.Zero){
    flags[6] = true // member proposal
  }

  _submitProposal(proposalIdentifier, applicant, sharesRequested, lootRequested, tributeOffered, tributeToken, paymentRequested, paymentToken, flags)
 // REENTRANTGUARD.nonReentrantClose()
  return proposalCount - 1
}

function _submitTransfers(tributeOffered: u128, tributeToken: AccountId): void {
  // collect tribute from proposer and store it in the Moloch until the proposal is processed
  let ftAPI = new tokenAPI()
  ftAPI.incAllowance(tributeOffered, tributeToken)
  ftAPI.transferFrom(Context.sender, MOLOCH_CONTRACT_ACCOUNT, tributeOffered, tributeToken)
  
  _unsafeAddToBalance(ESCROW, tributeToken, tributeOffered)
}


export function submitWhitelistProposal(tokenToWhitelist: string, proposalIdentifier: string): u64 {
  REENTRANTGUARD.nonReentrantOpen()
  assert(env.isValidAccountID(tokenToWhitelist), ERR_INVALID_ACCOUNT_ID)
  assert(!tokenWhiteList.getSome(tokenToWhitelist), ERR_ALREADY_WHITELISTED)
  assert(u128.lt(new u128(approvedTokens.length), new u128(MAX_TOKEN_WHITELIST_COUNT)), ERR_TOO_MANY_WHITELISTED)

  let flags = new Array<bool>(7) // [sponsored, processed, didPass, cancelled, whitelist, guildkick]
  flags[4] = true; // whitelist
  _submitProposal(proposalIdentifier, '', u128.Zero, u128.Zero, u128.Zero, tokenToWhitelist, u128.Zero, '', flags)
  REENTRANTGUARD.nonReentrantClose()
  return proposalCount - 1
}


export function submitGuildKickProposal(memberToKick: AccountId, proposalIdentifier: string): u64 {
  REENTRANTGUARD.nonReentrantOpen()
  let member = members.getSome(memberToKick)
  assert(member.shares > u128.Zero || member.loot > u128.Zero, ERR_SHAREORLOOT)
  assert(member.jailed == u128.Zero, ERR_JAILED)

  let flags = new Array<bool>(7) // [sponsored, processed, didPass, cancelled, whitelist, guildkick]
  flags[5] = true; // guild kick
  
  _submitProposal(proposalIdentifier, memberToKick, u128.Zero, u128.Zero, u128.Zero, '', u128.Zero, '', flags)
  REENTRANTGUARD.nonReentrantClose()
  return proposalCount-1
}




function _submitProposal(
  proposalIdentifier: string,
  applicant: AccountId,
  sharesRequested: u128,
  lootRequested: u128,
  tributeOffered: u128,
  tributeToken: AccountId,
  paymentRequested: u128,
  paymentToken: AccountId,
  flags: Array<bool>
): void {
  assert(getProposalIndex(proposalIdentifier) == -1, ERR_DUPLICATE_PROPOSAL)
  proposals.push(new Proposal(
    proposalIdentifier,
    applicant,
    Context.sender,
    '',
    sharesRequested,
    lootRequested,
    tributeOffered,
    tributeToken,
    paymentRequested,
    paymentToken,
    proposalCount,
    u128.Zero,
    u128.Zero,
    u128.Zero,
    flags,
    u128.Zero,
    Context.blockIndex
  ))
  
  let memberAddress: AccountId
  if(memberAddressByDelegatekey.get(Context.sender)!=null) {
    memberAddress = memberAddressByDelegatekey.getSome(Context.sender)
  } else {
    memberAddress = Context.sender
  }

  submitProposalEvent(proposalIdentifier, applicant, sharesRequested, lootRequested, tributeOffered, tributeToken, paymentRequested, paymentToken, flags, proposalCount, Context.predecessor, memberAddress, Context.blockIndex )
  proposalCount += 1
}

export function sponsorProposal(proposalIdentifier: string, proposalDeposit: u128, depositToken: AccountId): void {
  REENTRANTGUARD.nonReentrantOpen()
  assert(onlyDelegate(Context.predecessor), 'not a delegate')

  let proposalId = getProposalIndex(proposalIdentifier)
  
  // collect proposal deposit from sponsor and store it in the Moloch until the proposal is processed
  let ftAPI = new tokenAPI()  
  ftAPI.incAllowance(proposalDeposit, depositToken)
  ftAPI.transferFrom(Context.sender, MOLOCH_CONTRACT_ACCOUNT, proposalDeposit, depositToken)
  
  _unsafeAddToBalance(ESCROW, depositToken, proposalDeposit)

  let proposal = proposals[proposalId]
  assert(proposal.proposalIdentifier == proposalIdentifier, 'not right proposal')
  assert(env.isValidAccountID(proposal.proposer), 'invalid account ID')
  assert(!proposal.flags[0], 'already sponsored')
  assert(!proposal.flags[3], 'proposal cancelled')
 
  if(members.get(proposal.applicant)!=null){
    assert(members.getSome(proposal.applicant).jailed == u128.Zero, 'member jailed')
  }

  if(proposal.tributeOffered > u128.Zero && getUserTokenBalance(GUILD, proposal.tributeToken) == u128.Zero ) {
    assert(u128.lt(totalGuildBankTokens, new u128(MAX_TOKEN_GUILDBANK_COUNT)), 'guild bank full')
  }
  
  // Whitelist proposal
  if(proposal.flags[4]) {
    assert(!tokenWhiteList.getSome(proposal.tributeToken), 'already whitelisted')
    assert(!proposedToWhiteList.getSome(proposal.tributeToken), 'whitelist proposed already')
    assert(approvedTokens.length < MAX_TOKEN_WHITELIST_COUNT, 'can not sponsor more')
    proposedToWhiteList.set(proposal.tributeToken, true)

    //Guild Kick Proposal
  } else if (proposal.flags[5]) {
    assert(!proposedToKick.getSome(proposal.applicant), 'proposed to kick')
    proposedToKick.set(proposal.applicant, true)
  }

  // compute starting period for proposal
  let max = _max(
    new u128(getCurrentPeriod()), 
    new u128(proposalQueue.length) == u128.Zero ? u128.Zero : proposals[proposalQueue[proposalQueue.length - 1]].startingPeriod
  )
  let startingPeriod = u128.add(max, new u128(1))
  
  let memberAddress = memberAddressByDelegatekey.getSome(Context.predecessor)

  let flags = proposal.flags // [sponsored, processed, didPass, cancelled, whitelist, guildkick, member]
  flags[0] = true; //sponsored

  proposal.flags = flags
  proposal.startingPeriod = startingPeriod
  proposal.sponsor = memberAddress

    logging.log('proposal flags ' + proposal.flags.toString())
   proposals.replace(proposalId, proposal)  

  // append proposal to queue
  proposalQueue.push(proposalId)
  
  sponsorProposalEvent(Context.predecessor, memberAddress, proposalId, proposalQueue.length-1, startingPeriod)
  REENTRANTGUARD.nonReentrantClose()
}


export function submitVote(proposalIdentifier: string, vote: string): void {
  REENTRANTGUARD.nonReentrantOpen()
  let proposalIndex = getProposalIndex(proposalIdentifier)
  assert(onlyDelegate(Context.predecessor), ERR_NOT_DELEGATE)
  let memberAddress = memberAddressByDelegatekey.getSome(Context.predecessor)
  let member = members.getSome(memberAddress)

  assert(proposalIndex < proposalQueue.length, ERR_PROPOSAL_NO)
  let proposal = proposals[proposalQueue[proposalIndex]]

  assert(vote == 'abstain' || vote == 'yes' || vote=='no', ERR_VOTE_INVALID)
  assert(u128.ge(new u128(getCurrentPeriod()), proposal.startingPeriod), ERR_VOTING_NOT_STARTED)
  assert(!hasVotingPeriodExpired(proposal.startingPeriod), ERR_VOTING_PERIOD_EXPIRED)
  logging.log('context predecessor ' + Context.predecessor)
  logging.log('context sender submit vote ' + Context.sender)
  let existingVote = getMemberProposalVote(Context.predecessor, proposalIdentifier)

  assert(existingVote == 'no vote yet', ERR_ALREADY_VOTED)

  votesByMember.push({user: Context.predecessor, proposalIdentifier: proposalIdentifier, vote: vote})

  if(vote == 'yes') {
    let newYesVotes = u128.add(proposal.yesVotes, member.shares)

    //set highest index (latest) yes vote - must be processed for member to ragequit
    if(proposalIndex > member.highestIndexYesVote) {
      member.highestIndexYesVote = proposalIndex
      members.set(memberAddress, new Member(
        member.delegateKey,
        member.shares, 
        member.loot, 
        true,
        member.highestIndexYesVote,
        member.jailed
        ))
    }

    // set maximum of total shares encountered at a yes vote - used to bound dilution for yes voters
    let newmaxTotalSharesAndLootAtYesVote: u128
    if(u128.gt(u128.add(totalShares, totalLoot), proposal.maxTotalSharesAndLootAtYesVote)) {
      newmaxTotalSharesAndLootAtYesVote = u128.add(totalShares, totalLoot)
    } else {
      newmaxTotalSharesAndLootAtYesVote = proposal.maxTotalSharesAndLootAtYesVote
    }
    proposal.yesVotes = newYesVotes
    proposal.votesByMember = votesByMember
    proposal.maxTotalSharesAndLootAtYesVote = newmaxTotalSharesAndLootAtYesVote
    proposals.replace(proposalIndex, proposal)

  } else if (vote == 'no') {
    let newNoVotes = u128.add(proposal.noVotes, member.shares)

    proposal.noVotes = newNoVotes

    proposals.replace(proposalIndex, proposal)
    
  }

  // NOTE: subgraph indexes by proposalId not proposalIndex since proposalIndex isn't set until it's been sponsored but proposal is created on submission
  submitVoteEvent(proposalQueue[proposalIndex], proposalIndex, Context.predecessor, memberAddress, vote)
  REENTRANTGUARD.nonReentrantClose()
}


export function processProposal(proposalIdentifier: string): bool {
 // REENTRANTGUARD.nonReentrantOpen()
  let proposalIndex = getProposalIndex(proposalIdentifier)
  _validateProposalForProcessing(proposalIndex)
  
  let proposalId = proposalQueue[proposalIndex]
  let proposal = proposals[proposalId]

  assert(!proposal.flags[4] && !proposal.flags[5], ERR_STANDARD_PROPOSAL)

  let flags = proposal.flags // [sponsored, processed, didPass, cancelled, whitelist, guildkick, member]
  flags[1] = true; //processed

  proposal.flags = flags
  proposals.replace(proposalId, proposal)

  let didPass = _didPass(proposalId)

  //Make the proposal fail if the new total number of shares and loot exceeds the limit
  let firstAdd = u128.add(totalShares, totalLoot)
  let secondAdd = u128.add(proposal.sharesRequested, proposal.lootRequested)
  if(u128.gt(u128.add(firstAdd, secondAdd), new u128(MAX_NUMBER_OF_SHARES_AND_LOOT))) {
    didPass = false
  }

  //Make the proposal fail if it is requesting more tokens as payment than the available guild bank balance
  if(proposal.paymentRequested > getUserTokenBalance(GUILD, proposal.paymentToken)) {
    didPass = false
  }

  //Make the proposal fail if it would result in too many tokens with non-zero balance in guild bank
  if(proposal.tributeOffered > u128.Zero && getUserTokenBalance(GUILD, proposal.tributeToken) == u128.Zero && u128.ge(totalGuildBankTokens, new u128(MAX_TOKEN_GUILDBANK_COUNT))) {
    didPass = false
  }

  return didPass
}

  export function proposalPassed(proposalIdentifier: string): void {

    let proposalIndex = getProposalIndex(proposalIdentifier)
    let proposalId = proposalQueue[proposalIndex]
    let proposal = proposals[proposalId]

    let flags = proposal.flags // [sponsored, processed, didPass, cancelled, whitelist, guildkick]
    flags[2] = true; //didPass
    proposal.flags = flags
    proposals.replace(proposalId, proposal)

    if(members.get(proposal.applicant)!=null) {
      // if the applicant is already a member, add to their existing shares and loot
      if(members.getSome(proposal.applicant).existing) {

        let member = members.getSome(proposal.applicant)
        let newShares = u128.add(member.shares, proposal.sharesRequested)
        let newLoot = u128.add(member.loot, proposal.lootRequested)
    
        members.set(proposal.applicant, new Member(
          member.delegateKey,
          newShares, 
          newLoot, 
          true,
          member.highestIndexYesVote,
          member.jailed
          ))

      // the applicant is a new member, create a new record for them 
      } else {
        // if the applicant address is already taken by a member's delegateKey, reset it to their member address
        if(members.getSome((memberAddressByDelegatekey.getSome(proposal.applicant))).existing) {
         
          let memberToOverride = memberAddressByDelegatekey.getSome(proposal.applicant)
          memberAddressByDelegatekey.set(memberToOverride, memberToOverride)
          
          let member = members.getSome(memberToOverride)
        
            members.set(memberToOverride, new Member(
              memberToOverride,
              member.shares, 
              member.loot, 
              true,
              member.highestIndexYesVote,
              member.jailed
              ))
        }
      }
    } else {
      // use applicant address as delegateKey by default
      members.set(proposal.applicant, new Member(proposal.applicant, proposal.sharesRequested, proposal.lootRequested, true, 0, u128.Zero))
      memberAddressByDelegatekey.set(proposal.applicant, proposal.applicant)
    }

    // mint new shares and loot
    totalShares = u128.add(totalShares, proposal.sharesRequested)
    totalLoot = u128.add(totalLoot, proposal.lootRequested)

    // if the proposal tribute is the first tokens of its kind to make it into the guild bank, increment total guild bank tokens
    if(getUserTokenBalance(GUILD, proposal.tributeToken) == u128.Zero && u128.gt(proposal.tributeOffered, u128.Zero)) {
      totalGuildBankTokens = u128.add(totalGuildBankTokens, new u128(1))
    }

    _unsafeInternalTransfer(ESCROW, GUILD, proposal.tributeToken, proposal.tributeOffered)
    _unsafeInternalTransfer(GUILD, proposal.applicant, proposal.paymentToken, proposal.paymentRequested)

    // if the proposal spends 100% of guild bank balance for a token, decrement total guild bank tokens
    if(getUserTokenBalance(GUILD, proposal.paymentToken) == u128.Zero && u128.gt(proposal.paymentRequested, u128.Zero)) {
      totalGuildBankTokens = u128.sub(totalGuildBankTokens, new u128(1))
    }
  }

export function proposalFailed(proposalIdentifier: string): void {
    let proposalIndex = getProposalIndex(proposalIdentifier)
    let proposalId = proposalQueue[proposalIndex]
    let proposal = proposals[proposalId]
   
    //return all tokens to the proposer (not the applicant, because funds come from the proposer)
    _unsafeInternalTransfer(ESCROW, proposal.proposer, proposal.tributeToken, proposal.tributeOffered)
  

  _returnDeposit(proposal.sponsor)

  //processProposalEvent(proposalIndex, proposalId, didPass)
//  REENTRANTGUARD.nonReentrantClose()
}


export function processWhitelistProposal(proposalIdentifier: string): void {
  REENTRANTGUARD.nonReentrantOpen()
  let proposalIndex = getProposalIndex(proposalIdentifier)
  _validateProposalForProcessing(proposalIndex)

  let proposalId = proposalQueue[proposalIndex]
  let proposal = proposals[proposalId]

  assert(proposal.flags[4], ERR_WHITELIST_PROPOSAL)

  let flags = proposal.flags // [sponsored, processed, didPass, cancelled, whitelist, guildkick]
  flags[1] = true; //processed
  proposal.flags = flags
  proposals.replace(proposalId,proposal)

  let didPass = _didPass(proposalId)

  if(approvedTokens.length >= MAX_TOKEN_WHITELIST_COUNT) {
    didPass = false
  }

  if (didPass) {
    let flags = proposal.flags // [sponsored, processed, didPass, cancelled, whitelist, guildkick]
    flags[2] = true; //didPass
    proposal.flags = flags
    proposals.replace(proposalId, proposal)

    tokenWhiteList.set(proposal.tributeToken, true)
    approvedTokens.push(proposal.tributeToken)
  }

  proposedToWhiteList.set(proposal.tributeToken, false)

  _returnDeposit(proposal.sponsor)

  processWhiteListProposalEvent(proposalIndex, proposalId, didPass)
  REENTRANTGUARD.nonReentrantClose()
}


export function processGuildKickProposal(proposalIdentifier: string): void {
  REENTRANTGUARD.nonReentrantOpen()
  let proposalIndex = getProposalIndex(proposalIdentifier)
  _validateProposalForProcessing(proposalIndex)

  let proposalId = proposalQueue[proposalIndex]
  let proposal = proposals[proposalId]

  assert(proposal.flags[5], ERR_GUILD_PROPOSAL)

  let flags = proposal.flags // [sponsored, processed, didPass, cancelled, whitelist, guildkick]
    flags[1] = true; //processed
   
    proposal.flags = flags
    proposals.replace(proposalId, proposal)

  let didPass = _didPass(proposalId)

  if(didPass) {
    let flags = proposal.flags // [sponsored, processed, didPass, cancelled, whitelist, guildkick]
    flags[2] = true; //didPass

    proposal.flags = flags
    proposals.replace(proposalId, proposal)


    let member = members.getSome(proposal.applicant)

    let updateMember = new Member(
    member.delegateKey,
    u128.Zero, // revoke all shares
    u128.add(member.loot, member.shares), //transfer shares to loot
    true,
    member.highestIndexYesVote,
    new u128(proposalId)
    )

    members.set(proposal.applicant, updateMember)
     
    //transfer shares to loot
  
    totalShares = u128.sub(totalShares, member.shares)
    totalLoot = u128.add(totalLoot, member.shares)

  }

  proposedToKick.set(proposal.applicant, false)

  _returnDeposit(proposal.sponsor)

  processGuildKickProposalEvent(proposalIndex, proposalId, didPass)
  REENTRANTGUARD.nonReentrantClose()
}

/********************************/ 
/* CROSS CONTRACT API FUNCTIONS */
/********************************/



export class tokenAPI {

  // Cross Contract Calls Working
  
  callGetToken(token: AccountId): void {

    let promise = ContractPromise.create(
      token,
      "getTokenName",
      new Uint8Array(0),
      100,
      u128.Zero)

    promise.returnAsResult()
  }

  callBalanceOf(token: AccountId, account: AccountId): void {
    let args: BalanceArgs = {account}

    let promise = ContractPromise.create(
      token, // contract account Id
      "get_balance", // method
      args.encode(), // serialized contract method arguments as Uint8Array
      100, // gas attached to call
      u128.Zero) // attached deposit to be sent with call

      promise.returnAsResult()
  }

  transferFrom(from: AccountId, to: AccountId, amount: Amount, tributeToken: AccountId): void { //tributeToken is the fungible token contract account for the tributeToken
    let args: TransferFromArgs = { owner_id: from, new_owner_id: to, amount: amount }

    let promise = ContractPromise.create(
      tributeToken, 
      "transfer_from", 
      args.encode(), 
      100000000000000, 
      u128.Zero
    )

    assert(promise, ERR_TRIBUTE_TRANSFER_FAILED)
    logging.log("Other Contract: " + "(" + tributeToken + ")")
    promise.returnAsResult()
  }

  incAllowance(amount: Amount, tokenContract: AccountId): void {
    let args: IncAllowanceArgs = { escrow_account_id: MOLOCH_CONTRACT_ACCOUNT, amount: amount }
    let promise = ContractPromise.create(
      tokenContract,
      "inc_allowance",
      args.encode(),
      100000000000000,
      u128.Zero
    )
    promise.returnAsResult()
  }

  
  }

  
  
  
  