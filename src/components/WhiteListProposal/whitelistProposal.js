import React, { useState, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { makeStyles } from '@material-ui/core/styles'

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
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import Chip from '@material-ui/core/Chip'
import Paper from '@material-ui/core/Paper'


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


export default function WhiteListProposal(props) {
  const [open, setOpen] = useState(true)
  const [finished, setFinished] = useState(true)

  const classes = useStyles()
  const { register, handleSubmit, watch, errors } = useForm()

  const { handleWhiteListClickState, accountId } = props

  const handleClickOpen = () => {
    setOpen(true)
  };

  const handleClose = () => {
    handleWhiteListClickState(false)
    setOpen(false)
  };

  async function generateId() {
    let buf = Math.random([0, 999999999]);
    let b64 = btoa(buf);
    //setProposalId(b64.toString())
  }

  const onSubmit = async (values) => {
    event.preventDefault()
    console.log(errors)
    setFinished(false)
    const { proposalIdentifier, token } = values
    console.log('values', values)
 
    let finished = await window.contract.submitWhitelistProposal({
                    tokenToWhitelist: token,
                    proposalIdentifier: proposalIdentifier
                    }, process.env.DEFAULT_GAS_VALUE)
    
    if(finished) {
      setFinished(true)
      setOpen(false)
      handleWhiteListClickState(false)
    }
}

  return (
    <div>
     
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title" className={classes.root}>
        <DialogTitle id="form-dialog-title">Propose Token to Whitelist</DialogTitle>
        <DialogContent>
        {!finished ? <LinearProgress className={classes.progress} /> : (
          <DialogContentText style={{marginBottom: 10}}>
          Enter the contract account of the token you wish to have whitelisted.
          </DialogContentText>)}
            <div>
          <TextField
            autoFocus
            margin="dense"
            id="whitelist-proposal-identifier"
            variant="outlined"
            name="proposalIdentifier"
            label="Proposal Identifier"
            placeholder="e.g. GCCX564"
            inputRef={register({
                required: true
            })}
            />
            {errors.proposalIdentifier && <p style={{color: 'red'}}>You must provide a proposal identifier.</p>}
          </div><div>
          <TextField
            margin="dense"
            id="token-proposal"
            variant="outlined"
            name="token"
            label="Token to Whitelist"
            placeholder="e.g. yourtoken.testnet"
            inputRef={register({
                required: true
            })}
            />
            {errors.token && <p style={{color: 'red'}}>You must enter a token contract account.</p>}
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
