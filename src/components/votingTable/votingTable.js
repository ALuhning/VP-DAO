import React, { useState, useEffect } from 'react'

// Material UI Components
import { makeStyles } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'
import TablePagination from '@material-ui/core/TablePagination'
import Button from '@material-ui/core/Button'
import ButtonGroup from '@material-ui/core/ButtonGroup'
import ThumbDownAlt from '@material-ui/icons/ThumbDownAlt'
import ThumbUpAlt from '@material-ui/icons/ThumbUpAlt'
import Big from 'big.js'

const useStyles = makeStyles({
  table: {
  },
  cell: {
      paddingTop: 6,
      paddingBottom: 6,
      paddingLeft: 5,
      paddingRight: 0,
      maxWidth: 70,
  },
  cellText: {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%'
  }
});

const BOATLOAD_OF_GAS = Big(3).times(10 ** 14).toFixed()

export default function VotingListTable(props) {
    const [page, setPage] = useState(0)
    const [proposalList, setProposalList] = useState([])
    const [yesVotes, setYesVotes] = useState('0')
    const [noVotes, setNoVotes] = useState('0')
    const [disabled, setDisabled] = useState(false)
    const [rowsPerPage, setRowsPerPage] = useState(5)
    const classes = useStyles()
    
    const { allProposalsList, 
        eventCount, 
        matches,
        memberStatus,
        handleVotingCountChange,
        handleProposalEventChange,
        handleEscrowBalanceChanges,
        handleGuildBalanceChanges
    } = props

    useEffect(() => {
        async function fetchData() {
            let newList = await resolveStatus(allProposalsList)
            handleVotingCountChange(newList.length)
            setProposalList(newList)
        }
        if(allProposalsList.length > 0){
        fetchData()
          .then((res) => {
            console.log('res', res)
          })
        }
    },[allProposalsList])

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    async function handleYesVotingAction(proposalIdentifier) {
        await window.contract.submitVote({
            proposalIdentifier: proposalIdentifier,
            vote: 'yes'
            }, BOATLOAD_OF_GAS)
        await getUserVote(proposalIdentifier)
        await handleProposalEventChange()
           
    }

    async function handleNoVotingAction(proposalIdentifier) {
        await window.contract.submitVote({
            proposalIdentifier: proposalIdentifier,
            vote: 'no'
            }, BOATLOAD_OF_GAS)
            await getUserVote(proposalIdentifier)
            await handleProposalEventChange()
    }

    async function handleAbstainVotingAction(proposalIdentifier) {
        await window.contract.submitVote({
            proposalIdentifier: proposalIdentifier,
            vote: 'abstain'
            }, BOATLOAD_OF_GAS)
            await getUserVote(proposalIdentifier)
            await handleProposalEventChange()
    }

    async function getStatus(proposalIdentifier) {
        // flags [sponsored, processed, didPass, cancelled, whitelist, guildkick, member]
        let flags = await window.contract.getProposalFlags({proposalIdentifier: proposalIdentifier})
        console.log('flags ', flags)
        let status = ''
        if(!flags[0] && !flags[1] && !flags[2] && !flags[3]) {
        status = 'Submitted'
        }
        if(flags[0] && !flags[1] && !flags[2] && !flags[3]) {
        status = 'Sponsored'
        }
        if(flags[0] && flags[1] && !flags[2] && !flags[3]) {
        status = 'Processed'
        }
        if(flags[0] && flags[1] && flags[2] && !flags[3]) {
        status = 'Passed'
        }
        if(flags[0] && flags[1] && !flags[2] && !flags[3]) {
        status = 'Not Passed'
        }
        if(flags[3]) {
        status = 'Cancelled'
        }
        return status
    }

    async function getProposalVotes(proposalIdentifier) {
        return await window.contract.getProposalVotes({proposalIdentifier: proposalIdentifier})
    }

    async function getProposalType(proposalIdentifier) {
        // flags [sponsored, processed, didPass, cancelled, whitelist, guildkick, member]
        let flags = await window.contract.getProposalFlags({proposalIdentifier: proposalIdentifier})
        console.log('flags ', flags)
        let status = ''
        if(flags[4]) {
        status = 'Whitelist'
        }
        if(flags[5]) {
        status = 'GuildKick'
        }
        if(flags[6]) {
        status = 'Member'
        }
        if(!flags[4] && !flags[5] && !flags[6]) {
        status = 'Funding'
        }
        return status
    }

    async function getVotingPeriod(proposalIdentifier) {
        return await window.contract.isVotingPeriod({proposalIdentifier: proposalIdentifier})
     }

     async function getGracePeriod(proposalIdentifier) {
        return await window.contract.isGracePeriod({proposalIdentifier: proposalIdentifier})
     }

     async function getUserVote(proposalIdentifier) {
        let result = await window.contract.getMemberProposalVote({memberAddress: accountId, proposalIdentifier: proposalIdentifier})
        console.log('user vote result ', result)
        if(result == 'no vote yet') {
            setDisabled(false)
            return false
        } else {
            setDisabled(true)
            return true
        }
     }
    

    async function resolveStatus(requests) {
        let status
        let votingPeriod 
        let gracePeriod
        let userVote
        let proposalType
        let updated = []
        let voteCounts
        console.log('proposal list here now ', requests)
        for(let i = 0; i < requests.length; i++) {
            status = await getStatus(requests[i][0].requestId)
            votingPeriod = await getVotingPeriod(requests[i][0].requestId)
            console.log('voting period', votingPeriod)
            votingPeriod ? setDisabled(false) : setDisabled(true)
            gracePeriod = await getGracePeriod(requests[i][0].requestId)
            if(status != 'Submitted' && status != 'Cancelled' && memberStatus) {
                userVote = await getUserVote(requests[i][0].requestId)
            }
            
            console.log('disabled ', disabled)
            proposalType = await getProposalType(requests[i][0].requestId)
            console.log('proposal type ', proposalType)
            voteCounts = await getProposalVotes(requests[i][0].requestId)
            setNoVotes(voteCounts[0].no)
            setYesVotes(voteCounts[0].yes)
            console.log('voteCounts ', voteCounts)
            console.log('status ', status)
            if(status == 'Sponsored' && status != 'Processed' && status !='Passed' && status != 'Not Passed' && status != 'Cancelled' && (votingPeriod || gracePeriod)){
                updated.push({requestId: requests[i][0].requestId,
                    blockIndex: requests[i][0].blockIndex,
                    applicant: requests[i][0].applicant,
                    shares: requests[i][0].shares,
                    loot: requests[i][0].loot,
                    tribute: requests[i][0].tribute,
                    status: status, 
                    proposalType: proposalType,
                    votingPeriod: votingPeriod,
                    gracePeriod: gracePeriod,
                    yesVotes: yesVotes,
                    noVotes: noVotes
                })
                }
                console.log('frl ', updated)
            }
            return updated
    }

    return (
        <>
        
        <TableContainer component={Paper}>
        <Table className={classes.table} size="small" aria-label="a dense table">
            <TableHead>
            <TableRow>
               
                <TableCell className={classes.cell} align="center">Proposal Type</TableCell>
                
                <TableCell className={classes.cell} align="center">Applicant</TableCell>
                <TableCell className={classes.cell} align="center">Shares</TableCell>
                <TableCell className={classes.cell} align="center">Loot</TableCell>
                <TableCell className={classes.cell} align="center">Tribute</TableCell>
                <TableCell className={classes.cell} align="center">Identifier</TableCell>
                <TableCell className={classes.cell} align="center">Vote Counts</TableCell>
                <TableCell className={classes.cell} align="center"></TableCell>
             
            </TableRow>
            </TableHead>
            <TableBody>
          
            {(rowsPerPage > 0 
                ? proposalList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) 
                : proposalList
                ).map((row) => (
                   
                    <TableRow key={row.requestId}>
                  
                    <TableCell className={classes.cell} align="center"><div className={classes.cellText}>{row.proposalType}</div></TableCell>
                   
                    <TableCell className={classes.cell} align="center"><div className={classes.cellText}>{row.applicant}</div></TableCell>
                    <TableCell className={classes.cell} align="center"><div className={classes.cellText}>
                    {row.proposalType=='Member' ? row.shares : '0'}
                    </div></TableCell>
                    <TableCell className={classes.cell} align="center"><div className={classes.cellText}>
                    {row.proposalType!='Member' ? row.loot : '0'}
                    </div></TableCell>
                    <TableCell className={classes.cell} align="center"><div className={classes.cellText}>{row.tribute}</div></TableCell>
                    <TableCell className={classes.cell} align="center"><div className={classes.cellText}>{row.requestId}</div></TableCell>
                    <TableCell className={classes.cell} align="center"><div className={classes.cellText}>Yes:{yesVotes} | No:{noVotes}</div></TableCell>
                    <TableCell className={classes.cell} align="center"><div className={classes.cellText}>
                    {row.status == 'Sponsored' && row.votingPeriod == true ? <ButtonGroup disabled={disabled} orientation="vertical" aria-label="vertical contained primary button group"><Button variant="contained" color="primary" startIcon={<ThumbUpAlt />} onClick={(e) => handleYesVotingAction(row.requestId, e)}>Yes</Button> <Button variant="contained"  color="secondary" startIcon={<ThumbDownAlt />} onClick={(e) => handleNoVotingAction(row.requestId, e)}>No</Button> <Button variant="contained"  onClick={(e) => handleAbstainVotingAction(row.requestId, e)}>Abstain</Button></ButtonGroup> : null }
                    {row.status == 'Sponsored' && row.gracePeriod == true ? 'Grace' : null } 
                    </div></TableCell>
                       </TableRow>
                    
                ))}
            </TableBody>
        </Table>
    </TableContainer>
        <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={eventCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
        />
    </>
    )
}