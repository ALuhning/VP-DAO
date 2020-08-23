//@nearBindgen

const DEBUG = true;

import { Context, u128, PersistentDeque, logging } from "near-sdk-as";

// ----------------------------------------------------------------------------
// this file contains models representing events emitted by the contract
// ----------------------------------------------------------------------------

/**
 * originally defined in https://eips.ethereum.org/EIPS/eip-20 as
 *  event Transfer(address indexed _from, address indexed _to, uint256 _value);
 *
 * modifications (additional field `spender`) applied after reading
 *  https://docs.google.com/document/d/1YLPtQxZu1UAvO9cZ1O2RPXBbT0mooh4DYKjA_jp-RLM/edit
 *
 *
 * Transfer
 * MUST trigger when tokens are transferred, including zero value transfers.
 *
 * A token contract which creates new tokens SHOULD trigger a Transfer event
 *    with the _from address set to 0x0 when tokens are created.
 *
 * event Transfer(address indexed _from, address indexed _to, uint256 _value)
 *
 */
@nearBindgen
export class TransferEvent {
  id: u64;
  spender: string;
  from: string;
  to: string;
  value: u128;
  date: u64;
}


/**
 * originall defined in https://eips.ethereum.org/EIPS/eip-20 as
 *  event Approval(address indexed _owner, address indexed _spender, uint256 _value);
 *
 * modifications (additional field `oldValue`) applied after reading
 *  https://docs.google.com/document/d/1YLPtQxZu1UAvO9cZ1O2RPXBbT0mooh4DYKjA_jp-RLM/edit
 *
 * Approval
 *
 * MUST trigger on any successful call to approve(address _spender, uint256 _value).
 *
 * event Approval(address indexed _owner, address indexed _spender, uint256 _value)
 *
 */
export class ApprovalEvent {
  constructor(
    public owner: string,
    public spender: string,
    public oldValue: u128,
    public value: u128) {}
}

/**
 * Mint
 * MUST trigger when tokens are minted including zero value mints.
 *
 */
// export class MintEvent {
//   constructor(
//     public owner: string,
//     public value: u128) {}
// }
@nearBindgen
export class MintEvent {
    id: u64;
    owner: string;
    value: u128;
    date: u64;
}

/**
 * Burn
 * MUST trigger when tokens are burned including zero value burns.
 *
 */
@nearBindgen
export class BurnEvent {
    id: u64;
    owner: string;
    value: u128;
    date: u64;
}

  /**
 * Ownership Transfer
 * MUST trigger when token ownership is transferred.
 *
 */
@nearBindgen
export class OwnerTransferEvent {
    id: u64;
    owner: string;
    newOwner: string;
    date: u64;
}

// setup a queue for transfer events
export const transferEvents = new PersistentDeque<TransferEvent>("xfr");

// setup a queue for approval events
export const approvalEvents = new PersistentDeque<ApprovalEvent>("apr");

// setup a queue for mint events
export const mintEvents = new PersistentDeque<MintEvent>("mint");

// setup a queue for burn events
export const burnEvents = new PersistentDeque<BurnEvent>("burn");

// setup a queue for ownership transfers
export const ownerTransferEvents = new PersistentDeque<OwnerTransferEvent>("oxfr")

/**
 * This function records transfer events since NEAR doesn't currently support
 * an event model on-chain
 *
 * @param spender
 * @param from
 * @param to
 * @param value
 */
export function recordTransferEvent(spender: string, from: string, to: string, value: u128): void {
  DEBUG ? logging.log("[call] recordTransferEvent(" + spender + ", " + from + ", " + to + ", " + value.toString() + ")") : false;
  const transfer = new TransferEvent();
  transfer.id = <u64>(transferEvents.length + 1);
  transfer.spender = spender;
  transfer.from = from;
  transfer.to = to;
  transfer.value = value;
  transfer.date = <u64>Context.blockIndex;
  transferEvents.pushFront(transfer);
}

/**
 * this function returns the very first recorded transfer event
 *
 * mutates the list of transfer events permanently by removing the earliest
 * event from storage
 */
export function getOldestTransferEvent(): TransferEvent {
  DEBUG ? logging.log("[call] getOldestTransferEvent()") : false;
  return transferEvents.popBack();
}

/**
 * this function returns the most recently recorded transfer event
 *
 * mutates the list of transfer events permanently by removing the most recent
 * event from storage
 */
export function getNewestTransferEvent(): TransferEvent {
  DEBUG ? logging.log("[call] getNewestTransferEvent()") : false;
  return transferEvents.popFront();
}

/**
 * This function records approval events since NEAR doesn't currently support
 * an event model on-chain
 *
 * @param owner
 * @param spender
 * @param oldValue
 * @param value
 */
export function recordApprovalEvent(owner: string, spender: string, oldValue: u128, value: u128): void {
  DEBUG ? logging.log("[call] recordApprovalEvent(" + owner + ", " + spender + ", " + oldValue.toString() + ", " + value.toString() + ")") : false;
  const approval = new ApprovalEvent(owner, spender, oldValue, value);
  approvalEvents.pushFront(approval)
}

/**
 * this function returns the very first recorded approval event
 *
 * mutates the list of approval events permanently by removing the earliest
 * event from storage
 */
export function getOldestApprovalEvent(): ApprovalEvent {
  DEBUG ? logging.log("[call] getOldestApprovalEvent()") : false;
  return approvalEvents.popBack();
}

/**
 * this function returns the most recently recorded approval event
 *
 * mutates the list of approval events permanently by removing the most recent
 * event from storage
 */
export function getNewestApprovalEvent(): ApprovalEvent {
  DEBUG ? logging.log("[call] getNewestApprovalEvent()") : false;
  return approvalEvents.popFront();
}

/**
 * This function records mint events since NEAR doesn't currently support
 * an event model on-chain
 *
 * @param owner
 * @param value
 */
export function recordMintEvent(owner: string, value: u128): void {
    DEBUG ? logging.log("[call] recordMintEvent(" + owner + ", " + value.toString() + ")") : false;
    const mint = new MintEvent();
    mint.id = <u64>(mintEvents.length + 1);
    mint.owner = owner;
    mint.value = value;
    mint.date = <u64>Context.blockIndex;
    mintEvents.pushFront(mint)
  }

/**
 * This function records burn events since NEAR doesn't currently support
 * an event model on-chain
 *
 * @param owner
 * @param value
 */
export function recordBurnEvent(owner: string, value: u128): void {
    DEBUG ? logging.log("[call] recordBurnEvent(" + owner + ", " + value.toString() + ")") : false;
    const burn = new BurnEvent();
    burn.id = <u64>(burnEvents.length + 1);
    burn.owner = owner;
    burn.value = value;
    burn.date = <u64>Context.blockIndex;
    burnEvents.pushFront(burn)
  }

/**
 * This function records ownership transfer events since NEAR doesn't currently support
 * an event model on-chain
 *
 * @param owner
 * @param newOwner
 */
export function recordOwnershipTransferEvent(owner: string, newOwner: string): void {
    DEBUG ? logging.log("[call] recordOwnershipTransferEvent(" + owner + ", " + newOwner + ")") : false
    const ownerTransfer = new OwnerTransferEvent();
    ownerTransfer.id = <u64>(ownerTransferEvents.length + 1);
    ownerTransfer.owner = owner;
    ownerTransfer.newOwner = newOwner;
    ownerTransfer.date = <u64>Context.blockIndex;
    ownerTransferEvents.pushFront(ownerTransfer)
  }