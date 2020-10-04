import React, { useState, useEffect } from 'react'
import { Redirect } from 'react-dom'
import { makeStyles } from '@material-ui/core/styles'
import { useForm } from 'react-hook-form'
import LogoutButton from '../../components/common/LogoutButton/logoutButton'

// Material UI components
import TextField from '@material-ui/core/TextField'
import InputAdornment from '@material-ui/core/InputAdornment'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import LinearProgress from '@material-ui/core/LinearProgress'
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import Card from '@material-ui/core/Card'


const useStyles = makeStyles((theme) => ({
  root: {
   
    marginTop: 50
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  customCard: {
    maxWidth: 300,
    minWidth: 275,
    margin: 'auto',
    padding: 20
  },
  rootForm: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  progress: {
    width: '100%',
    '& > * + *': {
      marginTop: theme.spacing(2),
    },
  },
  }));


export default function Initialize(props) {

    const classes = useStyles()
    const { register, handleSubmit, watch, errors } = useForm()
    const { done, handleInitChange, initialized, accountId } = props
    
    const [finished, setFinish] = useState(true)

    useEffect(
      () => {
          async function fetchInit () {
            try {
            let init = await window.contract.getInit()
            init=='done' ? handleInitChange(true) : handleInitChange(false)
            } catch (err) {
              console.log('failure fetching init')
            }
          }
          if(finished) {
            fetchInit().then((res) => {
              console.log(res)
            })
          }
      }, [initialized, finished])
  
    const onSubmit = async (values) => {
        event.preventDefault()
        setFinish(false)
        const { approvedTokens, periodDuration, votingPeriodLength, gracePeriodLength, dilutionBound, proposalDeposit, processingReward, minSharePrice } = values
        console.log('values', values)

        let arrayApprovedTokens = []
          approvedTokens.split(',').map(item => {
          arrayApprovedTokens.push(item.trim())
        })
        console.log('arrayApprovedTokens', arrayApprovedTokens)
     
        let finished = await window.contract.init({
                            _approvedTokens: arrayApprovedTokens,
                            periodDuration: parseInt(periodDuration),
                            votingPeriodLength: votingPeriodLength,
                            gracePeriodLength: gracePeriodLength,
                            proposalDeposit: proposalDeposit,
                            dilutionBound: dilutionBound,
                            processingReward: processingReward,
                            minSharePrice: parseInt(minSharePrice)
                        }, process.env.DEFAULT_GAS_VALUE)
        setFinish(finished)
    }

    if(!done || !finished) {
      return <LinearProgress className="progress"/>
    } else if (!initialized) {
      return (       
        <Grid container spacing={3}>
         <Grid item xs={12}>
           <Paper className={classes.paper}>
            <LogoutButton accountId={accountId} />
               <div className={classes.root}>
                 <Card className={classes.customCard}>
                  <Typography variant="h5" component="h1" >DAO Setup</Typography>
                  <form className={classes.rootForm} noValidate autoComplete="off" onSubmit={handleSubmit(onSubmit)}>

                    <TextField
                      id="approved-tokens"
                      variant="outlined"
                      name="approvedTokens"
                      label="Approved Tokens"
                      inputRef={register({
                          required: true,
                      })}
                      placeholder="vpc.vitalpointai.testnet"
                    />
                      
                    <TextField
                      id="period-duration"
                      variant="outlined"
                      name="periodDuration"
                      label="Period Duration"
                      required={true}
                      inputRef={register({
                          required: true
                      })}
                      placeholder="14400"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">Seconds</InputAdornment>,
                    }}
                    />

                    <TextField
                      id="voting-period-length"
                      variant="outlined"
                      name="votingPeriodLength"
                      label="Voting Period Length"
                      placeholder="42"
                      inputRef={register({
                          required: true,
                      })}
                      InputProps={{
                          endAdornment: <InputAdornment position="end">Periods</InputAdornment>,
                      }}
                    />

                    <TextField
                    id="grace-period-length"
                    variant="outlined"
                    name="gracePeriodLength"
                    label="Grace Period Length"
                    placeholder="42"
                    inputRef={register({
                        required: true, 
                    })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">Periods</InputAdornment>,
                      }}
                    />

                    <TextField
                    id="proposal-deposit"
                    variant="outlined"
                    name="proposalDeposit"
                    label="Proposal Deposit"
                    placeholder="10"
                    inputRef={register({
                        required: true, 
                    })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">Tokens</InputAdornment>,
                      }}
                    />

                    <TextField
                    id="dilution-bound"
                    variant="outlined"
                    name="dilutionBound"
                    label="Dilution Bound"
                    placeholder="3"
                    inputRef={register({
                        required: true, 
                    })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">Tokens</InputAdornment>,
                      }}
                    />

                    <TextField
                    id="processing-reward"
                    variant="outlined"
                    name="processingReward"
                    label="Processing Reward"
                    placeholder="1"
                    inputRef={register({
                        required: true, 
                    })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">Tokens</InputAdornment>,
                      }}
                    />

                    <TextField
                    id="min-share-price"
                    variant="outlined"
                    name="minSharePrice"
                    label="Minimum Share Tribute"
                    placeholder="1"
                    inputRef={register({
                        required: true,
                        min: 0
                    })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">Tokens</InputAdornment>,
                      }}
                    />

                  <Button variant="contained" color="primary" type="submit">
                        Submit
                  </Button>

                  <Button variant="contained" color="secondary" type="reset">
                        Reset
                  </Button>

                  </form>
                  </Card>
                </div>
            </Paper>
          </Grid>
        </Grid> 
    )
  } else {
    return (<Redirect to="/"/>)
  }
}