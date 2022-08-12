//let helloHedera = require("./domainToken.json");
let helloHedera = require("./DomainWeb23.json");
//let helloHedera = require("./RegistryByteCode.json");
const bytecode = helloHedera.object;
const { constants } = require("./constants");
const { Client,PrivateKey,AccountId,Hbar,FileCreateTransaction,ContractCreateTransaction,ContractFunctionParameters,FileAppendTransaction} = require("@hashgraph/sdk");
/*
File ID: 0.0.29572802
Contract ID  0.0.29572803

*/
initHedera=async()=>{
	const ADMIN_ACCOUNT = AccountId.fromString(constants.adminAccountHedera);
	const ADMIN_PK = PrivateKey.fromString(constants.adminHederaPK);
	const client = Client.forTestnet();
    client.setOperator(ADMIN_ACCOUNT, ADMIN_PK);
	const contractByteCode =bytecode;
	const maxLen=4000;
	const conLen=contractByteCode.length;
	const parts=Math.floor(conLen/maxLen);
	const partsRem=conLen%maxLen;
	console.log("Byte Length="+conLen);
	console.log("Parts="+parts);
	console.log("Rem="+partsRem);
	let TMaxLen=maxLen;
	let pi=0;
	let ti=0;
	let partsData=contractByteCode.substring(ti,ti+TMaxLen);
	console.log("parts-1="+(ti+TMaxLen));
	
	//1.Storing Byte Code into Hedera Server
	const fileTransactionResponse = await new FileCreateTransaction()
        .setKeys([client.operatorPublicKey])
        .setContents(partsData)
        .execute(client);
		
		
	const fileReceipt = await fileTransactionResponse.getReceipt(client);	
	const fileId = fileReceipt.fileId;
	console.log(`contract bytecode file: ${fileId.toString()}`);
	for(pi=1;pi<parts;pi++)
	{
		console.log("\nINIT PARTS="+pi);
		ti=pi*TMaxLen;
		partsData=contractByteCode.substring(ti,ti+TMaxLen);
		const transaction = await new FileAppendTransaction()
		.setFileId(fileId)
		.setContents(partsData)
		.setMaxTransactionFee(new Hbar(2))
		.execute(client);
		console.log("DONE PARTS of bytes="+(ti+TMaxLen));
	}
	
	if(partsRem>0){
		
		ti=pi*TMaxLen;
		console.log("\nINIT PARTS REMAINDER="+pi+" START BYTES="+ti);
		partsData=contractByteCode.substring(ti,ti+partsRem);
		const transaction = await new FileAppendTransaction()
		.setFileId(fileId)
		.setContents(partsData)
		.setMaxTransactionFee(new Hbar(2))
		.execute(client);	
		console.log("DONE PARTS of bytes="+(ti+partsRem));
	}
	
	//.End Storing Byte Code into Hedera Server
	
	//2.Create the contract
    const contractTransactionResponse = await new ContractCreateTransaction()
        // Set gas to create the contract
        .setGas(570000)
        // The contract bytecode must be set to the file ID containing the contract bytecode
        .setBytecodeFileId(fileId)
        // Set the admin key on the contract in case the contract should be deleted or
        // updated in the future
		.setConstructorParameters(new ContractFunctionParameters().addAddress('0000000000000000000000000000000002d820b6'))
		//.setConstructorParameters(new ContractFunctionParameters().addAddress(0.0.34356041))
        .setAdminKey(client.operatorPublicKey)
        .execute(client);

    // Fetch the receipt for the transaction that created the contract
    const contractReceipt = await contractTransactionResponse.getReceipt(client);
	const newContractId = contractReceipt.contractId;
	console.log("The smart contract ID is " + newContractId);
	//End Deployement Code
	
}

initHedera().then(null);
