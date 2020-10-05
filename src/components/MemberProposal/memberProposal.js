import React, { useState, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { makeStyles } from '@material-ui/core/styles'
import Big from 'big.js'

// Material UI components
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import LinearProgress from '@material-ui/core/LinearProgress'
import Stepper from '@material-ui/core/Stepper'
import Step from '@material-ui/core/Step'
import StepLabel from '@material-ui/core/StepLabel'
import StepContent from '@material-ui/core/StepContent'
import Typography from '@material-ui/core/Typography'
import InputAdornment from '@material-ui/core/InputAdornment'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import Chip from '@material-ui/core/Chip'
import Paper from '@material-ui/core/Paper'

const BOATLOAD_OF_GAS = Big(3).times(10 ** 14).toFixed()


const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    margin: 'auto',
    maxWidth: 325,
    minWidth: 325,
  },
  card: {
    margin: 'auto',
  },
  progress: {
    width: '100%',
    '& > * + *': {
      marginTop: theme.spacing(2),
    },
  },
  actionsContainer: {
    marginBottom: theme.spacing(2),
  },
  resetContainer: {
    padding: theme.spacing(3),
  },
  }));

export default function MemberProposal(props) {
  const [open, setOpen] = useState(true)
  const [finished, setFinished] = useState(true)
  const [applicant, setApplicant] = useState(props.accountId)
  const [shares, setShares] = useState('')
  const [tribute, setTribute] = useState('')
  const [proposalIdentifier, setProposalIdentifier] = useState('')
  

  const classes = useStyles()
  const { register, handleSubmit, watch, errors } = useForm()
  const { handleMemberProposalClickState, 
    handleProposalEventChange,
    handleGuildBalanceChanges,
    handleEscrowBalanceChanges,
    tokenName, 
    minSharePrice, 
    depositToken } = props
console.log('depositToken ', depositToken)
  const handleClickOpen = () => {
    setOpen(true)
  };

  const handleClose = () => {
    handleMemberProposalClickState(false)
    setOpen(false)
  };

  const handleSharesRequestedChange = (event) => {
    setShares(event.target.value.toString());
  };

  const handleTributeChange = (event) => {
    setTribute(event.target.value.toString());
  };

  async function generateId() {
    let buf = Math.random([0, 999999999]);
    let b64 = btoa(buf);
    console.log('b64', b64)
    return b64.toString()
  }

  const onSubmit = async (values) => {
    event.preventDefault()
    let id = await generateId()
    console.log('id sub ', id.substr(0,12))
    setFinished(false)
    
    let finished = await window.contract.submitProposal({
                    proposalIdentifier: id.substr(0,12),
                    applicant: applicant,
                    sharesRequested: shares,
                    lootRequested: '0',
                    tributeOffered: tribute,
                    tributeToken: depositToken,
                    paymentRequested: '0',
                    paymentToken: depositToken
                    }, process.env.DEFAULT_GAS_VALUE)
    let changed = await handleProposalEventChange()
    if(finished && changed) {
      setFinished(true)
      setOpen(false)
      handleMemberProposalClickState(false)
    }
}

  return (
    <div>
     
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Membership Proposal</DialogTitle>
        <DialogContent>
        {!finished ? <LinearProgress className={classes.progress} /> : (
            <DialogContentText style={{marginBottom: 10}}>
            Submit membership proposal for:
            </DialogContentText>)}
            <Typography component="h5" style={{marginBottom: 20}}>{applicant}</Typography>
              <div>
                <TextField
                    autoFocus
                    margin="dense"
                    id="membership-proposal-sharesRequested"
                    variant="outlined"
                    name="sharesRequested"
                    label="Shares Requested"
                    placeholder="10"
                    value={shares}
                    onChange={handleSharesRequestedChange}
                    inputRef={register({
                        required: true,
                        min: 1,
                        max: 10
                        
                    })}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">Shares</InputAdornment>,
                    }}
                />
              {errors.sharesRequested && <p style={{color: 'red'}}>You must provide a number between 1 and 10.</p>}
            </div><div>
            <TextField
              margin="dense"
              id="member-proposal-tribute"
              variant="outlined"
              name="memberTribute"
              label="Tribute"
              placeholder="1"
              value={tribute}
              onChange={handleTributeChange}
              inputRef={register({
                  required: true,
                  min: {minSharePrice}
              })}
              InputProps={{
                endAdornment: <InputAdornment position="end">{tokenName}</InputAdornment>,
                }}
              />
              {errors.memberTribute && <p style={{color: 'red'}}>You must enter a value greater than {minSharePrice}.</p>}
              </div>
          </DialogContent>
        <DialogActions>
        <Button onClick={handleSubmit(onSubmit)} color="primary" type="submit">
            Submit Proposal
          </Button>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
