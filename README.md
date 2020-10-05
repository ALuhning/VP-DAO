[![Vital Point Guild](https://vitalpoint.ai/wp-content/uploads/2020/08/header-github.png)](https://vitalpoint.ai "Vital Point Guild")

## PORTING MOLOCH DAO V2 TO NEAR FOR INTEGRATION IN DECENTRALIZED COMMUNITIES
----

Communities may require the ability to coordinate funds and resources.  As an example, let's consider how guilds interact in the NEAR Guilds community.  Each guild has the option of submitting proposals to the community for funding consideration.  

One option to deciding whether to fund the proposal is to have a human committee sit around and discuss each proposal and then arbitrarily or based on some set criteria decide to award the funding from the resource pool.

A better option considering we are interested in web 3.0 technologies is to provide a module that facilitates coordination and resource allocation through a decentralized autonomous organization (DAO).  This project ported Moloch v2 to run on NEAR and it could be the start of the answer.


We're going to use NEAR's Fungible Token Standard (NEP-21), and Ethereum's ERC-20 standard as the basis for this project which will do the following:  

- Allows someone to create a Fungible Token on the NEAR blockchain;
- Adds some additional functionality to that token that is found in the ERC-20 standard but is not currently found in the NEAR fungible token spec (minting, burning); and
- Build out beginning of a user role system that allows token owner and users to use the token in different ways.

We're going to build the contracts with AssemblyScript and the frontend with React.

Project Demo
----

Here's a video demo of the fungible token creator on NEAR and administration wallet that you'll build in the course:

[![Vital Point Guild - Fungible Token Creation on NEAR](https://vitalpoint.ai/wp-content/uploads/2020/08/youtube-preview.png)](https://youtu.be/CGhPRDT1lnw "Building and Issuing Fungible Tokens on NEAR")

[![Vital Point Guild](https://vitalpoint.ai/wp-content/uploads/2020/08/join-guild.png)](https://vitalpoint.ai "Vital Point Guild")

