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

 


export default function FundingProposal(props) {
  const [open, setOpen] = useState(true)
  const [finished, setFinished] = useState(true)
  const [applicant, setApplicant] = useState(props.accountId)
  const [funding, setFunding] = useState('')
  const [proposalIdentifier, setProposalIdentifier] = useState('')
  const [tributeOffer, setTributeOffer] = useState('')
  const [tributeType, setTributeType] = useState('')

  const classes = useStyles()
  const { control, register, handleSubmit, watch, errors } = useForm()
  const { handleProposalEventChange,
    handleEscrowBalanceChanges,
    handleGuildBalanceChanges,
    handleFundingProposalClickState,
    depositToken,
    accountId } = props

  const [activeStep, setActiveStep] = useState(0);

  function getSteps() {
    
    return ['Funding Information', 'Tribute Information', 'Review Proposal'];
  } 
  const steps = getSteps();
  const id = generateId()

  const handleNext = () => {
    console.log(errors)
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const handleClickOpen = () => {
    setOpen(true)
  };

  const handleClose = () => {
    handleFundingProposalClickState(false)
    setOpen(false)
  };

  const handleProposalIdentifierChange = (event) => {
    setProposalIdentifier(event.target.value)
  };
  
  const handleApplicantChange = (event) => {
    setApplicant(event.target.value);
  };

  const handleFundingChange = (event) => {
    setFunding(event.target.value);
  };

  const handleTributeOfferChange = (event) => {
    setTributeOffer(event.target.value);
  };

  const handleTributeTypeChange = (event) => {
    setTributeType(event.target.value);
    console.log(tributeType)
  };

  function generateId() {
    let buf = Math.random([0, 999999999]);
    let b64 = btoa(buf);
    return b64.toString()
  }

  
  const isFundingEmpty = funding.length > 0
  const isTributeOfferEmpty = tributeOffer.length > 0
  const isTributeTypeEmpty = tributeType.length > 0

  const onSubmit = async (values) => {
    event.preventDefault()
    setProposalIdentifier(id)
    console.log(errors)
    setFinished(false)
 
    let finished = await window.contract.submitProposal({
                    proposalIdentifier: id.substr(0,12),
                    applicant: accountId,
                    sharesRequested: '0',
                    lootRequested: funding,
                    tributeOffered: tributeOffer,
                    tributeToken: tributeType,
                    paymentRequested: '0',
                    paymentToken: depositToken,
                    }, process.env.DEFAULT_GAS_VALUE)
    let changed = await handleProposalEventChange()
    await handleGuildBalanceChanges()
    await handleEscrowBalanceChanges()
    if(finished && changed) {
      setFinished(true)
      setOpen(false)
      handleFundingProposalClickState(false)
    }
}

function getStepContent(step) {
  switch (step) {
    case 0:
      
      return (
        <div>
      
          <TextField
            autoFocus = {activeStep ==1 ? true : false}
            margin="dense"
            id="funding-proposal-applicant-receiver"
            variant="outlined"
            name="fundingProposalApplicant"
            label="Applicant Account"
            value={applicant}
            onChange={handleApplicantChange}
            inputRef={register({
                required: true,
                validate: value => value != '' || <p style={{color:'red'}}>You must specify an account that will receive the funding.</p>
            })}
            placeholder={applicant}
            fullWidth
          />
        {errors.fundingProposalApplicant?.message}
      
        <TextField
          margin="dense"
          id="funding-proposal-funds-requested"
          variant="outlined"
          name="fundingProposalLoot"
          label="Funding Requested"
          value={funding}
          onChange={handleFundingChange}
          inputRef={register({
              required: true,
              validate: value => value != '' || <p style={{color:'red'}}>You must specify the amount of funding your proposal needs.</p>
          })}
          placeholder="e.g. 100000"
          fullWidth
        />
        {errors.fundingProposalLoot?.message}
      
      </div>
      )
      case 1:
        return (
          
          <div>
            <TextField
              autoFocus = {activeStep ==1 ? true : false}
              margin="dense"
              id="funding-proposal-tribute-offer"
              variant="outlined"
              name="fundingProposalTribute"
              label="Tribute Offer"
              value={tributeOffer}
              onChange={handleTributeOfferChange}
              inputRef={register({
                  required: true,
                  validate: value => value != '' || <p style={{color:'red'}}>You must specify an amount as a tribute for considering your proposal.</p>
              })}
              placeholder="e.g. 10"
              fullWidth
            />
          {errors.fundingProposalTribute?.message}
       
          <TextField
            margin="dense"
            id="funding-proposal-tribute-type"
            variant="outlined"
            name="fundingProposalTributeType"
            label="Tribute Type"
            value={tributeType}
            onChange={handleTributeTypeChange}
            inputRef={register({
                required: true,
                validate: value => value != '' || <p style={{color:'red'}}>You must specify the type of token to use for your tribute.</p>
            })}
            placeholder="e.g. vpc.vitalpointai.testnet"
            fullWidth
          />
          {errors.fundingProposalTributeType?.message}
        
        </div>
        )
    case 2:
      return (
       
          <Card className={classes.card}>
            <CardHeader title={id}/>
            <CardContent>
  
              <Typography variant="subtitle2" gutterBottom>Applicant:  <Chip label={applicant} variant="outlined"/></Typography>
              <Typography variant="subtitle2" gutterBottom>Requesting: <Chip label={funding} variant="outlined"/></Typography>
              <Typography variant="subtitle2" gutterBottom>Tribute: <Chip label={tributeOffer + ':' + tributeType} variant="outlined"/></Typography>          
            
            </CardContent>
          </Card>
       
      )
    default:
      return 'Unknown step';
  }
}



  return (
    <div>
     
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Request Funding</DialogTitle>
        <DialogContent>
        {!finished ? <LinearProgress className={classes.progress} /> : (
          <DialogContentText>
            Complete the steps to submit a request for funding proposal.  
          </DialogContentText>)} <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
          <div className={classes.root}>  
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                {getStepContent(index)}
                  <div className={classes.actionsContainer}>
                    <div>
                      <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        className={classes.button}
                      >
                        Back
                      </Button>
                      <Button
                        disabled = {
                         
                          (activeStep ===0 && isFundingEmpty=='') ||
                          (activeStep ===1 && (isTributeOfferEmpty=='' || isTributeTypeEmpty=='')) }
                        variant="contained"
                        color="primary"
                        onClick={handleNext}
                        className={classes.button}
                      >
                     
                        {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                      </Button>
                    </div>
                  </div>
                </StepContent>
              </Step>
            ))}
          </Stepper>
       
          {activeStep === steps.length && (
            <Paper square elevation={0} className={classes.resetContainer}>
              <Typography>All steps complete - submit your proposal.</Typography>
              <Button onClick={handleReset} className={classes.button}>
                Reset
              </Button>
              <Button type="submit" className={classes.button}>
                Submit Proposal
              </Button>
            </Paper>
          
          )}
        </div>
        </form>
         
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
