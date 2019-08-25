/*jslint node: true */
'use strict';
const request = require('request');
const conf = require('ocore/conf.js');
const notifications = require('./notifications.js');

const documents = {
	lemmy: {
		status: "APPROVED_VERIFIED",
		firstName: "LEMMY",
		lastName: "KILMISTER",
		dob: "1945-12-24",
		gender: "M",
		issuingCountry: "USA",
		usState: "NY",
		number: "987654321",
		type: "PASSPORT",
		idSubType: "E_PASSPORT",
		clientIp: "127.0.0.1"
	},
	joe: {
		status: "APPROVED_VERIFIED",
		firstName: "JOE",
		lastName: "BLACK",
		dob: "1906-06-06",
		gender: "M",
		issuingCountry: "USA",
		usState: "CA",
		number: "666999666",
		type: "PASSPORT",
		idSubType: "E_PASSPORT",
		clientIp: "127.0.0.1"
	}
}
//require('request-debug')(request);

function sendRestRequest(url, onDone){
	onDone(null, body);
}

function retrieveScanData(jumioIdScanReference, onDone){
	console.log('retrieveScanData', jumioIdScanReference);
	onDone({
		transaction: {
			status: "DONE"
		},
		document: documents["joe"],
		verification: {
			identityVerification: {
				similarity: "MATCH",
				validity: "TRUE"
			}
		}
	});
}

function initScan(user_address, scanReference, onDone){
	onDone(null, "clientRedirectUrl", "JUMIO_" + scanReference, "authorizationToken");
}

function convertRestResponseToCallbackFormat(body){
	let data = {
		idScanStatus: body.transaction.status,
		verificationStatus: body.document.status,
		idFirstName: body.document.firstName,
		idLastName: body.document.lastName,
		idDob: body.document.dob,
		gender: body.document.gender,
		idCountry: body.document.issuingCountry,
		idUsState: body.document.usState,
		idNumber: body.document.number,
		idType: body.document.type,
		idSubtype: body.document.idSubtype,
		clientIp: body.transaction.clientIp
	};
	if (body.verification)
		data.identityVerification = body.verification.identityVerification;
	return data;
}

exports.initScan = initScan;
exports.retrieveScanData = retrieveScanData;
exports.convertRestResponseToCallbackFormat = convertRestResponseToCallbackFormat;

