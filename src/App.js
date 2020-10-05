import 'regenerator-runtime/runtime'
import 'fontsource-roboto';
import React, { useState, useEffect } from 'react'
import Big from 'big.js'

// Material UI imports
import LinearProgress from '@material-ui/core/LinearProgress'

// DApp component imports
import SignIn from './components/common/SignIn/signIn'
import Initialize from './components/Initialize/initialize'
import TokenData from './components/TokenData/tokenData'

// import stylesheets
import './global.css'

const BOATLOAD_OF_GAS = Big(3).times(10 ** 14).toFixed()
const NEAR = Big(1).times(10**24).toFixed()

export default function App() {

  // state setup
  const [loggedIn, setLoginState] = useState(false)
  const [initialized, setInit] = useState(false)
  const [done, setDone] = useState(false)
  const [accountId, setAccountId] = useState()
  const [tokenOwner, setTokenOwner] = useState()
  const [initialSupply, setInitialSupply] = useState()
  const [totalSupply, setTotalSupply] = useState()
  const [tokenSymbol, setTokenSymbol] = useState()
  
  const [precision, setPrecision] = useState()
  const [transferEvents, setTransferEvents] = useState([])
  const [mintEvents, setMintEvents] = useState([])
  const [burnEvents, setBurnEvents] = useState([])
  const [ownerTransferEvents, setOwnerTransferEvents] = useState([])
  const [tabValue, setTabValue] = useState('1')

  const [currentPeriod, setCurrentPeriod] = useState(0)
  const [proposalEvents, setProposalEvents] = useState([])
  const [summoner, setSummoner] = useState()
  const [tokenName, setTokenName] = useState()
  const [guildBalance, setGuildBalance] = useState()
  const [escrowBalance, setEscrowBalance] = useState()
  const [initSettings, setInitSettings] = useState()
  const [depositToken, setDepositToken] = useState('')
  const [memberStatus, setMemberStatus] = useState()
  const [userBalance, setUserBalance] = useState()
  const [memberInfo, setMemberInfo] = useState()
  const [proposalDeposit, setProposalDeposit] = useState()


  

  function handleInitChange(newState) {
    setInit(newState)
  }

  function handleSummonerChange(newSummoner) {
    setSummoner(newSummoner)
  }

  async function handleSupplyChange() {
    try {
    let currentSupply = await window.contract.get_total_supply()
    setTotalSupply(currentSupply)
    return true
    } catch (err) {
    return false
    }
  }

  async function handleTransferEventChange() {
    try {
      let currentTransferEvents = await window.contract.getAllTransferEvents()
      if(currentTransferEvents){
        setTransferEvents(currentTransferEvents)
      }
      return true
    } catch (err) {
      return false
    }
  }

  async function handleProposalEventChange() {
    try {
      let currentProposalEvents = await window.contract.getAllFundingRequestEvents()
      if(currentProposalEvents){
        setProposalEvents(currentProposalEvents)
      }
      return true
    } catch (err) {
      return false
    }
  }

  async function handleGuildBalanceChanges() {
    try {
      let currentGuildBalance = await window.contract.getGuildTokenBalances()
      if(currentGuildBalance) {
        setGuildBalance(currentGuildBalance)
      }
      return true
    } catch (err) {
      return false
    }
  }

  async function handleEscrowBalanceChanges() {
    try {
      let currentEscrowBalance = await window.contract.getEscrowTokenBalances()
      if(currentEscrowBalance) {
        setEscrowBalance(currentEscrowBalance)
      }
      return true
    } catch (err) {
      return false
    }
  }

  function handleTabValueState(value) {
    setTabValue(value)
  }

  // The useEffect hook can be used to fire side-effects during render
  // Learn more: https://reactjs.org/docs/hooks-intro.html
  useEffect(
      () => {
      // in this case, we only care to query the contract when signed in
      if (window.walletConnection.isSignedIn()) {
        setLoginState(true)
        setAccountId(window.accountId)
      
        
        async function fetchData() {
          try {
          // retrieve  Name and set state
         
            try {
              let result = await window.contract.getMemberStatus({member: window.accountId})
              setMemberStatus(result)
              let token = await window.contract.getDepositToken()
              setDepositToken(token)
              console.log('is deposit token here ', depositToken)
              let deposit = await window.contract.getProposalDeposit()
              setProposalDeposit(deposit)
              console.log('proposal deposit ', proposalDeposit)
              let result1 = await window.contract.getUserTokenBalance({user: window.accountId, token: depositToken})
              setUserBalance(result1)
              console.log('user balance ', userBalance)
              let result2 = await window.contract.getMemberInfo({member: window.accountId})
              setMemberInfo(result2)
              console.log('member Info', memberInfo)
              
              // window.contract is set in utils.js after being called by initContract in index.js
              if(!tokenName) {
            //  let name = initialized ? await window.contract.getTokenName({}, BOATLOAD_OF_GAS) : null
              let name = initialized ? 'VPC' : null
                if (name) {
                  setTokenName(name)
                } else {
                  return false
                }
              }
            } catch (err) {
              console.log(err)
              console.log('token name not set yet')
              return false
            }
          
            

         
          // // retrieve Token Symbol and set state
          // try {
          //   let symbol = await window.contract.getTokenSymbol()
          //   setTokenSymbol(symbol)
          // } catch (err) {
          //   console.log('token symbol not set yet')
          //   return false
          // }

          // // retrieve Token Precision and set state
          // try {
          //   let decimals = await window.contract.getPrecision()
          //   setPrecision(decimals)
          // } catch (err) {
          //   console.log('precision not set yet')
          //   return false
          // }

          // // retrieve Initial Supply and set state
          // try {
          //   let startSupply = await window.contract.getInitialSupply()
          //   setInitialSupply(startSupply)
          // } catch (err) {
          //   console.log('initial supply not set yet')
          //   return false
          // }

          // // retrieve current Total Supply and set state
          // try {
          //   let currentSupply = await window.contract.get_total_supply()
          //   setTotalSupply(currentSupply)
          // } catch (err) {
          //   console.log('total supply not set yet')
          //   return false
          // }

           // retrieve current token owner and set state
           try {
            let owner = await window.contract.getSummoner()
            setSummoner(owner)
          } catch (err) {
            console.log('no summoner yet')
            return false
          }
          
        
          } catch (err) {
            setDone(false)
            return false
          }
          return true
        }
        fetchData()
          .then((res) => {
            console.log('res', res)
            res ? setInit(true) : setInit(false)
            setDone(true)
          })

        // async function fetchTransferData() {
        //   try {
        //     let transfers = await window.contract.getAllTransferEvents()
        //     console.log('transfers', transfers)
        //     if(transfers.length != 0) {
        //       setTransferEvents(transfers)
        //     }
        //   } catch (err) {
        //     console.log('error retrieving transfers')
        //     return false
        //   }
        // }
        
        // fetchTransferData()
        //   .then((res) => {
        //     console.log('transfer records exist', res)
        //   })

        async function fetchEscrowBalances() {
          try {
           // window.contract is set in utils.js after being called by initContract in index.js
           let balance = await window.contract.getEscrowTokenBalances()
            setEscrowBalance(balance)
            console.log('escrow balance', escrowBalance)
         } catch (err) {
           console.log('no escrow balance')
           return false
         }
       }

       fetchEscrowBalances()
       .then((res) => {
         console.log('escrow balances exist', res)
       })

        async function fetchGuildBalances() {
          try {
           // window.contract is set in utils.js after being called by initContract in index.js
           console.log('is it here')
           let balance = await window.contract.getGuildTokenBalances()
           console.log('balance here', balance)
           setGuildBalance(balance)
           console.log('guild balance', guildBalance)
         } catch (err) {
           console.log('no guild balance')
           return false
         }
       }

       fetchGuildBalances()
       .then((res) => {
         console.log('guild balances exist', res)
       })

        async function fetchProposalData() {
          try {
            let requests = await window.contract.getAllFundingRequestEvents()
            console.log('proposals ', requests)
            if(requests.length != 0) {
              setProposalEvents(requests)
            }
          } catch (err) {
            console.log('error retrieving proposal events')
            return false
          }
         }
        
         fetchProposalData()
           .then((res) => {
             console.log('proposal events exist', res)
           })
        
        async function fetchInitSettings() {
          try {
            let settings = await window.contract.getInitSettings()
            console.log('settings ', settings)
            setInitSettings(settings)
            console.log('init settings app', initSettings)
          } catch (err) {
            console.log('problem retrieving init settings')
            return false
          }
        }

        if(initialized) {
        fetchInitSettings()
        .then((res) => {
          console.log('init settings exist', res)
        })
        }
     

     
        // async function fetchBurnData() {
        //   try {
        //     let burns = await window.contract.getAllBurnEvents()
        //     console.log('burns', burns)
        //     if(burns.length != 0) {
        //       setBurnEvents(burns)
        //     }
        //   } catch (err) {
        //     console.log('error retrieving burn events')
        //     return false
        //   }
        // }
        
        // fetchBurnData()
        //   .then((res) => {
        //     console.log('burn records exist', res)
        //   })

        // async function fetchOwnerTransferData() {
        //   try {
        //     let ots = await window.contract.getAllOwnerTransferEvents()
        //     console.log('ownership transfers', ots)
        //     if(ots.length != 0) {
        //       setOwnerTransferEvents(ots)
        //     }
        //   } catch (err) {
        //     console.log('error retrieving ownership transfer events')
        //     return false
        //   }
        // }
        
        // fetchOwnerTransferData()
        //   .then((res) => {
        //     console.log('owner transfer records exist', res)
        //   })
      }
    },

    // The second argument to useEffect tells React when to re-run the effect
    // it compares current value and if different - re-renders
    [initialized]
  )

  // if not signed in, return early with sign-in component
  if (!window.walletConnection.isSignedIn()) {
    return (<SignIn />)
  }

 


  async function poll() {
    const latestHash = (await window.near.connection.provider.status()).sync_info.latest_block_hash;
      console.log('latest Hash', latestHash)
    const latestBlock = await near.connection.provider.block(latestHash);
    console.log('latestBlock', latestBlock)

    let startBlockId = await latestBlock.header.hash
    console.log('start block Id', startBlockId)
    let stopBlockId = 1
    let i = 0
    let currentBlockId = startBlockId
    let currentBlock = latestBlock
    while(currentBlockId != stopBlockId) {
      currentBlock = await near.connection.provider.block(currentBlockId)
      console.log('current block id', currentBlockId)
      const changes = await fetch('https://rpc.testnet.near.org', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "icare",
          method: "EXPERIMENTAL_changes",
          params: {
            "block_id": currentBlockId,
            "changes_type": "data_changes",
            "account_ids": ["vpc.vitalpointai.testnet"],
            "key_prefix_base64": "U1RBVEU="
          },
        })
      })
      const jsonChanges = await changes.json()
      console.log('aloha jsonChanges', jsonChanges)
      const onlyChanges = jsonChanges.result.changes.map(c => c.change.value_base64)
      console.log('onlyChanges', onlyChanges)
      currentBlockId = await currentBlock.header.prev_hash
    }
  }
  async function getCurrentPeriod() {
    let period = await window.contract.getCurrentPeriod()
 //   console.log(period)
    setCurrentPeriod(period)
  }

  window.setInterval(getCurrentPeriod, 1000)

  //window.setInterval(poll, 2000)

  // if not done loading all the data, show a progress bar, otherwise show the content
  if(!done) {
    return <LinearProgress />
  } else {
    if(!initialized) {
      return (
        <Initialize
          accountId={accountId}
          done={done} 
          handleInitChange={handleInitChange} 
          initialized={initialized}
        />
      )
    } else {
      return (
        <TokenData
          handleSummonerChange={handleSummonerChange}
          handleSupplyChange={handleSupplyChange}
          handleTransferEventChange={handleTransferEventChange}
         
        
          tokenSymbol={tokenSymbol}
          currentSupply={totalSupply}
          initialSupply={initialSupply}
          tokenOwner={tokenOwner}
          done={done}
          transferEvents={transferEvents}
          mintEvents={mintEvents}
          burnEvents={burnEvents}
          ownerTransferEvents={ownerTransferEvents}
          guildBalance={guildBalance}
          escrowBalance={escrowBalance}
          tabValue={tabValue}

          handleTabValueState={handleTabValueState}
          accountId={accountId}
          userBalance={userBalance}
          handleProposalEventChange={handleProposalEventChange}
          handleEscrowBalanceChanges={handleEscrowBalanceChanges}
          handleGuildBalanceChanges={handleGuildBalanceChanges}
          currentPeriod={currentPeriod}
          memberStatus={memberStatus}
          tokenName={tokenName} 
          proposalEvents={proposalEvents}
          depositToken={depositToken}
          proposalDeposit={proposalDeposit}
          summoner={summoner}

          />
      )
    }
  }
}
