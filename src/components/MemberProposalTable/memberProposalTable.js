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

export default function MemberProposalTable(props) {
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(5)
    const [proposalList, setProposalList] = useState([])
    const classes = useStyles()
    
    const { memberProposalList, eventCount, matches, accountId, loaded } = props
    console.log('account Id ', accountId)
    console.log('this memberProposalList ', memberProposalList)
    console.log(' memberProposalList length', memberProposalList.length)
    console.log('eventcount ', eventCount)

    useEffect(() => {
        async function fetchData() {
            let newList = await resolveStatus(memberProposalList)
            setProposalList(newList)
        }
       
        fetchData()
          .then((res) => {
            console.log('res', res)
          })
        
       
    },[memberProposalList])

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    async function handleSponsorAction(proposalIdentifier) {
        await window.contract.sponsorProposal({
            proposalIdentifier: proposalIdentifier
            }, process.env.DEFAULT_GAS_VALUE)
      };

    async function handleProcessAction(proposalIdentifier) {
    await window.contract.processProposal({
        proposalIdentifier: proposalIdentifier
        }, process.env.DEFAULT_GAS_VALUE)
    };

    async function handleCancelAction(proposalIdentifier) {
        await window.contract.cancelProposal({
            proposalIdentifier: proposalIdentifier
            }, process.env.DEFAULT_GAS_VALUE)
        };

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

    async function getVotingPeriod(proposalIdentifier) {
        return await window.contract.isVotingPeriod({proposalIdentifier: proposalIdentifier})
     }

     async function getGracePeriod(proposalIdentifier) {
        return await window.contract.isGracePeriod({proposalIdentifier: proposalIdentifier})
     }
 

     async function getUserVote(proposalIdentifier) {
        let result = await window.contract.getMemberProposalVote({memberAddress: accountId, proposalIdentifier: proposalIdentifier})
        if(result == 'no vote yet') {
            return false
        } else {
            return true
        }
     }
    

    async function resolveStatus(requests) {
        let status
        let votingPeriod
        let gracePeriod
        let userVote
        console.log('funding request list here now ', requests)
        for(let i = 0; i < requests.length; i++) {
            status = await getStatus(requests[i][0].requestId)
            votingPeriod = await getVotingPeriod(requests[i][0].requestId)
            gracePeriod = await getGracePeriod(requests[i][0].requestId)
            if(status != 'Submitted') {
                userVote = await getUserVote(requests[i][0].requestId)
            } else {
                userVote = true
            }
            console.log('status ', status)
            requests[i].push({status: status, votingPeriod: votingPeriod, gracePeriod: gracePeriod, userVote: userVote})
            console.log('frl ', requests)
        }
        return requests
    }

   
    return (
        <>
        
        <TableContainer component={Paper}>
            <Table className={classes.table} size="small" aria-label="a dense table">
                <TableHead>
                <TableRow>
                    <TableCell className={classes.cell}>BlockIndex</TableCell>
                    <TableCell className={classes.cell} align="center">Status</TableCell>
                    <TableCell className={classes.cell} align="center">Applicant</TableCell>
                    <TableCell className={classes.cell} align="center">Shares Requested</TableCell>
                    <TableCell className={classes.cell} align="center">Tribute</TableCell>
                    <TableCell className={classes.cell} align="center">Identifier</TableCell>
                    <TableCell className={classes.cell} align="center"></TableCell>
                  
                    <TableCell className={classes.cell} align="center"></TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
              
                {(rowsPerPage > 0 
                    ? proposalList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) 
                    : proposalList
                    ).map((row) => (
                        <TableRow key={row[0].requestId}>
                        <TableCell className={classes.cell} component="th" scope="row" size='small' align="left">
                            <div className={classes.cellText}>{row[0].blockIndex}</div>
                        </TableCell>
                        <TableCell className={classes.cell} align="center"><div className={classes.cellText}>{row[1].status}</div></TableCell>
                        <TableCell className={classes.cell} align="center"><div className={classes.cellText}>{row[0].applicant}</div></TableCell>
                        <TableCell className={classes.cell} align="center"><div className={classes.cellText}>{row[0].shares}</div></TableCell>
                        <TableCell className={classes.cell} align="center"><div className={classes.cellText}>{row[0].tribute}</div></TableCell>
                        <TableCell className={classes.cell} align="center"><div className={classes.cellText}>{row[0].requestId}</div></TableCell>
                        <TableCell className={classes.cell} align="center"><div className={classes.cellText}>
                        {row[1].status == 'Submitted' && accountId == row[0].proposer ? 'Awaiting Sponsorship' : null}
                        {accountId != row[0].proposer && row[1].status=='Submitted' ? <Button variant="contained" color="primary" onClick={(e) => handleSponsorAction(row[0].requestId, e)}>Sponsor</Button> : null}
                        {row[1].status == 'Sponsored' && row[1].votingPeriod == true ? <ButtonGroup><Button variant="contained" disabled={row[1].userVote} color="primary" startIcon={<ThumbUpAlt />} onClick={(e) => handleYesVotingAction(row[0].requestId, e)}>Yes</Button> <Button variant="contained" disabled={row[1].userVote} color="secondary" startIcon={<ThumbDownAlt />} onClick={(e) => handleNoVotingAction(row[0].requestId, e)}>No</Button> <Button variant="contained" disabled={row[1].userVote} color="secondary" startIcon={<ThumbDownAlt />} onClick={(e) => handleAbstainVotingAction(row[0].requestId, e)}>Abstain</Button></ButtonGroup> : null }
                        {row[1].status == 'Sponsored' && row[1].gracePeriod == true ? 'Grace' : null } 
                        {accountId != row[0].proposer && row[1].status == 'Sponsored' && row[1].votingPeriod == false && row[1].gracePeriod == false ? <Button variant="contained" color="primary" onClick={(e) => handleProcessAction(row[0].requestId, e)}>Process</Button> : null}
                        {accountId == row[0].proposer && row[1].status == 'Sponsored' ? 'Awaiting Processing' : null }
                        {row[1].status == 'Not Passed' || row[1].status == 'Passed' ? 'Finalized' : null}
                        </div></TableCell>
                       
                            {accountId == row[0].proposer && row[1].status=='Submitted' ? <TableCell className={classes.cell} align="center"><div className={classes.cellText}><Button variant="contained" color="primary" onClick={(e) => handleCancelAction(row[0].requestId, e)}>Cancel</Button> </div></TableCell>: <TableCell className={classes.cell} align="center"><div className={classes.cellText}>N/A</div></TableCell> } 
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