import { u128, PersistentMap, PersistentVector } from 'near-sdk-as'
import { AccountId } from './dao-types'

// Data Types and Storage
//export type tokenBalances = PersistentMap<string, u128>
//export const tokenBalances: tokenBalances = new PersistentMap<string, u128>('tb') // maps token account to token balance

//export type userTokenBalances = PersistentMap<string, tokenBalances>
//export const userTokenBalances: userTokenBalances = new PersistentMap<string, tokenBalances>('utb') //maps user to specific token balances

export const userTokenBalances = new PersistentVector<userTokenBalanceInfo>('u') //maps user to token to amount
//export type totalTokenBalances = PersistentMap<string, u128>
//export const totalTokenBalances: totalTokenBalances = new PersistentMap<string, u128>('ttb') // maps token to total token balance
//export const guildTokenBalances = new PersistentMap<string, totalTokenBalances>('gtb') // maps guild total to total token balance
export type votesByMember = PersistentVector<UserVote>
export const votesByMember = new PersistentVector<UserVote>('v') // maps user to proposal to vote on that proposal
//export type votesByMember = PersistentMap<string, Vote> // maps user account to vote result (true, false, null)
//export const votesByMember: votesByMember = new PersistentMap<string, Vote>('vbm')

export const tokenWhiteList = new PersistentMap<string, bool>('tw') // maps token name to whether it is whitelisted or not
export const proposedToWhiteList = new PersistentMap<string, bool>('pw') // maps token name to whether it has been proposed for white listing or not
export const proposedToKick = new PersistentMap<string, bool>('pk') // maps user account to whether it has been proposed to kick or not
export const members = new PersistentMap<string, Member>('m') // maps account to its Member model
export const memberAddressByDelegatekey = new PersistentMap<string, string>('md') // maps account to delegate key
export const proposals = new PersistentVector<Proposal>('p') // array of proposals - use vector as provides index and length
export const proposalQueue = new PersistentVector<i32>('pq') // proposal queue
//export const proposals = new PersistentMap<string, Proposal>('pro') // map of proposals - identifier to proposal
export const approvedTokens = new PersistentVector<AccountId>('a') // array of approvedtokens




@nearBindgen
export class Vote {
    vote: string;
}

@nearBindgen
export class Votes {
    yes: string;
    no: string;
    abstain: string;
}

@nearBindgen
export class UserVote {
    user: string;
    proposalIdentifier: string;
    vote: string;
}

@nearBindgen
export class TokenBalances {
    token: string;
    balance: u128;
}

@nearBindgen
export class userTokenBalanceInfo {
    user: string;
    token: string;
    balance: u128;
}

@nearBindgen
export class Member {
    delegateKey: string; // the key responsible for submitting proposals and voting - defaults to member address unless updated
    shares: u128; // the # of voting shares assigned to this member
    loot: u128; // the loot amount available to this member (combined with shares on ragequit)
    existing: bool; // always true once a member has been created
    highestIndexYesVote: i32; // highest proposal index # on which the member voted YES
    jailed: u128; // set to proposalIndex of a passing guild kick proposal for this member, prevents voting on and sponsoring proposals

    constructor(
        delegateKey: string,
        shares: u128,
        loot: u128,
        existing: bool,
        highestIndexYesVote: i32,
        jailed: u128) {
            this.delegateKey = delegateKey;
            this.shares = shares;
            this.loot = loot;
            this.existing = existing;
            this.highestIndexYesVote = highestIndexYesVote;
            this.jailed = jailed;
        }
    
}

@nearBindgen
export class Proposal {
    proposalIdentifier: string; // frontend generated id to link record to proposal details
    applicant: AccountId; // the applicant who wishes to become a member - this key will be used for withdrawals (doubles as guild kick target for gkick proposals)
    proposer: AccountId; // the account that submitted the proposal (can be non-member)
    sponsor: AccountId; // the member that sponsored the proposal (moving it into the queue)
    sharesRequested: u128; // the # of shares the applicant is requesting
    lootRequested: u128; // the amount of loot the applicant is requesting
    tributeOffered: u128; // amount of tokens offered as tribute
    tributeToken: AccountId; // tribute token contract reference
    paymentRequested: u128; // amount of tokens requested as payment
    paymentToken: AccountId; // payment token contract reference
    proposalId: i32; // proposal id for indexing
    startingPeriod: u128; // the period in which voting can start for this proposal
    yesVotes: u128; // the total number of YES votes for this proposal
    noVotes: u128; // the total number of NO votes for this proposal
    flags: Array<bool>; // [sponsored, processed, didPass, cancelled, whitelist, guildkick
    maxTotalSharesAndLootAtYesVote: u128; // the maximum # of total shares encountered at a yes vote on this proposal
    votesByMember: votesByMember; // the votes on this proposal by each member
    proposalSubmission: u64; // blockindex when proposal was submitted

    constructor (
        proposalIdentifier: string, // frontend generated id to link record to proposal details
        applicant: AccountId, // the applicant who wishes to become a member - this key will be used for withdrawals (doubles as guild kick target for gkick proposals)
        proposer: AccountId, // the account that submitted the proposal (can be non-member)
        sponsor: AccountId, // the member that sponsored the proposal (moving it into the queue)
        sharesRequested: u128, // the # of shares the applicant is requesting
        lootRequested: u128, // the amount of loot the applicant is requesting
        tributeOffered: u128, // amount of tokens offered as tribute
        tributeToken: AccountId, // tribute token contract reference
        paymentRequested: u128, // amount of tokens requested as payment
        paymentToken: AccountId, // payment token contract reference
        proposalId: i32, // proposal id for indexing
        startingPeriod: u128, // the period in which voting can start for this proposal
        yesVotes: u128, // the total number of YES votes for this proposal
        noVotes: u128, // the total number of NO votes for this proposal
        flags: Array<bool>, // [sponsored, processed, didPass, cancelled, whitelist, guildkick
        maxTotalSharesAndLootAtYesVote: u128, // the maximum # of total shares encountered at a yes vote on this proposal
        //votesByMember: votesByMember, // the votes on this proposal by each member
        proposalSubmission: u64 // blockindex when proposal was submitted
    ){
        this.proposalIdentifier = proposalIdentifier;
        this.applicant = applicant;
        this.proposer = proposer;
        this.sponsor = sponsor;
        this.sharesRequested = sharesRequested;
        this.lootRequested = lootRequested;
        this.tributeOffered = tributeOffered;
        this.tributeToken = tributeToken;
        this.paymentRequested = paymentRequested;
        this.paymentToken = paymentToken;
        this.proposalId = proposalId;
        this.startingPeriod = startingPeriod;
        this.yesVotes = yesVotes;
        this.noVotes = noVotes;
        this.flags = flags;
        this.maxTotalSharesAndLootAtYesVote = maxTotalSharesAndLootAtYesVote;
      //  this.votesByMember = votesByMember;
        this.proposalSubmission = proposalSubmission;
    }
}

@nearBindgen
export class ReentrancyGuard {
    _NOT_ENTERED: u64 = 1;
    _ENTERED: u64 = 2;
    _status: u64;
    constructor() {
        this._status = this._NOT_ENTERED;
    }

    nonReentrantOpen(): void {
        assert(this._status != this._ENTERED, "ReentrancyGuard: reentrant call")
        this._status = this._ENTERED;
    }

    nonReentrantClose(): void {
        this._status = this._NOT_ENTERED;
    }
}

// Cross Contract API Models

@nearBindgen
export class TransferFromArgs {
    owner_id: string;
    new_owner_id: string;
    amount: u128;
}

@nearBindgen
export class IncAllowanceArgs {
    escrow_account_id: string;
    amount: u128;
}

@nearBindgen
export class TransferArgs {
    to: string;
    amount: u128;
}

@nearBindgen
export class BalanceArgs {
   account: string;
}

@nearBindgen
export class OnBalanceCalledArgs {
    amount: u128 = u128.Zero;
    constructor(
        amount: u128 = u128.Zero
    )
    {this.amount = amount}    
}

@nearBindgen
export class TokenNameArgs {
}


@nearBindgen
export class ReceivedTokenNameArgs {
    name: string;
}

//@nearBindgen
//export class OnGetTokenNameCalled {
//    tokenName: string;
//  
//}

@nearBindgen
export class OnGetTokenNameCalled {
    tokenName: string
    constructor (
       
    )
    {
        
    }
}