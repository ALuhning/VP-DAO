import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Transfer from '../Transfer/transfer'
import FundingProposal from '../FundingProposal/fundingProposal'
import WhiteListProposal from '../WhiteListProposal/whitelistProposal'
import GuildKickProposal from '../GuildKickProposal/guildKickProposal'
import MemberProposal from '../MemberProposal/memberProposal'
import Mint from '../Mint/Mint'
import Burn from '../Burn/burn'

// Material UI Components
import Accordion from '@material-ui/core/Accordion'
import AccordionSummary from '@material-ui/core/AccordionSummary'
import AccordionDetails from '@material-ui/core/AccordionDetails'
import Typography from '@material-ui/core/Typography'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import TransferWithinAStationTwoToneIcon from '@material-ui/icons/TransferWithinAStationTwoTone'
import LabelImportantIcon from '@material-ui/icons/LabelImportant'
import AddCircleIcon from '@material-ui/icons/AddCircle'
import FireplaceIcon from '@material-ui/icons/Fireplace'


const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  },
  mintButton: {

  },
}));

export default function ActionSelector(props) {
  const classes = useStyles();
  const [transferClicked, setTransferClicked] = useState(false)
  const [memberProposalClicked, setMemberProposalClicked] = useState(false)
  const [fundingProposalClicked, setFundingProposalClicked] = useState(false)
  const [whiteListClicked, setWhiteListClicked] = useState(false)
  const [guildKickClicked, setGuildKickClicked] = useState(false)
  const [expanded, setExpanded] = useState(false)
  
  const { currentSupply, 
    handleSupplyChange, 
    handleOwnerChange, 
    handleTransferEventChange,
    handleProposalEventChange,
    handleGuildBalanceChanges,
    handleEscrowBalanceChanges,
    handleTabValueState,
    tokenOwner,
    accountId,
    depositToken,
    tokenName,
    minSharePrice,
    accountBalance } = props

  const handleTransferClick = () => {
    handleExpanded()
    handleTabValueState('1')
    setTransferClicked(true)
  };

  const handleFundingProposalClick = () => {
    handleExpanded()
    handleTabValueState('1')
    setFundingProposalClicked(true)
  };

  const handleWhiteListClick = () => {
    handleExpanded()
    handleTabValueState('2')
    setWhiteListClicked(true)
  };

  const handleGuildKickClick = () => {
    handleExpanded()
    handleTabValueState('3')
    setGuildKickClicked(true)
  };

  const handleMemberProposalClick = () => {
    handleExpanded()
    handleTabValueState('1')
    setMemberProposalClicked(true)
  };

  function handleWhiteListClickState(property) {
    setWhiteListClicked(property)
  }

  function handleGuildKickClickState(property) {
    setGuildKickClicked(property)
  }

  function handleTransferClickState(property) {
    setTransferClicked(property)
  }

  function handleFundingProposalClickState(property) {
    setFundingProposalClicked(property)
  }

  function handleMemberProposalClickState(property) {
    setMemberProposalClicked(property)
  }

  function handleExpanded() {
    setExpanded(!expanded)
  }

  return (
    <>
      <Accordion onClick={handleExpanded} expanded={expanded}>
      
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"         
        >
          <Typography className={classes.heading}>Proposals</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {tokenOwner==accountId 
            ?
            ( <List component="nav" aria-label="main mailbox folders">
              <ListItem button onClick={handleMemberProposalClick}>
              <ListItemIcon><LabelImportantIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Member Proposal" />
            </ListItem>
            <ListItem button onClick={handleFundingProposalClick}>
              <ListItemIcon><TransferWithinAStationTwoToneIcon color="secondary" /></ListItemIcon>
              <ListItemText primary="Request Funding" />
            </ListItem>
            <ListItem button onClick={handleWhiteListClick}>
              <ListItemIcon><AddCircleIcon color='action' /></ListItemIcon>
              <ListItemText primary="Whitelist Token" />
            </ListItem>
            <ListItem button onClick={handleGuildKickClick}>
              <ListItemIcon><FireplaceIcon color='secondary' /></ListItemIcon>
              <ListItemText primary="Remove Member" />
            </ListItem>
            <ListItem button onClick={handleGuildKickClick}>
            <ListItemIcon><FireplaceIcon color='secondary' /></ListItemIcon>
            <ListItemText primary="Trade" />
          </ListItem>
            </List>)
          : 
          ( <List component="nav" aria-label="main mailbox folders">
              <ListItem button onClick={handleMemberProposalClick}>
              <ListItemIcon><LabelImportantIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Member Proposal" />
            </ListItem>
            <ListItem button onClick={handleFundingProposalClick}>
              <ListItemIcon><TransferWithinAStationTwoToneIcon color="secondary" /></ListItemIcon>
              <ListItemText primary="Request Funding" />
            </ListItem>
            <ListItem button onClick={handleWhiteListClick}>
              <ListItemIcon><AddCircleIcon color='action' /></ListItemIcon>
              <ListItemText primary="Whitelist Token" />
            </ListItem>
            <ListItem button onClick={handleGuildKickClick}>
              <ListItemIcon><FireplaceIcon color='secondary' /></ListItemIcon>
              <ListItemText primary="Remove Member" />
            </ListItem>
            <ListItem button onClick={handleGuildKickClick}>
            <ListItemIcon><FireplaceIcon color='secondary' /></ListItemIcon>
            <ListItemText primary="Trade" />
          </ListItem>
            </List>)
        }
        </AccordionDetails>
      </Accordion>

      {whiteListClicked ? <WhiteListProposal 
      handleProposalEventChange={handleProposalEventChange}
      handleWhiteListClickState={handleWhiteListClickState}  
      handleTabValueState={handleTabValueState}/> : null }

      {guildKickClicked ? <GuildKickProposal
      handleProposalEventChange={handleProposalEventChange}
      handleGuildKickClickState={handleGuildKickClickState} 
      handleTabValueState={handleTabValueState}/> : null }

      {fundingProposalClicked ? <FundingProposal 
      handleProposalEventChange={handleProposalEventChange}
      handleGuildBalanceChanges={handleGuildBalanceChanges}
      handleEscrowBalanceChanges={handleEscrowBalanceChanges}
      handleFundingProposalClickState={handleFundingProposalClickState}
      handleTabValueState={handleTabValueState}
      depositToken={depositToken}
      accountId={accountId}/> : null }

      {memberProposalClicked ? <MemberProposal 
      handleProposalEventChange={handleProposalEventChange}
      handleGuildBalanceChanges={handleGuildBalanceChanges}
      handleEscrowBalanceChanges={handleEscrowBalanceChanges}
      handleMemberProposalClickState={handleMemberProposalClickState} 
      handleTabValueState={handleTabValueState} 
      accountId={accountId} 
      depositToken={depositToken}
      tokenName={tokenName}
      minSharePrice={minSharePrice}/> : null }
    </>
  );
}