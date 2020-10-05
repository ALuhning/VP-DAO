import React, { useState, useEffect } from 'react'
import TransferTable from '../TransferTable/transferTable'
import ProposalsTable from '../ProposalsTable/proposalsTable'
import VotingListTable from '../votingTable/votingTable'
import QueueTable from '../QueueTable/queueTable'
import ProcessedTable from '../ProcessedTable/processedTable'
import BurnTable from '../BurnTable/burnTable'
import OwnerTransferTable from '../OwnershipTransferTable/ownerTransferTable'
import BalanceChart from '../BalanceGraphs/balanceGraph'
import DistributionGraph from '../DistributionGraph/distributionGraph'

// Material UI Components
import { makeStyles, useTheme } from '@material-ui/core/styles'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import TabContext from '@material-ui/lab/TabContext'
import Tab from '@material-ui/core/Tab'
import TabList from '@material-ui/lab/TabList'
import TabPanel from '@material-ui/lab/TabPanel'
import AppBar from '@material-ui/core/AppBar'
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles({
  appBar: {
      font: '70%'
  }
});

export default function TransferList(props) {
  const[loaded, setLoaded] = useState(false)
  const[proposalCount, setProposalCount] = useState(0)
  const[votingCount, setVotingCount] = useState(0)
  const[queueCount, setQueueCount] = useState(0)
  const[processCount, setProcessCount] = useState(0)
  const[fundingRequestCount, setFundingRequestCount] = useState(1)

  const classes = useStyles()
  const theme = useTheme()
  const matches = useMediaQuery(theme.breakpoints.only('xs'))
  const { transferEvents, 
    mintEvents,
    burnEvents,
    ownerTransferEvents,
    tokenOwner, 
    accountId, 
    initialSupply, 
    accountBalance,
    tabValue,
    handleTabValueState,
    handleProposalEventChange,
    handleGuildBalanceChanges,
    handleEscrowBalanceChanges,
    proposalEvents,
    memberStatus,
    depositToken,
    proposalDeposit
  } = props

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  function handleProposalCountChange(newCount) {
    setProposalCount(newCount)
  }

  function handleVotingCountChange(newCount) {
    setVotingCount(newCount)
  }

  function handleProcessCountChange(newCount) {
    setProcessCount(newCount)
  }

  function handleQueueCountChange(newCount) {
    setQueueCount(newCount)
  }

  const handleChangeRowsPerPage = (event) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
  };

  const handleTabChange = (event, newValue) => {
      handleTabValueState(newValue);
  };



  
  let allProposalsList = []
  let votingList = []
  let whiteListProposalList = []
  let guildKickProposalList = []
  let memberProposalList = []

      if (proposalEvents.length > 0) {
        proposalEvents.map((fr, i) => {
              
                allProposalsList.push([{blockIndex: fr.proposalSubmission, applicant: fr.applicant, proposer: fr.delegateKey, requestId: fr.proposalIdentifier, shares: fr.sharesRequested, loot: fr.lootRequested, tribute: fr.tributeOffered}])
                
                
    //          } else if (fr.flags[5]) {
    //            
    //            guildKickProposalList.push([{blockIndex: fr.proposalSubmission, memberToKick: fr.applicant, proposer: fr.delegateKey}])
     //           
    //          } else if (fr.flags[6]) {
    //            memberProposalList.push([{blockIndex: fr.proposalSubmission, applicant: fr.applicant, proposer: fr.delegateKey, shares: fr.sharesRequested, tribute: fr.tributeOffered, requestId: fr.proposalIdentifier}])
              

          })
        
      }
  

     

  let transferList = []
  let runningBalance = 0
  let mintRunningBalance = 0
  let burnRunningBalance = 0
  let accountBalanceGraphData = []
  let mintBalanceGraphData = []
  let burnBalanceGraphData = []

  if(tokenOwner == accountId) {
    runningBalance = parseInt(initialSupply)
  } else {
    runningBalance = parseInt(accountBalance)
  }

  if (transferEvents.length > 0) {
        transferEvents.map(transfer => {
          if(accountId != tokenOwner) {
              if (transfer.to == accountId || transfer.from == accountId) {
              transferList.push([{id: transfer.id, spender: transfer.spender, from: transfer.from, to: transfer.to, value: transfer.value, date: transfer.date, runningBalance: runningBalance.toString()}])
              accountBalanceGraphData.push([transfer.id, parseInt(runningBalance)])
              if(transfer.to != accountId) {
                runningBalance += parseInt(transfer.value)
              } else {
                runningBalance -= parseInt(transfer.value)
              }
            } 
            } else {
              transferList.push([{id: transfer.id, spender: transfer.spender, from: transfer.from, to: transfer.to, value: transfer.value, date: transfer.date}])
            }
        })
  }

  const uniqueAccounts = [[0,1]]
  const revList = transferList.reverse()
  const map = new Map();
  for (const item of revList) {
      if(!map.has(item[0].to)){
          map.set(item[0].to, true);    // set any value to Map
          if(item[0].to != '0x0') {  // don't include the token account
          uniqueAccounts.push([parseInt(item[0].date), uniqueAccounts.length+1]);
          console.log('uniqueaccounts', uniqueAccounts)
          }
      }
  }
  
  let mintList = []

  if (mintEvents.length > 0) {
    mintEvents.map(mint => {
        mintRunningBalance += parseInt(mint.value)
        mintList.push([{id: mint.id, owner: mint.owner, value: mint.value, date: mint.date, mintRunningBalance: mintRunningBalance}])
        mintBalanceGraphData.push([mintList.length, parseInt(mintRunningBalance)])
        console.log('mint graph data', mintBalanceGraphData)
       
    })
  }

  let burnList = []

  if (burnEvents.length > 0) {
    burnEvents.map(burn => {
        burnRunningBalance += parseInt(burn.value)
        burnList.push([{id: burn.id, owner: burn.owner, value: burn.value, date: burn.date, burnRunningBalance: burnRunningBalance}])
        burnBalanceGraphData.push([burnList.length, parseInt(burnRunningBalance)])
        console.log('burn graph data', burnBalanceGraphData)
        
    })
  }

  let otList = []

  if (ownerTransferEvents.length > 0) {
    ownerTransferEvents.map(ot => {
        otList.push([{id: ot.id, owner: ot.owner, newOwner: ot.newOwner, date: ot.date}])        
    })
  }

  const proposalTabLabel = 'Proposals ('+ proposalCount + ')'
  const votingTabLabel = 'Voting (' + votingCount + ')'
  const queueLabel = 'Queued (' + queueCount + ')'
  const processedLabel = 'Processed (' + processCount +')'
  
  return (
    <>
    
    {tokenOwner != accountId && tabValue == 1 && transferList.length > 0 ? <><Typography variant="button" display="block">Account Balance</Typography><BalanceChart graphData={accountBalanceGraphData} /></> : null }
    {tokenOwner == accountId && tabValue == 1 && uniqueAccounts.length > 0 ? <><Typography variant="button" display="block"># Unique Accounts</Typography><DistributionGraph graphData={uniqueAccounts} /></> : null }
    {tokenOwner == accountId && tabValue == 2 && mintList.length > 0 ? <><Typography variant="button" display="block">Total Minted</Typography><BalanceChart graphData={mintBalanceGraphData} /> </>: null }
    {tokenOwner == accountId && tabValue == 3 && burnList.length > 0 ? <><Typography variant="button" display="block">Total Burned</Typography><BalanceChart graphData={burnBalanceGraphData} /> </>: null }

    {tokenOwner==accountId
      ?
      ( <TabContext value={tabValue}>
        <AppBar position="static">
      {!matches 
        ? <TabList onChange={handleTabChange} aria-label="simple tabs example" variant="fullWidth">
            <Tab className="appBar" label={proposalTabLabel} value="1" />
            <Tab label={votingTabLabel} value="2"/>
            <Tab label={queueLabel} value="3" />
            <Tab label={processedLabel} value="4" />
           
          </TabList>
        : <TabList onChange={handleTabChange} aria-label="simple tabs example">
            <Tab className="appBar" label={proposalTabLabel} value="1" />
            <Tab label={votingTabLabel} value="2"/>
            <Tab label={queueLabel} value="3" />
            <Tab label={processedLabel} value="4" />
           
          </TabList>
      }
      </AppBar>
      <TabPanel value="1">{(allProposalsList.length > 0 ? <ProposalsTable 
        loaded={loaded} 
        allProposalsList={allProposalsList} 
        eventCount={allProposalsList.length} 
        matches={matches} 
        tokenOwner={tokenOwner} 
        accountId={accountId}
        depositToken={depositToken}
        proposalDeposit={proposalDeposit}
        memberStatus={memberStatus}
        handleProposalCountChange={handleProposalCountChange}
        handleProposalEventChange={handleProposalEventChange}
        handleGuildBalanceChanges={handleGuildBalanceChanges}
        handleEscrowBalanceChanges={handleEscrowBalanceChanges}
        /> : <div style={{marginTop: 10, marginBottom: 10}}>No Proposals</div>)}</TabPanel>
      <TabPanel value="2">{(allProposalsList.length > 0 ? <VotingTable 
        allProposalsList={allProposalsList} 
        eventCount={allProposalsList.length}  
        matches={matches} 
        accountId={accountId} 
        memberStatus={memberStatus}
        depositToken={depositToken}
        proposalDeposit={proposalDeposit}
        handleVotingCountChange={handleVotingCountChange}
        handleProposalEventChange={handleProposalEventChange}
        handleGuildBalanceChanges={handleGuildBalanceChanges}
        handleEscrowBalanceChanges={handleEscrowBalanceChanges}
        /> : <div style={{marginTop: 10, marginBottom: 10}}>No Proposals Ready for Voting</div>)}</TabPanel>
      <TabPanel value="3">{(allProposalsList.length > 0 ? <QueueTable 
        allProposalsList={allProposalsList} 
        eventCount={allProposalsList.length} 
        matches={matches} 
        accountId={accountId}
        memberStatus={memberStatus} 
        depositToken={depositToken}
        proposalDeposit={proposalDeposit}
        handleQueueCountChange={handleQueueCountChange}
        handleProposalEventChange={handleProposalEventChange}
        handleGuildBalanceChanges={handleGuildBalanceChanges}
        handleEscrowBalanceChanges={handleEscrowBalanceChanges}
        /> : <div style={{marginTop: 10, marginBottom: 10}}>No Queued Proposals</div>)}</TabPanel>
      <TabPanel value="4">{(allProposalsList.length > 0 ? <ProcessedTable 
        allProposalsList={allProposalsList} 
        eventCount={allProposalsList.length} 
        matches={matches} 
        accountId={accountId}
        memberStatus={memberStatus}
        depositToken={depositToken}
        proposalDeposit={proposalDeposit}
        handleProcessCountChange={handleProcessCountChange}
        handleProposalEventChange={handleProposalEventChange}
        handleGuildBalanceChanges={handleGuildBalanceChanges}
        handleEscrowBalanceChanges={handleEscrowBalanceChanges}
        /> : <div style={{marginTop: 10, marginBottom: 10}}>No Processed Proposals</div>)}</TabPanel>
    
    </TabContext>)
    :  (<TabContext value={tabValue}>
        <AppBar position="static">
        {!matches 
          ? <TabList onChange={handleTabChange} aria-label="simple tabs example" variant="fullWidth">
              <Tab className="appBar" label={proposalTabLabel} value="1" align="left" />
              <Tab label={votingTabLabel} value="2"/>
              <Tab label={queueLabel} value="3" />
              <Tab label={processedLabel} value="4" />
            </TabList>
          : <TabList onChange={handleTabChange} aria-label="simple tabs example">
              <Tab className="appBar" label={proposalTabLabel} value="1" />
              <Tab label={votingTabLabel} value="2"/>
              <Tab label={queueLabel} value="3" />
              <Tab label={processedLabel} value="4" />
            </TabList>
        }
    </AppBar>
      <TabPanel value="1">{(allProposalsList.length > 0 ? <ProposalsTable 
        allProposalsList={allProposalsList} 
        loaded={loaded} 
        eventCount={allProposalsList.length} 
        matches={matches} 
        tokenOwner={tokenOwner} 
        accountId={accountId} 
        memberStatus={memberStatus}
        depositToken={depositToken}
        proposalDeposit={proposalDeposit}
        handleProposalCountChange={handleProposalCountChange}
        handleProposalEventChange={handleProposalEventChange}
        handleGuildBalanceChanges={handleGuildBalanceChanges}
        handleEscrowBalanceChanges={handleEscrowBalanceChanges}
        /> : 'No Proposals')}</TabPanel>
      <TabPanel value="2">{(allProposalsList.length > 0 ? <VotingListTable 
        allProposalsList={allProposalsList} 
        eventCount={allProposalsList.length}  
        matches={matches} 
        accountId={accountId} 
        memberStatus={memberStatus}
        depositToken={depositToken}
        proposalDeposit={proposalDeposit}
        handleVotingCountChange={handleVotingCountChange}
        handleProposalEventChange={handleProposalEventChange}
        handleGuildBalanceChanges={handleGuildBalanceChanges}
        handleEscrowBalanceChanges={handleEscrowBalanceChanges}
        /> : <div style={{marginTop: 10, marginBottom: 10}}>No Proposals Ready for Voting</div>)}</TabPanel>
      <TabPanel value="3">{(allProposalsList.length > 0 ? <QueueTable 
        allProposalsList={allProposalsList} 
        eventCount={allProposalsList.length} 
        matches={matches} 
        accountId={accountId}
        memberStatus={memberStatus}
        depositToken={depositToken}
        proposalDeposit={proposalDeposit}
        handleQueueCountChange={handleQueueCountChange}
        handleProposalEventChange={handleProposalEventChange}
        handleGuildBalanceChanges={handleGuildBalanceChanges}
        handleEscrowBalanceChanges={handleEscrowBalanceChanges}
        /> : <div style={{marginTop: 10, marginBottom: 10}}>No Guild Kick Proposals</div>)}</TabPanel>
      <TabPanel value="4">{(allProposalsList.length > 0 ? <ProcessedTable 
        allProposalsList={allProposalsList} 
        eventCount={allProposalsList.length} 
        matches={matches} 
        accountId={accountId}
        memberStatus={memberStatus}
        depositToken={depositToken}
        proposalDeposit={proposalDeposit}
        handleProcessCountChange={handleProcessCountChange}
        handleProposalEventChange={handleProposalEventChange}
        handleGuildBalanceChanges={handleGuildBalanceChanges}
        handleEscrowBalanceChanges={handleEscrowBalanceChanges}
        /> : <div style={{marginTop: 10, marginBottom: 10}}>No Processed Proposals</div>)}</TabPanel>
      </TabContext>) 
  }

    </>
  )
}