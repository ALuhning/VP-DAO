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
import ThumbUpAlt from '@material-ui/icons/ThumbUpAlt'
import ThumbDownAlt from '@material-ui/icons/ThumbDownAlt'

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

export default function ProposalsTable(props) {
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(5)
    const [proposalList, setProposalList] = useState([])
    const classes = useStyles()
    
    const { allProposalsList, 
        eventCount, 
        matches, 
        accountId, 
        loaded,
        memberStatus,
        depositToken,
        proposalDeposit,
        handleProposalCountChange,
        handleProposalEventChange,
        handleEscrowBalanceChanges,
        handleGuildBalanceChanges } = props
    console.log('this allProposalsList ', allProposalsList)
    console.log(' fund request list length', allProposalsList.length)
    console.log('eventcount ', eventCount)

    useEffect(() => {
        async function fetchData() {
            let newList = await resolveStatus(allProposalsList)
            handleProposalCountChange(newList.length)
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

    async function handleSponsorAction(proposalIdentifier) {
       await window.contract.sponsorProposal({
            proposalIdentifier: proposalIdentifier,
            proposalDeposit: proposalDeposit,
            depositToken: depositToken
            }, process.env.DEFAULT_GAS_VALUE)
           await handleProposalEventChange()
           await handleEscrowBalanceChanges()
           await handleGuildBalanceChanges()
      };

    async function handleCancelAction(proposalIdentifier) {
       await window.contract.cancelProposal({
            proposalIdentifier: proposalIdentifier
            }, process.env.DEFAULT_GAS_VALUE)
            await handleProposalEventChange()
            await handleEscrowBalanceChanges()
            await handleGuildBalanceChanges()
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

    async function getProposalType(proposalIdentifier) {
        // flags [sponsored, processed, didPass, cancelled, whitelist, guildkick, member]
        let flags = await window.contract.getProposalFlags({proposalIdentifier: proposalIdentifier})
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
    

    async function resolveStatus(requests) {
        let status
        let proposalType
        let updated = []
        console.log('proposal list here now ', requests)
        for(let i = 0; i < requests.length; i++) {
            status = await getStatus(requests[i][0].requestId)
            proposalType = await getProposalType(requests[i][0].requestId)
            console.log('status ', status)
            if(status != 'Sponsored' && status != 'Processed' && status !='Passed' && status != 'Not Passed' && status != 'Cancelled'){
            updated.push({requestId: requests[i][0].requestId,
                blockIndex: requests[i][0].blockIndex,
                applicant: requests[i][0].applicant,
                shares: requests[i][0].shares,
                loot: requests[i][0].loot,
                tribute: requests[i][0].tribute,
                status: status, 
                proposalType: proposalType})
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
                    <TableCell className={classes.cell}>BlockIndex</TableCell>
                    <TableCell className={classes.cell} align="center">Proposal Type</TableCell>
                    <TableCell className={classes.cell} align="center">Status</TableCell>
                    <TableCell className={classes.cell} align="center">Applicant</TableCell>
                    <TableCell className={classes.cell} align="center">Shares</TableCell>
                    <TableCell className={classes.cell} align="center">Loot</TableCell>
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
                        <TableRow key={row.requestId}>
                        <TableCell className={classes.cell} component="th" scope="row" size='small' align="left">
                            <div className={classes.cellText}>{row.blockIndex}</div>
                        </TableCell>
                        <TableCell className={classes.cell} align="center"><div className={classes.cellText}>{row.proposalType}</div></TableCell>
                        <TableCell className={classes.cell} align="center"><div className={classes.cellText}>{row.status}</div></TableCell>
                        <TableCell className={classes.cell} align="center"><div className={classes.cellText}>{row.applicant}</div></TableCell>
                        <TableCell className={classes.cell} align="center"><div className={classes.cellText}>
                        {row.proposalType=='Member' ? row.shares : '0'}
                        </div></TableCell>
                        <TableCell className={classes.cell} align="center"><div className={classes.cellText}>
                        {row.proposalType!='Member' ? row.loot : '0'}
                        </div></TableCell>
                        <TableCell className={classes.cell} align="center"><div className={classes.cellText}>{row.tribute}</div></TableCell>
                        <TableCell className={classes.cell} align="center"><div className={classes.cellText}>{row.requestId}</div></TableCell>
                        <TableCell className={classes.cell} align="center"><div className={classes.cellText}>
                        {row.status == 'Submitted' && accountId == row.proposer ? 'Awaiting Sponsorship' : null}
                        {(accountId != row.proposer && accountId != row.applicant) && row.status=='Submitted' ? <Button variant="contained" color="primary" onClick={(e) => handleSponsorAction(row.requestId, e)}>Sponsor</Button> : null}
                        </div></TableCell>
                            {(accountId == row.proposer || accountId == row.applicant) && row.status=='Submitted' ? <TableCell className={classes.cell} align="center"><div className={classes.cellText}><Button variant="contained" color="primary" onClick={() => handleCancelAction(row.requestId)}>Cancel</Button> </div></TableCell>: <TableCell className={classes.cell} align="center"><div className={classes.cellText}>N/A</div></TableCell> } 
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