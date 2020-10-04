import React, { useState } from 'react'

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

export default function GuildKickProposalTable(props) {
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(5)
    const classes = useStyles()
    
    const { guildKickProposalList, eventCount, matches } = props

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <>
        
        <TableContainer component={Paper}>
            <Table className={classes.table} size="small" aria-label="a dense table">
                <TableHead>
                <TableRow>
                    <TableCell className={classes.cell}>BlockIndex</TableCell>
                    <TableCell className={classes.cell} align="right">Status</TableCell>
                    <TableCell className={classes.cell} align="right">Member To Kick</TableCell>
                    <TableCell className={classes.cell} align="right">Identifier</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {(rowsPerPage > 0
                    ? guildKickProposalList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    : guildKickProposalList
                ).map((row) => (
                    <TableRow key={row[0].requestId}>
                    <TableCell className={classes.cell} component="th" scope="row" size='small' align="left">
                        <div className={classes.cellText}>{row[0].blockIndex}</div>
                    </TableCell>
                    {!row[0].status[0] && !row[0].status[1] && !row[0].status[2] && !row[0].status[3] ? <TableCell className={classes.cell} align="right"><div className={classes.cellText}>Submitted</div></TableCell> : null }
                    {row[0].status[0] && !row[0].status[1] && !row[0].status[2] && !row[0].status[3]? <TableCell className={classes.cell} align="right"><div className={classes.cellText}>Sponsored</div></TableCell> : null }
                    {row[0].status[1] && !row[0].status[2] && !row[0].status[3]? <TableCell className={classes.cell} align="right"><div className={classes.cellText}>Processed</div></TableCell> : null }
                    {row[0].status[2] && !row[0].status[3]? <TableCell className={classes.cell} align="right"><div className={classes.cellText}>Passed</div></TableCell> : null }
                    {row[0].status[3] ? <TableCell className={classes.cell} align="right"><div className={classes.cellText}>Cancelled</div></TableCell> : null }
                    <TableCell className={classes.cell} align="right"><div className={classes.cellText}>{row[0].memberToKick}</div></TableCell>
                    <TableCell className={classes.cell} align="right"><div className={classes.cellText}>{row[0].requestId}</div></TableCell>
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